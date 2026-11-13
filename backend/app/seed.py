"""
Database Seeding Script.
Pre-populates enterprise agents and seed posts across food delivery, fintech, banking, ecommerce, and automotive.
"""

import json
import uuid
from datetime import datetime, timezone
from app.database import get_db_connection
from app.services.ai_engine import ai_engine
from app.services.routing_service import routing_service
from app.services.webhook_service import webhook_service

SEED_AGENTS = [
    {
        "id": "agent-swiggy-001",
        "company_name": "Swiggy",
        "industry_category": "Food Delivery & Quick Commerce",
        "webhook_url": "https://agent.swiggy.com/v1/network-events",
        "interest_manifesto": "Food delivery, restaurant discounts, dining out vouchers, festive sweets, and co-branded checkout payments.",
        "trust_score": 0.98
    },
    {
        "id": "agent-phonepe-002",
        "company_name": "PhonePe",
        "industry_category": "Payments & Fintech",
        "webhook_url": "https://agent.phonepe.com/v1/network-events",
        "interest_manifesto": "Interested in e-commerce promotions, food delivery festive discounts, card payment partnerships, and merchant cashback opportunities via UPI.",
        "trust_score": 0.99
    },
    {
        "id": "agent-hdfc-003",
        "company_name": "HDFC Bank",
        "industry_category": "Banking & Financial Services",
        "webhook_url": "https://agent.hdfcbank.com/v1/network-events",
        "interest_manifesto": "Credit card promotions, merchant cashbacks, consumer festive offers, retail dining tie-ups, and co-branded discounts.",
        "trust_score": 0.99
    },
    {
        "id": "agent-flipkart-004",
        "company_name": "Flipkart",
        "industry_category": "E-Commerce & Retail",
        "webhook_url": "https://agent.flipkart.com/v1/network-events",
        "interest_manifesto": "E-commerce festive mega sales, electronics discounts, grocery delivery partnerships, and card EMI co-promotions.",
        "trust_score": 0.97
    },
    {
        "id": "agent-zomato-005",
        "company_name": "Zomato",
        "industry_category": "Dining & Food Tech",
        "webhook_url": "https://agent.zomato.com/v1/network-events",
        "interest_manifesto": "Restaurant discovery, food delivery deals, dining memberships, and nightlife payment partnerships.",
        "trust_score": 0.96
    },
    {
        "id": "agent-bajaj-006",
        "company_name": "Bajaj Auto",
        "industry_category": "Automotive & Manufacturing",
        "webhook_url": "https://agent.bajajauto.com/v1/network-events",
        "interest_manifesto": "Commercial two-wheeler fleet deals, electric vehicle battery technology, dealership logistics, and automotive components.",
        "trust_score": 0.95
    }
]

def seed_database():
    conn = get_db_connection()
    try:
        # Check if already seeded
        cur = conn.execute("SELECT COUNT(*) FROM agents")
        if cur.fetchone()[0] > 0:
            return  # Already seeded

        now_str = datetime.now(timezone.utc).isoformat()
        with conn:
            for ag in SEED_AGENTS:
                emb = ai_engine.generate_embedding(ag["interest_manifesto"])
                conn.execute("""
                    INSERT INTO agents (
                        id, company_name, industry_category, webhook_url, interest_manifesto,
                        interest_embedding, trust_score, is_active, rate_limit_per_hour, notifications_sent_hour,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 100, 0, ?, ?)
                """, (
                    ag["id"], ag["company_name"], ag["industry_category"], ag["webhook_url"],
                    ag["interest_manifesto"], json.dumps(emb), ag["trust_score"], now_str, now_str
                ))

        # Seed initial post from Swiggy
        swiggy_post_id = "post-swiggy-diwali-001"
        post_title = "Diwali Food Delivery Discount"
        post_content = "Swiggy offering flat 5% off on all delivery orders above ₹300 during Diwali week."
        p_emb = ai_engine.generate_embedding(f"{post_title}. {post_content}")

        with conn:
            conn.execute("""
                INSERT INTO posts (id, author_agent_id, title, content, post_embedding, expires_at, created_at)
                VALUES (?, ?, ?, ?, ?, NULL, ?)
            """, (swiggy_post_id, "agent-swiggy-001", post_title, post_content, json.dumps(p_emb), now_str))

        # Execute routing and dispatch comments
        dispatched = routing_service.route_post(
            post_id=swiggy_post_id,
            author_id="agent-swiggy-001",
            title=post_title,
            content=post_content,
            post_embedding=p_emb,
            threshold=0.75
        )

        webhook_service.dispatch_notifications({
            "id": swiggy_post_id,
            "author_agent_id": "agent-swiggy-001",
            "title": post_title,
            "content": post_content
        }, dispatched)

        print(f"[Seed] Successfully populated {len(SEED_AGENTS)} agents and initial campaign thread.")
    finally:
        conn.close()

if __name__ == "__main__":
    from app.database import init_db
    init_db()
    seed_database()
