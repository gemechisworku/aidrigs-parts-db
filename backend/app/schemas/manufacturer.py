from typing import Optional, Dict, Any
from pydantic import BaseModel, UUID4
from datetime import datetime

class ManufacturerBase(BaseModel):
    mfg_name: str
    mfg_type: str  # OEM, APM, Remanufacturers
    country: Optional[str] = None
    website: Optional[str] = None
    contact_info: Optional[Dict[str, Any]] = None
    certification: Optional[str] = None

class ManufacturerCreate(ManufacturerBase):
    pass

class ManufacturerUpdate(BaseModel):
    mfg_name: Optional[str] = None
    mfg_type: Optional[str] = None
    country: Optional[str] = None
    website: Optional[str] = None
    contact_info: Optional[Dict[str, Any]] = None
    certification: Optional[str] = None

class ManufacturerResponse(ManufacturerBase):
    id: UUID4
    approval_status: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
