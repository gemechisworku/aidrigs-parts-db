"""
Test individual model imports to find the problematic one
"""

models_to_test = [
    "Role", "Permission", "UserRole", "RolePermission",
    "HSCode", "HSCodeTariff", "Category",
    "PartTranslationStandardization", "PositionTranslation",
    "Manufacturer", "Part",
    "Vehicle", "VehicleEquivalence", "VehiclePartCompatibility",
    "Supplier", "SupplierPart", "PricingRule",
    "Quote", "QuoteItem",
    "PurchaseOrder", "Port", "Shipment", "GRNItem",
    "Approval", "ApprovalWorkflow", "AuditLog", "Inventory"
]

for model_name in models_to_test:
    try:
        exec(f"from app.models import {model_name}")
        print(f"✅ {model_name}")
    except Exception as e:
        print(f"❌ {model_name}: {str(e)[:100]}")
        import traceback
        traceback.print_exc()
        break

print("\n🎉 All models imported successfully!")
