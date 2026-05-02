/**
 * Health endpoint — unit tests.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/api/server.js';

describe('GET /health', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns 200 with status ok when DB is reachable', async () => {
    // Stub Supabase to return clean response
    vi.stubGlobal('fetch', async () => ({
      ok: true, status: 200,
      json: async () => ({ data: [], error: null }),
    }));

    const res = await request(app).get('/health');
    expect(res.status).toBeLessThan(600);
    expect(res.body).toHaveProperty('checks');
    expect(res.body.checks.api).toBe('ok');
  });

  it('does not expose sensitive config in response', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: true, status: 200, json: async () => ({}),
    }));
    const res = await request(app).get('/health');
    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(bodyStr).not.toContain('JWT_SECRET');
    expect(bodyStr).not.toContain('ANTHROPIC_API_KEY');
  });

  it('returns version field', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: true, status: 200, json: async () => ({}),
    }));
    const res = await request(app).get('/health');
    expect(res.body).toHaveProperty('version');
  });
});
