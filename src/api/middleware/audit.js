export function auditMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.user?.id || null;
    const entry = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration,
      user_id: userId,
      ip: req.ip,
    };

    if (res.statusCode >= 400) {
      console.warn('[audit]', JSON.stringify(entry));
    } else if (process.env.NODE_ENV !== 'test') {
      console.info('[audit]', JSON.stringify(entry));
    }

    // Non-blocking async write to DB for sensitive routes
    if (req.supabase && userId && isSensitiveRoute(req.path)) {
      req.supabase.from('audit_events').insert({
        event_type: `api.${req.method.toLowerCase()}.${routeLabel(req.path)}`,
        severity: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warning' : 'info',
        actor_id: userId,
        payload: { method: req.method, path: req.path, status: res.statusCode, duration_ms: duration },
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || null,
      }).then().catch(() => {});  // fire-and-forget, never block response
    }
  });

  next();
}

function isSensitiveRoute(path) {
  return /\/(engines|artifacts|orgs)/.test(path);
}

function routeLabel(path) {
  return path.replace(/^\/api\/v\d+\//, '').replace(/\/[0-9a-f-]{36}/g, '/:id').replace(/\//g, '.');
}
