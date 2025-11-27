"""
Pydantic schemas for Partners and Contacts
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class PartnerTypeEnum(str, Enum):
    """Partner type enumeration"""
    SUPPLIER = "supplier"
    CUSTOMER = "customer"
    AR_STORAGE = "AR_storage"
    FORWARDER = "forwarder"


class ContactBase(BaseModel):
    """Base contact schema"""
    full_name: Optional[str] = Field(None, max_length=60)
    job_title: Optional[str] = Field(None, max_length=60)
    email: Optional[str] = Field(None, max_length=60)
    phone1: Optional[str] = Field(None, max_length=12)
    phone2: Optional[str] = Field(None, max_length=12)


class ContactCreate(ContactBase):
    """Schema for creating a contact"""
    partner_id: UUID


class ContactUpdate(ContactBase):
    """Schema for updating a contact"""
    pass


class ContactResponse(ContactBase):
    """Schema for contact response"""
    id: UUID
    partner_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PartnerBase(BaseModel):
    """Base partner schema"""
    code: Optional[str] = Field(None, max_length=10)
    name: Optional[str] = Field(None, max_length=60)
    street_number: Optional[str] = Field(None, max_length=10)
    city: Optional[str] = Field(None, max_length=60)
    country: Optional[str] = Field(None, max_length=60)
    type: Optional[PartnerTypeEnum] = None


class PartnerCreate(PartnerBase):
    """Schema for creating a partner"""
    pass


class PartnerUpdate(PartnerBase):
    """Schema for updating a partner"""
    pass


class PartnerResponse(PartnerBase):
    """Schema for partner response"""
    id: UUID
    created_at: datetime
    updated_at: datetime
    contacts: List[ContactResponse] = []
    
    class Config:
        from_attributes = True
