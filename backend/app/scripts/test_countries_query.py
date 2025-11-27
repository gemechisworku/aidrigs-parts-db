from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.reference_data import Country

def test_query():
    db = SessionLocal()
    try:
        print("Querying countries...")
        countries = db.query(Country).limit(5).all()
        print(f"Found {len(countries)} countries.")
        for c in countries:
            print(f"- {c.name} ({c.code})")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_query()
