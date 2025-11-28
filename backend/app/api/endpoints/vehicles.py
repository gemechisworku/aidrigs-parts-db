"""
Vehicles API endpoints
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.api import deps
from app.models.vehicle import Vehicle, VehicleEquivalence, VehiclePartCompatibility
from app.schemas.vehicle import (
    VehicleResponse,
    VehicleCreate,
    VehicleUpdate,
    VehicleEquivalenceResponse,
    VehicleEquivalenceCreate,
    VehiclePartCompatibilityResponse,
    VehiclePartCompatibilityCreate,
    BulkUploadResult
)
import csv
import io

router = APIRouter()


# Vehicles CRUD
@router.get("/")
def read_vehicles(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    search: str = "",
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Retrieve vehicles with pagination.
    """
    query = db.query(Vehicle)
    if search:
        query = query.filter(
            (Vehicle.vin.ilike(f"%{search}%")) |
            (Vehicle.make.ilike(f"%{search}%")) |
            (Vehicle.model.ilike(f"%{search}%"))
        )
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    vehicles = query.order_by(Vehicle.year.desc(), Vehicle.make, Vehicle.model).offset(skip).limit(limit).all()
    
    # Convert to schemas
    items = [VehicleResponse.model_validate(v) for v in vehicles]
    
    return {
        "items": items,
        "total": total,
        "page": skip // limit + 1 if limit > 0 else 1,
        "page_size": limit,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def read_vehicle(
    *,
    db: Session = Depends(deps.get_db),
    vehicle_id: UUID,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get vehicle by ID.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    *,
    db: Session = Depends(deps.get_db),
    vehicle_in: VehicleCreate,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create new vehicle.
    """
    # Check if VIN already exists
    existing = db.query(Vehicle).filter(Vehicle.vin == vehicle_in.vin).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle with VIN {vehicle_in.vin} already exists"
        )
    
    vehicle = Vehicle(**vehicle_in.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    *,
    db: Session = Depends(deps.get_db),
    vehicle_id: UUID,
    vehicle_in: VehicleUpdate,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update vehicle.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Check if VIN is being changed and if it already exists
    if vehicle_in.vin and vehicle_in.vin != vehicle.vin:
        existing = db.query(Vehicle).filter(Vehicle.vin == vehicle_in.vin).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vehicle with VIN {vehicle_in.vin} already exists"
            )
    
    update_data = vehicle_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vehicle, field, value)
    
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", response_model=VehicleResponse)
def delete_vehicle(
    *,
    db: Session = Depends(deps.get_db),
    vehicle_id: UUID,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Delete vehicle.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    db.delete(vehicle)
    db.commit()
    return vehicle


# Bulk upload
@router.post("/bulk-upload", response_model=BulkUploadResult)
async def bulk_upload(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Bulk upload vehicles from CSV file.
    Expected columns: vin, make, model, year, engine, trim, transmission, drive_type
    """
    created = 0
    updated = 0
    errors = []
    
    try:
        content = await file.read()
        decoded = content.decode('utf-8')
        csv_file = io.StringIO(decoded)
        reader = csv.DictReader(csv_file)
        
        for row_num, row in enumerate(reader, start=2):
            try:
                vin = row.get('vin', '').strip()
                if not vin or len(vin) != 17:
                    errors.append(f"Row {row_num}: Invalid or missing VIN")
                    continue
                
                make = row.get('make', '').strip()
                model = row.get('model', '').strip()
                year_str = row.get('year', '').strip()
                
                if not make or not model or not year_str:
                    errors.append(f"Row {row_num}: Missing required fields")
                    continue
                
                try:
                    year = int(year_str)
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid year")
                    continue
                
                # Check if exists
                existing = db.query(Vehicle).filter(Vehicle.vin == vin).first()
                
                if existing:
                    # Update
                    existing.make = make
                    existing.model = model
                    existing.year = year
                    existing.engine = row.get('engine', '').strip() or None
                    existing.trim = row.get('trim', '').strip() or None
                    existing.transmission = row.get('transmission', '').strip() or None
                    existing.drive_type = row.get('drive_type', '').strip() or None
                    updated += 1
                else:
                    # Create
                    new_vehicle = Vehicle(
                        vin=vin,
                        make=make,
                        model=model,
                        year=year,
                        engine=row.get('engine', '').strip() or None,
                        trim=row.get('trim', '').strip() or None,
                        transmission=row.get('transmission', '').strip() or None,
                        drive_type=row.get('drive_type', '').strip() or None
                    )
                    db.add(new_vehicle)
                    created += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                continue
        
        db.commit()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")
    
    return BulkUploadResult(created=created, updated=updated, errors=errors)


@router.get("/download/template")
async def download_template():
    """
    Download CSV template for bulk upload.
    """
    csv_content = "vin,make,model,year,engine,trim,transmission,drive_type\n"
    csv_content += "1HGBH41JXMN109186,Honda,Accord,2021,2.0L Turbo,Sport,CVT,FWD\n"
    csv_content += "5YJSA1E14HF158916,Tesla,Model S,2017,Electric,,Single Speed,RWD\n"
    
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vehicles_template.csv"}
    )


# Vehicle Equivalences
@router.get("/{vehicle_id}/equivalences", response_model=List[VehicleEquivalenceResponse])
def read_equivalences(
    *,
    db: Session = Depends(deps.get_db),
    vehicle_id: UUID,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get equivalences for a specific vehicle.
    """
    equivalences = db.query(VehicleEquivalence).filter(VehicleEquivalence.vin_prefix == vehicle_id).all()
    return equivalences


@router.post("/{vehicle_id}/equivalences", response_model=VehicleEquivalenceResponse)
def create_equivalence(
    *,
    db: Session = Depends(deps.get_db),
    vehicle_id: UUID,
    equivalence_in: VehicleEquivalenceCreate,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create new equivalence for vehicle.
    """
    # Check if vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    equivalence = VehicleEquivalence(**equivalence_in.model_dump())
    db.add(equivalence)
    db.commit()
    db.refresh(equivalence)
    return equivalence


@router.delete("/{vehicle_id}/equivalences/{equivalence_id}", response_model=VehicleEquivalenceResponse)
def delete_equivalence(
    *,
    db: Session = Depends(deps.get_db),
    vehicle_id: UUID,
    equivalence_id: UUID,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Delete equivalence.
    """
    equivalence = db.query(VehicleEquivalence).filter(
        VehicleEquivalence.id == equivalence_id,
        VehicleEquivalence.vin_prefix == vehicle_id
    ).first()
    if not equivalence:
        raise HTTPException(status_code=404, detail="Equivalence not found")
    
    db.delete(equivalence)
    db.commit()
    return equivalence


# Vehicle Part Compatibility
@router.get("/{vehicle_id}/compatible-parts", response_model=List[VehiclePartCompatibilityResponse])
def read_compatible_parts(
    *,
    db: Session = Depends(deps.get_db),
    vehicle_id: UUID,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get compatible parts for a specific vehicle.
    """
    compatibilities = db.query(VehiclePartCompatibility).filter(VehiclePartCompatibility.vehicle_id == vehicle_id).all()
    return compatibilities


@router.post("/{vehicle_id}/compatible-parts", response_model=VehiclePartCompatibilityResponse)
def create_compatible_part(
    *,
    db: Session = Depends(deps.get_db),
    vehicle_id: UUID,
    compatibility_in: VehiclePartCompatibilityCreate,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Add part compatibility for vehicle.
    """
    # Check if vehicle exists
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Check if already exists
    existing = db.query(VehiclePartCompatibility).filter(
        VehiclePartCompatibility.vehicle_id == vehicle_id,
        VehiclePartCompatibility.part_id == compatibility_in.part_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Compatibility already exists")
    
    compatibility = VehiclePartCompatibility(**compatibility_in.model_dump())
    db.add(compatibility)
    db.commit()
    db.refresh(compatibility)
    return compatibility


@router.delete("/{vehicle_id}/compatible-parts/{part_id}", response_model=VehiclePartCompatibilityResponse)
def delete_compatible_part(
    *,
    db: Session = Depends(deps.get_db),
    vehicle_id: UUID,
    part_id: UUID,
    current_user: dict = Depends(deps.get_current_active_user)
) -> Any:
    """
    Remove part compatibility.
    """
    compatibility = db.query(VehiclePartCompatibility).filter(
        VehiclePartCompatibility.vehicle_id == vehicle_id,
        VehiclePartCompatibility.part_id == part_id
    ).first()
    if not compatibility:
        raise HTTPException(status_code=404, detail="Compatibility not found")
    
    db.delete(compatibility)
    db.commit()
    return compatibility
