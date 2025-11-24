"""
Simplified seed script using raw SQL to avoid ORM relationship issues
"""
from app.core.database import engine
from passlib.context import CryptContext
from sqlalchemy import text

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_with_sql():
    """Seed database using raw SQL"""
    with engine.connect() as conn:
        try:
            print("🌱 Starting database seeding...")
            
            # Check existing data
            result = conn.execute(text("SELECT COUNT(*) FROM roles"))
            role_count = result.scalar()
            
            if role_count == 0:
                print("\n📝 Seeding roles...")
                conn.execute(text("""
                    INSERT INTO roles (id, name, description, is_system, created_at, updated_at, deleted_at)
                    VALUES 
                        (gen_random_uuid(), 'Admin', 'Full system access', true, NOW(), NOW(), NULL),
                        (gen_random_uuid(), 'Manager', 'Parts and quote management', true, NOW(), NOW(), NULL),
                        (gen_random_uuid(), 'Viewer', 'Read-only access', true, NOW(), NOW(), NULL),
                        (gen_random_uuid(), 'Approver', 'Can approve translations and parts', true, NOW(), NOW(), NULL)
                """))
                conn.commit()
                print("✅ Created 4 roles")
            else:
                print(f"ℹ️  Roles already exist ({role_count} found)")
            
            # Check users
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.scalar()
            
            if user_count == 0:
                print("\n📝 Seeding admin user...")
                password_hash = pwd_context.hash("admin123")
                conn.execute(text("""
                    INSERT INTO users (id, email, username, password_hash, first_name, last_name, 
                                     is_active, is_superuser, created_at, updated_at, deleted_at)
                    VALUES (gen_random_uuid(), 'admin@aidrigs.com', 'admin', :password_hash, 
                           'System', 'Administrator', true, true, NOW(), NOW(), NULL)
                """), {"password_hash": password_hash})
                conn.commit()
                print("✅ Created admin user (username: admin, password: admin123)")
            else:
                print(f"ℹ️  Users already exist ({user_count} found)")
            
            # Check categories
            result = conn.execute(text("SELECT COUNT(*) FROM categories"))
            cat_count = result.scalar()
            
            if cat_count == 0:
                print("\n📝 Seeding categories...")
                conn.execute(text("""
                    INSERT INTO categories (id, category_name_en, category_name_pr, category_name_fr, 
                                          created_at, updated_at, deleted_at)
                    VALUES 
                        (gen_random_uuid(), 'Engine Parts', 'Peças do Motor', 'Pièces de Moteur', NOW(), NOW(), NULL),
                        (gen_random_uuid(), 'Transmission', 'Transmissão', 'Transmission', NOW(), NOW(), NULL),
                        (gen_random_uuid(), 'Suspension', 'Suspensão', 'Suspension', NOW(), NOW(), NULL),
                        (gen_random_uuid(), 'Brakes', 'Freios', 'Freins', NOW(), NOW(), NULL),
                        (gen_random_uuid(), 'Electrical', 'Elétricos', 'Électrique', NOW(), NOW(), NULL),
                        (gen_random_uuid(), 'Body Parts', 'Peças de Carroçaria', 'Pièces de Carrosserie', NOW(), NOW(), NULL)
                """))
                conn.commit()
                print("✅ Created 6 categories")
            else:
                print(f"ℹ️  Categories already exist ({cat_count} found)")
            
            print("\n🎉 Database seeding completed successfully!")
            print("\n📊 Current Status:")
            
            # Show counts
            result = conn.execute(text("SELECT COUNT(*) FROM roles"))
            print(f"  - Roles: {result.scalar()}")
            
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            print(f"  - Users: {result.scalar()}")
            
            result = conn.execute(text("SELECT COUNT(*) FROM categories"))
            print(f"  - Categories: {result.scalar()}")
            
        except Exception as e:
            print(f"❌ Error during seeding: {e}")
            import traceback
            traceback.print_exc()
            conn.rollback()

if __name__ == "__main__":
    seed_with_sql()
