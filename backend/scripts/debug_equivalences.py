"""
Test script to verify get_equivalences
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.part import Part
from app.services.equivalence_service import EquivalenceService

db = SessionLocal()

try:
    # Find a part with a group ID
    part = db.query(Part).filter(Part.equivalence_group_id.isnot(None)).first()
    
    if part:
        print(f"Checking equivalences for part: {part.part_id} (Group: {part.equivalence_group_id})")
        
        equivalents = EquivalenceService.get_equivalences(db, part.id)
        
        print(f"Found {len(equivalents)} equivalents:")
        for eq in equivalents:
            print(f" - {eq.part_id} (Status: {eq.approval_status})")
            
    else:
        print("No parts with equivalence groups found.")

finally:
    db.close()
