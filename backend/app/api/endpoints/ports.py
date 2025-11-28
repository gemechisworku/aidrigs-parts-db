"""
Ports API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import csv
import io

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.reference_data import Port
from app.schemas.reference_data import PortCreate, PortUpdate, PortResponse
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=List[PortResponse])
async def get_ports(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all ports with optional search"""
    from sqlalchemy.orm import joinedload
    
    query = db.query(Port).options(joinedload(Port.country_details))
    
    if search:
        query = query.filter(
            (Port.port_name.ilike(f"%{search}%")) |
            (Port.port_code.ilike(f"%{search}%")) |
            (Port.city.ilike(f"%{search}%")) |
            (Port.country.ilike(f"%{search}%"))
        )
    
    ports = query.offset(skip).limit(limit).all()
    
    # Manually add country_name to each port
    result = []
    for port in ports:
        port_dict = PortResponse.model_validate(port).model_dump()
        if port.country_details:
            port_dict['country_name'] = port.country_details.name
        result.append(port_dict)
    
    return result


@router.get("/{port_id}", response_model=PortResponse)
async def get_port(
    port_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a single port by ID"""
    from sqlalchemy.orm import joinedload
    
    port = db.query(Port).options(joinedload(Port.country_details)).filter(Port.id == port_id).first()
    if not port:
        raise HTTPException(status_code=404, detail="Port not found")
    
    # Manually add country_name
    port_dict = PortResponse.model_validate(port).model_dump()
    if port.country_details:
        port_dict['country_name'] = port.country_details.name
    
    return port_dict


@router.post("/", response_model=PortResponse, status_code=status.HTTP_201_CREATED)
async def create_port(
    port_data: PortCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new port"""
    # Check if port_code already exists
    existing = db.query(Port).filter(Port.port_code == port_data.port_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Port with code {port_data.port_code} already exists"
        )
    
    port = Port(**port_data.model_dump())
    db.add(port)
    db.commit()
    db.refresh(port)
    return port


@router.put("/{port_id}", response_model=PortResponse)
async def update_port(
    port_id: UUID,
    port_data: PortUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a port"""
    port = db.query(Port).filter(Port.id == port_id).first()
    if not port:
        raise HTTPException(status_code=404, detail="Port not found")
    
    # Update fields
    update_data = port_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(port, field, value)
    
    db.commit()
    db.refresh(port)
    return port


@router.delete("/{port_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_port(
    port_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a port"""
    port = db.query(Port).filter(Port.id == port_id).first()
    if not port:
        raise HTTPException(status_code=404, detail="Port not found")
    
    db.delete(port)
    db.commit()
    return None


@router.post("/bulk", response_model=dict)
async def bulk_upload_ports(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Bulk upload ports from CSV file
    
    Expected CSV format:
    port_code,port_name,country,city,type
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
            port_code = row.get('port_code', '').strip()
            if not port_code:
                errors.append(f"Row {row_num}: port_code is required")
                continue
            
            # Check if port exists
            existing_port = db.query(Port).filter(Port.port_code == port_code).first()
            
            port_data = {
                'port_code': port_code,
                'port_name': row.get('port_name', '').strip() or None,
                'country': row.get('country', '').strip() or None,
                'city': row.get('city', '').strip() or None,
                'type': row.get('type', '').strip() or None
            }
            
            if existing_port:
                # Update existing
                for key, value in port_data.items():
                    if value is not None:
                        setattr(existing_port, key, value)
                updated_count += 1
            else:
                # Create new
                new_port = Port(**port_data)
                db.add(new_port)
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
    """Download CSV template for bulk upload"""
    from fastapi.responses import StreamingResponse
    
    template = "port_code,port_name,country,city,type\nEXAMPLE,Example Port,Example Country,Example City,Sea\n"
    return StreamingResponse(
        io.StringIO(template),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ports_template.csv"}
    )
