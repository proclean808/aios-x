import { createClient } from '@supabase/supabase-js';

let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }
  return _supabase;
}

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing_token' });
  }

  const token = header.slice(7);
  const supabase = getSupabase();

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'invalid_token' });
  }

  req.user = user;
  req.supabase = supabase;
  next();
}
