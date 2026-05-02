import { Router } from 'express';

const router = Router();

// GET /api/v1/orgs — list orgs for current user
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from('orgs')
      .select('*, org_members!inner(role)')
      .eq('org_members.user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ orgs: data });
  } catch (err) { next(err); }
});

// GET /api/v1/orgs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from('orgs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'not_found' });
    res.json({ org: data });
  } catch (err) { next(err); }
});

// POST /api/v1/orgs — create org
router.post('/', async (req, res, next) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'name and slug required' });

    const { data: org, error: orgErr } = await req.supabase
      .from('orgs')
      .insert({ name, slug, owner_id: req.user.id })
      .select()
      .single();

    if (orgErr) throw orgErr;

    // Auto-add creator as owner member
    await req.supabase.from('org_members').insert({
      org_id: org.id, user_id: req.user.id, role: 'owner',
    });

    res.status(201).json({ org });
  } catch (err) { next(err); }
});

export default router;
