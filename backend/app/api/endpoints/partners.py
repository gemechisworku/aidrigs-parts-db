"""
Partners API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import csv
import io

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.partners import Partner
from app.schemas.partners import PartnerCreate, PartnerUpdate, PartnerResponse
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[PartnerResponse])
async def get_partners(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    partner_type: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all partners with optional filters"""
    query = db.query(Partner).filter(Partner.deleted_at.is_(None))
    
    if search:
        query = query.filter(
            (Partner.name.ilike(f"%{search}%")) |
            (Partner.code.ilike(f"%{search}%")) |
            (Partner.city.ilike(f"%{search}%")) |
            (Partner.country.ilike(f"%{search}%"))
        )
    
    if partner_type:
        query = query.filter(Partner.type == partner_type)
    
    partners = query.offset(skip).limit(limit).all()
    return partners


@router.get("/{partner_id}", response_model=PartnerResponse)
async def get_partner(
    partner_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a single partner by ID"""
    partner = db.query(Partner).filter(
        Partner.id == partner_id,
        Partner.deleted_at.is_(None)
    ).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return partner


@router.post("/", response_model=PartnerResponse, status_code=status.HTTP_201_CREATED)
async def create_partner(
    partner_data: PartnerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new partner"""
    # Check if code already exists
    if partner_data.code:
        existing = db.query(Partner).filter(Partner.code == partner_data.code).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Partner with code {partner_data.code} already exists"
            )
    
    partner = Partner(**partner_data.model_dump())
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return partner


@router.put("/{partner_id}", response_model=PartnerResponse)
async def update_partner(
    partner_id: UUID,
    partner_data: PartnerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a partner"""
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    update_data = partner_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(partner, field, value)
    
    db.commit()
    db.refresh(partner)
    return partner


@router.delete("/{partner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_partner(
    partner_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Soft delete a partner"""
    from datetime import datetime
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    partner.deleted_at = datetime.utcnow()
    db.commit()
    return None


@router.post("/bulk", response_model=dict)
async def bulk_upload_partners(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Bulk upload partners from CSV
    
    Expected CSV format:
    code,name,street_number,city,country,type
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
            code = row.get('code', '').strip()
            name = row.get('name', '').strip()
            
            if not code:
                errors.append(f"Row {row_num}: code is required")
                continue
            
            existing_partner = db.query(Partner).filter(Partner.code == code).first()
            
            partner_data = {
                'code': code,
                'name': name or None,
                'street_number': row.get('street_number', '').strip() or None,
                'city': row.get('city', '').strip() or None,
                'country': row.get('country', '').strip() or None,
                'type': row.get('type', '').strip() or None
            }
            
            if existing_partner:
                for key, value in partner_data.items():
                    if value is not None:
                        setattr(existing_partner, key, value)
                updated_count += 1
            else:
                new_partner = Partner(**partner_data)
                db.add(new_partner)
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
    
    template = "code,name,street_number,city,country,type\nSUP001,Acme Suppliers,123,New York,USA,supplier\n"
    return StreamingResponse(
        io.StringIO(template),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=partners_template.csv"}
    )
