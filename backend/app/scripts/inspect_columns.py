"""
Inspect columns of specific tables
"""
from app.core.database import engine
from sqlalchemy import inspect

def inspect_columns():
    inspector = inspect(engine)
    
    target_tables = ['ports', 'price_tiers']
    
    for table in target_tables:
        print(f"\n=== Columns in '{table}' ===")
        try:
            columns = inspector.get_columns(table)
            for col in columns:
                print(f"  - {col['name']} ({col['type']})")
        except Exception as e:
            print(f"  Error: {e}")

if __name__ == "__main__":
    inspect_columns()
