"""
Extracted Quotes API endpoints
"""
from typing import List, Any, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, UploadFile, File, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from datetime import datetime, date
import httpx
import logging

from app.api import deps
from app.models.extracted_quote import ExtractedQuote, ExtractedQuoteItem
from app.models.user import User
from app.schemas.extracted_quote import (
    ExtractedQuoteCreate,
    ExtractedQuoteUpdate,
    ExtractedQuoteResponse,
    ExtractedQuoteListResponse,
    ExtractedQuoteFilter,
    WebhookResponse,
    ExtractedQuoteItemCreate,
)
from app.core.audit import log_audit
from app.core.config import settings
from math import ceil

logger = logging.getLogger(__name__)

router = APIRouter()

router = APIRouter()


def make_json_serializable(obj):
    """Convert objects to JSON-serializable format"""
    from uuid import UUID
    from datetime import datetime, date
    from decimal import Decimal
    
    if isinstance(obj, UUID):
        return str(obj)
    elif isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: make_json_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [make_json_serializable(item) for item in obj]
    return obj


def parse_date(date_str: Optional[str]) -> Optional[date]:
    """Parse date string to date object"""
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str).date()
    except:
        return None


@router.post("/upload", response_model=ExtractedQuoteResponse, status_code=status.HTTP_201_CREATED)
async def upload_quote_file(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user),
    request: Request
) -> Any:
    """
    Upload a quote file (PDF/image), send to webhook for AI extraction,
    and save extracted data to database.
    """
    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: PDF, JPEG, PNG"
        )
    
    # Read file content
    file_content = await file.read()
    if len(file_content) > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 50MB limit"
        )
    
    logger.info(f"Uploading file {file.filename} ({file.content_type}) to webhook")
    
    # Send file to webhook
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:  # 120 second timeout
            files = {"file": (file.filename, file_content, file.content_type)}
            response = await client.post(settings.EXTRACTED_QUOTES_WEBHOOK_URL, files=files)
            response.raise_for_status()
            webhook_data = response.json()
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Webhook request timed out. Please try again."
        )
    except httpx.HTTPError as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error communicating with extraction service: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )
    
    # Parse webhook response - handle actual n8n format
    try:
        logger.info(f"Received webhook data: {webhook_data}")
        
        # The webhook returns {'extracted_data': [{'output': {'quote': {...}, 'items': [...]}}]}
        if 'extracted_data' in webhook_data and len(webhook_data['extracted_data']) > 0:
            # Get the first item from extracted_data array
            first_extract = webhook_data['extracted_data'][0]
            
            # Check if data is nested in 'output'
            if 'output' in first_extract:
                output_data = first_extract['output']
                quote_data = output_data.get('quote', {})
                items_data = output_data.get('items', [])
            else:
                # Fallback: treat first_extract as quote data
                quote_data = first_extract
                items_data = []
            
            # Extract quote-level info
            quote_number = quote_data.get('quote_number', '')
            quote_date_str = quote_data.get('quote_date')
            valid_until_str = quote_data.get('valid_until')
            vehicle_vin = quote_data.get('vehicle_vin')
            vehicle_make = quote_data.get('vehicle_make')
            vehicle_model = quote_data.get('vehicle_model')
            customer_name = quote_data.get('customer_name')
            customer_city = quote_data.get('customer_city')
            customer_country = quote_data.get('customer_country')
            customer_phone = quote_data.get('customer_phone')
            customer_email = quote_data.get('customer_email')
            currency = quote_data.get('currency', 'USD')
            origin_incoterm = quote_data.get('origin_incoterm')
            origin_port = quote_data.get('origin_port')
            
            logger.info(f"Parsed quote_number: {quote_number}, customer: {customer_name}, items count: {len(items_data)}")
        else:
            raise ValueError("No 'extracted_data' field in webhook response")
            
    except Exception as e:
        logger.error(f"Error parsing webhook response: {e}")
        logger.error(f"Webhook data: {webhook_data}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing extracted data: {str(e)}"
        )
    
    # Create ExtractedQuote
    extracted_quote = ExtractedQuote(
        quote_number=quote_number,
        quote_date=parse_date(quote_date_str),
        valid_until=parse_date(valid_until_str),
        vehicle_vin=vehicle_vin,
        vehicle_make=vehicle_make,
        vehicle_model=vehicle_model,
        customer_name=customer_name,
        customer_city=customer_city,
        customer_country=customer_country,
        customer_phone=customer_phone,
        customer_email=customer_email,
        currency=currency,
        origin_incoterm=origin_incoterm,
        origin_port=origin_port,
        attachment_filename=file.filename,
        attachment_data=file_content,
        attachment_mime_type=file.content_type,
        extraction_status="pending",
        uploaded_by=current_user.id
    )
    
    db.add(extracted_quote)
    db.flush()  # Get ID for items
    logger.info(f"Created ExtractedQuote with ID: {extracted_quote.id}, quote_number: {quote_number}")
    
    # Create ExtractedQuoteItems from the array
    for position, item_data in enumerate(items_data, start=1):
        extracted_item = ExtractedQuoteItem(
            extracted_quote_id=extracted_quote.id,
            part_name=item_data.get('part_name', item_data.get('output_part_name', '')),
            quantity=int(item_data.get('quantity', item_data.get('output_quantity', 1))),
            unit_price=float(item_data.get('unit_price', item_data.get('output_unit_price', 0))),
            tax_code=item_data.get('tax_code'),
            discount=float(item_data.get('discount', 0)),
            total_price=float(item_data.get('total_price', item_data.get('output_total_price', 0))),
            position=position
        )
        db.add(extracted_item)
        logger.info(f"Added item {position}: {extracted_item.part_name}")
    
    logger.info(f"Committing {len(items_data)} items to database...")
    db.commit()
    db.refresh(extracted_quote)
    logger.info(f"Successfully committed ExtractedQuote {extracted_quote.id}")
    
    # Audit log
    log_audit(
        db=db,
        action="CREATE",
        entity_type="extracted_quotes",
        entity_id=str(extracted_quote.id),
        user_id=current_user.id,
        changes={"new": {"quote_number": extracted_quote.quote_number, "filename": file.filename}},
        request=request
    )
    
    logger.info(f"Extracted quote {extracted_quote.id} created by user {current_user.username}")
    
    # Load relationships
    extracted_quote = db.query(ExtractedQuote).options(
        joinedload(ExtractedQuote.uploader),
        joinedload(ExtractedQuote.items)
    ).filter(ExtractedQuote.id == extracted_quote.id).first()
    
    return extracted_quote


@router.get("/", response_model=ExtractedQuoteListResponse)
def list_extracted_quotes(
    db: Session = Depends(deps.get_db),
    search: Optional[str] = Query(None),
    extraction_status: Optional[str] = Query(None),
    uploaded_by: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Retrieve extracted quotes with filtering and pagination.
    """
    query = db.query(ExtractedQuote).options(
        joinedload(ExtractedQuote.uploader),
        joinedload(ExtractedQuote.items)
    )
    
    # Search filter
    if search:
        query = query.filter(
            or_(
                ExtractedQuote.quote_number.ilike(f"%{search}%"),
                ExtractedQuote.customer_name.ilike(f"%{search}%")
            )
        )
    
    # Status filter
    if extraction_status:
        query = query.filter(ExtractedQuote.extraction_status == extraction_status)
    
    # Uploader filter
    if uploaded_by:
        query = query.filter(ExtractedQuote.uploaded_by == uploaded_by)
    
    # Filter out soft-deleted items
    query = query.filter(ExtractedQuote.deleted_at.is_(None))
    
    # Order by created_at descending (newest first)
    query = query.order_by(ExtractedQuote.created_at.desc())
    
    # Count total
    total = query.count()
    
    # Pagination
    skip = (page - 1) * page_size
    quotes = query.offset(skip).limit(page_size).all()
    
    return {
        "items": quotes,
        "total": total,
        "page": page,
        "pages": ceil(total / page_size) if total > 0 else 1,
        "page_size": page_size
    }


@router.get("/{quote_id}", response_model=ExtractedQuoteResponse)
def get_extracted_quote(
    *,
    db: Session = Depends(deps.get_db),
    quote_id: UUID,
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get single extracted quote by ID with items.
    """
    quote = db.query(ExtractedQuote).options(
        joinedload(ExtractedQuote.uploader),
        joinedload(ExtractedQuote.items)
    ).filter(ExtractedQuote.id == quote_id).first()
    
    if not quote or quote.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Extracted quote not found"
        )
    
    return quote


@router.put("/{quote_id}", response_model=ExtractedQuoteResponse)
def update_extracted_quote(
    *,
    db: Session = Depends(deps.get_db),
    quote_id: UUID,
    quote_in: ExtractedQuoteUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    request: Request
) -> Any:
    """
    Update an extracted quote and its items.
    """
    quote = db.query(ExtractedQuote).filter(ExtractedQuote.id == quote_id).first()
    if not quote or quote.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Extracted quote not found"
        )
    
    # Capture old values for audit
    update_data = quote_in.model_dump(exclude_unset=True, exclude={"items"})
    old_values = {field: getattr(quote, field) for field in update_data.keys()}
    
    # Update quote fields
    for field, value in update_data.items():
        setattr(quote, field, value)
    
    # Update items if provided
    if quote_in.items is not None:
        # Delete existing items
        db.query(ExtractedQuoteItem).filter(
            ExtractedQuoteItem.extracted_quote_id == quote_id
        ).delete()
        
        # Create new items
        for position, item_data in enumerate(quote_in.items, start=1):
            new_item = ExtractedQuoteItem(
                extracted_quote_id=quote_id,
                part_name=item_data.part_name,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                tax_code=item_data.tax_code,
                discount=item_data.discount or 0,
                total_price=item_data.total_price,
                position=position
            )
            db.add(new_item)
    
    db.add(quote)
    db.commit()
    db.refresh(quote)
    
    # Audit log
    log_audit(
        db=db,
        action="UPDATE",
        entity_type="extracted_quotes",
        entity_id=str(quote.id),
        user_id=current_user.id,
        changes={
            "old": make_json_serializable(old_values),
            "new": make_json_serializable(update_data)
        },
        request=request
    )
    
    logger.info(f"Extracted quote {quote.id} updated by user {current_user.username}")
    
    # Load relationships
    quote = db.query(ExtractedQuote).options(
        joinedload(ExtractedQuote.uploader),
        joinedload(ExtractedQuote.items)
    ).filter(ExtractedQuote.id == quote.id).first()
    
    return quote


@router.delete("/{quote_id}")
def delete_extracted_quote(
    *,
    db: Session = Depends(deps.get_db),
    quote_id: UUID,
    current_user: User = Depends(deps.get_current_active_user),
    request: Request
) -> Any:
    """
    Soft delete an extracted quote.
    """
    quote = db.query(ExtractedQuote).filter(ExtractedQuote.id == quote_id).first()
    if not quote or quote.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Extracted quote not found"
        )
    
    # Hard delete
    db.delete(quote)
    db.commit()
    
    # Audit log
    log_audit(
        db=db,
        action="DELETE",
        entity_type="extracted_quotes",
        entity_id=str(quote.id),
        user_id=current_user.id,
        changes={"old": {"quote_number": quote.quote_number}},
        request=request
    )
    
    logger.info(f"Extracted quote {quote.id} deleted by user {current_user.username}")
    
    return {"message": "Extracted quote deleted successfully", "id": str(quote.id)}


@router.get("/{quote_id}/preview")
def get_quote_file_preview(
    *,
    db: Session = Depends(deps.get_db),
    quote_id: UUID,
    current_user: User = Depends(deps.get_current_active_user)
) -> Response:
    """
    Get the original uploaded file for preview.
    Returns the file binary with appropriate content type.
    """
    quote = db.query(ExtractedQuote).filter(ExtractedQuote.id == quote_id).first()
    
    if not quote or quote.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Extracted quote not found"
        )
    
    if not quote.attachment_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No file attached to this quote"
        )
    
    return Response(
        content=quote.attachment_data,
        media_type=quote.attachment_mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'inline; filename="{quote.attachment_filename}"'
        }
    )


@router.get("/{quote_id}/file")
def download_quote_file(
    *,
    db: Session = Depends(deps.get_db),
    quote_id: UUID,
    current_user: User = Depends(deps.get_current_active_user)
) -> Response:
    """
    Download the original uploaded file.
    Returns the file binary as an attachment.
    """
    quote = db.query(ExtractedQuote).filter(ExtractedQuote.id == quote_id).first()
    
    if not quote or quote.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Extracted quote not found"
        )
    
    if not quote.attachment_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No file attached to this quote"
        )
    
    return Response(
        content=quote.attachment_data,
        media_type=quote.attachment_mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{quote.attachment_filename}"'
        }
    )
