from sqlalchemy import inspect
from app.core.database import engine

inspector = inspect(engine)
columns = inspector.get_columns('categories')
for col in columns:
    print(f"{col['name']}: {col['type']}")
