import logging
# Disable logging to avoid noise
logging.basicConfig(level=logging.CRITICAL)

from app.core.database import SessionLocal
from app.models.manufacturer import Manufacturer
from sqlalchemy.exc import IntegrityError

db = SessionLocal()
try:
    deleted_mfgs = db.query(Manufacturer).filter(Manufacturer.deleted_at.isnot(None)).all()
    count = len(deleted_mfgs)
    print(f"Found {count} soft-deleted manufacturers.")
    
    if count > 0:
        for m in deleted_mfgs:
            try:
                db.delete(m)
                db.commit()
                print(f"Deleted: {m.mfg_name} ({m.mfg_id})")
            except IntegrityError:
                db.rollback()
                print(f"Skipped (FK constraint): {m.mfg_name} ({m.mfg_id})")
            except Exception as e:
                db.rollback()
                print(f"Error deleting {m.mfg_name}: {e}")
                
        print("Cleanup complete.")
    else:
        print("No soft-deleted manufacturers found.")
        
except Exception as e:
    print(f"Script Error: {e}")
finally:
    db.close()
