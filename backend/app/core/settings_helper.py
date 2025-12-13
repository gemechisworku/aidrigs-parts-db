from typing import Any
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.setting import SystemSetting

def get_system_setting(key: str, default: Any = None) -> Any:
    """
    Get a system setting value, prioritizing DB over config/env.
    """
    # Check DB
    db = SessionLocal()
    try:
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting and setting.value is not None:
            return setting.value
    except Exception:
        pass
    finally:
        db.close()
    
    # Check config/env
    if hasattr(settings, key):
        val = getattr(settings, key)
        if val is not None:
            return val
            
    return default
