"""
Script to seed SMTP settings
"""
import sys
import os

# Add parent directory to path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.setting import SystemSetting

def seed_smtp_settings():
    db = SessionLocal()
    try:
        settings = [
            {"key": "SMTP_HOST", "value": "", "description": "SMTP Server Host (e.g., smtp.gmail.com)", "category": "email", "type": "string", "is_secret": False},
            {"key": "SMTP_PORT", "value": "587", "description": "SMTP Server Port", "category": "email", "type": "string", "is_secret": False},
            {"key": "SMTP_USER", "value": "", "description": "SMTP Username", "category": "email", "type": "string", "is_secret": False},
            {"key": "SMTP_PASSWORD", "value": "", "description": "SMTP Password", "category": "email", "type": "string", "is_secret": True},
            {"key": "SMTP_FROM_EMAIL", "value": "noreply@aidrigs.com", "description": "Email address to send from", "category": "email", "type": "string", "is_secret": False},
            {"key": "SMTP_USE_TLS", "value": "true", "description": "Use TLS (true/false)", "category": "email", "type": "boolean", "is_secret": False},
        ]
        
        for s in settings:
            existing = db.query(SystemSetting).filter(SystemSetting.key == s["key"]).first()
            if not existing:
                new_setting = SystemSetting(**s)
                db.add(new_setting)
                print(f"Added setting: {s['key']}")
            else:
                print(f"Setting exists: {s['key']}")
        
        db.commit()
        print("SMTP settings seeded successfully")
        
    except Exception as e:
        print(f"Error seeding settings: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_smtp_settings()
