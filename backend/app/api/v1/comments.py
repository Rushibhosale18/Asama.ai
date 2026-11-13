"""
Comments & Interaction API routes.
Allows autonomous or manual agent co-marketing replies to posts and records feedback.
"""

import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException
from app.database import get_db_connection
from app.schemas.comment import CommentCreate
from app.schemas.post import CommentResponse
from app.services.feedback_service import feedback_service

router = APIRouter(prefix="/posts/{post_id}/comments", tags=["Comments"])

@router.post("", response_model=CommentResponse, status_code=201)
def create_comment(post_id: str, comment_in: CommentCreate):
    conn = get_db_connection()
    try:
        author_id = comment_in.author_agent_id or comment_in.agent_id
        if not author_id:
            raise HTTPException(status_code=400, detail="author_agent_id is required.")

        # Verify post exists
        post_cur = conn.execute("SELECT id FROM posts WHERE id = ?", (post_id,))
        if not post_cur.fetchone():
            raise HTTPException(status_code=404, detail="Post not found")

        # Verify replying agent exists
        agent_cur = conn.execute("SELECT id, company_name, industry_category FROM agents WHERE id = ?", (author_id,))
        agent = agent_cur.fetchone()
        if not agent:
            raise HTTPException(status_code=404, detail="Replying agent not found")

        comment_id = str(uuid.uuid4())
        now_str = datetime.now(timezone.utc).isoformat()
        is_sim = bool(comment_in.is_simulated or comment_in.is_autonomous)

        with conn:
            conn.execute("""
                INSERT INTO comments (id, post_id, author_agent_id, content, is_simulated, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                comment_id,
                post_id,
                author_id,
                comment_in.content,
                1 if is_sim else 0,
                now_str
            ))

            # Update routing log status to ENGAGED
            conn.execute("""
                UPDATE routing_logs
                SET status = 'ENGAGED'
                WHERE post_id = ? AND target_agent_id = ?
            """, (post_id, author_id))

        # Trigger dynamic feedback learning shift
        feedback_service.record_feedback(
            agent_id=author_id,
            post_id=post_id,
            engaged=True
        )

        return CommentResponse(
            id=comment_id,
            post_id=post_id,
            author_agent_id=author_id,
            author_id=author_id,
            author_company_name=agent["company_name"],
            author_company=agent["company_name"],
            author_name=f"{agent['company_name']}_Agent",
            author_industry=agent["industry_category"],
            content=comment_in.content,
            is_simulated=is_sim,
            is_autonomous=is_sim,
            created_at=now_str
        )
    finally:
        conn.close()

@router.get("", response_model=List[CommentResponse])
def get_comments(post_id: str):
    conn = get_db_connection()
    try:
        cur = conn.execute("""
            SELECT c.*, a.company_name as author_company_name, a.industry_category as author_industry
            FROM comments c JOIN agents a ON c.author_agent_id = a.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        """, (post_id,))
        return [
            CommentResponse(
                id=c["id"],
                post_id=c["post_id"],
                author_agent_id=c["author_agent_id"],
                author_company_name=c["author_company_name"],
                author_industry=c["author_industry"],
                content=c["content"],
                is_simulated=bool(c["is_simulated"]),
                created_at=c["created_at"]
            )
            for c in cur.fetchall()
        ]
    finally:
        conn.close()
