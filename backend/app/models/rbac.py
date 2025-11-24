"""
RBAC (Role-Based Access Control) models
"""
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel, TimestampMixin
from app.core.database import Base


class Role(BaseModel):
    """Role model for RBAC"""
    
    __tablename__ = "roles"
    
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    is_system = Column(Boolean, default=False, nullable=False)  # System roles cannot be deleted
    
    # Relationships
    users = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Role(name={self.name})>"


class Permission(BaseModel):
    """Permission model for granular access control"""
    
    __tablename__ = "permissions"
    __table_args__ = (
        UniqueConstraint('resource', 'action', name='uix_resource_action'),
    )
    
    resource = Column(String(100), nullable=False, index=True)  # e.g., 'parts', 'quotes', 'users'
    action = Column(String(50), nullable=False, index=True)  # e.g., 'create', 'read', 'update', 'delete'
    description = Column(Text)
    
    # Relationships
    roles = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Permission({self.resource}:{self.action})>"


class UserRole(Base, TimestampMixin):
    """Association table for User-Role many-to-many relationship"""
    
    __tablename__ = "user_roles"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    assigned_at = Column(DateTime(timezone=True))
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Relationships
    user = relationship("User", back_populates="roles", foreign_keys=[user_id])
    role = relationship("Role", back_populates="users", foreign_keys=[role_id])
    assigner = relationship("User", foreign_keys=[assigned_by])
    
    def __repr__(self):
        return f"<UserRole(user_id={self.user_id}, role_id={self.role_id})>"


class RolePermission(Base):
    """Association table for Role-Permission many-to-many relationship"""
    
    __tablename__ = "role_permissions"
    
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id = Column(UUID(as_uuid=True), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
    
    # Relationships
    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="roles")
    
    def __repr__(self):
        return f"<RolePermission(role_id={self.role_id}, permission_id={self.permission_id})>"
