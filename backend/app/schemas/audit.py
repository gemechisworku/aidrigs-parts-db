from typing import Optional, List
from pydantic import BaseModel, UUID4
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: UUID4
    user_id: Optional[UUID4] = None
    action: str
    entity_type: str
    entity_id: Optional[UUID4] = None
    changes: Optional[dict] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    
    # User relationship (denormalized for display)
    username: Optional[str] = None
    
    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    pages: int
    page_size: int
