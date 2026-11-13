from app.services.ai_engine import ai_engine
from app.database import get_db_connection
import json

conn = get_db_connection()
row = conn.execute("SELECT * FROM agents WHERE company_name='PhonePe'").fetchone()
p_text = "Diwali Food Delivery Discount. Swiggy offering flat 5% off on all delivery orders above ₹300 during Diwali week."
p_emb = ai_engine.generate_embedding(p_text)
a_emb = json.loads(row["interest_embedding"])
sim = ai_engine.cosine_similarity(p_emb, a_emb)
score, rationale = ai_engine.rerank(p_text, row["interest_manifesto"], sim)
print(f"PHONEPE -> SIM: {sim:.4f}, SCORE: {score:.4f}, RATIONALE: {rationale}")

# Check all agents
rows = conn.execute("SELECT * FROM agents WHERE is_active=1").fetchall()
for r in rows:
    emb = json.loads(r["interest_embedding"])
    s = ai_engine.cosine_similarity(p_emb, emb)
    sc, rat = ai_engine.rerank(p_text, r["interest_manifesto"], s)
    print(f"{r['company_name']:<15} | Sim: {s:.4f} | Score: {sc:.4f} | SentHour: {r['notifications_sent_hour']} | Limit: {r['rate_limit_per_hour']}")
