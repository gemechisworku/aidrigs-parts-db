"""
Simple test script to create one partner
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.partners import Partner, PartnerTypeEnum

db = SessionLocal()

try:
    # Create one simple partner using string value directly
    partner = Partner(
        code="TEST001",
        name="Test Partner",
        street_number="123",
        city="Test City",
        country="Test Country",
        type="supplier"  # Use string directly
    )
    
    print(f"Creating partner with type: {partner.type}")
    print(f"Type value: {partner.type.value if hasattr(partner.type, 'value') else partner.type}")
    
    db.add(partner)
    db.commit()
    
    print("SUCCESS: Partner created!")
    print(f"Partner ID: {partner.id}")
    print(f"Partner Code: {partner.code}")
    print(f"Partner Type: {partner.type}")
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
