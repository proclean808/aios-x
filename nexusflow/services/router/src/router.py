"""
NexusFlow Router — policy-based routing of insights and threads to downstream systems.

Loads routing rules from routing_rules.yaml and dispatches routing events
via Temporal workflow stubs (stub implementation — replace with real Temporal client).
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import yaml

from nexusflow_models import (
    Insight,
    PolicyDecision,
    RoutingDestination,
    RoutingEvent,
    RoutingStatus,
    SanitizationStatus,
)

logger = logging.getLogger(__name__)

RULES_PATH = Path(__file__).parent / "routing_rules.yaml"


def load_rules() -> List[Dict[str, Any]]:
    with RULES_PATH.open() as f:
        data = yaml.safe_load(f)
    return data.get("rules", [])


def _matches_conditions(insight: Insight, conditions: Dict[str, Any]) -> bool:
    if not conditions:
        return True

    if "insight_type" in conditions:
        if insight.insight_type.value not in conditions["insight_type"]:
            return False

    if "status" in conditions:
        if insight.status.value not in conditions["status"]:
            return False

    if "confidence_min" in conditions:
        if insight.confidence < conditions["confidence_min"]:
            return False

    return True


def evaluate_routing(insight: Insight) -> List[RoutingDestination]:
    rules = load_rules()
    destinations: List[RoutingDestination] = []

    for rule in rules:
        conditions = rule.get("conditions", {})

        # sanitization_status and classification are thread-level concerns;
        # handle them when routing threads directly. Skip here for insights.
        if "sanitization_status" in conditions or "classification" in conditions:
            continue

        if _matches_conditions(insight, conditions):
            for dest in rule.get("destinations", []):
                destinations.append(RoutingDestination(
                    system=dest["system"],
                    destination_type=dest["destination_type"],
                ))
            if rule.get("halt_on_match", False):
                break

    seen = set()
    unique: List[RoutingDestination] = []
    for d in destinations:
        key = (d.system, d.destination_type)
        if key not in seen:
            seen.add(key)
            unique.append(d)
    return unique


def dispatch_insight(insight: Insight, tenant_id: uuid.UUID) -> List[RoutingEvent]:
    destinations = evaluate_routing(insight)
    events: List[RoutingEvent] = []

    for dest in destinations:
        event = RoutingEvent(
            routing_event_id=uuid.uuid4(),
            tenant_id=tenant_id,
            source_id=insight.insight_id,
            source_type="insight",
            destination=dest,
            payload_summary={
                "insight_type": insight.insight_type.value,
                "status": insight.status.value,
                "confidence": insight.confidence,
            },
            status=RoutingStatus.PENDING,
            attempt_count=0,
            created_at=datetime.now(timezone.utc),
        )
        _trigger_temporal_workflow(event)
        events.append(event)

    return events


def _trigger_temporal_workflow(event: RoutingEvent) -> None:
    """
    Stub — replace with actual Temporal client workflow start call.
    In production this starts a RouteInsightWorkflow in Temporal that
    handles retries, backoff, idempotency, and dead-letter routing.
    """
    logger.info(
        "Routing event %s: %s -> %s (%s)",
        event.routing_event_id,
        event.source_id,
        event.destination.system,
        event.destination.destination_type,
    )
