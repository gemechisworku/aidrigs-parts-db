from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import date
from decimal import Decimal


# HS Code Schemas
class HSCodeBase(BaseModel):
    hs_code: str = Field(..., min_length=1, max_length=14)
    description_en: Optional[str] = Field(None, max_length=252)
    description_pr: Optional[str] = Field(None, max_length=252)
    description_pt: Optional[str] = Field(None, max_length=252)


class HSCodeCreate(HSCodeBase):
    pass


class HSCodeUpdate(BaseModel):
    description_en: Optional[str] = None
    description_pr: Optional[str] = None
    description_pt: Optional[str] = None


class HSCodeInDBBase(HSCodeBase):
    model_config = ConfigDict(from_attributes=True)


class HSCode(HSCodeInDBBase):
    pass


# HS Code Tariff Schemas
class HSCodeTariffBase(BaseModel):
    hs_code: str = Field(..., min_length=1, max_length=14)
    country_name: str = Field(..., max_length=60)
    tariff_rate: Optional[Decimal] = None
    last_updated: Optional[date] = None


class HSCodeTariffCreate(HSCodeTariffBase):
    pass


class HSCodeTariffUpdate(BaseModel):
    tariff_rate: Optional[Decimal] = None
    last_updated: Optional[date] = None


class HSCodeTariffInDBBase(HSCodeTariffBase):
    model_config = ConfigDict(from_attributes=True)


class HSCodeTariff(HSCodeTariffInDBBase):
    pass


# Combined response with tariffs
class HSCodeWithTariffs(HSCode):
    tariffs: List[HSCodeTariff] = []


# Bulk upload schemas
class BulkUploadResult(BaseModel):
    created: int
    updated: int
    errors: List[str]
