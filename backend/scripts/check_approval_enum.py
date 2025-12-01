from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(str(settings.DATABASE_URL))

with engine.connect() as conn:
    # Check if approval_status column exists
    result = conn.execute(text("""
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns 
        WHERE table_name = 'parts' AND column_name = 'approval_status'
    """))
    print("Parts table approval_status column:")
    for row in result:
        print(f"  Column: {row[0]}, Type: {row[1]}, UDT: {row[2]}")
    
    # Check existing enum values
    result = conn.execute(text("""
        SELECT e.enumlabel 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'approvalstatus'
        ORDER BY e.enumsortorder
    """))
    print("\nExisting approvalstatus enum values:")
    for row in result:
        print(f"  - {row[0]}")
    
    # Check if there are any parts with approval status
    result = conn.execute(text("SELECT COUNT(*) FROM parts WHERE approval_status IS NOT NULL"))
    count = result.scalar()
    print(f"\nParts with approval_status: {count}")
