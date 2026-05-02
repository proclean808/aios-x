import { Router } from 'express';
import { engineRateLimit } from '../middleware/ratelimit.js';
import { BotcastIntegration } from '../../engines/botcast_integration.js';
import { EngineRouter } from '../../engines/router.js';

const router = Router();

// GET /api/v1/engines/runs — list engine runs for user
router.get('/runs', async (req, res, next) => {
  try {
    const { project_id, status, limit = 20 } = req.query;
    let q = req.supabase
      .from('engine_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.min(Number(limit), 100));

    if (project_id) q = q.eq('project_id', project_id);
    if (status) q = q.eq('status', status);

    const { data, error } = await q;
    if (error) throw error;
    res.json({ runs: data });
  } catch (err) { next(err); }
});

// GET /api/v1/engines/runs/:runId
router.get('/runs/:runId', async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from('engine_runs')
      .select('*')
      .eq('run_id', req.params.runId)
      .single();

    if (error) return res.status(404).json({ error: 'run_not_found' });
    res.json({ run: data });
  } catch (err) { next(err); }
});

// POST /api/v1/engines/botcast/start — launch BotCast debate
router.post('/botcast/start', engineRateLimit(), async (req, res, next) => {
  try {
    const { topic, persona_ids, project_id, provider_keys } = req.body;

    if (!topic) return res.status(400).json({ error: 'topic required' });
    if (!provider_keys || typeof provider_keys !== 'object') {
      return res.status(400).json({ error: 'provider_keys object required' });
    }

    const engineRouter = new EngineRouter(provider_keys);
    const botcast = new BotcastIntegration(engineRouter, req.supabase, req.user.id);

    // Persist initial run record
    const run = await botcast.createRun({ topic, persona_ids, project_id });

    // Launch async — return run_id immediately for polling
    botcast.executeFull(run.run_id).catch(err => {
      console.error('[engines] botcast async failure:', run.run_id, err.message);
    });

    res.status(202).json({ run_id: run.run_id, status: 'running' });
  } catch (err) { next(err); }
});

// POST /api/v1/engines/botcast/runs/:runId/cancel
router.post('/botcast/runs/:runId/cancel', async (req, res, next) => {
  try {
    const { error } = await req.supabase
      .from('engine_runs')
      .update({ status: 'cancelled' })
      .eq('run_id', req.params.runId)
      .eq('started_by', req.user.id);

    if (error) throw error;
    res.json({ status: 'cancelled' });
  } catch (err) { next(err); }
});

export default router;
