import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

router.get('/', async (req, res) => {
  const checks = { api: 'ok', db: 'unknown', timestamp: new Date().toISOString() };

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
    );
    const { error } = await supabase.from('orgs').select('id').limit(1);
    checks.db = error ? 'degraded' : 'ok';
  } catch {
    checks.db = 'error';
  }

  const allOk = Object.values(checks).every(v => v === 'ok' || typeof v !== 'string' || v.includes('T'));
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    checks,
    version: process.env.npm_package_version || '1.0.0',
  });
});

export default router;
