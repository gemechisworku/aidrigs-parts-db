"""
Price Tiers API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import csv
import io

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.reference_data import PriceTier
from app.schemas.reference_data import PriceTierCreate, PriceTierUpdate, PriceTierResponse
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[PriceTierResponse])
async def get_price_tiers(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all price tiers with optional search"""
    query = db.query(PriceTier)
    
    if search:
        query = query.filter(
            (PriceTier.tier_name.ilike(f"%{search}%")) |
            (PriceTier.description.ilike(f"%{search}%"))
        )
    
    tiers = query.offset(skip).limit(limit).all()
    return tiers


@router.get("/{tier_id}", response_model=PriceTierResponse)
async def get_price_tier(
    tier_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a single price tier by ID"""
    tier = db.query(PriceTier).filter(PriceTier.id == tier_id).first()
    if not tier:
        raise HTTPException(status_code=404, detail="Price tier not found")
    return tier


@router.post("/", response_model=PriceTierResponse, status_code=status.HTTP_201_CREATED)
async def create_price_tier(
    tier_data: PriceTierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new price tier"""
    # Check if tier_name already exists
    existing = db.query(PriceTier).filter(PriceTier.tier_name == tier_data.tier_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Price tier '{tier_data.tier_name}' already exists"
        )
    
    tier = PriceTier(**tier_data.model_dump())
    db.add(tier)
    db.commit()
    db.refresh(tier)
    return tier


@router.put("/{tier_id}", response_model=PriceTierResponse)
async def update_price_tier(
    tier_id: UUID,
    tier_data: PriceTierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a price tier"""
    tier = db.query(PriceTier).filter(PriceTier.id == tier_id).first()
    if not tier:
        raise HTTPException(status_code=404, detail="Price tier not found")
    
    update_data = tier_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tier, field, value)
    
    db.commit()
    db.refresh(tier)
    return tier


@router.delete("/{tier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_price_tier(
    tier_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a price tier"""
    tier = db.query(PriceTier).filter(PriceTier.id == tier_id).first()
    if not tier:
        raise HTTPException(status_code=404, detail="Price tier not found")
    
    db.delete(tier)
    db.commit()
    return None


@router.post("/bulk", response_model=dict)
async def bulk_upload_price_tiers(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Bulk upload price tiers from CSV
    
    Expected CSV format:
    tier_name,description,tier_kind
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported"
        )
    
    content = await file.read()
    csv_file = io.StringIO(content.decode('utf-8'))
    reader = csv.DictReader(csv_file)
    
    created_count = 0
    updated_count = 0
    errors = []
    
    for row_num, row in enumerate(reader, start=2):
        try:
            tier_name = row.get('tier_name', '').strip()
            if not tier_name:
                errors.append(f"Row {row_num}: tier_name is required")
                continue
            
            existing_tier = db.query(PriceTier).filter(PriceTier.tier_name == tier_name).first()
            
            tier_data = {
                'tier_name': tier_name,
                'description': row.get('description', '').strip() or None,
                'tier_kind': row.get('tier_kind', '').strip() or None
            }
            
            if existing_tier:
                for key, value in tier_data.items():
                    if value is not None:
                        setattr(existing_tier, key, value)
                updated_count += 1
            else:
                new_tier = PriceTier(**tier_data)
                db.add(new_tier)
                created_count += 1
                
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
    
    db.commit()
    
    return {
        "created": created_count,
        "updated": updated_count,
        "errors": errors
    }


@router.get("/template/download")
async def download_template(current_user: User = Depends(get_current_active_user)):
    """Download CSV template"""
    from fastapi.responses import StreamingResponse
    
    template = "tier_name,description,tier_kind\nWholesale,Wholesale pricing tier,wholesale\n"
    return StreamingResponse(
        io.StringIO(template),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=price_tiers_template.csv"}
    )
