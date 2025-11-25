from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.classification import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse, CategoryTree

router = APIRouter()

@router.get("/", response_model=List[CategoryResponse])
def read_categories(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve categories.
    """
    categories = db.query(Category).offset(skip).limit(limit).all()
    return categories

@router.post("/", response_model=CategoryResponse)
def create_category(
    *,
    db: Session = Depends(deps.get_db),
    category_in: CategoryCreate,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new category.
    """
    category = Category(
        category_name_en=category_in.category_name_en,
        category_name_pr=category_in.category_name_pr,
        category_name_fr=category_in.category_name_fr,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    *,
    db: Session = Depends(deps.get_db),
    category_id: str,
    category_in: CategoryUpdate,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a category.
    """
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    
    update_data = category_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
        
    db.add(category)
    db.commit()
    db.refresh(category)
    return category
