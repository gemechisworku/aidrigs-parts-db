from app.core.database import SessionLocal
from app.models.setting import SystemSetting

db = SessionLocal()
settings = db.query(SystemSetting).filter(SystemSetting.key.like("SMTP_%")).all()
with open("config_dump.txt", "w") as f:
    f.write("--- SMTP CONFIG DUMP ---\n")
    for s in settings:
        val = s.value
        if s.key == "SMTP_PASSWORD":
            val = f"{val[:2]}...{val[-2:]} (Len: {len(val)})"
        f.write(f"{s.key}: {val}\n")
    f.write("------------------------\n")
db.close()
