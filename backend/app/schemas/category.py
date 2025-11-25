from typing import Optional, List
from pydantic import BaseModel, UUID4
from datetime import datetime

class CategoryBase(BaseModel):
    category_name_en: str
    category_name_pr: Optional[str] = None
    category_name_fr: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    category_name_en: Optional[str] = None
    category_name_pr: Optional[str] = None
    category_name_fr: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Deprecated tree structure since we don't have parent_id
# But keeping the name if frontend expects it, or just alias it
CategoryTree = CategoryResponse
