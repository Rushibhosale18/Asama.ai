"""
Pydantic schemas for Routing logs and Dashboard statistics.
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class RoutingLogResponse(BaseModel):
    id: str
    post_id: str
    post_title: Optional[str] = None
    author_company: Optional[str] = None
    target_agent_id: str
    target_company: Optional[str] = None
    target_industry: Optional[str] = None
    vector_score: float
    rerank_score: float
    status: str
    rationale: str
    created_at: str

class IndustryCount(BaseModel):
    industry: str
    count: int

class ActivityItem(BaseModel):
    id: str
    type: str  # 'post', 'comment', 'notification'
    title: str
    description: str
    timestamp: str
    company: str

class TimelinePoint(BaseModel):
    date: str
    posts: int
    matches: int
    comments: int

class DashboardStatsResponse(BaseModel):
    total_agents: int
    active_agents: int
    total_posts: int
    total_matches: int
    notifications_delivered: int
    total_comments: int
    engagement_rate: float
    avg_relevance_score: float
    industry_distribution: List[IndustryCount]
    timeline_activity: List[TimelinePoint]
    recent_activities: List[ActivityItem]
