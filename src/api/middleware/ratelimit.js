const windows = new Map();

export function rateLimitMiddleware({ windowMs = 60_000, max = 120 } = {}) {
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    let entry = windows.get(key);

    if (!entry || now - entry.start > windowMs) {
      entry = { start: now, count: 0 };
      windows.set(key, entry);
    }

    entry.count++;

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((entry.start + windowMs) / 1000));

    if (entry.count > max) {
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        retry_after_ms: entry.start + windowMs - now,
      });
    }

    next();
  };
}

// Tighter limit for engine launch endpoints
export function engineRateLimit() {
  return rateLimitMiddleware({ windowMs: 60_000, max: 10 });
}
