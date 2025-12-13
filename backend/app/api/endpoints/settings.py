from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.setting import SystemSetting
from app.schemas.setting import SettingCreate, SettingUpdate, SettingResponse
from app.core.config import settings as app_settings

router = APIRouter()

@router.get("/", response_model=List[SettingResponse])
def read_settings(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve system settings.
    """
    settings = db.query(SystemSetting).offset(skip).limit(limit).all()
    return settings

@router.post("/", response_model=SettingResponse)
def create_setting(
    *,
    db: Session = Depends(deps.get_db),
    setting_in: SettingCreate,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new system setting.
    """
    setting = db.query(SystemSetting).filter(SystemSetting.key == setting_in.key).first()
    if setting:
        raise HTTPException(
            status_code=400,
            detail="The setting with this key already exists in the system.",
        )
    setting = SystemSetting(
        key=setting_in.key,
        value=setting_in.value,
        description=setting_in.description,
        type=setting_in.type,
        is_secret=setting_in.is_secret,
        category=setting_in.category,
    )
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting

@router.put("/{key}", response_model=SettingResponse)
def update_setting(
    *,
    db: Session = Depends(deps.get_db),
    key: str,
    setting_in: SettingUpdate,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a system setting.
    """
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        raise HTTPException(
            status_code=404,
            detail="The setting with this key does not exist.",
        )
    
    if setting_in.value is not None:
        setting.value = setting_in.value
    if setting_in.description is not None:
        setting.description = setting_in.description
    if setting_in.is_secret is not None:
        setting.is_secret = setting_in.is_secret
        
    db.commit()
    db.refresh(setting)
    
    # Update app_settings if applicable
    # Note: This only updates the current worker. In multi-worker setup, others won't know.
    # But for this app (likely single worker or restartable), it's a start.
    if hasattr(app_settings, key):
        setattr(app_settings, key, setting.value)
        
    return setting
