"""
API Endpoints for User Invites
"""
from typing import List, Any
from datetime import datetime, timedelta, timezone
import secrets
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user, get_current_superuser
from app.api import deps
from app.models.user import User, UserInvite
from app.schemas.invite import InviteCreate, InviteResponse, InviteList
from app.core.config import settings
from app.core.email import send_invite_email

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=InviteResponse)
def create_invite(
    *,
    db: Session = Depends(get_db),
    invite_in: InviteCreate,
    current_user: User = Depends(get_current_active_user), # Allow any active user to invite for now, or change to superuser
) -> Any:
    """
    Create a new user invitation.
    """
    # Check if email is already registered
    if db.query(User).filter(User.email == invite_in.email).first():
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )

    # Check for existing valid invite
    existing_invite = db.query(UserInvite).filter(
        UserInvite.email == invite_in.email,
        UserInvite.is_used == False,
        UserInvite.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if existing_invite:
        # We could return the existing one, or regenerate. Let's regenerate.
        existing_invite.expires_at = datetime.now(timezone.utc) # Expire it
        db.add(existing_invite)
        db.commit()

    # Generate token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=48)
    
    # Create invite
    invite = UserInvite(
        email=invite_in.email,
        token=token,
        expires_at=expires_at,
        invited_by=current_user.id
    )
    
    db.add(invite)
    db.commit()
    db.refresh(invite)
    
    # Construct link (Frontend URL)
    # Assuming frontend is on the first allowed origin or localhost:5173 as fallback
    frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:5173"
    invite_link = f"{frontend_url}/register?token={token}"
    
    # Send email if requested
    email_sent = None
    email_error = None
    
    if invite_in.send_email:
        try:
            success = send_invite_email(invite.email, invite_link)
            email_sent = success
            if not success:
                logger.warning(f"Failed to send invite email to {invite.email}")
                email_error = "Failed to send email (check logs)"
        except Exception as e:
            logger.error(f"Error sending invite email: {e}")
            email_sent = False
            email_error = str(e)
            
    # Update invite with email status
    invite.email_sent = email_sent
    invite.email_error = email_error
    db.commit()

    # Serialize response manually to add computed fields
    return InviteResponse(
        email=invite.email,
        token=invite.token,
        invite_link=invite_link,
        expires_at=invite.expires_at,
        is_used=invite.is_used,
        invited_by=invite.invited_by,
        email_sent=email_sent,
        email_error=email_error
    )

@router.get("/", response_model=List[InviteList])
def list_invites(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    List all invitations.
    """
    invites = db.query(UserInvite).offset(skip).limit(limit).all()
    return invites

@router.delete("/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invite(
    *,
    db: Session = Depends(get_db),
    invite_id: str,
    current_user: User = Depends(get_current_active_user),
) -> None:
    """
    Delete/Revoke an invitation.
    """
    invite = db.query(UserInvite).filter(UserInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(
            status_code=404,
            detail="Invite not found"
        )
    
    db.delete(invite)
    db.commit()
    return None

@router.get("/validate", response_model=InviteResponse)
def validate_invite(
    token: str,
    db: Session = Depends(get_db),
) -> Any:
    """
    Validate an invite token and return invite details.
    """
    invite = db.query(UserInvite).filter(UserInvite.token == token).first()
    if not invite:
        raise HTTPException(
            status_code=404,
            detail="Invalid invite token"
        )
    
    if invite.is_used:
        raise HTTPException(
            status_code=400,
            detail="Invite token already used"
        )

    if invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=400,
            detail="Invite token expired"
        )
        
    # Construct link logic repeated (optional, or just return basic invite)
    # The response model requires invite_link, so we verify what fields are needed for InviteResponse
    # InviteResponse allows optional computed fields? Let's check schema.
    # Actually, InviteResponse requires invite_link. We can just put a placeholder or reconstruct it.
    
    frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:5173"
    invite_link = f"{frontend_url}/register?token={token}"

    return InviteResponse(
        email=invite.email,
        token=invite.token,
        invite_link=invite_link,
        expires_at=invite.expires_at,
        is_used=invite.is_used,
        invited_by=invite.invited_by,
        email_sent=invite.email_sent,
        email_error=invite.email_error
    )
