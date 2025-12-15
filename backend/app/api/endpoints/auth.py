"""
Authentication endpoints for user registration, login, and token management
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    get_current_active_user,
    get_db
)
from app.core.config import settings
from app.models.user import User, UserInvite
from app.schemas.auth import UserLogin, UserRegister, Token, PasswordChange, PasswordResetRequest, PasswordResetConfirm
from app.schemas.user import UserResponse, UserWithRoles, UserUpdate
from app.core.audit import log_audit
import logging
from datetime import datetime, timezone
from app.core.email import send_reset_password_email
from app.core.security import generate_password_reset_token, verify_password_reset_token
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user
    
    - **email**: User email address (must be unique)
    - **username**: Username (must be unique, alphanumeric + underscore)
    - **password**: Password (min 8 chars, must include upper, lower, digit)
    - **first_name**: Optional first name
    - **last_name**: Optional last name
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Validate Invite Token
    invite = db.query(UserInvite).filter(UserInvite.token == user_data.token).first()
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invite token"
        )
        
    if invite.is_used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite token already used"
        )
        
    if invite.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite token expired"
        )
        
    if invite.email != user_data.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email does not match invite"
        )
    
    # Create new user
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        is_active=True,
        is_superuser=False
    )
    
    db.add(new_user)
    
    # Mark invite as used
    invite.is_used = True
    invite.invited_by = invite.invited_by # Keep track of who invited
    db.add(invite)
    
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Login with email/username and password to get JWT token
    
    OAuth2 compatible token login, get an access token for future requests
    """
    # Try to find user by email or username
    user = db.query(User).filter(
        (User.email == form_data.username) | (User.username == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    
    # Update last login
    from datetime import datetime
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login/json", response_model=Token)
async def login_json(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Alternative login endpoint accepting JSON instead of form data
    
    - **email**: User email address
    - **password**: User password
    """
    user = db.query(User).filter(User.email == user_credentials.email).first()
    
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    
    # Update last login
    from datetime import datetime
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserWithRoles)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Get current logged-in user information
    
    Requires valid JWT token in Authorization header
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_user_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user information
    """
    if user_in.email and user_in.email != current_user.email:
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == user_in.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = user_in.email
        
    if user_in.first_name is not None:
        current_user.first_name = user_in.first_name
        
    if user_in.last_name is not None:
        current_user.last_name = user_in.last_name
        
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Change password for current user
    
    - **old_password**: Current password
    - **new_password**: New password (min 8 chars, must include upper, lower, digit)
    """
    # Verify old password
    if not verify_password(password_data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(current_user: User = Depends(get_current_active_user)):
    """
    Logout current user
    
    Note: Since we're using stateless JWT, actual logout is handled client-side
    by removing the token. This endpoint is mainly for logging purposes.
    """
    return {"message": "Logged out successfully"}


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(
    password_request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Request password reset email
    """
    user = db.query(User).filter(User.email == password_request.email).first()
    # We always return success to prevent email enumeration
    if user and user.is_active:
        token = generate_password_reset_token(email=user.email)
        frontend_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:5173"
        link = f"{frontend_url}/reset-password?token={token}"
        send_reset_password_email(user.email, user.email, link)
        
    return {"message": "If this email exists, a password reset link has been sent"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    password_reset: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Reset password using token
    """
    email = verify_password_reset_token(password_reset.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
        
    user.password_hash = get_password_hash(password_reset.new_password)
    db.commit()
    
    return {"message": "Password reset successfully"}
