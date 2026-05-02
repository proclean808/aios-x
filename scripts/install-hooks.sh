#!/usr/bin/env bash
# BotCast Arena / PlatFormula.ONE — Developer Security Hook Installer
# Run once: bash scripts/install-hooks.sh
set -euo pipefail

BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
RESET="\033[0m"

log()   { echo -e "${BOLD}[install-hooks]${RESET} $1"; }
ok()    { echo -e "${GREEN}✓${RESET} $1"; }
warn()  { echo -e "${YELLOW}⚠${RESET} $1"; }
fail()  { echo -e "${RED}✗${RESET} $1"; exit 1; }

log "Installing PlatFormula.ONE developer security hooks..."

# ── 1. Verify git repo ────────────────────────────────────────────────────
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  fail "Not inside a git repository. Run from project root."
fi
ok "Git repository detected"

# ── 2. Install gitleaks ───────────────────────────────────────────────────
if ! command -v gitleaks &> /dev/null; then
  warn "gitleaks not found. Installing via package manager..."
  if command -v brew &> /dev/null; then
    brew install gitleaks && ok "gitleaks installed via Homebrew"
  elif command -v apt-get &> /dev/null; then
    GITLEAKS_VERSION="8.18.2"
    curl -sSLf "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" | tar -xz -C /tmp
    sudo mv /tmp/gitleaks /usr/local/bin/gitleaks && ok "gitleaks installed"
  else
    warn "Cannot auto-install gitleaks. Install manually: https://github.com/gitleaks/gitleaks"
  fi
else
  ok "gitleaks $(gitleaks version) already installed"
fi

# ── 3. Install pre-commit framework ──────────────────────────────────────
if ! command -v pre-commit &> /dev/null; then
  warn "pre-commit not found."
  if command -v pip3 &> /dev/null; then
    pip3 install pre-commit && ok "pre-commit installed"
  elif command -v brew &> /dev/null; then
    brew install pre-commit && ok "pre-commit installed via Homebrew"
  else
    warn "Install pre-commit manually: https://pre-commit.com/#install"
  fi
else
  ok "pre-commit $(pre-commit --version) already installed"
fi

# ── 4. Install pre-commit hooks ───────────────────────────────────────────
if command -v pre-commit &> /dev/null && [ -f ".pre-commit-config.yaml" ]; then
  pre-commit install --install-hooks && ok "Pre-commit hooks installed"
  pre-commit install --hook-type commit-msg && ok "Commit-msg hooks installed"
else
  warn "Skipping pre-commit hook install — tool or config not found"
fi

# ── 5. Write manual pre-commit hook (fallback) ───────────────────────────
HOOK_PATH=".git/hooks/pre-commit"
cat > "$HOOK_PATH" << 'HOOK'
#!/usr/bin/env bash
# PlatFormula.ONE — Pre-commit secret scanner
set -e
if command -v gitleaks &> /dev/null; then
  echo "[pre-commit] Running gitleaks scan..."
  if ! gitleaks protect --staged --redact -v; then
    echo ""
    echo "BLOCKED: gitleaks detected potential secrets in staged files."
    echo "Review the output above. If this is a false positive, update .gitleaks.toml."
    echo "Never commit credentials. Use .env.local and secret managers."
    exit 1
  fi
  echo "[pre-commit] No secrets detected. Proceeding."
fi
HOOK
chmod +x "$HOOK_PATH"
ok "Fallback pre-commit hook installed at .git/hooks/pre-commit"

# ── 6. Verify .env is ignored ─────────────────────────────────────────────
if git check-ignore -q .env 2>/dev/null; then
  ok ".env is properly gitignored"
else
  warn ".env may NOT be gitignored — verify .gitignore contains .env entries"
fi

# ── 7. Run initial scan on current working tree ───────────────────────────
log "Running initial gitleaks scan on working tree..."
if command -v gitleaks &> /dev/null; then
  if gitleaks detect --source . --config .gitleaks.toml --no-git -v 2>/dev/null; then
    ok "Working tree scan: no secrets detected"
  else
    warn "Working tree scan: potential secrets found — review above output"
    warn "Run: gitleaks detect --source . -v for details"
  fi
fi

echo ""
log "Security hooks installation complete."
echo ""
echo "  Next steps:"
echo "    1. Copy .env.example → .env.local and fill in your values"
echo "    2. Never commit .env.local or any real credentials"
echo "    3. Run: gitleaks detect --source . -v  (full scan)"
echo "    4. Run: gitleaks detect --source . --log-opts='--all' -v  (history scan)"
echo ""
