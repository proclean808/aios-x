"""
NexusFlow Intelligence Extractor — derives structured Insight records from sanitized messages.

In production this layer calls an LLM (e.g. Claude via the Anthropic SDK) with a
structured extraction prompt. The stub here implements keyword-based heuristics
so the pipeline runs without an API key in local dev.

Replace _llm_extract() with a real Claude API call for production.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import List

from nexusflow_models import (
    Insight,
    InsightStatus,
    InsightType,
    Message,
    Thread,
)


# ---------------------------------------------------------------------------
# Keyword heuristics (replace with LLM extraction in production)
# ---------------------------------------------------------------------------


_PATTERNS: List[tuple[InsightType, list[re.Pattern]]] = [
    (InsightType.ACTION_ITEM, [
        re.compile(r"\b(TODO|todo|action item|will do|next step|i'll|we need to|needs to)\b", re.I),
    ]),
    (InsightType.DECISION, [
        re.compile(r"\b(we decided|decision made|agreed to|going with|choosing|chosen|decided)\b", re.I),
    ]),
    (InsightType.RISK, [
        re.compile(r"\b(risk|concern|blocker|issue|problem|could break|might fail|careful)\b", re.I),
    ]),
    (InsightType.FEATURE_REQUEST, [
        re.compile(r"\b(feature request|would be nice|should support|users want|customers asked|FR:)\b", re.I),
    ]),
    (InsightType.KNOWLEDGE_GAP, [
        re.compile(r"\b(not sure|unclear|unknown|need to investigate|research|TBD|figure out)\b", re.I),
    ]),
    (InsightType.ARCHITECTURE_NOTE, [
        re.compile(r"\b(architecture|design decision|schema|database|API|service boundary|endpoint)\b", re.I),
    ]),
]


def _detect_type(content: str) -> InsightType | None:
    for insight_type, patterns in _PATTERNS:
        if any(p.search(content) for p in patterns):
            return insight_type
    return None


def _heuristic_confidence(content: str, insight_type: InsightType) -> float:
    base = 0.60
    if len(content) > 200:
        base += 0.10
    if insight_type == InsightType.DECISION:
        base += 0.10
    return min(base, 0.95)


# ---------------------------------------------------------------------------
# Extraction entry point
# ---------------------------------------------------------------------------


def extract_insights(thread: Thread, messages: List[Message]) -> List[Insight]:
    insights: List[Insight] = []
    now = datetime.now(timezone.utc)

    for msg in messages:
        content = msg.content_sanitized or msg.content_raw
        if not content or len(content) < 20:
            continue

        detected_type = _detect_type(content)
        if detected_type is None:
            continue

        confidence = _heuristic_confidence(content, detected_type)
        summary = content[:200].strip()

        insight = Insight(
            insight_id=uuid.uuid4(),
            tenant_id=thread.tenant_id,
            source_thread_ids=[thread.thread_id],
            source_message_ids=[msg.message_id],
            insight_type=detected_type,
            content=content,
            summary=summary,
            confidence=confidence,
            status=InsightStatus.NEW,
            created_at=now,
            updated_at=now,
        )
        insights.append(insight)

    return insights
