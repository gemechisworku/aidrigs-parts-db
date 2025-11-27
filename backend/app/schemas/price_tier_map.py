from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator
from datetime import datetime
from uuid import UUID

# Shared properties
class PriceTierMapBase(BaseModel):
    part_id: str = Field(..., max_length=12)
    tier_id: UUID
    price: Optional[float] = None

# Properties to receive on creation
class PriceTierMapCreate(PriceTierMapBase):
    pass

# Properties to receive on update
class PriceTierMapUpdate(BaseModel):
    price: Optional[float] = None

# Properties shared by models stored in DB
class PriceTierMapInDBBase(PriceTierMapBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Additional properties to return via API
class PriceTierMap(PriceTierMapInDBBase):
    tier_name: Optional[str] = None
    tier_kind: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    @model_validator(mode='before')
    @classmethod
    def flatten_tier_info(cls, data: Any) -> Any:
        # If data is an ORM object (SQLAlchemy model)
        if hasattr(data, 'tier') and data.tier:
            # We can't modify the ORM object, so we might need to rely on Pydantic's ability 
            # to read from properties if we added them to the ORM model, 
            # OR we convert to dict here if Pydantic allows returning a dict from a 'before' validator for an ORM input.
            # Pydantic V2 from_attributes handles ORM objects. 
            # The cleanest way is often to add properties to the SQLAlchemy model or use a getter.
            
            # However, returning a dict with the extra fields merged in works for Pydantic.
            # But converting a full SQLAlchemy object to dict recursively is hard.
            
            # Alternative: Set attributes on the object temporarily? No, that's risky.
            
            # Better approach: Use computed_field or property on the Pydantic model 
            # that pulls from the 'tier' attribute of the underlying object?
            # But 'tier' is not in the Pydantic model fields, so it won't be validated/copied unless we add it.
            pass
            
        return data

    # Let's try a different approach: Add 'tier' to the schema but exclude it from output, 
    # and use computed fields.
    # OR simpler: Just map it manually in the endpoint? No, we want it in the schema.
    
    # Let's go with the property approach on the Pydantic model, 
    # but we need access to the original ORM object.
    
    # Actually, the previous `model_validate` override I tried (in step 2872) was close but `model_validate` is a class method called on the *input*.
    # If we use `from_attributes=True`, the input `data` is the ORM object.
    
    @model_validator(mode='before')
    @classmethod
    def extract_tier_fields(cls, data: Any) -> Any:
        """
        Extract tier_name and tier_kind from the 'tier' relationship 
        if 'data' is an ORM object.
        """
        # Check if it's an object with a 'tier' attribute (like SQLAlchemy model)
        if not isinstance(data, dict) and hasattr(data, 'tier'):
            tier = getattr(data, 'tier', None)
            if tier:
                # We can't easily inject attributes into the ORM object safely.
                # But we can convert the relevant parts to a dict.
                # This is the standard Pydantic V2 "getter" pattern.
                
                # However, since we are inheriting from PriceTierMapInDBBase, 
                # we can just return an object that has these attributes.
                # The issue is the ORM object doesn't have them.
                
                # Let's try returning a proxy or a dict.
                try:
                    return {
                        'id': data.id,
                        'part_id': data.part_id,
                        'tier_id': data.tier_id,
                        'price': data.price,
                        'created_at': data.created_at,
                        'tier_name': tier.tier_name,
                        'tier_kind': tier.tier_kind
                    }
                except Exception:
                    return data
        return data
