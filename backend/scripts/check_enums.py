from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(str(settings.DATABASE_URL))

with engine.connect() as conn:
    result = conn.execute(text("SELECT typname FROM pg_type WHERE typname = 'partner_type_enum'"))
    print("Existing enum types:")
    for row in result:
        print(row[0])
        
    # Check values of the enum
    result = conn.execute(text("SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'partner_type_enum'"))
    print("Enum values:")
    for row in result:
        print(row[0])
