"""
NexusFlow Normalizer — converts provider-specific payloads into canonical Thread/Message records.

Each provider connector implements the ProviderNormalizer protocol.
The dispatch function routes IngestEvents to the correct normalizer.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Protocol, Tuple

from nexusflow_models import (
    IngestEvent,
    Message,
    MessageRole,
    PlatformSource,
    SanitizationStatus,
    Thread,
    ThreadStatus,
)


class ProviderNormalizer(Protocol):
    def normalize(self, event: IngestEvent) -> Tuple[Thread, list[Message]]:
        ...


class GenericNormalizer:
    """
    Fallback normalizer for custom_app and local_model sources.
    Expects payload to contain a 'messages' list in the canonical role/content format.
    """

    def normalize(self, event: IngestEvent) -> Tuple[Thread, list[Message]]:
        payload = event.payload
        now = datetime.now(timezone.utc)
        thread_id = uuid.uuid4()

        thread = Thread(
            thread_id=thread_id,
            tenant_id=event.tenant_id,
            platform_source=event.platform_source.value,
            status=ThreadStatus.ACTIVE,
            created_at=now,
            last_activity=now,
        )

        messages: list[Message] = []
        raw_messages = payload.get("messages", [])
        parent_id = None

        for raw in raw_messages:
            msg_id = uuid.uuid4()
            role_str = raw.get("role", "user")
            try:
                role = MessageRole(role_str)
            except ValueError:
                role = MessageRole.USER

            msg = Message(
                message_id=msg_id,
                thread_id=thread_id,
                parent_id=parent_id,
                platform_message_id=raw.get("id"),
                role=role,
                content_raw=raw.get("content", ""),
                sanitization_status=SanitizationStatus.PENDING,
                model_metadata=raw.get("model_metadata", {}),
                timestamp=datetime.fromisoformat(raw["timestamp"]) if "timestamp" in raw else now,
            )
            messages.append(msg)
            parent_id = msg_id

        thread = thread.model_copy(update={"message_count": len(messages)})
        return thread, messages


class OpenAINormalizer:
    """
    Normalizer for OpenAI ChatGPT / GPT-4 conversation export format.
    Expects the standard conversations.json export payload structure.
    """

    def normalize(self, event: IngestEvent) -> Tuple[Thread, list[Message]]:
        payload = event.payload
        now = datetime.now(timezone.utc)
        thread_id = uuid.uuid4()

        thread = Thread(
            thread_id=thread_id,
            tenant_id=event.tenant_id,
            platform_source=event.platform_source.value,
            model_id=payload.get("model"),
            status=ThreadStatus.ACTIVE,
            created_at=datetime.fromtimestamp(payload.get("create_time", now.timestamp()), tz=timezone.utc),
            last_activity=datetime.fromtimestamp(payload.get("update_time", now.timestamp()), tz=timezone.utc),
        )

        messages: list[Message] = []
        mapping = payload.get("mapping", {})
        parent_id = None

        for node_id, node in mapping.items():
            msg_data = node.get("message")
            if not msg_data:
                continue
            content_parts = msg_data.get("content", {}).get("parts", [])
            content_raw = "\n".join(str(p) for p in content_parts if isinstance(p, str))
            if not content_raw:
                continue

            role_str = msg_data.get("author", {}).get("role", "user")
            try:
                role = MessageRole(role_str)
            except ValueError:
                role = MessageRole.USER

            msg = Message(
                message_id=uuid.uuid4(),
                thread_id=thread_id,
                parent_id=parent_id,
                platform_message_id=node_id,
                role=role,
                content_raw=content_raw,
                sanitization_status=SanitizationStatus.PENDING,
                model_metadata={"model": payload.get("model")},
                timestamp=datetime.fromtimestamp(
                    msg_data.get("create_time", now.timestamp()), tz=timezone.utc
                ),
            )
            messages.append(msg)
            parent_id = msg.message_id

        thread = thread.model_copy(update={"message_count": len(messages)})
        return thread, messages


_NORMALIZER_REGISTRY: dict[PlatformSource, ProviderNormalizer] = {
    PlatformSource.OPENAI_CHATGPT: OpenAINormalizer(),
    PlatformSource.OPENAI_AGENT: OpenAINormalizer(),
}

_GENERIC = GenericNormalizer()


def normalize_ingest_event(event: IngestEvent) -> Tuple[Thread, list[Message]]:
    normalizer = _NORMALIZER_REGISTRY.get(event.platform_source, _GENERIC)
    return normalizer.normalize(event)
