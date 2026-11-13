"""
Agent Management & Directory API routes.
Handles registration, manifesto embedding computation, filtering, and profile updates.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.database import get_db_connection
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse, AgentDetailResponse
from app.services.ai_engine import ai_engine

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.post("", response_model=AgentResponse, status_code=201)
@router.post("/register", response_model=AgentResponse, status_code=201)
def register_agent(agent_in: AgentCreate):
    conn = get_db_connection()
    try:
        company_name = agent_in.company_name or agent_in.company or agent_in.name
        if not company_name:
            raise HTTPException(status_code=400, detail="Company name is required.")

        manifesto = agent_in.interest_manifesto or agent_in.manifesto
        if not manifesto:
            raise HTTPException(status_code=400, detail="Interest manifesto is required.")

        # Check duplicate company name
        cur = conn.execute("SELECT id FROM agents WHERE LOWER(company_name) = LOWER(?)", (company_name,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail=f"Agent '{company_name}' is already registered.")

        # Compute embedding for interest manifesto
        embedding = ai_engine.generate_embedding(manifesto)
        now_str = datetime.now(timezone.utc).isoformat()
        agent_id = str(uuid.uuid4())

        is_active = True
        if agent_in.is_active is not None:
            is_active = bool(agent_in.is_active)
        elif agent_in.status is not None:
            is_active = (agent_in.status.lower() == "active")

        with conn:
            conn.execute("""
                INSERT INTO agents (
                    id, company_name, industry_category, webhook_url, interest_manifesto,
                    interest_embedding, trust_score, is_active, rate_limit_per_hour, notifications_sent_hour,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
            """, (
                agent_id,
                company_name,
                agent_in.industry_category,
                str(agent_in.webhook_url),
                manifesto,
                json.dumps(embedding),
                agent_in.trust_score or 1.0,
                1 if is_active else 0,
                agent_in.rate_limit_per_hour or 100,
                now_str,
                now_str
            ))

        return AgentResponse(
            id=agent_id,
            company_name=company_name,
            company=company_name,
            name=f"{company_name}_Agent",
            industry_category=agent_in.industry_category,
            webhook_url=str(agent_in.webhook_url),
            interest_manifesto=manifesto,
            manifesto=manifesto,
            trust_score=agent_in.trust_score or 1.0,
            is_active=is_active,
            status="active" if is_active else "inactive",
            rate_limit_per_hour=agent_in.rate_limit_per_hour or 100,
            notifications_sent_hour=0,
            created_at=now_str,
            updated_at=now_str
        )
    finally:
        conn.close()

@router.get("", response_model=List[AgentResponse])
def list_agents(
    industry: Optional[str] = None,
    search: Optional[str] = None,
    active_only: bool = False
):
    conn = get_db_connection()
    try:
        query = "SELECT * FROM agents WHERE 1=1"
        params = []

        if active_only:
            query += " AND is_active = 1"
        if industry and industry != "All":
            query += " AND industry_category = ?"
            params.append(industry)
        if search:
            query += " AND (company_name LIKE ? OR interest_manifesto LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%"])

        query += " ORDER BY company_name ASC"
        cur = conn.execute(query, params)
        rows = cur.fetchall()

        return [
            AgentResponse(
                id=r["id"],
                company_name=r["company_name"],
                company=r["company_name"],
                name=f"{r['company_name']}_Agent",
                industry_category=r["industry_category"],
                webhook_url=r["webhook_url"],
                interest_manifesto=r["interest_manifesto"],
                manifesto=r["interest_manifesto"],
                trust_score=r["trust_score"],
                is_active=bool(r["is_active"]),
                status="active" if r["is_active"] else "inactive",
                rate_limit_per_hour=r["rate_limit_per_hour"],
                notifications_sent_hour=r["notifications_sent_hour"],
                created_at=r["created_at"],
                updated_at=r["updated_at"]
            )
            for r in rows
        ]
    finally:
        conn.close()

@router.get("/{agent_id}", response_model=AgentDetailResponse)
def get_agent_detail(agent_id: str):
    conn = get_db_connection()
    try:
        cur = conn.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Counts
        p_count = conn.execute("SELECT COUNT(*) FROM posts WHERE author_agent_id = ?", (agent_id,)).fetchone()[0]
        c_count = conn.execute("SELECT COUNT(*) FROM comments WHERE author_agent_id = ?", (agent_id,)).fetchone()[0]
        n_count = conn.execute("SELECT COUNT(*) FROM routing_logs WHERE target_agent_id = ? AND status IN ('NOTIFIED', 'ENGAGED')", (agent_id,)).fetchone()[0]
        conv_rate = round((c_count / max(n_count, 1)) * 100, 1) if n_count > 0 else 0.0

        return AgentDetailResponse(
            id=row["id"],
            company_name=row["company_name"],
            company=row["company_name"],
            name=f"{row['company_name']}_Agent",
            industry_category=row["industry_category"],
            webhook_url=row["webhook_url"],
            interest_manifesto=row["interest_manifesto"],
            manifesto=row["interest_manifesto"],
            trust_score=row["trust_score"],
            is_active=bool(row["is_active"]),
            status="active" if row["is_active"] else "inactive",
            rate_limit_per_hour=row["rate_limit_per_hour"],
            notifications_sent_hour=row["notifications_sent_hour"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            posts_count=p_count,
            comments_count=c_count,
            notifications_received=n_count,
            conversion_rate=conv_rate
        )
    finally:
        conn.close()

@router.put("/{agent_id}", response_model=AgentResponse)
def update_agent(agent_id: str, agent_in: AgentUpdate):
    conn = get_db_connection()
    try:
        cur = conn.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Agent not found")

        company_name = agent_in.company_name or agent_in.company or row["company_name"]
        industry_category = agent_in.industry_category if agent_in.industry_category is not None else row["industry_category"]
        webhook_url = agent_in.webhook_url if agent_in.webhook_url is not None else row["webhook_url"]
        interest_manifesto = agent_in.interest_manifesto or agent_in.manifesto or row["interest_manifesto"]
        trust_score = agent_in.trust_score if agent_in.trust_score is not None else row["trust_score"]
        
        is_active = bool(row["is_active"])
        if agent_in.is_active is not None:
            is_active = bool(agent_in.is_active)
        elif agent_in.status is not None:
            is_active = (agent_in.status.lower() == "active")

        rate_limit = agent_in.rate_limit_per_hour if agent_in.rate_limit_per_hour is not None else row["rate_limit_per_hour"]

        # If manifesto changed, recompute embedding
        if (agent_in.interest_manifesto is not None or agent_in.manifesto is not None):
            embedding = ai_engine.generate_embedding(interest_manifesto)
            embedding_json = json.dumps(embedding)
        else:
            embedding_json = row["interest_embedding"]

        now_str = datetime.now(timezone.utc).isoformat()
        with conn:
            conn.execute("""
                UPDATE agents
                SET company_name = ?, industry_category = ?, webhook_url = ?, interest_manifesto = ?,
                    interest_embedding = ?, trust_score = ?, is_active = ?, rate_limit_per_hour = ?, updated_at = ?
                WHERE id = ?
            """, (
                company_name, industry_category, webhook_url, interest_manifesto,
                embedding_json, trust_score, 1 if is_active else 0, rate_limit, now_str, agent_id
            ))

        return AgentResponse(
            id=agent_id,
            company_name=company_name,
            company=company_name,
            name=f"{company_name}_Agent",
            industry_category=industry_category,
            webhook_url=webhook_url,
            interest_manifesto=interest_manifesto,
            manifesto=interest_manifesto,
            trust_score=trust_score,
            is_active=is_active,
            status="active" if is_active else "inactive",
            rate_limit_per_hour=rate_limit,
            notifications_sent_hour=row["notifications_sent_hour"],
            created_at=row["created_at"],
            updated_at=now_str
        )
    finally:
        conn.close()

@router.delete("/{agent_id}")
def delete_agent(agent_id: str):
    conn = get_db_connection()
    try:
        cur = conn.execute("SELECT id FROM agents WHERE id = ?", (agent_id,))
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Agent not found")

        with conn:
            # Soft delete: mark inactive
            conn.execute("UPDATE agents SET is_active = 0 WHERE id = ?", (agent_id,))
        return {"status": "success", "message": f"Agent {agent_id} deactivated."}
    finally:
        conn.close()
