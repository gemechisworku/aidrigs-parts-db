"""
Minimal test - just import the model
"""
import sys

print("Step 1: Adding path...")
sys.path.insert(0, r"d:\personal-projects\aidrigs-parts-db\backend")

print("Step 2: Importing database...")
from app.core.database import SessionLocal

print("Step 3: Importing Part model...")
from app.models.part import Part

print("Step 4: Importing ApprovalStatus...")
from app.models.approval import ApprovalStatus

print("Step 5: Creating session...")
db = SessionLocal()

print("Step 6: Creating part object...")
new_part = Part(
    part_id="TEST123",
    designation="Test",
    drive_side="NA",
    approval_status=ApprovalStatus.APPROVED
)

print("Step 7: Adding to session...")
db.add(new_part)

print("Step 8: Committing...")
try:
    db.commit()
    print("SUCCESS!")
except Exception as e:
    print(f"COMMIT FAILED: {e}")
    db.rollback()
finally:
    db.close()
