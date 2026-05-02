import { Router } from 'express';

const router = Router();

// GET /api/v1/audit?org_id=&severity=&limit=50
router.get('/', async (req, res, next) => {
  try {
    const { org_id, severity, event_type, limit = 50 } = req.query;
    let q = req.supabase
      .from('audit_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.min(Number(limit), 500));

    if (org_id) q = q.eq('org_id', org_id);
    if (severity) q = q.eq('severity', severity);
    if (event_type) q = q.eq('event_type', event_type);

    const { data, error } = await q;
    if (error) throw error;
    res.json({ events: data, count: data.length });
  } catch (err) { next(err); }
});

export default router;
