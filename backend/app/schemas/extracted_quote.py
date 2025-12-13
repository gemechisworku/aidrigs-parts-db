"""
Pydantic schemas for extracted quotes
"""
from typing import Optional, List
from pydantic import BaseModel, UUID4, Field, EmailStr
from datetime import datetime, date
from decimal import Decimal


# Extracted Quote Item Schemas
class ExtractedQuoteItemBase(BaseModel):
    """Base schema for extracted quote items"""
    part_name: str = Field(..., description="Part name/designation")
    quantity: int = Field(..., ge=1, description="Quantity")
    unit_price: Decimal = Field(..., ge=0, description="Unit price")
    tax_code: Optional[str] = Field(None, max_length=20)
    discount: Optional[Decimal] = Field(0, ge=0, le=100, description="Discount percentage")
    total_price: Decimal = Field(..., ge=0, description="Line total price")
    position: Optional[int] = Field(None, ge=1, description="Display order")


class ExtractedQuoteItemCreate(ExtractedQuoteItemBase):
    """Schema for creating extracted quote items"""
    pass


class ExtractedQuoteItemUpdate(BaseModel):
    """Schema for updating extracted quote items - all fields optional"""
    part_name: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=1)
    unit_price: Optional[Decimal] = Field(None, ge=0)
    tax_code: Optional[str] = Field(None, max_length=20)
    discount: Optional[Decimal] = Field(None, ge=0, le=100)
    total_price: Optional[Decimal] = Field(None, ge=0)
    position: Optional[int] = Field(None, ge=1)


class ExtractedQuoteItemResponse(ExtractedQuoteItemBase):
    """Schema for extracted quote item response"""
    id: UUID4
    extracted_quote_id: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Extracted Quote Schemas
class ExtractedQuoteBase(BaseModel):
    """Base schema for extracted quotes"""
    quote_number: Optional[str] = Field(None, max_length=50)
    quote_date: Optional[date] = None
    valid_until: Optional[date] = None
    vehicle_vin: Optional[str] = Field(None, max_length=100)
    vehicle_make: Optional[str] = Field(None, max_length=100)
    vehicle_model: Optional[str] = Field(None, max_length=100)
    customer_name: Optional[str] = Field(None, max_length=255)
    customer_city: Optional[str] = Field(None, max_length=255)
    customer_country: Optional[str] = Field(None, max_length=255)
    customer_phone: Optional[str] = Field(None, max_length=50)
    customer_email: Optional[EmailStr] = None
    currency: str = Field(default="USD", pattern="^[A-Z]{3}$")
    origin_incoterm: Optional[str] = Field(None, max_length=10)
    origin_port: Optional[str] = Field(None, max_length=255)


class ExtractedQuoteCreate(ExtractedQuoteBase):
    """Schema for creating extracted quotes with nested items"""
    items: List[ExtractedQuoteItemCreate] = Field(..., min_length=1)


class ExtractedQuoteUpdate(BaseModel):
    """Schema for updating extracted quotes"""
    quote_number: Optional[str] = Field(None, max_length=50)
    quote_date: Optional[date] = None
    valid_until: Optional[date] = None
    vehicle_vin: Optional[str] = Field(None, max_length=100)
    vehicle_make: Optional[str] = Field(None, max_length=100)
    vehicle_model: Optional[str] = Field(None, max_length=100)
    customer_name: Optional[str] = Field(None, max_length=255)
    customer_city: Optional[str] = Field(None, max_length=255)
    customer_country: Optional[str] = Field(None, max_length=255)
    customer_phone: Optional[str] = Field(None, max_length=50)
    customer_email: Optional[EmailStr] = None
    currency: Optional[str] = Field(None, pattern="^[A-Z]{3}$")
    origin_incoterm: Optional[str] = Field(None, max_length=10)
    origin_port: Optional[str] = Field(None, max_length=255)
    extraction_status: Optional[str] = Field(None, max_length=50)
    items: Optional[List[ExtractedQuoteItemCreate]] = None


# Nested user schema
class UploaderNested(BaseModel):
    """Nested uploader info"""
    id: UUID4
    username: str
    email: str
    
    class Config:
        from_attributes = True


class ExtractedQuoteResponse(ExtractedQuoteBase):
    """Schema for extracted quote response with items and uploader"""
    id: UUID4
    extraction_status: str
    uploaded_by: Optional[UUID4] = None
    uploader: Optional[UploaderNested] = None
    items: List[ExtractedQuoteItemResponse] = []
    attachment_filename: Optional[str] = None
    attachment_mime_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ExtractedQuoteListResponse(BaseModel):
    """Paginated list response for extracted quotes"""
    items: List[ExtractedQuoteResponse]
    total: int
    page: int
    pages: int
    page_size: int


class ExtractedQuoteFilter(BaseModel):
    """Filters for extracted quotes list"""
    search: Optional[str] = None  # Search in quote_number or customer_name
    extraction_status: Optional[str] = None  # pending, reviewed, imported, error
    uploaded_by: Optional[UUID4] = None
    page: int = 1
    page_size: int = 20


# Schema for the webhook response
class WebhookQuoteItem(BaseModel):
    """Schema matching webhook response for quote items"""
    part_name: str
    quantity: int
    unit_price: float
    tax_code: Optional[str] = None
    discount: Optional[float] = 0
    total_price: float


class WebhookQuoteData(BaseModel):
    """Schema matching webhook response for quote"""
    quote_number: str
    quote_date: Optional[str] = None  # Will be parsed to date
    valid_until: Optional[str] = None  # Will be parsed to date
    vehicle_vin: Optional[str] = None
    vehicle_make: Optional[str] = None
    vehicle_model: Optional[str] = None
    customer_name: Optional[str] = None
    customer_city: Optional[str] = None
    customer_country: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    currency: str = "USD"
    origin_incoterm: Optional[str] = None
    origin_port: Optional[str] = None


class WebhookResponse(BaseModel):
    """Schema for complete webhook response"""
    quote: WebhookQuoteData
    items: List[WebhookQuoteItem]
