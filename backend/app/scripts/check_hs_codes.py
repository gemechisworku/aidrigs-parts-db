from app.core.database import SessionLocal
from app.models.classification import HSCode

db = SessionLocal()
hs_codes = db.query(HSCode).all()
print(f"Found {len(hs_codes)} HS Codes")
for hs in hs_codes:
    print(f"- {hs.hs_code}")
db.close()
