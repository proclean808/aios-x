import { Router } from 'express';

const router = Router();

// GET /api/v1/artifacts?run_id=&project_id=&type=
router.get('/', async (req, res, next) => {
  try {
    const { run_id, project_id, artifact_type } = req.query;
    let q = req.supabase.from('artifacts').select('*').order('created_at', { ascending: false });
    if (run_id) q = q.eq('run_id', run_id);
    if (project_id) q = q.eq('project_id', project_id);
    if (artifact_type) q = q.eq('artifact_type', artifact_type);

    const { data, error } = await q;
    if (error) throw error;
    res.json({ artifacts: data });
  } catch (err) { next(err); }
});

// GET /api/v1/artifacts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from('artifacts').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'not_found' });
    res.json({ artifact: data });
  } catch (err) { next(err); }
});

// POST /api/v1/artifacts — save engine output
router.post('/', async (req, res, next) => {
  try {
    const {
      run_id, project_id, artifact_type, format,
      payload, payload_text, topic, persona_ids, stage_count,
    } = req.body;

    if (!run_id || !artifact_type || !format) {
      return res.status(400).json({ error: 'run_id, artifact_type, format required' });
    }

    const byte_size = payload ? JSON.stringify(payload).length
      : payload_text ? payload_text.length : 0;

    const { data, error } = await req.supabase
      .from('artifacts')
      .insert({
        run_id, project_id, artifact_type, format,
        payload, payload_text, topic, persona_ids, stage_count,
        byte_size, created_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ artifact: data });
  } catch (err) { next(err); }
});

export default router;
