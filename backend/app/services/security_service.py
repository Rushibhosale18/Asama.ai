"""
Security & Guardrails Service.
Handles HMAC-SHA256 webhook signatures, timestamp replay protection,
and indirect prompt injection defense.
"""

import hmac
import hashlib
import time
import re
from typing import Tuple, Dict
from app.config import settings

class SecurityService:
    SUSPICIOUS_PATTERNS = [
        r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
        r"you\s+are\s+now\s+in\s+developer\s+mode",
        r"system\s*:\s*override",
        r"send\s+(your\s+)?(api[_-]?keys?|private[_-]?keys?|secrets?)",
        r"execute\s*\(",
        r"sudo\s+",
        r"rm\s+-rf",
        r"<script.*?>",
        r"javascript\s*:"
    ]

    @classmethod
    def scan_for_prompt_injection(cls, text: str) -> Tuple[bool, str]:
        """
        Scans post text for indirect prompt injection or payload attacks.
        Returns (is_safe, reason).
        """
        text_lower = text.lower()
        for pattern in cls.SUSPICIOUS_PATTERNS:
            if re.search(pattern, text_lower):
                return False, f"Flagged by security guardrail (pattern: {pattern})"
        return True, "Safe"

    @classmethod
    def sign_webhook_payload(cls, payload_bytes: bytes, secret: str = None) -> Tuple[str, int]:
        """Signs payload using HMAC-SHA256 with timestamp."""
        secret_key = secret or settings.HMAC_SECRET
        timestamp = int(time.time())
        signed_data = f"{timestamp}.".encode("utf-8") + payload_bytes
        signature = hmac.new(secret_key.encode("utf-8"), signed_data, hashlib.sha256).hexdigest()
        return signature, timestamp

    @classmethod
    def verify_webhook_signature(
        cls, 
        payload_bytes: bytes, 
        signature: str, 
        timestamp: int, 
        secret: str = None, 
        max_drift_seconds: int = 300
    ) -> bool:
        """Verifies HMAC signature and rejects expired requests (replay protection)."""
        current_time = int(time.time())
        if abs(current_time - timestamp) > max_drift_seconds:
            return False

        secret_key = secret or settings.HMAC_SECRET
        signed_data = f"{timestamp}.".encode("utf-8") + payload_bytes
        expected = hmac.new(secret_key.encode("utf-8"), signed_data, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

security_service = SecurityService()
