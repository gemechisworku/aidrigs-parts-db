"""
Data Migration Script: Populate Equivalence Groups
Migrates existing parts_equivalence relationships to equivalence groups.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from uuid import uuid4
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.part import Part, parts_equivalence
from sqlalchemy import select

def migrate_equivalence_groups():
    """
    Build equivalence groups from existing parts_equivalence relationships.
    Uses graph traversal to find connected components.
    """
    db: Session = SessionLocal()
    
    try:
        print("="*60)
        print("EQUIVALENCE GROUPS DATA MIGRATION")
        print("="*60)
        
        # Step 1: Get all active equivalence relationships
        print("\n1. Loading active equivalence relationships...")
        relationships = db.execute(
            select(parts_equivalence.c.part_id, parts_equivalence.c.equivalent_part_id)
        ).all()
        
        print(f"   Found {len(relationships)} active equivalence relationships")
        
        if not relationships:
            print("\n✓ No equivalence relationships to migrate")
            return
        
        # Step 2: Build adjacency list (graph)
        print("\n2. Building equivalence graph...")
        all_part_ids = set()
        adj = {}
        
        for part_id, equiv_id in relationships:
            all_part_ids.add(part_id)
            all_part_ids.add(equiv_id)
            
            if part_id not in adj:
                adj[part_id] = set()
            if equiv_id not in adj:
                adj[equiv_id] = set()
            
            adj[part_id].add(equiv_id)
            adj[equiv_id].add(part_id)  # Bidirectional
        
        print(f"   Graph contains {len(all_part_ids)} unique parts")
        
        # Step 3: Find connected components (equivalence groups)
        print("\n3. Finding equivalence groups (connected components)...")
        visited = set()
        groups = []
        
        for part_id in all_part_ids:
            if part_id not in visited:
                # BFS to find all connected parts
                component = set()
                stack = [part_id]
                
                while stack:
                    node = stack.pop()
                    if node not in visited:
                        visited.add(node)
                        component.add(node)
                        # Add unvisited neighbors
                        stack.extend(adj[node] - visited)
                
                groups.append(component)
        
        print(f"   Found {len(groups)} equivalence groups")
        print(f"   Group sizes: {sorted([len(g) for g in groups], reverse=True)}")
        
        # Step 4: Assign group IDs to parts
        print("\n4. Assigning group IDs to parts...")
        parts_updated = 0
        
        for i, group in enumerate(groups, 1):
            if len(group) > 1:  # Only create groups for 2+ parts
                group_id = uuid4()
                
                # Update all parts in this group
                for part_id in group:
                    part = db.query(Part).filter(Part.id == part_id).first()
                    if part:
                        part.equivalence_group_id = group_id
                        parts_updated += 1
                
                print(f"   Group {i}: {len(group)} parts -> {group_id}")
        
        # Commit changes
        db.commit()
        
        print(f"\n✓ Successfully updated {parts_updated} parts with group assignments")
        
        # Step 5: Verification
        print("\n5. Verification...")
        parts_with_groups = db.query(Part).filter(Part.equivalence_group_id.isnot(None)).count()
        unique_groups = db.query(Part.equivalence_group_id).filter(
            Part.equivalence_group_id.isnot(None)
        ).distinct().count()
        
        print(f"   Parts with groups: {parts_with_groups}")
        print(f"   Unique groups: {unique_groups}")
        
        print("\n" + "="*60)
        print("✓ MIGRATION COMPLETE")
        print("="*60)
        
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_equivalence_groups()
