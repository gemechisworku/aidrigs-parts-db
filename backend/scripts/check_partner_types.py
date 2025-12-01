from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(str(settings.DATABASE_URL))

with engine.connect() as conn:
    result = conn.execute(text("SELECT DISTINCT type FROM partners"))
    print("Distinct types in partners table:")
    for row in result:
        print(row[0])
