from sqlalchemy import create_engine, inspect
from app.core.config import settings

def inspect_ports():
    engine = create_engine(str(settings.DATABASE_URL))
    inspector = inspect(engine)
    columns = inspector.get_columns('ports')
    print("Columns in 'ports' table:")
    for column in columns:
        if column['name'] == 'port_type':
            print(f"COLUMN: {column['name']}")
            print(f"TYPE: {column['type']}")
            print(f"DETAILS: {column}")

if __name__ == "__main__":
    inspect_ports()
