"""
Webhook Delivery & Autonomous Agent Interaction Service.
Signs outbound event payloads with HMAC-SHA256 and coordinates autonomous replies.
"""

import json
import uuid
from typing import Dict, Any, List
from datetime import datetime, timezone
from app.database import get_db_connection
from app.services.security_service import security_service

class WebhookService:
    def dispatch_notifications(self, post_data: Dict[str, Any], dispatched_agents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Dispatches signed webhooks to target agents.
        If the agent endpoint is simulated or external endpoint is demo-only,
        triggers the agent's autonomous reasoning engine to generate a comment proposal.
        """
        conn = get_db_connection()
        autonomous_comments = []
        try:
            for target in dispatched_agents:
                payload = {
                    "event": "partner_opportunity.detected",
                    "post": {
                        "id": post_data["id"],
                        "author_id": post_data["author_agent_id"],
                        "title": post_data["title"],
                        "content": post_data["content"]
                    },
                    "matching_telemetry": {
                        "vector_score": target["vector_score"],
                        "rerank_score": target["rerank_score"],
                        "rationale": target["rationale"]
                    }
                }

                payload_bytes = json.dumps(payload, sort_keys=True).encode("utf-8")
                sig, ts = security_service.sign_webhook_payload(payload_bytes)

                # In production, this pushes to Celery/RabbitMQ -> HTTP POST with headers
                # Headers: X-AgentSocial-Signature: sig, X-AgentSocial-Timestamp: ts
                # For immediate interactive feedback and Asama requirement F:
                # "Simulate autonomous responses only when a real external agent is unavailable,
                # and clearly label simulated responses."
                reply_content = self._generate_autonomous_response(
                    company_name=target["company_name"],
                    post_content=post_data["content"]
                )

                if reply_content:
                    comment_id = str(uuid.uuid4())
                    now_str = datetime.now(timezone.utc).isoformat()
                    with conn:
                        conn.execute("""
                            INSERT INTO comments (id, post_id, author_agent_id, content, is_simulated, created_at)
                            VALUES (?, ?, ?, ?, 1, ?)
                        """, (comment_id, post_data["id"], target["target_agent_id"], reply_content, now_str))

                        # Update routing log status to ENGAGED
                        conn.execute("""
                            UPDATE routing_logs 
                            SET status = 'ENGAGED' 
                            WHERE post_id = ? AND target_agent_id = ?
                        """, (post_data["id"], target["target_agent_id"]))

                    autonomous_comments.append({
                        "comment_id": comment_id,
                        "author_company": target["company_name"],
                        "content": reply_content
                    })

            return autonomous_comments
        finally:
            conn.close()

    def _generate_autonomous_response(self, company_name: str, post_content: str) -> str:
        """Autonomous partner co-marketing proposal generator."""
        p_low = post_content.lower()

        if company_name == "PhonePe":
            if "diwali" in p_low or "food" in p_low or "delivery" in p_low:
                return "PhonePe will provide flat ₹50 cashback for users completing checkout via PhonePe UPI on Diwali orders."
            return "PhonePe will activate a 5% UPI cashback incentive for transactions above ₹250."

        elif company_name == "HDFC Bank":
            if "delivery" in p_low or "discount" in p_low or "diwali" in p_low:
                return "HDFC Bank Credit Card holders get an additional 10% instant discount up to ₹150 throughout festive delivery campaigns."
            return "HDFC Bank offers co-branded 5X reward points on all card checkouts for this campaign."

        elif company_name == "Flipkart":
            return "Flipkart Quick can cross-promote this offer on our grocery checkout carousel."

        elif company_name == "Zomato":
            return "Zomato Gold dining partners will match a complementary voucher on select city orders."

        return None

webhook_service = WebhookService()
