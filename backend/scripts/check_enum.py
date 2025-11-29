import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, inspect, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

# Check enum values in database
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT enumlabel 
        FROM pg_enum 
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
        WHERE pg_type.typname = 'partner_type_enum'
        ORDER BY enumsortorder
    """))
    
    print("Enum values in database:")
    for row in result:
        print(f"  - '{row[0]}'")

# Check table columns
inspector = inspect(engine)
cols = inspector.get_columns('partners')
print("\nPartners table columns:")
for c in cols:
    print(f"  {c['name']}: {c['type']}")
