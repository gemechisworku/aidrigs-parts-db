"""
Seed data script for initial database setup
"""
import asyncio
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models import Role, Permission, RolePermission, User, Category
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_roles(db: Session):
    """Create default roles"""
    roles_data = [
        {"name": "Admin", "description": "Full system access", "is_system": True},
        {"name": "Manager", "description": "Parts and quote management", "is_system": True},
        {"name": "Viewer", "description": "Read-only access", "is_system": True},
        {"name": "Approver", "description": "Can approve translations and parts", "is_system": True},
    ]
    
    for role_data in roles_data:
        existing = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing:
            role = Role(**role_data)
            db.add(role)
            print(f"Created role: {role_data['name']}")
    
    db.commit()


def seed_permissions(db: Session):
    """Create default permissions"""
    resources = [
        "users", "roles", "permissions",
        "parts", "categories", "manufacturers",
        "vehicles", "suppliers", "quotes",
        "purchase_orders", "inventory", "approvals"
    ]
    actions = ["create", "read", "update", "delete", "approve"]
    
    for resource in resources:
        for action in actions:
            # Skip approve for resources that don't need it
            if action == "approve" and resource not in ["parts", "quotes", "translations"]:
                continue
                
            existing = db.query(Permission).filter(
                Permission.resource == resource,
                Permission.action == action
            ).first()
            
            if not existing:
                perm = Permission(
                    resource=resource,
                    action=action,
                    description=f"Can {action} {resource}"
                )
                db.add(perm)
    
    db.commit()
    print(f"Created permissions for {len(resources)} resources")


def seed_admin_user(db: Session):
    """Create default admin user"""
    existing = db.query(User).filter(User.username == "admin").first()
    if existing:
        print("Admin user already exists")
        return
    
    admin_user = User(
        email="game.worku@gmail.com",
        username="admin",
        password_hash=pwd_context.hash("admin123"),  # Change in production!
        first_name="System",
        last_name="Administrator",
        is_active=True,
        is_superuser=True
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)  # Refresh to get the ID
    
    # Assign Admin role
    admin_role = db.query(Role).filter(Role.name == "Admin").first()
    if admin_role:
        from app.models import UserRole
        from datetime import datetime
        user_role = UserRole(
            user_id=admin_user.id,
            role_id=admin_role.id,
            assigned_at=datetime.utcnow()
        )
        db.add(user_role)
        db.commit()
    
    print("Created admin user (username: admin, password: admin123)")


def seed_categories(db: Session):
    """Create sample categories"""
    categories_data = [
        {"category_name_en": "Engine Parts", "category_name_pr": "Peças do Motor", "category_name_fr": "Pièces de Moteur"},
        {"category_name_en": "Transmission", "category_name_pr": "Transmissão", "category_name_fr": "Transmission"},
        {"category_name_en": "Suspension", "category_name_pr": "Suspensão", "category_name_fr": "Suspension"},
        {"category_name_en": "Brakes", "category_name_pr": "Freios", "category_name_fr": "Freins"},
        {"category_name_en": "Electrical", "category_name_pr": "Elétricos", "category_name_fr": "Électrique"},
        {"category_name_en": "Body Parts", "category_name_pr": "Peças de Carroçaria", "category_name_fr": "Pièces de Carrosserie"},
    ]
    
    for cat_data in categories_data:
        existing = db.query(Category).filter(
            Category.category_name_en == cat_data["category_name_en"]
        ).first()
        if not existing:
            category = Category(**cat_data)
            db.add(category)
    
    db.commit()
    print(f"Created {len(categories_data)} categories")


def seed_all():
    """Run all seed functions"""
    db = SessionLocal()
    try:
        print("Starting database seeding...")
        seed_roles(db)
        seed_permissions(db)
        seed_admin_user(db)
        seed_categories(db)
        print("Database seeding completed successfully!")
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()
