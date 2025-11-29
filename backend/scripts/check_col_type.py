import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    # Check column type directly from information_schema
    result = conn.execute(text("""
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'partners' AND column_name = 'type'
    """))
    
    print("Column info from information_schema:")
    for row in result:
        print(f"  Column: {row[0]}")
        print(f"  Data type: {row[1]}")
        print(f"  UDT name: {row[2]}")
