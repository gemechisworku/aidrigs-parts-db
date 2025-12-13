import logging
logging.basicConfig(level=logging.CRITICAL)
from app.core.database import SessionLocal
from app.models.manufacturer import Manufacturer

db = SessionLocal()
try:
    mfgs = db.query(Manufacturer).all()
    print(f"Total Manufacturers: {len(mfgs)}")
    print("-" * 80)
    print(f"{'ID':<15} | {'Name':<30} | {'Status':<15} | {'Deleted':<10}")
    print("-" * 80)
    for m in mfgs:
        deleted = "YES" if m.deleted_at else "NO"
        print(f"{m.mfg_id:<15} | {m.mfg_name:<30} | {m.approval_status:<15} | {deleted:<10}")
finally:
    db.close()
