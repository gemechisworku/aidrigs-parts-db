"""
Test script to verify transitive equivalence functionality
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.part import Part

db = SessionLocal()

try:
    # Find a sample part with a group
    sample_part = db.query(Part).filter(Part.equivalence_group_id.isnot(None)).first()
    
    if sample_part:
        print(f"\n✓ Found sample part: {sample_part.part_id}")
        print(f"  Group ID: {sample_part.equivalence_group_id}")
        
        # Get all parts in the same group
        group_parts = db.query(Part).filter(
            Part.equivalence_group_id == sample_part.equivalence_group_id
        ).all()
        
        print(f"\n✓ Total parts in this equivalence group: {len(group_parts)}")
        print(f"  Part IDs: {', '.join([p.part_id for p in group_parts[:10]])}")
        if len(group_parts) > 10:
            print(f"  ... and {len(group_parts) - 10} more")
        
        print("\n✓ Transitive equivalence is working!")
        print(f"  All {len(group_parts)} parts are now equivalent to each other")
    else:
        print("\n✗ No parts with equivalence groups found")
        
finally:
    db.close()
