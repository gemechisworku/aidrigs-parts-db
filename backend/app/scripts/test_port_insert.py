from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.reference_data import Port
import uuid

def test_insert():
    engine = create_engine(str(settings.DATABASE_URL))
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("Attempting to insert port with type 'Air'")
        port = Port(
            port_code="TEST1",
            port_name="Test Port",
            country="US",
            city="Test City",
            type="Air"
        )
        db.add(port)
        db.commit()
        print("Successfully inserted 'Air'")
        
        print("Attempting to insert port with type 'Land'")
        port2 = Port(
            port_code="TEST2",
            port_name="Test Port 2",
            country="US",
            city="Test City",
            type="Land"
        )
        db.add(port2)
        db.commit()
        print("Successfully inserted 'Land'")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        # Cleanup
        try:
            db.query(Port).filter(Port.port_code.in_(["TEST1", "TEST2"])).delete()
            db.commit()
        except:
            pass
        db.close()

if __name__ == "__main__":
    test_insert()
