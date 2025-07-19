from pydantic import BaseModel, validator, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import re

class ReceiptCreate(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=255)
    vendor: Optional[str] = Field(None, max_length=255)
    date: Optional[str] = Field(None, regex=r'^\d{4}-\d{2}-\d{2}$')
    amount: Optional[float] = Field(None, ge=0)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    file_type: str = Field(..., max_length=50)
    file_size: int = Field(..., gt=0)
    extracted_text: Optional[str] = None
    confidence_score: Optional[float] = Field(default=0.0, ge=0.0, le=1.0)
    
    @validator('amount')
    def validate_amount(cls, v):
        if v is not None and v < 0:
            raise ValueError('Amount must be positive')
        return v
    
    @validator('date')
    def validate_date(cls, v):
        if v:
            try:
                datetime.strptime(v, '%Y-%m-%d')
            except ValueError:
                raise ValueError('Date must be in YYYY-MM-DD format')
        return v

class ReceiptUpdate(BaseModel):
    vendor: Optional[str] = Field(None, max_length=255)
    date: Optional[str] = Field(None, regex=r'^\d{4}-\d{2}-\d{2}$')
    amount: Optional[float] = Field(None, ge=0)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    status: Optional[str] = Field(None, regex=r'^(processing|processed|failed)$')

class ReceiptResponse(BaseModel):
    id: int
    file_name: str
    vendor: Optional[str]
    date: Optional[str]
    amount: Optional[float]
    category: Optional[str]
    description: Optional[str]
    upload_date: datetime
    file_type: str
    file_size: int
    status: str
    extracted_text: Optional[str]
    confidence_score: float
    
    class Config:
        from_attributes = True

class SearchFilters(BaseModel):
    keyword: Optional[str] = None
    vendor: Optional[str] = None
    category: Optional[str] = None
    date_from: Optional[str] = Field(None, regex=r'^\d{4}-\d{2}-\d{2}$')
    date_to: Optional[str] = Field(None, regex=r'^\d{4}-\d{2}-\d{2}$')
    amount_min: Optional[float] = Field(None, ge=0)
    amount_max: Optional[float] = Field(None, ge=0)
    status: Optional[str] = None

class SortOptions(BaseModel):
    field: str = Field(default="date", regex=r'^(date|amount|vendor|category|upload_date)$')
    direction: str = Field(default="desc", regex=r'^(asc|desc)$')

class StatsResponse(BaseModel):
    total_spend: float
    total_receipts: int
    average_amount: float
    median_amount: float
    mode_amount: float
    top_vendors: List[Dict[str, Any]]
    category_spending: List[Dict[str, Any]]
    monthly_spending: List[Dict[str, Any]]

class FileUploadResponse(BaseModel):
    message: str
    receipt_id: int
    filename: str
    processing_status: str