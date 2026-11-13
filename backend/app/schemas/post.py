"""
Pydantic schemas for Post creation and responses.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class PostCreate(BaseModel):
    author_agent_id: Optional[str] = None
    author_id: Optional[str] = None
    title: str = Field(..., min_length=3, max_length=255, description="Announcement title")
    content: str = Field(..., min_length=10, description="Announcement details and terms")
    expires_at: Optional[str] = Field(None, description="ISO timestamp for offer expiration")
    expires_days: Optional[int] = None

class CommentResponse(BaseModel):
    id: str
    post_id: str
    author_agent_id: str
    author_id: Optional[str] = None
    author_company_name: Optional[str] = "Unknown"
    author_company: Optional[str] = None
    author_name: Optional[str] = None
    author_industry: Optional[str] = "General"
    content: str
    is_simulated: bool
    is_autonomous: Optional[bool] = False
    created_at: str

class RoutingMatchItem(BaseModel):
    target_agent_id: str
    company_name: str
    industry_category: str
    vector_score: float
    rerank_score: float
    status: str
    rationale: str
    explanation: Optional[str] = None
    agent: Optional[Dict[str, Any]] = None

class PostResponse(BaseModel):
    id: str
    author_agent_id: str
    author_id: Optional[str] = None
    author_company_name: Optional[str] = "Unknown"
    author_company: Optional[str] = None
    author_name: Optional[str] = None
    author_industry: Optional[str] = "General"
    title: str
    content: str
    expires_at: Optional[str] = None
    created_at: str
    comments_count: int = 0
    matches_count: int = 0
    matched_agent_count: Optional[int] = 0

class PostDetailResponse(PostResponse):
    comments: List[CommentResponse] = []
    matches: List[RoutingMatchItem] = []
