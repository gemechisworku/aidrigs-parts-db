from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.models.translation import PositionTranslation
from pydantic import BaseModel, UUID4

router = APIRouter()

class PositionResponse(BaseModel):
    id: UUID4
    position_id: str
    position_en: str
    position_pr: str | None = None
    position_fr: str | None = None
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[PositionResponse])
def read_positions(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve all positions for dropdown selection.
    """
    positions = db.query(PositionTranslation).offset(skip).limit(limit).all()
    return positions
