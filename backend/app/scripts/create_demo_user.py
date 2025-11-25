import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_demo_user():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@aidrigs.com").first()
        if not user:
            logger.info("Creating demo user...")
            user = User(
                email="admin@aidrigs.com",
                username="admin",
                password_hash=get_password_hash("admin123"),
                first_name="Admin",
                last_name="User",
                is_active=True,
                is_superuser=True
            )
            db.add(user)
            db.commit()
            logger.info("Demo user created successfully.")
        else:
            logger.info("Demo user already exists.")
            # Reset password to be sure
            user.password_hash = get_password_hash("admin123")
            db.add(user)
            db.commit()
            logger.info("Demo user password reset to 'admin123'.")
            
    except Exception as e:
        logger.error(f"Error creating demo user: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

# Ensure all models are loaded to apply patches
import app.models.rbac

if __name__ == "__main__":
    create_demo_user()
