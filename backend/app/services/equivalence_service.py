"""
Equivalence Service
Handles business logic for part equivalences, including:
- Dual-source management (parts_equivalence table + equivalence_group_id)
- Transitive equivalence via groups
- Group merging and splitting
- Audit logging
"""
from typing import List, Optional, Set, Tuple
from uuid import UUID, uuid4
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, insert, update, delete, and_, or_, func
from sqlalchemy.sql import text
import logging

from app.models.part import Part, parts_equivalence
from app.models.user import User

logger = logging.getLogger(__name__)

class EquivalenceService:
    
    @staticmethod
    def get_equivalences(db: Session, part_id: UUID) -> List[Part]:
        """
        Get all equivalent parts for a given part ID.
        Uses the fast equivalence_group_id lookup.
        """
        # 1. Get the part's group ID
        part = db.query(Part).filter(Part.id == part_id).first()
        if not part or not part.equivalence_group_id:
            return []
            
        # 2. Query all parts in the same group (excluding self)
        equivalents = db.query(Part).filter(
            Part.equivalence_group_id == part.equivalence_group_id,
            Part.id != part_id,
            Part.deleted_at.is_(None)
        ).all()
        
        return equivalents

    @staticmethod
    def create_equivalence(
        db: Session, 
        part_id: UUID, 
        equivalent_part_id: UUID, 
        user_id: UUID
    ) -> None:
        """
        Create a new equivalence relationship.
        Updates both source of truth and computed groups.
        """
        # 1. Check if relationship already exists (including soft-deleted)
        existing = db.execute(
            select(parts_equivalence).where(
                or_(
                    and_(
                        parts_equivalence.c.part_id == part_id,
                        parts_equivalence.c.equivalent_part_id == equivalent_part_id
                    ),
                    and_(
                        parts_equivalence.c.part_id == equivalent_part_id,
                        parts_equivalence.c.equivalent_part_id == part_id
                    )
                )
            )
        ).first()

        if existing:
            if existing.deleted_at is None:
                # Already exists and active
                return
            else:
                # Reactivate soft-deleted relationship
                db.execute(
                    update(parts_equivalence).where(
                        or_(
                            and_(
                                parts_equivalence.c.part_id == part_id,
                                parts_equivalence.c.equivalent_part_id == equivalent_part_id
                            ),
                            and_(
                                parts_equivalence.c.part_id == equivalent_part_id,
                                parts_equivalence.c.equivalent_part_id == part_id
                            )
                        )
                    ).values(
                        deleted_at=None,
                        deleted_by=None,
                        created_at=datetime.utcnow(), 
                        created_by=user_id
                    )
                )
        else:
            # Create new relationship (Trigger will handle reverse)
            db.execute(
                insert(parts_equivalence).values(
                    id=uuid4(),
                    part_id=part_id,
                    equivalent_part_id=equivalent_part_id,
                    created_at=datetime.utcnow(),
                    created_by=user_id
                )
            )
        
        # 2. Update Groups
        part_a = db.query(Part).filter(Part.id == part_id).first()
        part_b = db.query(Part).filter(Part.id == equivalent_part_id).first()
        
        if not part_a or not part_b:
            logger.error(f"Failed to find parts for group update: {part_id}, {equivalent_part_id}")
            return

        group_a = part_a.equivalence_group_id
        group_b = part_b.equivalence_group_id
        
        logger.info(f"Updating groups for {part_id} (Group: {group_a}) and {equivalent_part_id} (Group: {group_b})")
        
        if group_a is None and group_b is None:
            # Case 1: Neither has group -> Create new
            new_group_id = uuid4()
            part_a.equivalence_group_id = new_group_id
            part_b.equivalence_group_id = new_group_id
            db.add(part_a)
            db.add(part_b)
            logger.info(f"Created new group {new_group_id} for both parts")
            
        elif group_a is not None and group_b is None:
            # Case 2: A has group, B doesn't -> Add B to A's group
            part_b.equivalence_group_id = group_a
            db.add(part_b)
            logger.info(f"Added part B to group {group_a}")
            
        elif group_a is None and group_b is not None:
            # Case 3: B has group, A doesn't -> Add A to B's group
            part_a.equivalence_group_id = group_b
            db.add(part_a)
            logger.info(f"Added part A to group {group_b}")
            
        elif group_a != group_b:
            # Case 4: Different groups -> Merge
            # Move all parts from group_b to group_a
            db.execute(
                update(Part).where(
                    Part.equivalence_group_id == group_b
                ).values(
                    equivalence_group_id=group_a
                )
            )
            logger.info(f"Merged group {group_b} into {group_a}")
        
        # Note: Caller is responsible for committing the transaction

    @staticmethod
    def delete_equivalence(
        db: Session, 
        part_id: UUID, 
        equivalent_part_id: UUID, 
        user_id: UUID
    ) -> None:
        """
        Soft delete equivalence and update groups.
        May cause group splitting.
        """
        # 1. Soft delete relationship (both directions)
        db.execute(
            update(parts_equivalence).where(
                or_(
                    and_(
                        parts_equivalence.c.part_id == part_id,
                        parts_equivalence.c.equivalent_part_id == equivalent_part_id
                    ),
                    and_(
                        parts_equivalence.c.part_id == equivalent_part_id,
                        parts_equivalence.c.equivalent_part_id == part_id
                    )
                )
            ).values(
                deleted_at=datetime.utcnow(),
                deleted_by=user_id
            )
        )
        
        # 2. Check connectivity and rebuild groups if needed
        part = db.query(Part).filter(Part.id == part_id).first()
        if not part or not part.equivalence_group_id:
            db.commit()
            return
            
        group_id = part.equivalence_group_id
        
        # Get all parts in this group
        group_parts = db.query(Part.id).filter(
            Part.equivalence_group_id == group_id
        ).all()
        part_ids = [p.id for p in group_parts]
        
        if len(part_ids) <= 1:
            db.execute(
                update(Part).where(Part.equivalence_group_id == group_id).values(equivalence_group_id=None)
            )
            db.commit()
            return

        # Build graph of REMAINING active connections within this group
        active_links = db.execute(
            select(parts_equivalence.c.part_id, parts_equivalence.c.equivalent_part_id).where(
                parts_equivalence.c.part_id.in_(part_ids),
                parts_equivalence.c.equivalent_part_id.in_(part_ids),
                parts_equivalence.c.deleted_at.is_(None)
            )
        ).all()
        
        adj = {pid: set() for pid in part_ids}
        for p1, p2 in active_links:
            adj[p1].add(p2)
            adj[p2].add(p1)
            
        visited = set()
        components = []
        
        for pid in part_ids:
            if pid not in visited:
                component = set()
                stack = [pid]
                while stack:
                    node = stack.pop()
                    if node not in visited:
                        visited.add(node)
                        component.add(node)
                        stack.extend(adj[node] - visited)
                components.append(component)
        
        if len(components) > 1:
            logger.info(f"Equivalence group {group_id} split into {len(components)} components")
            for comp in components:
                if len(comp) > 1:
                    new_group_id = uuid4()
                    db.execute(
                        update(Part).where(
                            Part.id.in_(list(comp))
                        ).values(
                            equivalence_group_id=new_group_id
                        )
                    )
                else:
                    db.execute(
                        update(Part).where(
                            Part.id.in_(list(comp))
                        ).values(
                            equivalence_group_id=None
                        )
                    )
        elif len(components) == 1 and len(components[0]) <= 1:
             db.execute(
                update(Part).where(Part.equivalence_group_id == group_id).values(equivalence_group_id=None)
            )

        db.commit()
