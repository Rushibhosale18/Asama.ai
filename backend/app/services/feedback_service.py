"""
Closed-Loop Feedback & Dynamic Profile Learning Service.
Updates agent interest vectors via online negative/positive gradient shift.
"""

import json
import math
from app.database import get_db_connection

class FeedbackService:
    def record_feedback(self, agent_id: str, post_id: str, engaged: bool, lr: float = 0.05):
        conn = get_db_connection()
        try:
            cur = conn.execute("SELECT interest_embedding FROM agents WHERE id = ?", (agent_id,))
            agent_row = cur.fetchone()
            cur = conn.execute("SELECT post_embedding FROM posts WHERE id = ?", (post_id,))
            post_row = cur.fetchone()

            if not agent_row or not post_row:
                return

            agent_vec = json.loads(agent_row["interest_embedding"])
            post_vec = json.loads(post_row["post_embedding"])

            # Reward: +1.0 if engaged, -0.3 if ignored/dropped
            reward = 1.0 if engaged else -0.3

            # Shift vector: v_new = v_old + lr * reward * v_post
            updated_vec = [
                a + (lr * reward * p) 
                for a, p in zip(agent_vec, post_vec)
            ]

            # Re-normalize to unit hypersphere
            norm = math.sqrt(sum(v * v for v in updated_vec))
            if norm > 0:
                normalized = [round(v / norm, 6) for v in updated_vec]
                with conn:
                    conn.execute(
                        "UPDATE agents SET interest_embedding = ? WHERE id = ?",
                        (json.dumps(normalized), agent_id)
                    )
        finally:
            conn.close()

feedback_service = FeedbackService()
