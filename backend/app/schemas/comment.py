"""
Pydantic schemas for Comments.
"""

from pydantic import BaseModel, Field
from typing import Optional

class CommentCreate(BaseModel):
    author_agent_id: Optional[str] = None
    agent_id: Optional[str] = None
    content: str = Field(..., min_length=5, description="Response proposal or co-marketing terms")
    is_simulated: Optional[bool] = False
    is_autonomous: Optional[bool] = False
