"""
User and authentication models
"""
from sqlalchemy import Column, String, Boolean, DateTime
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
    created_pos = relationship("PurchaseOrder", back_populates="creator", foreign_keys="PurchaseOrder.created_by")
    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.user_id")
    
    @property
    def full_name(self):
        """Return full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
    
    def __repr__(self):
        return f"<User(username={self.username}, email={self.email})>"
