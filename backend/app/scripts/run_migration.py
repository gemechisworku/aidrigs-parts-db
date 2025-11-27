"""
Run SQL migration for adding missing tables
"""
from app.core.database import engine
from sqlalchemy import text

def run_migration():
    """Execute the SQL migration file"""
    print("🔄 Running database migration...")
    
    # Read the SQL file
    with open('app/scripts/add_missing_tables.sql', 'r') as f:
        sql = f.read()
    
    # Execute it
    with engine.begin() as connection:
        # Split by semicolons and execute each statement
        statements = [stmt.strip() for stmt in sql.split(';') if stmt.strip()]
        
        for i, stmt in enumerate(statements, 1):
            if stmt:
                print(f"  Executing statement {i}/{len(statements)}...")
                try:
                    connection.execute(text(stmt))
                except Exception as e:
                    print(f"    ⚠️  Warning: {e}")
    
    print("✅ Migration completed!")

if __name__ == "__main__":
    run_migration()
