import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/ratelimit.js';
import { auditMiddleware } from './middleware/audit.js';
import healthRouter from './routes/health.js';
import orgsRouter from './routes/orgs.js';
import workspacesRouter from './routes/workspaces.js';
import projectsRouter from './routes/projects.js';
import artifactsRouter from './routes/artifacts.js';
import enginesRouter from './routes/engines.js';
import auditRouter from './routes/audit.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security headers ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,  // Vite dev compat
}));

// ── CORS ──────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173',
  'http://localhost:3001',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

// ── Rate limiting (global baseline) ──────────────────────────────────────
app.use(rateLimitMiddleware({ windowMs: 60_000, max: 120 }));

// ── Audit logging (all requests) ─────────────────────────────────────────
app.use(auditMiddleware);

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/api/v1/orgs', authMiddleware, orgsRouter);
app.use('/api/v1/workspaces', authMiddleware, workspacesRouter);
app.use('/api/v1/projects', authMiddleware, projectsRouter);
app.use('/api/v1/artifacts', authMiddleware, artifactsRouter);
app.use('/api/v1/engines', authMiddleware, enginesRouter);
app.use('/api/v1/audit', authMiddleware, auditRouter);

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'not_found', path: req.path });
});

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'internal_error';
  if (status >= 500) console.error('[server]', err);
  res.status(status).json({ error: message });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[server] PlatFormula.ONE API listening on :${PORT}`);
  });
}

export default app;
