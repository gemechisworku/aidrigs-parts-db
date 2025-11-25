"""
Translation API endpoints for parts translation management
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
import csv
import io
from uuid import UUID

from app.api import deps
from app.models.translation import PartTranslationStandardization
from app.models.classification import Category, HSCode
from app.schemas.translation import (
    TranslationCreate,
    TranslationUpdate,
    TranslationResponse,
    TranslationListResponse,
    BulkUploadResponse,
)

router = APIRouter()


@router.get("/", response_model=TranslationListResponse)
async def list_translations(
    search: str = None,
    category_en: str = None,
    drive_side_specific: str = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Get list of translations with optional filters
    """
    query = db.query(PartTranslationStandardization)
    
    # Apply filters
    if search:
        search_filter = or_(
            PartTranslationStandardization.part_name_en.ilike(f"%{search}%"),
            PartTranslationStandardization.part_name_pr.ilike(f"%{search}%"),
            PartTranslationStandardization.part_name_fr.ilike(f"%{search}%"),
            PartTranslationStandardization.alternative_names.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if category_en:
        query = query.filter(PartTranslationStandardization.category_en == category_en)
    
    if drive_side_specific:
        query = query.filter(PartTranslationStandardization.drive_side_specific == drive_side_specific)
    
    # Count total
    total = query.count()
    
    # Paginate
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }


@router.post("/", response_model=TranslationResponse, status_code=status.HTTP_201_CREATED)
async def create_translation(
    translation: TranslationCreate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Create a new translation manually
    """
    # Check if part_name_en already exists (it's the primary key)
    existing = db.query(PartTranslationStandardization).filter(
        PartTranslationStandardization.part_name_en == translation.part_name_en
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Translation with part_name_en '{translation.part_name_en}' already exists"
        )
    
    # Validate category_en exists if provided
    if translation.category_en:
        category = db.query(Category).filter(Category.category_name_en == translation.category_en).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{translation.category_en}' not found"
            )
    
    # Validate hs_code exists if provided
    if translation.hs_code:
        hs_code = db.query(HSCode).filter(HSCode.hs_code == translation.hs_code).first()
        if not hs_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"HS Code '{translation.hs_code}' not found"
            )
    
    # Create new translation
    new_translation = PartTranslationStandardization(**translation.dict())
    
    db.add(new_translation)
    db.commit()
    db.refresh(new_translation)
    
    return new_translation


@router.get("/{translation_id}", response_model=TranslationResponse)
async def get_translation(
    translation_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Get a specific translation by ID
    """
    translation = db.query(PartTranslationStandardization).filter(
        PartTranslationStandardization.id == translation_id
    ).first()
    
    if not translation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Translation not found"
        )
    
    return translation


@router.put("/{translation_id}", response_model=TranslationResponse)
async def update_translation(
    translation_id: UUID,
    translation_update: TranslationUpdate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Update an existing translation (cannot update part_name_en as it's the primary key)
    """
    translation = db.query(PartTranslationStandardization).filter(
        PartTranslationStandardization.id == translation_id
    ).first()
    
    if not translation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Translation not found"
        )
    
    # Update fields
    update_data = translation_update.dict(exclude_unset=True)
    
    # Validate category_en exists if provided
    if "category_en" in update_data and update_data["category_en"]:
        category = db.query(Category).filter(Category.category_name_en == update_data["category_en"]).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{update_data['category_en']}' not found"
            )
    
    # Validate hs_code exists if provided
    if "hs_code" in update_data and update_data["hs_code"]:
        hs_code = db.query(HSCode).filter(HSCode.hs_code == update_data["hs_code"]).first()
        if not hs_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"HS Code '{update_data['hs_code']}' not found"
            )
    
    for field, value in update_data.items():
        setattr(translation, field, value)
    
    db.commit()
    db.refresh(translation)
    
    return translation


@router.delete("/{translation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_translation(
    translation_id: UUID,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Delete a translation
    """
    translation = db.query(PartTranslationStandardization).filter(
        PartTranslationStandardization.id == translation_id
    ).first()
    
    if not translation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Translation not found"
        )
    
    db.delete(translation)
    db.commit()
    
    return None


@router.post("/bulk-upload", response_model=BulkUploadResponse)
async def bulk_upload_translations(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
):
    """
    Bulk upload translations from CSV file
    
    CSV format: part_name_en,part_name_pr,part_name_fr,hs_code,category_en,drive_side_specific,alternative_names,links
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV"
        )
    
    content = await file.read()
    csv_text = content.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(csv_text))
    
    success_count = 0
    error_count = 0
    errors = []
    created_ids = []
    
    for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 (header is row 1)
        try:
            # Validate required fields
            if not row.get('part_name_en'):
                raise ValueError("part_name_en is required")
            
            # Check for duplicates
            existing = db.query(PartTranslationStandardization).filter(
                PartTranslationStandardization.part_name_en == row['part_name_en']
            ).first()
            
            if existing:
                raise ValueError(f"Translation '{row['part_name_en']}' already exists")
            
            # Validate category if provided
            category_en = row.get('category_en') or None
            if category_en:
                category = db.query(Category).filter(Category.category_name_en == category_en).first()
                if not category:
                    raise ValueError(f"Category '{category_en}' not found")
            
            # Validate hs_code if provided
            hs_code = row.get('hs_code') or None
            if hs_code:
                hs_obj = db.query(HSCode).filter(HSCode.hs_code == hs_code).first()
                if not hs_obj:
                    raise ValueError(f"HS Code '{hs_code}' not found")
            
            # Create translation
            new_translation = PartTranslationStandardization(
                part_name_en=row['part_name_en'],
                part_name_pr=row.get('part_name_pr') or None,
                part_name_fr=row.get('part_name_fr') or None,
                hs_code=hs_code,
                category_en=category_en,
                drive_side_specific=row.get('drive_side_specific') or 'no',
                alternative_names=row.get('alternative_names') or None,
                links=row.get('links') or None,
            )
            
            db.add(new_translation)
            db.flush()  # Flush to get ID
            created_ids.append(new_translation.id)
            success_count += 1
            
        except Exception as e:
            error_count += 1
            errors.append({
                "row": row_num,
                "data": dict(row),
                "error": str(e)
            })
    
    # Commit all successful insertions
    if success_count > 0:
        db.commit()
    else:
        db.rollback()
    
    return {
        "success_count": success_count,
        "error_count": error_count,
        "errors": errors,
        "created_ids": created_ids
    }


@router.get("/template/download")
async def download_csv_template(
    current_user = Depends(deps.get_current_active_user),
):
    """
    Download CSV template for bulk upload
    """
    csv_content = "part_name_en,part_name_pr,part_name_fr,hs_code,category_en,drive_side_specific,alternative_names,links\n"
    csv_content += "Oil Filter,Filtro de Óleo,Filtre à Huile,8421.23.00,Engine Parts,no,Oil Strainer,https://example.com\n"
    csv_content += "Brake Pad,Pastilha de Freio,Plaquette de Frein,8708.30.10,Brakes,yes,Brake Shoe,\n"
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=translation_template.csv"}
    )
