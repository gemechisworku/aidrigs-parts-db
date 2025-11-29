import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

def run_sql(conn, sql):
    try:
        conn.execute(text(sql))
        conn.commit()
        print(f"Success: {sql[:50]}...")
    except Exception as e:
        print(f"Error executing {sql[:50]}...: {e}")
        conn.rollback()

with engine.connect() as conn:
    print("Fixing database schema...")
    
    # 1. Fix Partner Type Enum
    # Drop old type if exists
    run_sql(conn, "DROP TYPE IF EXISTS partnertypeenum CASCADE")
    
    # Ensure partner_type_enum exists with correct lowercase values
    # We need to check if it exists first to avoid error if we try to create it
    try:
        run_sql(conn, """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'partner_type_enum') THEN
                    CREATE TYPE partner_type_enum AS ENUM ('supplier', 'customer', 'AR_storage', 'forwarder');
                END IF;
            END$$;
        """)
    except Exception as e:
        print(f"Error creating enum: {e}")

    # 2. Fix Partners Type Column
    # Check if column is already using the enum
    result = conn.execute(text("""
        SELECT data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'partners' AND column_name = 'type'
    """)).fetchone()
    
    if result:
        print(f"Current type column: {result[0]}, udt: {result[1]}")
        if result[1] != 'partner_type_enum':
            print("Converting type column to enum...")
            # We might need to cast to text first if it's incompatible
            run_sql(conn, """
                ALTER TABLE partners 
                ALTER COLUMN type TYPE partner_type_enum 
                USING type::text::partner_type_enum
            """)
        else:
            print("Type column is already correct.")
            
    # 3. Increase Phone Number Length
    print("Increasing phone number length...")
    run_sql(conn, "ALTER TABLE contacts ALTER COLUMN phone1 TYPE VARCHAR(20)")
    run_sql(conn, "ALTER TABLE contacts ALTER COLUMN phone2 TYPE VARCHAR(20)")
    
    print("Schema fix complete.")
