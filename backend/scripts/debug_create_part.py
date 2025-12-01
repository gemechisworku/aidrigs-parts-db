"""
Debug script to test part creation
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.part import Part
from app.schemas.part import PartCreate
from app.models.approval import ApprovalStatus
from uuid import uuid4

db = SessionLocal()

try:
    # 1. Test creating a part directly with model
    print("Attempting to create part via Model...")
    part_id = f"TEST-{str(uuid4())[:8]}"
    
    new_part = Part(
        part_id=part_id,
        designation="Test Part",
        drive_side="NA",
        approval_status=ApprovalStatus.APPROVED
    )
    db.add(new_part)
    db.commit()
    print(f"✓ Successfully created part {part_id} via Model")
    
    # 2. Test reading it back
    db.refresh(new_part)
    print(f"Read back status: {new_part.approval_status}")
    
    # 3. Clean up
    db.delete(new_part)
    db.commit()
    print("✓ Cleaned up")
    
except Exception as e:
    print(f"✗ Failed: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
