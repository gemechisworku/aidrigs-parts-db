from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

# Shared properties
class CountryBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=2, description="ISO 3166-1 alpha-2 code")
    name: str = Field(..., max_length=100)
    currency_code: Optional[str] = Field(None, min_length=3, max_length=3)
    currency_name: Optional[str] = Field(None, max_length=100)

# Properties to receive on creation
class CountryCreate(CountryBase):
    pass

# Properties to receive on update
class CountryUpdate(BaseModel):
    name: Optional[str] = None
    currency_code: Optional[str] = None
    currency_name: Optional[str] = None

# Properties shared by models stored in DB
class CountryInDBBase(CountryBase):
    
    model_config = ConfigDict(from_attributes=True)

# Additional properties to return via API
class Country(CountryInDBBase):
    pass
