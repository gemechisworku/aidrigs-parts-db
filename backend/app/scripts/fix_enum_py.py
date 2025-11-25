import os
import psycopg2
from psycopg2 import sql

# Database connection from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/aidrigs_parts_db")

print("Connecting to database...")
conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cursor = conn.cursor()

try:
    print("Step 1: Converting drive_side_specific to VARCHAR...")
    cursor.execute("""
        ALTER TABLE part_translation_standardization 
        ALTER COLUMN drive_side_specific TYPE VARCHAR(10);
    """)
    
    print("Step 2: Converting parts.drive_side to VARCHAR...")
    cursor.execute("""
        ALTER TABLE parts 
        ALTER COLUMN drive_side TYPE VARCHAR(10);
    """)
    
    print("Step 3: Dropping old enum...")
    cursor.execute("DROP TYPE IF EXISTS drive_side_enum CASCADE;")
    
    print("Step 4: Creating drive_side_enum for parts...")
    cursor.execute("CREATE TYPE drive_side_enum AS ENUM ('NA', 'LHD', 'RHD');")
    
    print("Step 5: Creating drive_side_specific_enum for translations...")
    cursor.execute("CREATE TYPE drive_side_specific_enum AS ENUM ('yes', 'no');")
    
    print("Step 6: Converting parts.drive_side to enum...")
    cursor.execute("""
        ALTER TABLE parts 
        ALTER COLUMN drive_side TYPE drive_side_enum 
        USING drive_side::drive_side_enum;
    """)
    
    print("Step 7: Converting part_translation_standardization.drive_side_specific to enum...")
    cursor.execute("""
        ALTER TABLE part_translation_standardization 
        ALTER COLUMN drive_side_specific TYPE drive_side_specific_enum 
        USING drive_side_specific::drive_side_specific_enum;
    """)
    
    print("Step 8: Setting defaults...")
    cursor.execute("ALTER TABLE parts ALTER COLUMN drive_side SET DEFAULT 'NA';")
    cursor.execute("ALTER TABLE part_translation_standardization ALTER COLUMN drive_side_specific SET DEFAULT 'no';")
    
    print("✅ Successfully fixed enum conflict!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    conn.rollback()
finally:
    cursor.close()
    conn.close()
