"""
System Settings schemas
"""
from typing import Optional, Any
from pydantic import BaseModel, Field

class SettingBase(BaseModel):
    key: str
    value: Optional[str] = None
    description: Optional[str] = None
    type: str = "string"
    is_secret: bool = False
    category: str = "general"

class SettingCreate(SettingBase):
    pass

class SettingUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = None
    is_secret: Optional[bool] = None

class SettingResponse(SettingBase):
    pass
    
    class Config:
        from_attributes = True
