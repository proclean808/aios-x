"""
Router unit tests — validate policy-based routing rule evaluation.
"""

import uuid
from datetime import datetime, timezone

import pytest

from nexusflow.services.router.src.router import evaluate_routing
from nexusflow_models import Insight, InsightStatus, InsightType


def _insight(insight_type: InsightType, status: InsightStatus = InsightStatus.NEW, confidence: float = 0.80) -> Insight:
    return Insight(
        insight_id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        insight_type=insight_type,
        content="Test insight content for routing evaluation.",
        confidence=confidence,
        status=status,
        created_at=datetime.now(timezone.utc),
    )


def test_action_item_routes_to_linear():
    insight = _insight(InsightType.ACTION_ITEM, InsightStatus.NEW, confidence=0.80)
    destinations = evaluate_routing(insight)
    systems = {d.system for d in destinations}
    assert "linear" in systems


def test_verified_decision_routes_to_notion_and_memory():
    insight = _insight(InsightType.DECISION, InsightStatus.VERIFIED, confidence=0.85)
    destinations = evaluate_routing(insight)
    systems = {d.system for d in destinations}
    assert "notion" in systems
    assert "membrain" in systems


def test_risk_routes_to_linear_and_membrain():
    insight = _insight(InsightType.RISK, InsightStatus.NEW, confidence=0.75)
    destinations = evaluate_routing(insight)
    systems = {d.system for d in destinations}
    assert "linear" in systems
    assert "membrain" in systems


def test_all_insights_route_to_audit():
    for itype in InsightType:
        insight = _insight(itype, InsightStatus.NEW, confidence=0.50)
        destinations = evaluate_routing(insight)
        systems = {d.system for d in destinations}
        assert "internal_audit_ledger" in systems, f"Audit missing for {itype}"


def test_low_confidence_action_item_skips_linear():
    insight = _insight(InsightType.ACTION_ITEM, InsightStatus.NEW, confidence=0.50)
    destinations = evaluate_routing(insight)
    systems = {d.system for d in destinations}
    assert "linear" not in systems


def test_no_duplicate_destinations():
    insight = _insight(InsightType.DECISION, InsightStatus.VERIFIED, confidence=0.90)
    destinations = evaluate_routing(insight)
    keys = [(d.system, d.destination_type) for d in destinations]
    assert len(keys) == len(set(keys))
