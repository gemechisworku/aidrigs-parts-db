from app.core.database import SessionLocal
from app.models.setting import SystemSetting
import logging

# Suppress logging
logging.basicConfig(level=logging.CRITICAL)
logging.getLogger('sqlalchemy.engine').setLevel(logging.CRITICAL)

from app.core.database import SessionLocal

db = SessionLocal()
s = db.query(SystemSetting).filter(SystemSetting.key == "SMTP_PASSWORD").first()
with open("password_check.txt", "w") as f:
    if s:
        pwd = s.value
        user_setting = db.query(SystemSetting).filter(SystemSetting.key == "SMTP_USER").first()
        user = user_setting.value if user_setting else "NOT FOUND"
        
        f.write(f"User: {user}\n")
        f.write(f"Password Length: {len(pwd)}\n")
        f.write(f"Contains Spaces: {'YES' if ' ' in pwd else 'NO'}\n")
    else:
        f.write("No password found")
db.close()
