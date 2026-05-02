"""
TALON Policy Gate — sanitization and compliance enforcement.

Applies PII detection, secret scanning, and routing policy decisions
to every Message before it proceeds downstream.

Architecture:
    1. Run detector chain against content_raw
    2. Aggregate findings into a DetectionResult
    3. Apply routing policy rules to decide final PolicyDecision
    4. Return sanitized content, redaction log, and risk tags
"""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Tuple

from nexusflow_models import (
    Classification,
    Message,
    PolicyDecision,
    RedactionEntry,
    ReplacementType,
    SanitizationStatus,
)


# ---------------------------------------------------------------------------
# Detector definitions
# ---------------------------------------------------------------------------


@dataclass
class DetectorMatch:
    detector: str
    field: str
    original_span: str
    risk_tag: str
    replacement_type: ReplacementType = ReplacementType.REDACTED


# Patterns are intentionally conservative — tune per deployment.
_DETECTORS: List[Tuple[str, str, re.Pattern, str, ReplacementType]] = [
    (
        "pii.email",
        "content_raw",
        re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"),
        "pii:email",
        ReplacementType.REDACTED,
    ),
    (
        "pii.phone",
        "content_raw",
        re.compile(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
        "pii:phone",
        ReplacementType.REDACTED,
    ),
    (
        "secret.api_key_generic",
        "content_raw",
        re.compile(r"(?i)(api[_\-]?key|apikey)\s*[:=]\s*['\"]?([A-Za-z0-9\-_]{20,})['\"]?"),
        "secret:api_key",
        ReplacementType.REDACTED,
    ),
    (
        "secret.openai_key",
        "content_raw",
        re.compile(r"sk-[A-Za-z0-9]{48}"),
        "secret:openai_key",
        ReplacementType.REDACTED,
    ),
    (
        "secret.anthropic_key",
        "content_raw",
        re.compile(r"sk-ant-[A-Za-z0-9\-_]{80,}"),
        "secret:anthropic_key",
        ReplacementType.REDACTED,
    ),
    (
        "secret.github_token",
        "content_raw",
        re.compile(r"gh[pousr]_[A-Za-z0-9]{36}"),
        "secret:github_token",
        ReplacementType.REDACTED,
    ),
    (
        "secret.jwt",
        "content_raw",
        re.compile(r"eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+"),
        "secret:jwt",
        ReplacementType.REDACTED,
    ),
    (
        "secret.aws_access_key",
        "content_raw",
        re.compile(r"AKIA[0-9A-Z]{16}"),
        "secret:aws_access_key",
        ReplacementType.REDACTED,
    ),
    (
        "secret.private_key",
        "content_raw",
        re.compile(r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----"),
        "secret:private_key",
        ReplacementType.REDACTED,
    ),
    (
        "credential.db_connection_string",
        "content_raw",
        re.compile(r"(?i)(?:postgres|mysql|mongodb|redis)://[^\s'\"]+"),
        "credential:connection_string",
        ReplacementType.REDACTED,
    ),
]


# ---------------------------------------------------------------------------
# Policy rules
# ---------------------------------------------------------------------------


def _apply_policy(risk_tags: List[str]) -> PolicyDecision:
    """
    Convert the set of detected risk tags into a TALON policy decision.
    Rules are evaluated in priority order — first match wins.
    """
    tag_set = set(risk_tags)

    blocking_tags = {"secret:private_key", "secret:aws_access_key", "credential:connection_string"}
    if blocking_tags & tag_set:
        return PolicyDecision.BLOCK

    quarantine_tags = {"secret:openai_key", "secret:anthropic_key", "secret:github_token", "secret:jwt"}
    if quarantine_tags & tag_set:
        return PolicyDecision.QUARANTINE

    redaction_tags = {"secret:api_key", "pii:email", "pii:phone"}
    if redaction_tags & tag_set:
        return PolicyDecision.ALLOW_WITH_REDACTION

    if tag_set:
        return PolicyDecision.REVIEW_REQUIRED

    return PolicyDecision.ALLOW


# ---------------------------------------------------------------------------
# Core gate
# ---------------------------------------------------------------------------


def run_detectors(content: str) -> List[DetectorMatch]:
    matches: List[DetectorMatch] = []
    for detector_name, field_name, pattern, risk_tag, replacement_type in _DETECTORS:
        for m in pattern.finditer(content):
            matches.append(DetectorMatch(
                detector=detector_name,
                field=field_name,
                original_span=m.group(0),
                risk_tag=risk_tag,
                replacement_type=replacement_type,
            ))
    return matches


def _redact_content(content: str, matches: List[DetectorMatch]) -> str:
    """Replace detected spans with [REDACTED:<detector>] tokens."""
    result = content
    # Replace longest spans first to avoid nested clobber issues.
    for match in sorted(matches, key=lambda m: -len(m.original_span)):
        result = result.replace(
            match.original_span,
            f"[REDACTED:{match.detector}]",
            1,
        )
    return result


def apply_policy_gate(message: Message) -> Message:
    """
    Run the full TALON policy gate against a Message.
    Returns a new Message with sanitization fields populated.
    Mutates nothing on the original.
    """
    matches = run_detectors(message.content_raw)

    risk_tags = list({m.risk_tag for m in matches})
    decision = _apply_policy(risk_tags)

    if decision == PolicyDecision.ALLOW:
        sanitized = message.content_raw
        redaction_log = []
        sanitization_status = SanitizationStatus.CLEAN
    elif decision in (PolicyDecision.BLOCK, PolicyDecision.QUARANTINE):
        sanitized = "[CONTENT BLOCKED BY POLICY GATE]"
        redaction_log = [
            RedactionEntry(
                redaction_id=uuid.uuid4(),
                field="content_raw",
                original_span=None,
                replacement_type=ReplacementType.REMOVED,
                reason=f"Policy decision: {decision.value}",
                detector="talon.policy_gate",
                timestamp=datetime.now(timezone.utc),
            )
        ]
        sanitization_status = (
            SanitizationStatus.BLOCKED if decision == PolicyDecision.BLOCK
            else SanitizationStatus.QUARANTINED
        )
    elif decision == PolicyDecision.REVIEW_REQUIRED:
        sanitized = message.content_raw
        redaction_log = []
        sanitization_status = SanitizationStatus.REVIEW_REQUIRED
    else:
        # ALLOW_WITH_REDACTION / HASH_FIELDS / TOKENIZE_FIELDS
        sanitized = _redact_content(message.content_raw, matches)
        redaction_log = [
            RedactionEntry(
                redaction_id=uuid.uuid4(),
                field=m.field,
                original_span=m.original_span,
                replacement_type=m.replacement_type,
                reason=f"Detector: {m.detector}",
                detector=m.detector,
                timestamp=datetime.now(timezone.utc),
            )
            for m in matches
        ]
        sanitization_status = SanitizationStatus.REDACTED

    classification = _classify(risk_tags)

    return message.model_copy(update={
        "content_sanitized": sanitized,
        "sanitization_status": sanitization_status,
        "policy_decision": decision,
        "redaction_log": message.redaction_log + redaction_log,
        "risk_tags": list(set(message.risk_tags) | set(risk_tags)),
    })


def _classify(risk_tags: List[str]) -> Classification:
    if any(t.startswith("secret:") for t in risk_tags):
        return Classification.CRITICAL
    if any(t.startswith("pii:") for t in risk_tags):
        return Classification.CONFIDENTIAL
    if any(t.startswith("credential:") for t in risk_tags):
        return Classification.RESTRICTED
    return Classification.INTERNAL
