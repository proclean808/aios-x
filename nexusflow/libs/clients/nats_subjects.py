"""
NATS JetStream subject definitions for NexusFlow.

All inter-service events use these subject constants.
Subjects follow the pattern: nexusflow.<domain>.<event>
"""

# Ingestion
INGEST_EVENT_RECEIVED = "nexusflow.ingest.event_received"

# Normalization
THREAD_CREATED = "nexusflow.thread.created"
THREAD_UPDATED = "nexusflow.thread.updated"
MESSAGE_CREATED = "nexusflow.message.created"
MESSAGE_NORMALIZED = "nexusflow.message.normalized"
ATTACHMENT_REGISTERED = "nexusflow.attachment.registered"

# Sanitization
MESSAGE_SANITIZED = "nexusflow.message.sanitized"
MESSAGE_QUARANTINED = "nexusflow.message.quarantined"
MESSAGE_BLOCKED = "nexusflow.message.blocked"
MESSAGE_REVIEW_REQUIRED = "nexusflow.message.review_required"

# Intelligence
INSIGHT_CREATED = "nexusflow.insight.created"
INSIGHT_UPDATED = "nexusflow.insight.updated"
EMBEDDING_GENERATED = "nexusflow.embedding.generated"

# Routing
ROUTING_TRIGGERED = "nexusflow.routing.triggered"
ROUTING_COMPLETED = "nexusflow.routing.completed"
ROUTING_FAILED = "nexusflow.routing.failed"
ROUTING_DEAD_LETTERED = "nexusflow.routing.dead_lettered"

# Stream name
NEXUSFLOW_STREAM = "NEXUSFLOW"

# Consumer group names
NORMALIZER_CONSUMER = "normalizer"
SANITIZER_CONSUMER = "sanitizer"
INTELLIGENCE_CONSUMER = "intelligence"
ROUTER_CONSUMER = "router"
AUDIT_CONSUMER = "audit"

# Subject wildcards for stream filter configuration
ALL_SUBJECTS = "nexusflow.>"
INGEST_SUBJECTS = "nexusflow.ingest.>"
THREAD_SUBJECTS = "nexusflow.thread.>"
MESSAGE_SUBJECTS = "nexusflow.message.>"
INSIGHT_SUBJECTS = "nexusflow.insight.>"
ROUTING_SUBJECTS = "nexusflow.routing.>"
