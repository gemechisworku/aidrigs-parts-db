"""
Database inspection script to check existing tables and enums.
"""
from app.core.database import engine
from sqlalchemy import inspect, text

def check_database():
    """Check existing tables and enums in the database"""
    inspector = inspect(engine)
    
    # Get all tables
    tables = inspector.get_table_names()
    print("=== Existing Tables ===")
    for table in sorted(tables):
        print(f"  ✓ {table}")
    
    # Get all enums
    print("\n=== Existing ENUMs ===")
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT t.typname as enum_name,
                   array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public'
            GROUP BY t.typname
            ORDER BY t.typname;
        """))
        
        for row in result:
            print(f"  ✓ {row[0]}: {row[1]}")
    
    # Tables we need
    required_tables = [
        'ports', 'price_tiers', 'partners', 'contacts',
        'hs_codes', 'hs_code_tariff', 'vehicles', 'vehicles_equivalence',
        'fx_rate', 'quotes', 'quote_items', 'shipments', 'freight_costs',
        'grns', 'grn_items', 'price_tiers_map', 'suppliers', 'supplier_parts'
    ]
    
    print("\n=== Missing Tables ===")
    missing = [t for t in required_tables if t not in tables]
    for table in missing:
        print(f"  ✗ {table}")
    
    if not missing:
        print("  (None - all required tables exist)")

if __name__ == "__main__":
    check_database()
