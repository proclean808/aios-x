"""
NexusFlow Gateway — public ingestion and API edge service.

Responsibilities:
- Receive webhooks from AI platforms and custom apps
- Accept manual batch exports
- Validate payloads against IngestEvent schema
- Emit IngestEvent to NATS JetStream
- Handle auth via OIDC middleware
"""

from __future__ import annotations

import json
import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Dict

import nats
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from pydantic import BaseModel, ValidationError

from nexusflow_models import IngestEvent, IngestMode, PlatformSource

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

NATS_URL = os.getenv("NATS_URL", "nats://localhost:4222")
INGEST_SUBJECT = "nexusflow.ingest.event_received"

nc: nats.NATS | None = None
js: Any = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global nc, js
    nc = await nats.connect(NATS_URL)
    js = nc.jetstream()
    logger.info("NATS connected: %s", NATS_URL)
    yield
    if nc:
        await nc.drain()
    logger.info("NATS connection closed")


app = FastAPI(
    title="NexusFlow Gateway",
    description="Public ingestion edge for cross-channel AI thread export",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["POST", "GET"],
    allow_headers=["Authorization", "Content-Type", "X-Tenant-Id"],
)

FastAPIInstrumentor.instrument_app(app)


# ---------------------------------------------------------------------------
# Auth dependency (stub — replace with OIDC/JWT validation)
# ---------------------------------------------------------------------------


async def require_tenant(x_tenant_id: str = Header(...)) -> str:
    if not x_tenant_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing X-Tenant-Id header")
    return x_tenant_id


# ---------------------------------------------------------------------------
# Request/response models
# ---------------------------------------------------------------------------


class WebhookIngestRequest(BaseModel):
    platform_source: PlatformSource
    ingest_mode: IngestMode = IngestMode.REALTIME
    ingestion_source_id: str | None = None
    provider_metadata: Dict[str, Any] = {}
    payload: Dict[str, Any]


class BatchIngestRequest(BaseModel):
    platform_source: PlatformSource
    ingestion_source_id: str | None = None
    provider_metadata: Dict[str, Any] = {}
    items: list[Dict[str, Any]]


class IngestResponse(BaseModel):
    event_id: str
    status: str
    queued_at: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
async def health():
    return {"status": "ok", "service": "nexusflow-gateway"}


@app.post("/v1/ingest/webhook", response_model=IngestResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_webhook(
    body: WebhookIngestRequest,
    tenant_id: str = Depends(require_tenant),
):
    with tracer.start_as_current_span("ingest_webhook"):
        event = IngestEvent(
            event_id=uuid.uuid4(),
            tenant_id=uuid.UUID(tenant_id),
            platform_source=body.platform_source,
            ingest_mode=IngestMode.REALTIME,
            received_at=datetime.now(timezone.utc),
            ingestion_source_id=body.ingestion_source_id,
            provider_metadata=body.provider_metadata,
            payload=body.payload,
        )
        await _publish(event)
        return IngestResponse(
            event_id=str(event.event_id),
            status="queued",
            queued_at=event.received_at.isoformat(),
        )


@app.post("/v1/ingest/batch", response_model=list[IngestResponse], status_code=status.HTTP_202_ACCEPTED)
async def ingest_batch(
    body: BatchIngestRequest,
    tenant_id: str = Depends(require_tenant),
):
    with tracer.start_as_current_span("ingest_batch"):
        responses = []
        for item in body.items:
            event = IngestEvent(
                event_id=uuid.uuid4(),
                tenant_id=uuid.UUID(tenant_id),
                platform_source=body.platform_source,
                ingest_mode=IngestMode.BATCH,
                received_at=datetime.now(timezone.utc),
                ingestion_source_id=body.ingestion_source_id,
                provider_metadata=body.provider_metadata,
                payload=item,
            )
            await _publish(event)
            responses.append(IngestResponse(
                event_id=str(event.event_id),
                status="queued",
                queued_at=event.received_at.isoformat(),
            ))
        return responses


async def _publish(event: IngestEvent) -> None:
    if js is None:
        raise RuntimeError("NATS JetStream not initialized")
    payload = json.dumps(event.model_dump(mode="json")).encode()
    await js.publish(INGEST_SUBJECT, payload)
    logger.info("Published IngestEvent %s from %s", event.event_id, event.platform_source)
