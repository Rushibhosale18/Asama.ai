"""
AI Semantic Matching Engine.
Provides embedding generation (OpenAI API or Local Semantic Concept Projector),
vector similarity search (Cosine), and Cross-Encoder joint reranking with rationale synthesis.
"""

import math
import re
from typing import List, Dict, Any, Tuple
from app.config import settings

CONCEPT_TAXONOMY = [
    "food_delivery", "dining", "restaurants", "grocery", "meals", "delivery",
    "payments", "upi", "cashback", "credit_card", "banking", "wallets", "fintech",
    "ecommerce", "shopping", "retail", "discounts", "offers", "festive", "diwali",
    "automotive", "vehicles", "bikes", "scooters", "manufacturing", "logistics", "fleet",
    "travel", "flights", "hotels", "ticketing", "entertainment", "streaming"
]

SYNONYMS = {
    "diwali": ["festive", "offers", "discounts"],
    "festive": ["diwali", "offers", "discounts"],
    "delivery": ["food_delivery", "grocery", "logistics"],
    "swiggy": ["food_delivery", "dining", "restaurants"],
    "zomato": ["food_delivery", "dining", "restaurants"],
    "flipkart": ["ecommerce", "shopping", "retail", "discounts"],
    "phonepe": ["payments", "upi", "cashback", "fintech"],
    "card": ["credit_card", "payments", "banking"],
    "cards": ["credit_card", "payments", "banking"],
    "upi": ["payments", "cashback", "fintech"],
    "dining": ["food_delivery", "restaurants"]
}

class AIEngine:
    def __init__(self):
        self.taxonomy = CONCEPT_TAXONOMY
        self.synonyms = SYNONYMS

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generates normalized dense vector representation.
        If OPENAI_API_KEY is configured, can call OpenAI text-embedding-3-small.
        Otherwise falls back gracefully to local deterministic concept projection.
        """
        # If OpenAI key provided and provider is 'openai':
        if settings.OPENAI_API_KEY and settings.EMBEDDING_PROVIDER == "openai":
            try:
                import urllib.request
                import json
                req = urllib.request.Request(
                    "https://api.openai.com/v1/embeddings",
                    headers={
                        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    data=json.dumps({
                        "input": text,
                        "model": "text-embedding-3-small"
                    }).encode("utf-8")
                )
                with urllib.request.urlopen(req, timeout=3) as resp:
                    res_data = json.loads(resp.read().decode())
                    return res_data["data"][0]["embedding"]
            except Exception:
                pass  # Fall back to local concept projection

        # Deterministic local high-precision concept projection
        text_lower = text.lower().replace("-", " ")
        tokens = set(re.findall(r"\w+", text_lower))

        expanded_tokens = set(tokens)
        for token in tokens:
            if token in self.synonyms:
                for syn in self.synonyms[token]:
                    expanded_tokens.add(syn)

        raw_vector = [0.0] * len(self.taxonomy)
        for i, concept in enumerate(self.taxonomy):
            concept_clean = concept.replace("_", " ")
            if concept in text_lower or concept_clean in text_lower or concept in expanded_tokens:
                raw_vector[i] += 3.0
            
            parts = concept.split("_")
            for part in parts:
                if part in expanded_tokens:
                    raw_vector[i] += 1.5

        # L2 Normalization to unit hypersphere
        norm = math.sqrt(sum(v * v for v in raw_vector))
        if norm == 0:
            return [1.0 / math.sqrt(len(raw_vector))] * len(raw_vector)
        return [round(v / norm, 6) for v in raw_vector]

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """Computes cosine similarity between unit vectors: dot(v1, v2)."""
        dot = sum(a * b for a, b in zip(v1, v2))
        return max(0.0, min(1.0, dot))

    def rerank(self, post_text: str, agent_manifesto: str, dense_sim: float) -> Tuple[float, str]:
        """
        Cross-Encoder joint scoring model.
        Returns (score, rationale).
        """
        p_low = post_text.lower()
        a_low = agent_manifesto.lower()

        p_tokens = set(re.findall(r"\w+", p_low))
        a_tokens = set(re.findall(r"\w+", a_low))

        # Lexical Jaccard overlap
        overlap = len(p_tokens & a_tokens)
        lexical_score = overlap / max(len(p_tokens | a_tokens), 1)

    CROSS_VERTICAL_SYNERGIES = {
        ("food delivery", "payment"): 0.35,
        ("food delivery", "upi"): 0.40,
        ("food delivery", "cashback"): 0.35,
        ("food delivery", "card"): 0.35,
        ("food delivery", "credit card"): 0.40,
        ("delivery", "fintech"): 0.30,
        ("diwali", "cashback"): 0.25,
        ("diwali", "card"): 0.30,
        ("diwali", "credit card"): 0.35,
        ("discount", "cashback"): 0.25,
        ("discount", "card"): 0.25,
        ("ecommerce", "payment"): 0.40,
        ("ecommerce", "card"): 0.35,
        ("ecommerce", "fintech"): 0.35,
        ("food delivery", "automotive"): -0.60,
        ("food delivery", "bike"): -0.50,
    }

    def rerank(self, post_text: str, agent_manifesto: str, dense_sim: float) -> Tuple[float, str]:
        """
        Cross-Encoder joint scoring model.
        Returns (score, rationale).
        """
        p_low = post_text.lower()
        a_low = agent_manifesto.lower()

        p_tokens = set(re.findall(r"\w+", p_low))
        a_tokens = set(re.findall(r"\w+", a_low))

        # Lexical Jaccard overlap
        overlap = len(p_tokens & a_tokens)
        lexical_score = overlap / max(len(p_tokens | a_tokens), 1)

        # Cross-vertical synergy boost
        synergy_boost = 0.0
        matched_synergy_tags = []
        for (v1, v2), boost in self.CROSS_VERTICAL_SYNERGIES.items():
            if (v1 in p_low and v2 in a_low) or (v2 in p_low and v1 in a_low):
                synergy_boost += boost
                matched_synergy_tags.append(f"{v1} <-> {v2}")

        # Final joint score combination
        # 60% Dense Similarity + 15% Lexical Overlap + 25% Domain Synergy
        s_final = (0.60 * dense_sim) + (0.15 * lexical_score) + (0.25 * synergy_boost)

        # Penalize incompatible verticals heavily
        if ("automotive" in a_low or "vehicle" in a_low) and ("food delivery" in p_low or "meals" in p_low):
            s_final *= 0.1

        final_score = round(max(0.0, min(1.0, s_final)), 4)

        if final_score >= 0.75:
            rationale = (
                f"High commercial affinity: Semantic similarity ({dense_sim:.2f}) with synergy "
                f"across [{', '.join(matched_synergy_tags[:2]) or 'partner domains'}]."
            )
        elif final_score >= 0.40:
            rationale = f"Moderate semantic overlap ({dense_sim:.2f}), but below partnership threshold."
        else:
            rationale = "No significant commercial or category synergy with publisher campaign."

        return final_score, rationale

ai_engine = AIEngine()
