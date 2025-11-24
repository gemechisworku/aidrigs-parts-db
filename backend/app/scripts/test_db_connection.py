"""
Simple database connection test
"""
from app.core.database import SessionLocal

def test_connection():
    db = SessionLocal()
    try:
        # Just test the connection
        result = db.execute("SELECT 1")
        print("✅ Database connection works!")
        
        # List tables
        result = db.execute("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname='public' 
            ORDER BY tablename
        """)
        tables = [row[0] for row in result]
        print(f"\n📊 Found {len(tables)} tables:")
        for table in tables:
            print(f"  - {table}")
        
        # Test simple count on a table
        result = db.execute("SELECT COUNT(*) FROM roles")
        count = result.scalar()
        print(f"\n✅ Roles table has {count} records")
        
        result = db.execute("SELECT COUNT(*) FROM users")
        count = result.scalar()
        print(f"✅ Users table has {count} records")
        
        result = db.execute("SELECT COUNT(*) FROM categories")
        count = result.scalar()
        print(f"✅ Categories table has {count} records")
        
        print("\n🎉 Database is working correctly!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "____main__":
    test_connection()
