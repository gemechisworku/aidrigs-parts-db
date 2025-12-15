from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_active_user, get_current_superuser, get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.core.config import settings
from app.core.email import send_reset_password_email
from app.core.security import generate_password_reset_token

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve users.
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: str,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update a user.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
    
    # Check permissions (only superuser or owner can update)
    if not current_user.is_superuser and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges",
        )
        
    user_data = jsonable_encoder(user)
    update_data = user_in.dict(exclude_unset=True)
    
    # If checking uniqueness when email changes
    if "email" in update_data and update_data["email"] != user.email:
         if db.query(User).filter(User.email == update_data["email"]).first():
             raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )

    for field in user_data:
        if field in update_data:
            setattr(user, field, update_data[field])
            
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/{user_id}/reset-password", status_code=200)
def reset_password_admin(
    *,
    db: Session = Depends(get_db),
    user_id: str,
    current_user: User = Depends(get_current_active_user), # Ideally superuser
) -> Any:
    """
    Trigger password reset for a user (Admin action).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )
        
    password_reset_token = generate_password_reset_token(email=user.email)
    frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:5173"
    link = f"{frontend_url}/reset-password?token={password_reset_token}"
    
    send_reset_password_email(user.email, user.email, link)
    
    return {"message": "Password reset email sent"}
