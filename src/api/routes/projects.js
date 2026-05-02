import { Router } from 'express';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { workspace_id, engine_type } = req.query;
    let q = req.supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (workspace_id) q = q.eq('workspace_id', workspace_id);
    if (engine_type) q = q.eq('engine_type', engine_type);

    const { data, error } = await q;
    if (error) throw error;
    res.json({ projects: data });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from('projects').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'not_found' });
    res.json({ project: data });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { workspace_id, name, engine_type = 'botcast', config = {} } = req.body;
    if (!workspace_id || !name) {
      return res.status(400).json({ error: 'workspace_id and name required' });
    }

    const { data, error } = await req.supabase
      .from('projects')
      .insert({ workspace_id, name, engine_type, config, created_by: req.user.id })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ project: data });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'config', 'status'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const { data, error } = await req.supabase
      .from('projects').update(updates).eq('id', req.params.id).select().single();

    if (error) throw error;
    res.json({ project: data });
  } catch (err) { next(err); }
});

export default router;
