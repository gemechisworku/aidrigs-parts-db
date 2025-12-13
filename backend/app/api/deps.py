"""
API dependencies
"""
from typing import Generator
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_current_user, get_current_active_user, get_current_superuser

# Re-export for convenience
__all__ = ["get_db", "get_current_user", "get_current_active_user", "get_current_active_superuser"]

# Alias for backward compatibility or clarity
get_current_active_superuser = get_current_superuser


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for database session.
    Yields a database session and closes it after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
