"""
CORRECTED create_part function with auto-create translation logic
Location: backend/app/api/endpoints/parts.py
Replace lines 104-180 (the entire create_part function)
"""

@router.post("/", response_model=PartResponse, status_code=status.HTTP_201_CREATED)
def create_part(
    *,
    db: Session = Depends(deps.get_db),
    part_in: PartCreate,
    current_user = Depends(deps.get_current_active_user),
    request: Request
) -> Any:
    """
    Create new part with validation and auto-create translations if needed.
    """
    from app.models.approval import ApprovalStatus
    from datetime import datetime
    
    # Check if part_id already exists
    existing = db.query(Part).filter(Part.part_id == part_in.part_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Part with part_id '{part_in.part_id}' already exists",
        )
    
    # Validate manufacturer exists if provided
    if part_in.mfg_id:
        mfg = db.query(Manufacturer).filter(Manufacturer.id == part_in.mfg_id).first()
        if not mfg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Manufacturer with id '{part_in.mfg_id}' not found",
            )
    
    # Validate/Auto-create part_name_en if provided
    if part_in.part_name_en:
        # First check for approved translations
        translation = db.query(PartTranslationStandardization).filter(
            PartTranslationStandardization.part_name_en == part_in.part_name_en,
            PartTranslationStandardization.approval_status == ApprovalStatus.APPROVED
        ).first()
        
        if not translation:
            # Check if there's already a pending translation
            pending_translation = db.query(PartTranslationStandardization).filter(
                PartTranslationStandardization.part_name_en == part_in.part_name_en
            ).first()
            
            if not pending_translation:
                # Auto-create new translation with pending approval
                logger.info(f"Auto-creating translation '{part_in.part_name_en}' with pending approval status")
                new_translation = PartTranslationStandardization(
                    part_name_en=part_in.part_name_en,
                    approval_status=ApprovalStatus.PENDING_APPROVAL,
                    submitted_at=datetime.utcnow(),
                    created_by=current_user.id
                )
                db.add(new_translation)
                db.flush()  # Get ID without full commit
    
    # Validate position_id exists if provided
    if part_in.position_id:
        position = db.query(PositionTranslation).filter(
            PositionTranslation.id == part_in.position_id
        ).first()
        if not position:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Position with id '{part_in.position_id}' not found",
            )
    
    # Create part
    part = Part(**part_in.model_dump())
    db.add(part)
    db.commit()
    db.refresh(part)
    
    # Audit log
    log_audit(
        db=db,
        action="CREATE",
        entity_type="parts",
        entity_id=str(part.id),
        user_id=current_user.id,
        changes={"new": make_json_serializable(part_in.model_dump())},
        request=request
    )
    logger.info(f"Part {part.part_id} created by user {current_user.username}")
    
    # Load relationships
    db.refresh(part)
    part = db.query(Part).options(
        joinedload(Part.manufacturer),
        joinedload(Part.part_translation),
        joinedload(Part.position)
    ).filter(Part.id == part.id).first()
    
    return part
