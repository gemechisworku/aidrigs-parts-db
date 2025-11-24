"""
Base models and mixins for all database models
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declared_attr
from app.core.database import Base


class TimestampMixin:
    """Mixin for timestamp fields"""
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


class SoftDeleteMixin:
    """Mixin for soft delete functionality"""
    
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    @property
    def is_deleted(self):
        return self.deleted_at is not None


class UUIDMixin:
    """Mixin for UUID primary key"""
    
    @declared_attr
    def id(cls):
        return Column(
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False
        )


class BaseModel(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """
    Base model with UUID primary key, timestamps, and soft delete
    All models should inherit from this
    """
    
    __abstract__ = True
    
    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"
