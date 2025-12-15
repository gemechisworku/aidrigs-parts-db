"""
User and authentication models
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class User(BaseModel):
    """User model for authentication and authorization"""
    
    __tablename__ = "users"
    
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan", foreign_keys="UserRole.user_id")
    roles = relationship("Role", secondary="user_roles", foreign_keys="[UserRole.user_id, UserRole.role_id]", viewonly=True)
    created_quotes = relationship("Quote", back_populates="creator", foreign_keys="Quote.created_by")
    uploaded_quotes = relationship("ExtractedQuote", back_populates="uploader", foreign_keys="ExtractedQuote.uploaded_by")
    created_pos = relationship("PurchaseOrder", back_populates="creator", foreign_keys="PurchaseOrder.created_by")
    created_pos = relationship("PurchaseOrder", back_populates="creator", foreign_keys="PurchaseOrder.created_by")
    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.user_id")
    invites = relationship("UserInvite", back_populates="user", cascade="all, delete-orphan", foreign_keys="UserInvite.invited_by")
    
    @property
    def full_name(self):
        """Return full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
    
    def __repr__(self):
        return f"<User(username={self.username}, email={self.email})>"


class UserInvite(BaseModel):
    """Model for user invitations"""
    
    __tablename__ = "user_invites"
    
    email = Column(String(255), nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    invited_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    email_sent = Column(Boolean, default=False)
    email_error = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="invites", foreign_keys=[invited_by])
    
    def __repr__(self):
        return f"<UserInvite(email={self.email}, is_used={self.is_used})>"
