"""
Policy gate unit tests.

These run without any external services.
"""

import uuid
from datetime import datetime, timezone

import pytest

from nexusflow.services.sanitizer.src.policy_gate import apply_policy_gate, run_detectors
from nexusflow_models import Message, MessageRole, PolicyDecision, SanitizationStatus


def _msg(content: str) -> Message:
    return Message(
        message_id=uuid.uuid4(),
        thread_id=uuid.uuid4(),
        role=MessageRole.USER,
        content_raw=content,
        timestamp=datetime.now(timezone.utc),
    )


# ---------------------------------------------------------------------------
# Detector tests
# ---------------------------------------------------------------------------


def test_detects_email():
    matches = run_detectors("Contact me at alice@example.com please")
    assert any(m.detector == "pii.email" for m in matches)


def test_detects_openai_key():
    fake_key = "sk-" + "a" * 48
    matches = run_detectors(f"My key is {fake_key}")
    assert any(m.detector == "secret.openai_key" for m in matches)


def test_detects_github_token():
    matches = run_detectors("Use token ghp_" + "A" * 36 + " for auth")
    assert any(m.detector == "secret.github_token" for m in matches)


def test_detects_aws_key():
    matches = run_detectors("AWS key: AKIAIOSFODNN7EXAMPLE123")
    assert any(m.detector == "secret.aws_access_key" for m in matches)


def test_clean_content_no_matches():
    matches = run_detectors("The weather today is sunny and warm.")
    assert matches == []


# ---------------------------------------------------------------------------
# Policy gate integration tests
# ---------------------------------------------------------------------------


def test_clean_message_passes():
    msg = _msg("Let's discuss the product roadmap for Q3.")
    result = apply_policy_gate(msg)
    assert result.sanitization_status == SanitizationStatus.CLEAN
    assert result.policy_decision == PolicyDecision.ALLOW
    assert result.content_sanitized == msg.content_raw


def test_email_triggers_redaction():
    msg = _msg("Send results to user@company.com when done.")
    result = apply_policy_gate(msg)
    assert result.sanitization_status == SanitizationStatus.REDACTED
    assert result.policy_decision == PolicyDecision.ALLOW_WITH_REDACTION
    assert "user@company.com" not in result.content_sanitized
    assert len(result.redaction_log) > 0


def test_openai_key_triggers_quarantine():
    fake_key = "sk-" + "b" * 48
    msg = _msg(f"Here's my API key: {fake_key}")
    result = apply_policy_gate(msg)
    assert result.sanitization_status == SanitizationStatus.QUARANTINED
    assert result.policy_decision == PolicyDecision.QUARANTINE


def test_private_key_triggers_block():
    msg = _msg("-----BEGIN RSA PRIVATE KEY-----\nMIIEoAIBAAK...\n-----END RSA PRIVATE KEY-----")
    result = apply_policy_gate(msg)
    assert result.sanitization_status == SanitizationStatus.BLOCKED
    assert result.policy_decision == PolicyDecision.BLOCK


def test_redaction_log_populated():
    msg = _msg("Email me at test@example.org and use token ghp_" + "X" * 36)
    result = apply_policy_gate(msg)
    assert len(result.redaction_log) >= 1


def test_risk_tags_populated():
    msg = _msg("Contact alice@example.com")
    result = apply_policy_gate(msg)
    assert "pii:email" in result.risk_tags
