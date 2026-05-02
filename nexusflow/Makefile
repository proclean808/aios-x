# NexusFlow development Makefile

.PHONY: help dev-up dev-down dev-logs install-models install-gateway install-sanitizer install-router test test-unit test-contract test-sanitizer lint fmt migrate

PYTHON := python3
PYTEST := pytest
DOCKER := docker compose -f infra/docker-compose.yml

help:
	@echo "NexusFlow development targets"
	@echo ""
	@echo "  dev-up             Start local infrastructure (Postgres, NATS, MinIO, Qdrant, gateway)"
	@echo "  dev-down           Stop and remove local infrastructure containers"
	@echo "  dev-logs           Tail logs from all local services"
	@echo ""
	@echo "  install-models     Install nexusflow-core-models in editable mode"
	@echo "  install-gateway    Install nexusflow-gateway in editable mode"
	@echo "  install-sanitizer  Install nexusflow-sanitizer in editable mode"
	@echo "  install-router     Install nexusflow-router in editable mode"
	@echo "  install-all        Install all service packages in editable mode"
	@echo ""
	@echo "  migrate            Run Postgres migrations against local DATABASE_URL"
	@echo ""
	@echo "  test               Run all tests"
	@echo "  test-unit          Run sanitizer and router unit tests"
	@echo "  test-contract      Run contract/schema tests"
	@echo "  lint               Run ruff linter"
	@echo "  fmt                Run ruff formatter"

# ── Infrastructure ───────────────────────────────────────────────────────────

dev-up:
	cp -n infra/.env.example infra/.env 2>/dev/null || true
	$(DOCKER) up -d --build

dev-down:
	$(DOCKER) down -v

dev-logs:
	$(DOCKER) logs -f

# ── Install ──────────────────────────────────────────────────────────────────

install-models:
	$(PYTHON) -m pip install -e libs/core-models/python

install-gateway: install-models
	$(PYTHON) -m pip install -e services/gateway

install-sanitizer: install-models
	$(PYTHON) -m pip install -e services/sanitizer

install-router: install-models
	$(PYTHON) -m pip install -e services/router

install-all: install-models install-gateway install-sanitizer install-router

# ── Migrations ───────────────────────────────────────────────────────────────

migrate:
	@if [ -z "$$DATABASE_URL" ]; then \
		export DATABASE_URL=postgresql://nexusflow:nexusflow_dev@localhost:5432/nexusflow; \
	fi; \
	psql $$DATABASE_URL -f infra/migrations/001_initial_schema.sql

# ── Tests ────────────────────────────────────────────────────────────────────

test: install-all
	$(PYTEST) tests/ services/sanitizer/tests/ services/router/tests/ -v

test-unit:
	$(PYTEST) services/sanitizer/tests/ -v

test-contract:
	$(PYTEST) tests/contract/ -v

# ── Lint / format ────────────────────────────────────────────────────────────

lint:
	ruff check libs/ services/ tests/

fmt:
	ruff format libs/ services/ tests/
