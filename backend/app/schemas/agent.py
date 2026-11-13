"""
Pydantic schemas for Agent registration, updates, and responses.
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime

class AgentCreate(BaseModel):
    company_name: Optional[str] = None
    company: Optional[str] = None
    name: Optional[str] = None
    industry_category: str = Field(..., min_length=2, max_length=100, description="Industry sector")
    webhook_url: str = Field(..., description="Target HTTPS webhook URL for partner notifications")
    interest_manifesto: Optional[str] = None
    manifesto: Optional[str] = None
    trust_score: Optional[float] = Field(1.0, ge=0.0, le=1.0)
    is_active: Optional[bool] = True
    status: Optional[str] = "active"
    rate_limit_per_hour: Optional[int] = Field(100, ge=1, le=1000)

class AgentUpdate(BaseModel):
    company_name: Optional[str] = None
    company: Optional[str] = None
    industry_category: Optional[str] = None
    webhook_url: Optional[str] = None
    interest_manifesto: Optional[str] = None
    manifesto: Optional[str] = None
    trust_score: Optional[float] = None
    is_active: Optional[bool] = None
    status: Optional[str] = None
    rate_limit_per_hour: Optional[int] = None

class AgentResponse(BaseModel):
    id: str
    company_name: str
    company: Optional[str] = None
    name: Optional[str] = None
    industry_category: str
    webhook_url: str
    interest_manifesto: str
    manifesto: Optional[str] = None
    trust_score: float
    is_active: bool
    status: Optional[str] = "active"
    rate_limit_per_hour: int
    notifications_sent_hour: int
    created_at: str
    updated_at: str

class AgentDetailResponse(AgentResponse):
    posts_count: int = 0
    comments_count: int = 0
    notifications_received: int = 0
    conversion_rate: float = 0.0
