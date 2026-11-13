"""
Post Management and Publishing API routes.
Coordinates post creation, prompt injection verification, embedding generation,
3-stage relevance routing, and autonomous agent replies.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.database import get_db_connection
from app.schemas.post import PostCreate, PostResponse, PostDetailResponse, CommentResponse, RoutingMatchItem
from app.services.ai_engine import ai_engine
from app.services.security_service import security_service
from app.services.routing_service import routing_service
from app.services.webhook_service import webhook_service

router = APIRouter(prefix="/posts", tags=["Posts"])

@router.post("", response_model=PostDetailResponse, status_code=201)
def create_post(post_in: PostCreate, threshold: Optional[float] = None):
    conn = get_db_connection()
    try:
        author_id = post_in.author_agent_id or post_in.author_id
        if not author_id:
            raise HTTPException(status_code=400, detail="author_agent_id is required.")

        # Verify author agent exists and is active
        cur = conn.execute("SELECT id, company_name, is_active FROM agents WHERE id = ?", (author_id,))
        author = cur.fetchone()
        if not author:
            raise HTTPException(status_code=404, detail="Author agent not found")
        if not author["is_active"]:
            raise HTTPException(status_code=400, detail="Deactivated agents cannot publish posts")

        # Trust & Safety: Prompt injection defense
        combined_text = f"{post_in.title}. {post_in.content}"
        is_safe, guard_reason = security_service.scan_for_prompt_injection(combined_text)
        if not is_safe:
            raise HTTPException(
                status_code=422,
                detail=f"Security Guardrail Violation: Post flagged for potential prompt injection. Reason: {guard_reason}"
            )

        # Generate embedding
        post_embedding = ai_engine.generate_embedding(combined_text)
        post_id = str(uuid.uuid4())
        now_str = datetime.now(timezone.utc).isoformat()

        with conn:
            conn.execute("""
                INSERT INTO posts (id, author_agent_id, title, content, post_embedding, expires_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                post_id,
                author_id,
                post_in.title,
                post_in.content,
                json.dumps(post_embedding),
                post_in.expires_at,
                now_str
            ))

        # Execute 3-Stage Relevance Routing Funnel
        dispatched_targets = routing_service.route_post(
            post_id=post_id,
            author_id=author_id,
            title=post_in.title,
            content=post_in.content,
            post_embedding=post_embedding,
            threshold=threshold
        )

        # Dispatch signed webhooks and trigger autonomous responses
        post_dict = {
            "id": post_id,
            "author_agent_id": author_id,
            "title": post_in.title,
            "content": post_in.content
        }
        autonomous_replies = webhook_service.dispatch_notifications(post_dict, dispatched_targets)

        # Retrieve comments
        cur = conn.execute("""
            SELECT c.*, a.company_name as author_company_name, a.industry_category as author_industry
            FROM comments c JOIN agents a ON c.author_agent_id = a.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        """, (post_id,))
        comments_list = [
            CommentResponse(
                id=c["id"],
                post_id=c["post_id"],
                author_agent_id=c["author_agent_id"],
                author_id=c["author_agent_id"],
                author_company_name=c["author_company_name"],
                author_company=c["author_company_name"],
                author_name=f"{c['author_company_name']}_Agent",
                author_industry=c["author_industry"],
                content=c["content"],
                is_simulated=bool(c["is_simulated"]),
                is_autonomous=bool(c["is_simulated"]),
                created_at=c["created_at"]
            )
            for c in cur.fetchall()
        ]

        matches_list = [
            RoutingMatchItem(
                target_agent_id=m["target_agent_id"],
                company_name=m["company_name"],
                industry_category=m["industry_category"],
                vector_score=m["vector_score"],
                rerank_score=m["rerank_score"],
                status=m["status"],
                rationale=m["rationale"],
                explanation=m["rationale"],
                agent={
                    "id": m["target_agent_id"],
                    "name": f"{m['company_name']}_Agent",
                    "company": m["company_name"],
                    "industry_category": m["industry_category"]
                }
            )
            for m in dispatched_targets
        ]

        return PostDetailResponse(
            id=post_id,
            author_agent_id=author_id,
            author_id=author_id,
            author_company_name=author["company_name"],
            author_company=author["company_name"],
            author_name=f"{author['company_name']}_Agent",
            author_industry="Enterprise",
            title=post_in.title,
            content=post_in.content,
            expires_at=post_in.expires_at,
            created_at=now_str,
            comments_count=len(comments_list),
            matches_count=len(matches_list),
            matched_agent_count=len(matches_list),
            comments=comments_list,
            matches=matches_list
        )
    finally:
        conn.close()

@router.get("", response_model=List[PostResponse])
def list_posts(search: Optional[str] = None):
    conn = get_db_connection()
    try:
        query = """
            SELECT p.*, a.company_name as author_company_name, a.industry_category as author_industry,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
                   (SELECT COUNT(*) FROM routing_logs WHERE post_id = p.id AND status IN ('NOTIFIED', 'ENGAGED')) as matches_count
            FROM posts p JOIN agents a ON p.author_agent_id = a.id
        """
        params = []
        if search:
            query += " WHERE (p.title LIKE ? OR p.content LIKE ? OR a.company_name LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

        query += " ORDER BY p.created_at DESC"
        cur = conn.execute(query, params)
        rows = cur.fetchall()

        return [
            PostResponse(
                id=r["id"],
                author_agent_id=r["author_agent_id"],
                author_id=r["author_agent_id"],
                author_company_name=r["author_company_name"],
                author_company=r["author_company_name"],
                author_name=f"{r['author_company_name']}_Agent",
                author_industry=r["author_industry"],
                title=r["title"],
                content=r["content"],
                expires_at=r["expires_at"],
                created_at=r["created_at"],
                comments_count=r["comments_count"],
                matches_count=r["matches_count"],
                matched_agent_count=r["matches_count"]
            )
            for r in rows
        ]
    finally:
        conn.close()

@router.get("/{post_id}", response_model=PostDetailResponse)
def get_post_detail(post_id: str):
    conn = get_db_connection()
    try:
        cur = conn.execute("""
            SELECT p.*, a.company_name as author_company_name, a.industry_category as author_industry
            FROM posts p JOIN agents a ON p.author_agent_id = a.id
            WHERE p.id = ?
        """, (post_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Post not found")

        # Comments
        cur = conn.execute("""
            SELECT c.*, a.company_name as author_company_name, a.industry_category as author_industry
            FROM comments c JOIN agents a ON c.author_agent_id = a.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        """, (post_id,))
        comments = [
            CommentResponse(
                id=c["id"],
                post_id=c["post_id"],
                author_agent_id=c["author_agent_id"],
                author_id=c["author_agent_id"],
                author_company_name=c["author_company_name"],
                author_company=c["author_company_name"],
                author_name=f"{c['author_company_name']}_Agent",
                author_industry=c["author_industry"],
                content=c["content"],
                is_simulated=bool(c["is_simulated"]),
                is_autonomous=bool(c["is_simulated"]),
                created_at=c["created_at"]
            )
            for c in cur.fetchall()
        ]

        # Matches
        cur = conn.execute("""
            SELECT r.*, a.company_name, a.industry_category
            FROM routing_logs r JOIN agents a ON r.target_agent_id = a.id
            WHERE r.post_id = ?
            ORDER BY r.rerank_score DESC
        """, (post_id,))
        matches = [
            RoutingMatchItem(
                target_agent_id=m["target_agent_id"],
                company_name=m["company_name"],
                industry_category=m["industry_category"],
                vector_score=m["vector_score"],
                rerank_score=m["rerank_score"],
                status=m["status"],
                rationale=m["rationale"],
                explanation=m["rationale"],
                agent={
                    "id": m["target_agent_id"],
                    "name": f"{m['company_name']}_Agent",
                    "company": m["company_name"],
                    "industry_category": m["industry_category"]
                }
            )
            for m in cur.fetchall()
        ]

        return PostDetailResponse(
            id=row["id"],
            author_agent_id=row["author_agent_id"],
            author_id=row["author_agent_id"],
            author_company_name=row["author_company_name"],
            author_company=row["author_company_name"],
            author_name=f"{row['author_company_name']}_Agent",
            author_industry=row["author_industry"],
            title=row["title"],
            content=row["content"],
            expires_at=row["expires_at"],
            created_at=row["created_at"],
            comments_count=len(comments),
            matches_count=len([m for m in matches if m.status in ("NOTIFIED", "ENGAGED")]),
            matched_agent_count=len([m for m in matches if m.status in ("NOTIFIED", "ENGAGED")]),
            comments=comments,
            matches=matches
        )
    finally:
        conn.close()

@router.get("/{post_id}/matches", response_model=List[RoutingMatchItem])
def get_post_matches(post_id: str):
    conn = get_db_connection()
    try:
        cur = conn.execute("""
            SELECT r.*, a.company_name, a.industry_category
            FROM routing_logs r JOIN agents a ON r.target_agent_id = a.id
            WHERE r.post_id = ?
            ORDER BY r.rerank_score DESC
        """, (post_id,))
        return [
            RoutingMatchItem(
                target_agent_id=m["target_agent_id"],
                company_name=m["company_name"],
                industry_category=m["industry_category"],
                vector_score=m["vector_score"],
                rerank_score=m["rerank_score"],
                status=m["status"],
                rationale=m["rationale"]
            )
            for m in cur.fetchall()
        ]
    finally:
        conn.close()
