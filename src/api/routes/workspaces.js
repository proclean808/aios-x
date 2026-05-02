import { Router } from 'express';

const router = Router();

// GET /api/v1/workspaces?org_id=
router.get('/', async (req, res, next) => {
  try {
    const { org_id } = req.query;
    let q = req.supabase.from('workspaces').select('*').order('created_at', { ascending: false });
    if (org_id) q = q.eq('org_id', org_id);

    const { data, error } = await q;
    if (error) throw error;
    res.json({ workspaces: data });
  } catch (err) { next(err); }
});

// POST /api/v1/workspaces
router.post('/', async (req, res, next) => {
  try {
    const { org_id, name, slug, description } = req.body;
    if (!org_id || !name || !slug) {
      return res.status(400).json({ error: 'org_id, name, and slug required' });
    }

    const { data, error } = await req.supabase
      .from('workspaces')
      .insert({ org_id, name, slug, description, created_by: req.user.id })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ workspace: data });
  } catch (err) { next(err); }
});

export default router;
