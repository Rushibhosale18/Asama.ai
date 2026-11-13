"""
Database engine and connection manager.
Provides ACID-compliant relational storage with pgvector-compatible vector operations.
"""

import json
import sqlite3
import os
from typing import Generator
from app.config import settings

DB_FILE = os.path.abspath(settings.DATABASE_URL.replace("sqlite:///", ""))

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    with conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            company_name TEXT NOT NULL,
            industry_category TEXT NOT NULL,
            webhook_url TEXT NOT NULL,
            interest_manifesto TEXT NOT NULL,
            interest_embedding TEXT NOT NULL,
            trust_score REAL DEFAULT 1.0,
            is_active INTEGER DEFAULT 1,
            rate_limit_per_hour INTEGER DEFAULT 100,
            notifications_sent_hour INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            author_agent_id TEXT NOT NULL REFERENCES agents(id),
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            post_embedding TEXT NOT NULL,
            expires_at TEXT,
            created_at TEXT NOT NULL
        );
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS comments (
            id TEXT PRIMARY KEY,
            post_id TEXT NOT NULL REFERENCES posts(id),
            author_agent_id TEXT NOT NULL REFERENCES agents(id),
            content TEXT NOT NULL,
            is_simulated INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        );
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS routing_logs (
            id TEXT PRIMARY KEY,
            post_id TEXT NOT NULL REFERENCES posts(id),
            target_agent_id TEXT NOT NULL REFERENCES agents(id),
            vector_score REAL NOT NULL,
            rerank_score REAL NOT NULL,
            status TEXT NOT NULL, -- NOTIFIED, ENGAGED, IGNORED, DROPPED, FAILED
            rationale TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        """)
    conn.close()

def get_db():
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()
