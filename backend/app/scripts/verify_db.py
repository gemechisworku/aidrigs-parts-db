"""
Simple script to verify database schema and seed minimal data
"""
from app.core.database import SessionLocal
from app.models import Role, User, Category
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_and_seed():
    """Verify tables exist and seed minimal data"""
    db = SessionLocal()
    try:
        print("✅ Database connection successful!")
        
        # Check if tables exist by querying
        print("Testing Role query...")
        role_count = db.query(Role).count()
        print(f"📊 Roles table exists. Current count: {role_count}")
        
        print("Testing User query...")
        user_count = db.query(User).count()
        print(f"📊 Users table exists. Current count: {user_count}")
        
        print("Testing Category query...")
        category_count = db.query(Category).count()
        print(f"📊 Categories table exists. Current count: {category_count}")
        
        # Create minimal seed data if tables are empty
        if role_count == 0:
            print("\n🌱 Seeding roles...")
            admin_role = Role(name="Admin", description="System Administrator", is_system=True)
            db.add(admin_role)
            db.commit()
            print("✅ Created Admin role")
        
        if user_count == 0 and role_count > 0:
            print("\n🌱 Seeding admin user...")
            admin_user = User(
                email="admin@aidrigs.com",
                username="admin",
                password_hash=pwd_context.hash("admin123"),
                first_name="Admin",
                last_name="User",
                is_active=True,
                is_superuser=True
            )
            db.add(admin_user)
            db.commit()
            print("✅ Created admin user (username: admin, password: admin123)")
        
        if category_count == 0:
            print("\n🌱 Seeding categories...")
            categories = [
                Category(category_name_en="Engine Parts"),
                Category(category_name_en="Transmission"),
                Category(category_name_en="Brakes"),
            ]
            for cat in categories:
                db.add(cat)
            db.commit()
            print(f"✅ Created {len(categories)} categories")
        
        print("\n🎉 Database verification and seeding complete!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    verify_and_seed()
