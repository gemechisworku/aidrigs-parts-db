from app.core.database import SessionLocal
from app.models.classification import Category

db = SessionLocal()
categories = db.query(Category).all()
print(f"Found {len(categories)} categories")
for cat in categories:
    print(f"- {cat.category_name_en} (PT: {cat.category_name_pr}, FR: {cat.category_name_fr})")
db.close()
