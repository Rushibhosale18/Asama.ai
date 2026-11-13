"""
Dashboard Analytics API routes.
Returns real-time dynamic aggregates and timeline data from SQLite / PostgreSQL.
"""

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter
from app.database import get_db_connection
from app.schemas.routing import DashboardStatsResponse, IndustryCount, TimelinePoint, ActivityItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats():
    conn = get_db_connection()
    try:
        cur = conn.execute("SELECT COUNT(*) FROM agents")
        total_agents = cur.fetchone()[0]

        cur = conn.execute("SELECT COUNT(*) FROM agents WHERE is_active = 1")
        active_agents = cur.fetchone()[0]

        cur = conn.execute("SELECT COUNT(*) FROM posts")
        total_posts = cur.fetchone()[0]

        # Total notifications delivered (all qualified candidates that passed Stage 3 >= 0.75)
        cur = conn.execute("SELECT COUNT(*) FROM routing_logs WHERE status IN ('NOTIFIED', 'ENGAGED')")
        notifications_delivered = cur.fetchone()[0]
        total_matches = notifications_delivered

        # Total unique engagements (target agents that responded to matching notifications)
        cur = conn.execute("SELECT COUNT(*) FROM routing_logs WHERE status = 'ENGAGED'")
        total_engaged = cur.fetchone()[0]

        cur = conn.execute("SELECT COUNT(*) FROM comments")
        total_comments = cur.fetchone()[0]

        # Engagement conversion rate: strictly bounded between 0.0% and 100.0%
        if notifications_delivered > 0:
            engagement_rate = round(min(100.0, (total_engaged / notifications_delivered) * 100.0), 1)
        else:
            engagement_rate = 0.0

        # Average relevance score computed strictly from actual database routing logs
        cur = conn.execute("SELECT AVG(rerank_score) FROM routing_logs WHERE status IN ('NOTIFIED', 'ENGAGED')")
        avg_score_row = cur.fetchone()
        if avg_score_row and avg_score_row[0] is not None:
            avg_relevance_score = round(float(avg_score_row[0]), 2)
        else:
            # Check if any logs exist at all
            cur = conn.execute("SELECT AVG(rerank_score) FROM routing_logs")
            fallback_row = cur.fetchone()
            avg_relevance_score = round(float(fallback_row[0]), 2) if (fallback_row and fallback_row[0] is not None) else 0.0

        # Industry distribution from actual agents table
        cur = conn.execute("""
            SELECT industry_category, COUNT(*) as cnt 
            FROM agents 
            GROUP BY industry_category 
            ORDER BY cnt DESC
        """)
        industry_distribution = [
            IndustryCount(industry=row["industry_category"], count=row["cnt"])
            for row in cur.fetchall()
        ]

        # Activity Stream: union of posts, comments, and partner routing matches with strict deduplication
        activities = []
        seen_keys = set()

        # 1. Match/routing events
        cur = conn.execute("""
            SELECT r.id, 'match' as type, r.status, r.rerank_score, a.company_name, p.title as post_title, r.created_at
            FROM routing_logs r
            JOIN agents a ON r.target_agent_id = a.id
            JOIN posts p ON r.post_id = p.id
            WHERE r.status IN ('NOTIFIED', 'ENGAGED')
            ORDER BY r.created_at DESC LIMIT 6
        """)
        for r in cur.fetchall():
            key = (r["type"], r["id"])
            if key not in seen_keys:
                seen_keys.add(key)
                status_label = "Engaged" if r["status"] == "ENGAGED" else "Dispatched"
                activities.append(ActivityItem(
                    id=f"match_{r['id']}",
                    type="notification",
                    title=f"Partner Match ({status_label}): @{r['company_name']}",
                    description=f"Synergy score {r['rerank_score']:.2f} for '{r['post_title']}'",
                    timestamp=r["created_at"],
                    company=r["company_name"]
                ))

        # 2. Announcement posts
        cur = conn.execute("""
            SELECT p.id, 'post' as type, p.title, a.company_name, p.created_at
            FROM posts p JOIN agents a ON p.author_agent_id = a.id
            ORDER BY p.created_at DESC LIMIT 6
        """)
        for r in cur.fetchall():
            key = (r["type"], r["id"])
            if key not in seen_keys:
                seen_keys.add(key)
                activities.append(ActivityItem(
                    id=f"post_{r['id']}",
                    type="post",
                    title=f"New announcement by @{r['company_name']}",
                    description=r["title"],
                    timestamp=r["created_at"],
                    company=r["company_name"]
                ))

        # 3. Autonomous responses & comments
        cur = conn.execute("""
            SELECT c.id, 'comment' as type, c.content, a.company_name, c.created_at
            FROM comments c JOIN agents a ON c.author_agent_id = a.id
            ORDER BY c.created_at DESC LIMIT 6
        """)
        for r in cur.fetchall():
            key = (r["type"], r["id"])
            if key not in seen_keys:
                seen_keys.add(key)
                activities.append(ActivityItem(
                    id=f"comment_{r['id']}",
                    type="comment",
                    title=f"Co-marketing response by @{r['company_name']}",
                    description=r["content"],
                    timestamp=r["created_at"],
                    company=r["company_name"]
                ))

        # Sort activities descending by timestamp
        activities.sort(key=lambda x: x.timestamp, reverse=True)

        # Actual 7-Day Activity Timeline from database
        today = datetime.now(timezone.utc).date()
        timeline = []
        for i in range(6, -1, -1):
            day_date = today - timedelta(days=i)
            day_str = day_date.strftime("%Y-%m-%d")
            label = "Today" if i == 0 else (day_date.strftime("%b %d") if i < 6 else "7d Ago")

            cur = conn.execute("SELECT COUNT(*) FROM posts WHERE substr(created_at, 1, 10) = ?", (day_str,))
            p_cnt = cur.fetchone()[0]

            cur = conn.execute("SELECT COUNT(*) FROM routing_logs WHERE status IN ('NOTIFIED', 'ENGAGED') AND substr(created_at, 1, 10) = ?", (day_str,))
            m_cnt = cur.fetchone()[0]

            cur = conn.execute("SELECT COUNT(*) FROM comments WHERE substr(created_at, 1, 10) = ?", (day_str,))
            c_cnt = cur.fetchone()[0]

            timeline.append(TimelinePoint(
                date=label,
                posts=p_cnt,
                matches=m_cnt,
                comments=c_cnt
            ))

        return DashboardStatsResponse(
            total_agents=total_agents,
            active_agents=active_agents,
            total_posts=total_posts,
            total_matches=total_matches,
            notifications_delivered=notifications_delivered,
            total_comments=total_comments,
            engagement_rate=engagement_rate,
            avg_relevance_score=avg_relevance_score,
            industry_distribution=industry_distribution,
            timeline_activity=timeline,
            recent_activities=activities[:12]
        )
    finally:
        conn.close()
