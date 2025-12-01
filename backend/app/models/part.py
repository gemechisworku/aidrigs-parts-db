"""
Part models including main parts and equivalence
"""
from sqlalchemy import Column, String, Integer, Numeric, Enum, Text, ForeignKey, Table, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.core.database import Base
from app.models.approval import ApprovalStatus


# Association table for parts equivalence
parts_equivalence = Table(
    'parts_equivalence',
    Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True),
    Column('part_id', UUID(as_uuid=True), ForeignKey('parts.id', ondelete='CASCADE')),
    Column('equivalent_part_id', UUID(as_uuid=True), ForeignKey('parts.id', ondelete='CASCADE')),
    Column('created_at', DateTime, nullable=False),
    Column('created_by', UUID(as_uuid=True), ForeignKey('users.id')),
    Column('deleted_at', DateTime, nullable=True),
    Column('deleted_by', UUID(as_uuid=True), ForeignKey('users.id'))
)


class Part(BaseModel):
    """Main parts catalog"""
    
    __tablename__ = "parts"
    
    part_id = Column(String(12), unique=True, nullable=False, index=True)  # Legacy/external part ID
    mfg_id = Column(UUID(as_uuid=True), ForeignKey("manufacturers.id"))
    part_name_en = Column(String(60), ForeignKey("part_translation_standardization.part_name_en"))
    position_id = Column(UUID(as_uuid=True), ForeignKey("position_translation.id"))
    drive_side = Column(Enum('NA', 'LHD', 'RHD', name='drive_side_enum'), default='NA')
    designation = Column(String(255))
    status = Column(String(50), default='active')  # active, discontinued, pending
    
    # Physical attributes
    moq = Column(Integer)  # Minimum order quantity
    weight = Column(Numeric(10, 2))
    width = Column(Numeric(10, 2))
    length = Column(Numeric(10, 2))
    height = Column(Numeric(10, 2))
    
    # Additional info
    note = Column(Text)
    image_url = Column(Text)
    part_metadata = Column(JSONB)  # Flexible additional data (renamed from 'metadata' to avoid SQLAlchemy conflict)
    
    # Approval system fields
    approval_status = Column(Enum(ApprovalStatus), default=ApprovalStatus.APPROVED, nullable=False, index=True)
    submitted_at = Column(DateTime, nullable=True)  # When submitted for approval
    reviewed_at = Column(DateTime, nullable=True)   # When approved/rejected
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Equivalence System
    # Computed view for fast transitive lookups. Source of truth is parts_equivalence table.
    equivalence_group_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    # Relationships
    manufacturer = relationship("Manufacturer", back_populates="parts")
    part_translation = relationship("PartTranslationStandardization", back_populates="parts")
    position = relationship("PositionTranslation", back_populates="parts")
    
    # Self-referential many-to-many for equivalence
    # Note: The parts_equivalence table exists, queries can be done directly on it
    # or we can implement a method to get equivalent parts
    # equivalent_parts = relationship(
    #     "Part",
    #     secondary=parts_equivalence,
    #     primaryjoin="and_(Part.id==parts_equivalence.c.part_id)",
    #     secondaryjoin="and_(Part.id==parts_equivalence.c.equivalent_part_id)",
    #     backref="equivalent_to",
    #     lazy="select"
    # )
    
    # Other relationships
    supplier_parts = relationship("SupplierPart", back_populates="part")
    quote_items = relationship("QuoteItem", back_populates="part")
    inventory = relationship("Inventory", back_populates="part", uselist=False)
    vehicle_compatibility = relationship("VehiclePartCompatibility", back_populates="part")
    
    def __repr__(self):
        return f"<Part({self.part_id}: {self.designation})>"
