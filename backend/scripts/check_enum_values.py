"""
Check database enum values
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine

conn = engine.connect()

try:
    # Check what enum values exist in the database
    result = conn.execute(text("""
        SELECT n.nspname as enum_schema,
               t.typname as enum_name,
               e.enumlabel as enum_value
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'approvalstatus'
        ORDER BY e.enumsortorder;
    """))
    
    print("Database enum values for 'approvalstatus':")
    for row in result:
        print(f"  - {row.enum_value}")
    
    # Check actual values in parts table
    result2 = conn.execute(text("""
        SELECT DISTINCT approval_status 
        FROM parts 
        LIMIT 10;
    """))
    
    print("\nActual values in parts table:")
    for row in result2:
        print(f"  - {row.approval_status}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    conn.close()
