"""
System Settings model
"""
from sqlalchemy import Column, String, Text, Boolean
from app.models.base import BaseModel

class SystemSetting(BaseModel):
    """System configuration settings"""
    
    __tablename__ = "system_settings"
    
    key = Column(String(100), primary_key=True, index=True)
    value = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    type = Column(String(20), default="string")  # string, boolean, int, json
    is_secret = Column(Boolean, default=False)  # If true, value masked in UI
    category = Column(String(50), default="general")
    
    def __repr__(self):
        return f"<SystemSetting({self.key})>"
