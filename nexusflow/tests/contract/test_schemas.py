"""
Contract tests: validate that Pydantic models round-trip cleanly and match
the JSON Schema definitions in nexusflow/schemas/.
"""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

import pytest

from nexusflow_models import (
    IngestEvent,
    IngestMode,
    Insight,
    InsightStatus,
    InsightType,
    Message,
    MessageRole,
    PlatformSource,
    SanitizationStatus,
    Thread,
    ThreadStatus,
    User,
    UserRole,
)

SCHEMAS_DIR = Path(__file__).parent.parent.parent / "schemas"


def _now():
    return datetime.now(timezone.utc)


def test_ingest_event_roundtrip():
    event = IngestEvent(
        event_id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        platform_source=PlatformSource.ANTHROPIC_CLAUDE,
        ingest_mode=IngestMode.REALTIME,
        received_at=_now(),
        payload={"messages": []},
    )
    dumped = event.model_dump(mode="json")
    restored = IngestEvent.model_validate(dumped)
    assert restored.event_id == event.event_id
    assert restored.platform_source == PlatformSource.ANTHROPIC_CLAUDE


def test_thread_roundtrip():
    thread = Thread(
        thread_id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        platform_source="anthropic_claude",
        status=ThreadStatus.ACTIVE,
        classification="Internal",
        created_at=_now(),
    )
    dumped = thread.model_dump(mode="json")
    restored = Thread.model_validate(dumped)
    assert restored.thread_id == thread.thread_id


def test_message_roundtrip():
    msg = Message(
        message_id=uuid.uuid4(),
        thread_id=uuid.uuid4(),
        role=MessageRole.USER,
        content_raw="Hello world",
        sanitization_status=SanitizationStatus.PENDING,
        timestamp=_now(),
    )
    dumped = msg.model_dump(mode="json")
    restored = Message.model_validate(dumped)
    assert restored.message_id == msg.message_id


def test_insight_roundtrip():
    insight = Insight(
        insight_id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        insight_type=InsightType.ACTION_ITEM,
        content="We need to update the onboarding flow.",
        confidence=0.85,
        status=InsightStatus.NEW,
        created_at=_now(),
    )
    dumped = insight.model_dump(mode="json")
    restored = Insight.model_validate(dumped)
    assert restored.insight_id == insight.insight_id
    assert restored.confidence == 0.85


def test_user_roundtrip():
    user = User(
        user_id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        role=UserRole.ANALYST,
        created_at=_now(),
    )
    dumped = user.model_dump(mode="json")
    restored = User.model_validate(dumped)
    assert restored.user_id == user.user_id


def test_json_schema_files_exist():
    expected = [
        "ingest-event.schema.json",
        "thread.schema.json",
        "message.schema.json",
        "insight.schema.json",
        "user.schema.json",
        "routing-event.schema.json",
    ]
    for filename in expected:
        path = SCHEMAS_DIR / filename
        assert path.exists(), f"Missing schema file: {filename}"
        with path.open() as f:
            data = json.load(f)
        assert "$schema" in data
        assert "title" in data
