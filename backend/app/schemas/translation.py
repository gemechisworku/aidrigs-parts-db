"""
Pydantic schemas for translation management
"""
from typing import Optional, List
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
from uuid import UUID


class TranslationBase(BaseModel):
    """Base schema for translation"""
    part_name_en: str = Field(..., max_length=60, description="English part name (Primary Key)")
    part_name_pr: Optional[str] = Field(None, max_length=60, description="Portuguese part name")
    part_name_fr: Optional[str] = Field(None, max_length=60, description="French part name")
    hs_code: Optional[str] = Field(None, max_length=14, description="HS Code (Harmonized System)")
    category_en: Optional[str] = Field(None, max_length=60, description="Category name in English")
    drive_side_specific: Optional[str] = Field('no', pattern="^(yes|no)$", description="Drive side specific")
    alternative_names: Optional[str] = Field(None, max_length=60, description="Alternative names (comma-separated)")
    links: Optional[str] = Field(None, max_length=1024, description="Related links")


class TranslationCreate(TranslationBase):
    """Schema for creating a new translation"""
    pass


class TranslationUpdate(BaseModel):
    """Schema for updating an existing translation"""
    part_name_pr: Optional[str] = Field(None, max_length=60)
    part_name_fr: Optional[str] = Field(None, max_length=60)
    hs_code: Optional[str] = Field(None, max_length=14)
    category_en: Optional[str] = Field(None, max_length=60)
    drive_side_specific: Optional[str] = Field(None, pattern="^(yes|no)$")
    alternative_names: Optional[str] = Field(None, max_length=60)
    links: Optional[str] = Field(None, max_length=1024)


class TranslationResponse(TranslationBase):
    """Schema for translation response"""
    id: UUID
    approval_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TranslationListResponse(BaseModel):
    """Schema for paginated translation list"""
    items: List[TranslationResponse]
    total: int
    page: int
    page_size: int
    pages: int


class CSVTranslationRow(BaseModel):
    """Schema for a single CSV row"""
    part_name_en: str
    part_name_pr: Optional[str] = None
    part_name_fr: Optional[str] = None
    hs_code: Optional[str] = None
    category_en: Optional[str] = None
    drive_side_specific: Optional[str] = 'no'
    alternative_names: Optional[str] = None
    links: Optional[str] = None


class BulkTranslationCreate(BaseModel):
    """Schema for bulk translation creation via CSV"""
    translations: List[CSVTranslationRow]


class BulkUploadResponse(BaseModel):
    """Response for bulk upload"""
    success_count: int
    error_count: int
    errors: List[dict]  # List of {row: int, error: str}
    created_ids: List[UUID]


class TranslationFilter(BaseModel):
    """Schema for filtering translations"""
    search: Optional[str] = None
    category_en: Optional[str] = None
    drive_side_specific: Optional[str] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=100)


class PendingTranslationResponse(BaseModel):
    """Detailed response for pending translations"""
    id: UUID
    part_name_en: str
    part_name_pr: Optional[str] = None
    part_name_fr: Optional[str] = None
    hs_code: Optional[str] = None
    category_en: Optional[str] = None
    approval_status: str
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
