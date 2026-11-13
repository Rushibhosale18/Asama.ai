"""
Multi-Stage Relevance Routing Pipeline.
Executes:
  Stage 1: Fast SQL Guardrails (< 2 ms)
  Stage 2: Dense Vector ANN Search (< 15 ms)
  Stage 3: Cross-Encoder Joint Reranking (< 100 ms)
"""

import json
import uuid
from typing import List, Dict, Any, Tuple
from app.database import get_db_connection
from app.services.ai_engine import ai_engine
from app.config import settings

class RoutingService:
    def route_post(self, post_id: str, author_id: str, title: str, content: str, post_embedding: List[float], threshold: float = None) -> List[Dict[str, Any]]:
        threshold_val = threshold if threshold is not None else settings.DEFAULT_RELEVANCE_THRESHOLD
        conn = get_db_connection()
        try:
            # =================================================================
            # STAGE 1: Fast SQL Metadata Guardrails (< 2 ms)
            # =================================================================
            cur = conn.execute("""
                SELECT id, company_name, industry_category, webhook_url, interest_manifesto, interest_embedding, rate_limit_per_hour, notifications_sent_hour
                FROM agents
                WHERE is_active = 1 AND id != ?
            """, (author_id,))
            candidates = cur.fetchall()

            if not candidates:
                return []

            # =================================================================
            # STAGE 2: Dense Vector ANN Search (< 15 ms)
            # =================================================================
            stage2_candidates = []
            for row in candidates:
                # Rate limit guardrail
                if row["notifications_sent_hour"] >= row["rate_limit_per_hour"]:
                    continue

                agent_embedding = json.loads(row["interest_embedding"])
                dense_sim = ai_engine.cosine_similarity(post_embedding, agent_embedding)
                stage2_candidates.append((row, dense_sim))

            # Sort descending by vector similarity and take Top 50
            stage2_candidates.sort(key=lambda x: x[1], reverse=True)
            top_50 = stage2_candidates[:50]

            # =================================================================
            # STAGE 3: Cross-Encoder Joint Reranking (< 100 ms)
            # =================================================================
            dispatched = []
            full_text = f"{title}. {content}"

            with conn:
                for agent_row, dense_sim in top_50:
                    rerank_score, rationale = ai_engine.rerank(
                        post_text=full_text,
                        agent_manifesto=agent_row["interest_manifesto"],
                        dense_sim=dense_sim
                    )

                    status = "NOTIFIED" if rerank_score >= threshold_val else "DROPPED"

                    # Log routing decision
                    log_id = str(uuid.uuid4())
                    from datetime import datetime, timezone
                    now_str = datetime.now(timezone.utc).isoformat()
                    conn.execute("""
                        INSERT INTO routing_logs (id, post_id, target_agent_id, vector_score, rerank_score, status, rationale, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (log_id, post_id, agent_row["id"], dense_sim, rerank_score, status, rationale, now_str))

                    if rerank_score >= threshold_val:
                        # Increment notifications_sent_hour
                        conn.execute("""
                            UPDATE agents 
                            SET notifications_sent_hour = notifications_sent_hour + 1 
                            WHERE id = ?
                        """, (agent_row["id"],))

                        dispatched.append({
                            "target_agent_id": agent_row["id"],
                            "company_name": agent_row["company_name"],
                            "industry_category": agent_row["industry_category"],
                            "webhook_url": agent_row["webhook_url"],
                            "vector_score": dense_sim,
                            "rerank_score": rerank_score,
                            "status": "NOTIFIED",
                            "rationale": rationale
                        })

            dispatched.sort(key=lambda x: x["rerank_score"], reverse=True)
            return dispatched
        finally:
            conn.close()

routing_service = RoutingService()
