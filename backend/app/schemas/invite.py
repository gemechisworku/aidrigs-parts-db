"""
Pydantic schemas for User Invites
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr
from uuid import UUID

class InviteCreate(BaseModel):
    """Schema for creating an invite"""
    email: EmailStr
    send_email: bool = True

class InviteResponse(BaseModel):
    """Schema for invite response"""
    email: EmailStr
    token: str
    invite_link: str
    expires_at: datetime
    is_used: bool
    invited_by: Optional[UUID] = None
    email_sent: Optional[bool] = None
    email_error: Optional[str] = None

    class Config:
        from_attributes = True

class InviteList(BaseModel):
    """Schema for displaying invites in a list"""
    id: UUID
    email: EmailStr
    expires_at: datetime
    is_used: bool
    is_used: bool
    invited_by: Optional[UUID] = None
    email_sent: Optional[bool] = None
    email_error: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
