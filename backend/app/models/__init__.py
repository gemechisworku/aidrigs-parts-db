"""
Models package - imports all models for Alembic auto-discovery
"""
from app.models.base import BaseModel, TimestampMixin, SoftDeleteMixin, UUIDMixin
from app.models.user import User
from app.models.rbac import Role, Permission, UserRole, RolePermission
from app.models.classification import HSCode, HSCodeTariff, Category
from app.models.translation import PartTranslationStandardization, PositionTranslation
from app.models.manufacturer import Manufacturer
from app.models.part import Part
from app.models.vehicle import Vehicle, VehicleEquivalence, VehiclePartCompatibility
from app.models.supplier import Supplier, SupplierPart, PricingRule
from app.models.quote import Quote, QuoteItem
from app.models.purchasing import PurchaseOrder, Port, Shipment, GRNItem
from app.models.workflow import Approval, ApprovalWorkflow, AuditLog, Inventory

__all__ = [
    # Base
    "BaseModel",
    "TimestampMixin",
    "SoftDeleteMixin",
    "UUIDMixin",
    
    # User & RBAC
    "User",
    "Role",
    "Permission",
    "UserRole",
    "RolePermission",
    
    # Classification
    "HSCode",
    "HSCodeTariff",
    "Category",
    
    # Translation
    "PartTranslationStandardization",
    "PositionTranslation",
    
    # Parts & Manufacturers
    "Manufacturer",
    "Part",
    
    # Vehicles
    "Vehicle",
    "VehicleEquivalence",
    "VehiclePartCompatibility",
    
    # Suppliers & Pricing
    "Supplier",
    "SupplierPart",
    "PricingRule",
    
    # Quotes
    "Quote",
    "QuoteItem",
    
    # Purchasing
    "PurchaseOrder",
    "Port",
    "Shipment",
    "GRNItem",
    
    # Workflow & Audit
    "Approval",
    "ApprovalWorkflow",
    "AuditLog",
    "Inventory",
]
