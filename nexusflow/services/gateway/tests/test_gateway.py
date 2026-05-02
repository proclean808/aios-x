"""
Gateway smoke tests — validate request/response shapes without a live NATS connection.
"""

import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    with patch("nats.connect", new_callable=AsyncMock):
        from nexusflow.services.gateway.src.main import app
        with TestClient(app) as c:
            yield c


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_ingest_webhook_missing_tenant(client):
    response = client.post(
        "/v1/ingest/webhook",
        json={
            "platform_source": "anthropic_claude",
            "payload": {"messages": []}
        }
    )
    assert response.status_code == 422


def test_ingest_webhook_accepted(client):
    with patch("nexusflow.services.gateway.src.main.js") as mock_js:
        mock_js.publish = AsyncMock()
        response = client.post(
            "/v1/ingest/webhook",
            headers={"X-Tenant-Id": "00000000-0000-0000-0000-000000000001"},
            json={
                "platform_source": "anthropic_claude",
                "payload": {"messages": [{"role": "user", "content": "hello"}]}
            }
        )
    assert response.status_code == 202
    body = response.json()
    assert body["status"] == "queued"
    assert "event_id" in body
