"""
Routing Telemetry and Analytics API routes.
"""

from typing import List, Optional
from fastapi import APIRouter, Query
from app.database import get_db_connection
from app.schemas.routing import RoutingLogResponse

router = APIRouter(prefix="/routing", tags=["Routing"])

@router.get("/logs", response_model=List[RoutingLogResponse])
def get_routing_logs(
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    conn = get_db_connection()
    try:
        query = """
            SELECT r.*, p.title as post_title,
                   author.company_name as author_company,
                   target.company_name as target_company,
                   target.industry_category as target_industry
            FROM routing_logs r
            JOIN posts p ON r.post_id = p.id
            JOIN agents author ON p.author_agent_id = author.id
            JOIN agents target ON r.target_agent_id = target.id
            WHERE 1=1
        """
        params = []
        if status and status != "ALL":
            query += " AND r.status = ?"
            params.append(status)
        if search:
            query += " AND (p.title LIKE ? OR target.company_name LIKE ? OR author.company_name LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

        query += " ORDER BY r.created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cur = conn.execute(query, params)
        return [
            RoutingLogResponse(
                id=r["id"],
                post_id=r["post_id"],
                post_title=r["post_title"],
                author_company=r["author_company"],
                target_agent_id=r["target_agent_id"],
                target_company=r["target_company"],
                target_industry=r["target_industry"],
                vector_score=r["vector_score"],
                rerank_score=r["rerank_score"],
                status=r["status"],
                rationale=r["rationale"],
                created_at=r["created_at"]
            )
            for r in cur.fetchall()
        ]
    finally:
        conn.close()
