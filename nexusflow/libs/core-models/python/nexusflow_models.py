"""
NexusFlow canonical Pydantic models.

These are the authoritative Python representations of the JSON Schemas in nexusflow/schemas/.
Import from here in every service — never redefine entity shapes locally.
"""

from __future__ import annotations

import enum
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------


class PlatformSource(str, enum.Enum):
    OPENAI_CHATGPT = "openai_chatgpt"
    OPENAI_AGENT = "openai_agent"
    ANTHROPIC_CLAUDE = "anthropic_claude"
    GOOGLE_GEMINI = "google_gemini"
    MICROSOFT_COPILOT = "microsoft_copilot"
    META_LLAMA = "meta_llama"
    PERPLEXITY = "perplexity"
    POE = "poe"
    SLACK_BOT = "slack_bot"
    DISCORD_BOT = "discord_bot"
    CUSTOM_APP = "custom_app"
    LOCAL_MODEL = "local_model"


class IngestMode(str, enum.Enum):
    REALTIME = "realtime"
    BATCH = "batch"


class Classification(str, enum.Enum):
    PUBLIC = "Public"
    INTERNAL = "Internal"
    CONFIDENTIAL = "Confidential"
    RESTRICTED = "Restricted"
    CRITICAL = "Critical"


class ThreadStatus(str, enum.Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    QUARANTINED = "quarantined"
    DELETED = "deleted"


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class SanitizationStatus(str, enum.Enum):
    PENDING = "pending"
    CLEAN = "clean"
    REDACTED = "redacted"
    TOKENIZED = "tokenized"
    QUARANTINED = "quarantined"
    BLOCKED = "blocked"
    REVIEW_REQUIRED = "review_required"


class PolicyDecision(str, enum.Enum):
    ALLOW = "ALLOW"
    ALLOW_WITH_REDACTION = "ALLOW_WITH_REDACTION"
    HASH_FIELDS = "HASH_FIELDS"
    TOKENIZE_FIELDS = "TOKENIZE_FIELDS"
    QUARANTINE = "QUARANTINE"
    BLOCK = "BLOCK"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"


class InsightType(str, enum.Enum):
    DECISION = "decision"
    FEATURE_REQUEST = "feature_request"
    RISK = "risk"
    FINDING = "finding"
    ACTION_ITEM = "action_item"
    KNOWLEDGE_GAP = "knowledge_gap"
    REQUIREMENT = "requirement"
    BLOCKER = "blocker"
    CUSTOMER_SIGNAL = "customer_signal"
    ARCHITECTURE_NOTE = "architecture_note"


class InsightStatus(str, enum.Enum):
    NEW = "new"
    IN_REVIEW = "in_review"
    VERIFIED = "verified"
    REJECTED = "rejected"
    IMPLEMENTED = "implemented"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    USER = "user"
    VIEWER = "viewer"


class ReplacementType(str, enum.Enum):
    REDACTED = "redacted"
    HASHED = "hashed"
    TOKENIZED = "tokenized"
    REMOVED = "removed"


class RoutingStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    DEAD_LETTERED = "dead_lettered"


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------


class Sentiment(BaseModel):
    label: str
    score: float = Field(ge=-1.0, le=1.0)


class Attachment(BaseModel):
    attachment_id: UUID
    type: str
    url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ToolCall(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    result: Optional[Dict[str, Any]] = None


class Citation(BaseModel):
    source_type: str
    source_id: str
    url: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)


class RedactionEntry(BaseModel):
    redaction_id: UUID
    field: str
    original_span: Optional[str] = None
    replacement_type: ReplacementType
    reason: Optional[str] = None
    detector: Optional[str] = None
    timestamp: datetime


class EditEntry(BaseModel):
    edited_at: datetime
    editor_id: UUID
    diff: str


class PlatformAccount(BaseModel):
    platform: str
    account_id: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EvidenceLink(BaseModel):
    type: str
    id: str
    url: Optional[str] = None
    verified: bool = False


class ExternalReference(BaseModel):
    system: str
    external_id: str
    url: Optional[str] = None


class RoutingDestination(BaseModel):
    system: str
    destination_type: str
    endpoint: Optional[str] = None
    external_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Core entities
# ---------------------------------------------------------------------------


class IngestEvent(BaseModel):
    event_id: UUID
    tenant_id: UUID
    platform_source: PlatformSource
    ingest_mode: IngestMode
    received_at: datetime
    ingestion_source_id: Optional[str] = None
    provider_metadata: Dict[str, Any] = Field(default_factory=dict)
    payload: Dict[str, Any]


class Thread(BaseModel):
    thread_id: UUID
    tenant_id: UUID
    platform_source: str
    model_id: Optional[str] = None
    user_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    topic_tags: List[str] = Field(default_factory=list)
    classification: Classification = Classification.INTERNAL
    status: ThreadStatus = ThreadStatus.ACTIVE
    created_at: datetime
    last_activity: Optional[datetime] = None
    message_count: int = 0
    token_count: int = 0
    extracted_entities: Dict[str, Any] = Field(default_factory=dict)
    confidence_score: float = Field(ge=0.0, le=1.0, default=0.0)
    risk_tags: List[str] = Field(default_factory=list)


class Message(BaseModel):
    message_id: UUID
    thread_id: UUID
    parent_id: Optional[UUID] = None
    platform_message_id: Optional[str] = None
    role: MessageRole
    content_raw: str
    content_sanitized: Optional[str] = None
    content_structured: Dict[str, Any] = Field(default_factory=dict)
    sanitization_status: SanitizationStatus = SanitizationStatus.PENDING
    policy_decision: Optional[PolicyDecision] = None
    model_metadata: Dict[str, Any] = Field(default_factory=dict)
    sentiment: Optional[Sentiment] = None
    intent: Optional[str] = None
    attachments: List[Attachment] = Field(default_factory=list)
    tool_calls: List[ToolCall] = Field(default_factory=list)
    citations: List[Citation] = Field(default_factory=list)
    redaction_log: List[RedactionEntry] = Field(default_factory=list)
    risk_tags: List[str] = Field(default_factory=list)
    timestamp: datetime
    edit_history: List[EditEntry] = Field(default_factory=list)


class Insight(BaseModel):
    insight_id: UUID
    tenant_id: UUID
    source_thread_ids: List[UUID] = Field(default_factory=list)
    source_message_ids: List[UUID] = Field(default_factory=list)
    insight_type: InsightType
    content: str
    summary: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0, default=0.0)
    evidence_links: List[EvidenceLink] = Field(default_factory=list)
    assigned_to: Optional[UUID] = None
    due_date: Optional[datetime] = None
    status: InsightStatus = InsightStatus.NEW
    created_at: datetime
    updated_at: Optional[datetime] = None
    external_references: List[ExternalReference] = Field(default_factory=list)


class User(BaseModel):
    user_id: UUID
    tenant_id: UUID
    email_hash: Optional[str] = None
    role: UserRole = UserRole.USER
    project_access: List[UUID] = Field(default_factory=list)
    platform_accounts: List[PlatformAccount] = Field(default_factory=list)
    preferences: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    last_login_at: Optional[datetime] = None


class RoutingEvent(BaseModel):
    routing_event_id: UUID
    tenant_id: UUID
    source_id: UUID
    source_type: str
    destination: RoutingDestination
    payload_summary: Dict[str, Any] = Field(default_factory=dict)
    status: RoutingStatus = RoutingStatus.PENDING
    attempt_count: int = 0
    error: Optional[str] = None
    workflow_id: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
