const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const db = require('./db');
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// In-memory stores (demo)
// users: email -> user
const userStore = new Map();
// sessions: sessionId -> { id, userEmail, createdAt, ip }
const sessionStore = new Map();
// feedback list
const feedbackStore = [];
// tracking events list
const eventStore = [];
// invoices list
const invoiceStore = [];

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createTokens(user) {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role || 'user', type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL_SECONDS }
  );
  const refreshToken = jwt.sign(
    { sub: user.id, email: user.email, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL_SECONDS }
  );
  return { accessToken, refreshToken };
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing Authorization header' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'access') throw new Error('Invalid token type');
    const user = [...userStore.values()].find(u => u.id === decoded.sub);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  next();
}

// Basic middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
// CORS
const corsOptions = {
  origin: true,
  credentials: false,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Seed an admin user if not present
(function seedAdmin() {
  const adminEmail = 'admin@maijjd.com';
  if (!userStore.has(adminEmail)) {
    const adminUser = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: 'Maijjd Admin',
      email: adminEmail,
      role: 'admin',
      passwordHash: hashPassword('Admin123!'),
    };
    userStore.set(adminEmail, adminUser);
  }
})();

// Root endpoint for Railway health check
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Maijjd Backend is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Simple health check for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Maijjd Backend is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Maijjd API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Basic API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Maijjd Backend API',
    version: '2.0.0',
    status: 'running',
    endpoints: [
      '/',
      '/health',
      '/api/health',
      '/api'
    ]
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Maijjd Backend API',
    version: '2.0.0',
    description: 'Backend API for Maijjd Platform',
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// --- Minimal data endpoints to satisfy frontend ---
// Software catalog (placeholder data)
app.get('/api/software', async (req, res) => {
  const pool = db.getPool && db.getPool();
  if (pool) {
    const rows = (await db.query('select * from software order by id asc')).rows;
    const transformed = rows.map(r => ({
      ...r,
      name: typeof r.name === 'string' ? r.name.replace(/AI/gi, 'MNJD, MJ, and Team') : r.name,
      description: typeof r.description === 'string' ? r.description.replace(/AI/gi, 'MNJD, MJ, and Team') : r.description
    }));
    return res.status(200).json({ data: transformed });
  }
  // fallback to static list
  const items = [
    { id: 'crm-pro', name: 'Maijjd CRM Pro', category: 'Business', description: 'Customer relationship management.', standard_price: 59, premium_price: 199 },
    { id: 'analytics-suite', name: 'Maijjd Analytics Suite', category: 'Analytics', description: 'Analytics & dashboards.', standard_price: 79, premium_price: 399 },
    { id: 'security-shield', name: 'Maijjd Security Shield', category: 'Security', description: 'Security & compliance.', standard_price: 299, premium_price: 599 },
    { id: 'cloud-manager', name: 'Maijjd Cloud Manager', category: 'Cloud', description: 'Cloud resources manager.', standard_price: 119, premium_price: 349 },
    { id: 'dev-studio', name: 'Maijjd Development Studio', category: 'Development', description: 'Dev tools & pipelines.', standard_price: 59, premium_price: 249 },
    { id: 'web-builder', name: 'Maijjd Web Builder Pro', category: 'Web', description: 'Web site builder.', standard_price: 49, premium_price: 179 },
    { id: 'infra-manager', name: 'Maijjd Infrastructure Manager', category: 'Infrastructure', description: 'Infra orchestration.', standard_price: 199, premium_price: 429 },
    { id: 'marketing-auto', name: 'Maijjd Marketing Automation', category: 'Marketing & Automation', description: 'Automation campaigns.', standard_price: 49, premium_price: 159 },
    { id: 'pm-pro', name: 'Maijjd Project Management Pro', category: 'Project Management', description: 'Project planning.', standard_price: 25, premium_price: 89 },
    { id: 'ds-studio', name: 'Maijjd Data Science Studio', category: 'Data Science & ML', description: 'ML & data platform.', standard_price: 199, premium_price: 599 },
    { id: 'cs-ai', name: 'Maijjd Customer Support AI', category: 'Customer Support', description: 'AI helpdesk.', standard_price: 35, premium_price: 129 },
    { id: 'fin-analytics', name: 'Maijjd Financial Analytics', category: 'Financial Technology', description: 'FinAnalytics.', standard_price: 119, premium_price: 349 },
    { id: 'health-analytics', name: 'Maijjd Healthcare Analytics', category: 'Healthcare Technology', description: 'Health analytics.', standard_price: 199, premium_price: 499 },
    { id: 'edu-platform', name: 'Maijjd Education Platform', category: 'Education Technology', description: 'Education platform.', standard_price: 25, premium_price: 79 },
  ];
  // replace occurrences of "AI" in description with requested phrase
  const transformed = items.map(it => ({
    ...it,
    name: typeof it.name === 'string' ? it.name.replace(/AI/gi, 'MNJD, MJ, and Team') : it.name,
    description: typeof it.description === 'string' ? it.description.replace(/AI/gi, 'MNJD, MJ, and Team') : it.description
  }));
  res.status(200).json({ data: transformed });
});

// --- Authentication Routes ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    if (userStore.has(normalizedEmail)) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    // Check DB for existing email if configured
    try {
      const pool = db.getPool && db.getPool();
      if (pool) {
        const exists = (await db.query('select 1 from users where email=$1 limit 1', [normalizedEmail])).rows[0];
        if (exists) return res.status(409).json({ message: 'Email already registered' });
      }
    } catch (_) {}
    const user = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: String(name).trim(),
      email: normalizedEmail,
      role: 'user',
      passwordHash: hashPassword(password)
    };
    userStore.set(normalizedEmail, user);
    // Persist to DB when configured
    try {
      const pool = db.getPool && db.getPool();
      if (pool) {
        await db.query(
          'insert into users(id,name,email,role,password_hash) values($1,$2,$3,$4,$5) on conflict (email) do nothing',
          [user.id, user.name, user.email, user.role, user.passwordHash]
        );
      }
    } catch (_) {}
    const authentication = createTokens(user);
    return res.status(201).json({
      message: 'Registered',
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, authentication }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    let user = userStore.get(normalizedEmail);
    if (!user) {
      try {
        const pool = db.getPool && db.getPool();
        if (pool) {
          const row = (await db.query('select id,name,email,role,password_hash from users where email=$1 limit 1', [normalizedEmail])).rows[0];
          if (row) {
            user = { id: row.id, name: row.name, email: row.email, role: row.role || 'user', passwordHash: row.password_hash };
            userStore.set(normalizedEmail, user);
          }
        }
      } catch (_) {}
    }
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const authentication = createTokens(user);
    // record session
    const sid = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    sessionStore.set(sid, { id: sid, userEmail: user.email, createdAt: new Date().toISOString(), ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress });
    // persist session when DB is configured
    (async () => {
      try {
        const pool = db.getPool && db.getPool();
        if (pool) {
          await db.query('insert into sessions(id,user_email,ip) values($1,$2,$3)', [sid, user.email, req.headers['x-forwarded-for'] || req.socket.remoteAddress || null]);
        }
      } catch (_) {}
    })();
    return res.status(200).json({
      message: 'Logged in',
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, authentication }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/api/auth/profile', authMiddleware, (req, res) => {
  const user = req.user;
  return res.status(200).json({ data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } } });
});

app.post('/api/auth/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken is required' });
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (decoded.type !== 'refresh') throw new Error('Invalid token type');
    const user = [...userStore.values()].find(u => u.id === decoded.sub);
    if (!user) return res.status(401).json({ message: 'User not found' });
    const authentication = createTokens(user);
    return res.status(200).json({ message: 'Refreshed', data: { authentication } });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Password reset (stubs)
app.post('/api/auth/forgot', (req, res) => {
  return res.status(200).json({ message: 'If this email exists, a reset link was sent.' });
});
app.post('/api/auth/reset', (req, res) => {
  return res.status(200).json({ message: 'Password reset successful.' });
});

// Logout endpoint: removes current session from memory and DB when possible
app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  const { sessionId } = req.body || {};
  try {
    if (sessionId) {
      sessionStore.delete(sessionId);
      try { const pool = db.getPool && db.getPool(); if (pool) await db.query('delete from sessions where id=$1', [sessionId]); } catch (_) {}
    }
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ message: 'Logout failed' });
  }
});

// Public feedback submission
app.post('/api/feedback', (req, res) => {
  const { email, message, category } = req.body || {};
  if (!message) return res.status(400).json({ message: 'message is required' });
  const item = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), email: email||null, category: category||'general', message: String(message), createdAt: new Date().toISOString(), status: 'new' };
  feedbackStore.push(item);
  // persist when DB is configured
  (async () => {
    try {
      const pool = db.getPool && db.getPool();
      if (pool) {
        await db.query('insert into feedback(id,email,category,message,status) values($1,$2,$3,$4,$5)', [item.id, item.email, item.category, item.message, item.status]);
      }
    } catch (_) {}
  })();
  res.status(201).json({ data: item });
});

// Public tracking endpoint
app.post('/api/track', (req, res) => {
  const { event, meta } = req.body || {};
  if (!event) return res.status(400).json({ message: 'event is required' });
  const item = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), event: String(event), meta: meta||{}, t: Date.now() };
  eventStore.push(item);
  // persist when DB is configured
  (async () => {
    try {
      const pool = db.getPool && db.getPool();
      if (pool) {
        await db.query('insert into events(id,event,meta,t) values($1,$2,$3,$4)', [item.id, item.event, item.meta, item.t]);
      }
    } catch (_) {}
  })();
  res.status(201).json({ data: item });
});

// --- Admin endpoints ---
app.get('/api/admin/metrics', authMiddleware, requireAdmin, async (req, res) => {
  const pool = db.getPool && db.getPool();
  try {
    if (pool) {
      const activeSessions = Number((await db.query('select count(*) from sessions')).rows[0].count);
      const pv = (await db.query("select to_char(to_timestamp(t/1000),'YYYY-MM-DD') d, count(*) c from events where event='page_view' and to_timestamp(t/1000) >= now() - interval '30 days' group by d order by d asc")).rows;
      const su = (await db.query("select to_char(to_timestamp(t/1000),'YYYY-MM-DD') d, count(*) c from events where event='signup' and to_timestamp(t/1000) >= now() - interval '30 days' group by d order by d asc")).rows;
      const rv = (await db.query("select to_char(created_at,'YYYY-MM-DD') d, coalesce(sum(amount),0) s from invoices where status='paid' and created_at >= now() - interval '30 days' group by d order by d asc")).rows;
      const pageViews30d = pv.reduce((a,b)=>a+Number(b.c),0);
      const signups30d = su.reduce((a,b)=>a+Number(b.c),0);
      const revenue30d = rv.reduce((a,b)=>a+Number(b.s),0);
      return res.json({ activeSessions, pageViews30d, signups30d, revenue30d, dailyPageViews: pv, dailySignups: su, dailyRevenue: rv });
    }
    const activeSessions = sessionStore.size;
    const rangeMs = 30*24*3600*1000;
    const toKey = (ts)=> new Date(ts).toISOString().slice(0,10);
    const pvMap = {}; const suMap = {}; const rvMap = {};
    eventStore.filter(e => (Date.now() - e.t) <= rangeMs).forEach(e=>{
      const k=toKey(e.t); if(e.event==='page_view') pvMap[k]=(pvMap[k]||0)+1; if(e.event==='signup') suMap[k]=(suMap[k]||0)+1;
    });
    invoiceStore.filter(i=>i.status==='paid' && (Date.now()-new Date(i.createdAt).getTime())<=rangeMs).forEach(i=>{ const k=toKey(i.createdAt); rvMap[k]=(rvMap[k]||0)+(i.amount||0); });
    const pv = Object.keys(pvMap).sort().map(d=>({ d, c: pvMap[d] }));
    const su = Object.keys(suMap).sort().map(d=>({ d, c: suMap[d] }));
    const rv = Object.keys(rvMap).sort().map(d=>({ d, s: rvMap[d] }));
    const pageViews30d = pv.reduce((a,b)=>a+Number(b.c),0);
    const signups30d = su.reduce((a,b)=>a+Number(b.c),0);
    const revenue30d = rv.reduce((a,b)=>a+Number(b.s),0);
    return res.json({ activeSessions, pageViews30d, signups30d, revenue30d, dailyPageViews: pv, dailySignups: su, dailyRevenue: rv });
  } catch (e) {
    return res.status(500).json({ message: 'Metrics failed' });
  }
});

app.get('/api/admin/sessions', authMiddleware, requireAdmin, async (req, res) => {
  const { email = '', page = '1', pageSize = '20', from = '', to = '', sortBy = 'created_at', sortDir = 'desc' } = req.query || {};
  const p = Math.max(parseInt(page)||1, 1);
  const ps = Math.max(Math.min(parseInt(pageSize)||20, 200), 1);
  const pool = db.getPool && db.getPool();
  try {
    if (pool) {
      const where = [];
      const vals = [];
      if (email) { vals.push(`%${email}%`); where.push(`user_email ilike $${vals.length}`); }
      if (from) { vals.push(new Date(from)); where.push(`created_at >= $${vals.length}`); }
      if (to) { vals.push(new Date(to)); where.push(`created_at <= $${vals.length}`); }
      const whereSql = where.length? `where ${where.join(' and ')}` : '';
      const total = (await db.query(`select count(*) from sessions ${whereSql}`, vals)).rows[0].count;
      const orderCol = ['user_email','created_at','ip'].includes(String(sortBy).toLowerCase()) ? sortBy : 'created_at';
      const orderDir = String(sortDir).toLowerCase() === 'asc' ? 'asc' : 'desc';
      vals.push(ps, (p-1)*ps);
      const rows = (await db.query(`select * from sessions ${whereSql} order by ${orderCol} ${orderDir} limit $${vals.length-1} offset $${vals.length}`, vals)).rows;
      return res.json({ data: rows, paging: { total: Number(total), page: p, pageSize: ps } });
    }
    // in-memory fallback
    let rows = Array.from(sessionStore.values());
    if (email) rows = rows.filter(r => (r.userEmail||'').includes(email));
    if (from) rows = rows.filter(r => new Date(r.createdAt) >= new Date(from));
    if (to) rows = rows.filter(r => new Date(r.createdAt) <= new Date(to));
    if (sortBy) {
      rows.sort((a,b)=>{
        const dir = (String(sortDir).toLowerCase()==='asc')?1:-1;
        const av = a[sortBy]||''; const bv = b[sortBy]||'';
        return av>bv?dir:(av<bv?-dir:0);
      });
    }
    const total = rows.length; const start = (p-1)*ps; rows = rows.slice(start, start+ps);
    return res.json({ data: rows, paging: { total, page: p, pageSize: ps } });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list sessions' });
  }
});

// Revoke a session
app.delete('/api/admin/sessions/:id', authMiddleware, requireAdmin, (req, res) => {
  const { id } = req.params;
  const existed = sessionStore.delete(id);
  return res.json({ success: existed });
});

// Bulk revoke sessions
app.post('/api/admin/sessions/bulk-delete', authMiddleware, requireAdmin, async (req, res) => {
  const { ids = [], allFiltered = false, filters = {} } = req.body || {};
  const pool = db.getPool && db.getPool();
  try {
    if (pool) {
      if (allFiltered) {
        const where=[]; const vals=[];
        if (filters.email) { vals.push(`%${filters.email}%`); where.push(`user_email ilike $${vals.length}`); }
        if (filters.from) { vals.push(new Date(filters.from)); where.push(`created_at >= $${vals.length}`); }
        if (filters.to) { vals.push(new Date(filters.to)); where.push(`created_at <= $${vals.length}`); }
        const whereSql = where.length? `where ${where.join(' and ')}`:'';
        const result = await db.query(`delete from sessions ${whereSql}`, vals);
        return res.json({ success: true, count: result.rowCount||0 });
      } else {
        for (const id of ids) { await db.query('delete from sessions where id = $1', [id]); }
        return res.json({ success: true, count: ids.length });
      }
    }
    let rows = Array.from(sessionStore.values());
    if (allFiltered) {
      rows.forEach(r => {
        const match = (!filters.email || (r.userEmail||'').includes(filters.email)) && (!filters.from || new Date(r.createdAt)>=new Date(filters.from)) && (!filters.to || new Date(r.createdAt)<=new Date(filters.to));
        if (match) sessionStore.delete(r.id);
      });
      return res.json({ success: true, count: 0 });
    }
    let count = 0; ids.forEach(id => { if (sessionStore.delete(id)) count++; });
    return res.json({ success: true, count });
  } catch (e) { return res.status(500).json({ message: 'Bulk delete failed' }); }
});

app.get('/api/admin/feedback', authMiddleware, requireAdmin, async (req, res) => {
  const { status = '', category = '', email = '', from = '', to = '', page='1', pageSize='20', sortBy='created_at', sortDir='desc' } = req.query || {};
  const p = Math.max(parseInt(page)||1, 1);
  const ps = Math.max(Math.min(parseInt(pageSize)||20, 200), 1);
  const pool = db.getPool && db.getPool();
  try {
    if (pool) {
      const where = []; const vals = [];
      if (status) { vals.push(status); where.push(`status = $${vals.length}`); }
      if (category) { vals.push(category); where.push(`category = $${vals.length}`); }
      if (email) { vals.push(`%${email}%`); where.push(`email ilike $${vals.length}`); }
      if (from) { vals.push(new Date(from)); where.push(`created_at >= $${vals.length}`); }
      if (to) { vals.push(new Date(to)); where.push(`created_at <= $${vals.length}`); }
      const whereSql = where.length? `where ${where.join(' and ')}` : '';
      const total = (await db.query(`select count(*) from feedback ${whereSql}`, vals)).rows[0].count;
      const orderCol = ['email','category','status','created_at'].includes(String(sortBy).toLowerCase()) ? sortBy : 'created_at';
      const orderDir = String(sortDir).toLowerCase() === 'asc' ? 'asc' : 'desc';
      vals.push(ps, (p-1)*ps);
      const rows = (await db.query(`select * from feedback ${whereSql} order by ${orderCol} ${orderDir} limit $${vals.length-1} offset $${vals.length}`, vals)).rows;
      return res.json({ data: rows, paging: { total: Number(total), page: p, pageSize: ps } });
    }
    let rows = feedbackStore.slice();
    if (status) rows = rows.filter(r => r.status===status);
    if (category) rows = rows.filter(r => r.category===category);
    if (email) rows = rows.filter(r => (r.email||'').includes(email));
    if (from) rows = rows.filter(r => new Date(r.createdAt) >= new Date(from));
    if (to) rows = rows.filter(r => new Date(r.createdAt) <= new Date(to));
    if (sortBy) {
      rows.sort((a,b)=>{ const dir = (String(sortDir).toLowerCase()==='asc')?1:-1; const av=a[sortBy]||''; const bv=b[sortBy]||''; return av>bv?dir:(av<bv?-dir:0); });
    }
    const total = rows.length; const start = (p-1)*ps; rows = rows.slice(start, start+ps);
    return res.json({ data: rows, paging: { total, page: p, pageSize: ps } });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list feedback' });
  }
});

// Update feedback status
app.patch('/api/admin/feedback/:id', authMiddleware, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status = 'resolved' } = req.body || {};
  const idx = feedbackStore.findIndex(f => f.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Feedback not found' });
  feedbackStore[idx].status = status;
  return res.json({ data: feedbackStore[idx] });
});

// Delete feedback
app.delete('/api/admin/feedback/:id', authMiddleware, requireAdmin, (req, res) => {
  const { id } = req.params;
  const before = feedbackStore.length;
  const remaining = feedbackStore.filter(f => f.id !== id);
  feedbackStore.length = 0;
  feedbackStore.push(...remaining);
  return res.json({ success: remaining.length !== before });
});

// Bulk feedback actions
app.post('/api/admin/feedback/bulk', authMiddleware, requireAdmin, async (req, res) => {
  const { ids = [], action = 'resolve', allFiltered = false, filters = {} } = req.body || {};
  const pool = db.getPool && db.getPool();
  try {
    if (pool) {
      if (allFiltered) {
        const where=[]; const vals=[];
        if (filters.status) { vals.push(filters.status); where.push(`status=$${vals.length}`); }
        if (filters.category) { vals.push(filters.category); where.push(`category=$${vals.length}`); }
        if (filters.email) { vals.push(`%${filters.email}%`); where.push(`email ilike $${vals.length}`); }
        if (filters.from) { vals.push(new Date(filters.from)); where.push(`created_at >= $${vals.length}`); }
        if (filters.to) { vals.push(new Date(filters.to)); where.push(`created_at <= $${vals.length}`); }
        const whereSql = where.length? `where ${where.join(' and ')}`:'';
        if (action==='resolve') {
          const result = await db.query(`update feedback set status='resolved' ${whereSql}`, vals);
          return res.json({ success: true, count: result.rowCount||0 });
        } else if (action==='delete') {
          const result = await db.query(`delete from feedback ${whereSql}`, vals);
          return res.json({ success: true, count: result.rowCount||0 });
        }
      } else {
        if (action === 'resolve') { for (const id of ids) await db.query('update feedback set status=$1 where id=$2', ['resolved', id]); }
        else if (action === 'delete') { for (const id of ids) await db.query('delete from feedback where id=$1', [id]); }
        return res.json({ success: true, count: ids.length });
      }
    }
    let rows = feedbackStore.slice();
    if (allFiltered) {
      rows.forEach(f => {
        const match = (!filters.status || f.status===filters.status) && (!filters.category || f.category===filters.category) && (!filters.email || (f.email||'').includes(filters.email)) && (!filters.from || new Date(f.createdAt)>=new Date(filters.from)) && (!filters.to || new Date(f.createdAt)<=new Date(filters.to));
        if (match) {
          if (action==='resolve') f.status='resolved';
        }
      });
      if (action==='delete') {
        const remaining = rows.filter(f => {
          const match = (!filters.status || f.status===filters.status) && (!filters.category || f.category===filters.category) && (!filters.email || (f.email||'').includes(filters.email)) && (!filters.from || new Date(f.createdAt)>=new Date(filters.from)) && (!filters.to || new Date(f.createdAt)<=new Date(filters.to));
          return !match;
        });
        feedbackStore.length = 0; feedbackStore.push(...remaining);
      }
      return res.json({ success: true, count: 0 });
    }
    if (action === 'resolve') { ids.forEach(id => { const i = feedbackStore.findIndex(f=>f.id===id); if (i>-1) feedbackStore[i].status='resolved'; }); }
    else if (action === 'delete') { const remaining = feedbackStore.filter(f => !ids.includes(f.id)); feedbackStore.length = 0; feedbackStore.push(...remaining); }
    return res.json({ success: true, count: ids.length });
  } catch (e) { return res.status(500).json({ message: 'Bulk feedback action failed' }); }
});

app.get('/api/admin/invoices', authMiddleware, requireAdmin, async (req, res) => {
  const { status = '', minAmount = '', maxAmount = '', from = '', to = '', page='1', pageSize='20', sortBy='created_at', sortDir='desc' } = req.query || {};
  const p = Math.max(parseInt(page)||1, 1);
  const ps = Math.max(Math.min(parseInt(pageSize)||20, 200), 1);
  const pool = db.getPool && db.getPool();
  try {
    if (pool) {
      const where = []; const vals = [];
      if (status) { vals.push(status); where.push(`status = $${vals.length}`); }
      if (minAmount) { vals.push(Number(minAmount)||0); where.push(`amount >= $${vals.length}`); }
      if (maxAmount) { vals.push(Number(maxAmount)||0); where.push(`amount <= $${vals.length}`); }
      if (from) { vals.push(new Date(from)); where.push(`created_at >= $${vals.length}`); }
      if (to) { vals.push(new Date(to)); where.push(`created_at <= $${vals.length}`); }
      const whereSql = where.length? `where ${where.join(' and ')}` : '';
      const total = (await db.query(`select count(*) from invoices ${whereSql}`, vals)).rows[0].count;
      const orderCol = ['status','amount','created_at'].includes(String(sortBy).toLowerCase()) ? sortBy : 'created_at';
      const orderDir = String(sortDir).toLowerCase() === 'asc' ? 'asc' : 'desc';
      vals.push(ps, (p-1)*ps);
      const rows = (await db.query(`select * from invoices ${whereSql} order by ${orderCol} ${orderDir} limit $${vals.length-1} offset $${vals.length}`, vals)).rows;
      return res.json({ data: rows, paging: { total: Number(total), page: p, pageSize: ps } });
    }
    let rows = invoiceStore.slice();
    if (status) rows = rows.filter(r => r.status===status);
    if (minAmount) rows = rows.filter(r => (r.amount||0) >= Number(minAmount));
    if (maxAmount) rows = rows.filter(r => (r.amount||0) <= Number(maxAmount));
    if (from) rows = rows.filter(r => new Date(r.createdAt) >= new Date(from));
    if (to) rows = rows.filter(r => new Date(r.createdAt) <= new Date(to));
    if (sortBy) { rows.sort((a,b)=>{ const dir=(String(sortDir).toLowerCase()==='asc')?1:-1; const av=a[sortBy]||''; const bv=b[sortBy]||''; return av>bv?dir:(av<bv?-dir:0); }); }
    const total = rows.length; const start = (p-1)*ps; rows = rows.slice(start, start+ps);
    return res.json({ data: rows, paging: { total, page: p, pageSize: ps } });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list invoices' });
  }
});

// Create / update / delete invoices (demo)
app.post('/api/admin/invoices', authMiddleware, requireAdmin, (req, res) => {
  const { amount = 0, status = 'paid' } = req.body || {};
  const inv = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), amount: Number(amount)||0, status, createdAt: new Date().toISOString() };
  invoiceStore.push(inv);
  // persist when DB is configured
  (async () => {
    try {
      const pool = db.getPool && db.getPool();
      if (pool) {
        await db.query('insert into invoices(id,amount,status) values($1,$2,$3)', [inv.id, inv.amount, inv.status]);
      }
    } catch (_) {}
  })();
  res.status(201).json({ data: inv });
});
app.patch('/api/admin/invoices/:id', authMiddleware, requireAdmin, (req, res) => {
  const { id } = req.params; const { status, amount } = req.body || {};
  const idx = invoiceStore.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Invoice not found' });
  if (status) invoiceStore[idx].status = status;
  if (amount !== undefined) invoiceStore[idx].amount = Number(amount)||0;
  return res.json({ data: invoiceStore[idx] });
});
app.delete('/api/admin/invoices/:id', authMiddleware, requireAdmin, (req, res) => {
  const { id } = req.params;
  const before = invoiceStore.length;
  const remaining = invoiceStore.filter(i => i.id !== id);
  invoiceStore.length = 0; invoiceStore.push(...remaining);
  return res.json({ success: remaining.length !== before });
});

// Bulk invoices actions
app.post('/api/admin/invoices/bulk', authMiddleware, requireAdmin, async (req, res) => {
  const { ids = [], action = 'delete', allFiltered = false, filters = {} } = req.body || {};
  const pool = db.getPool && db.getPool();
  try {
    if (pool) {
      if (allFiltered) {
        const where=[]; const vals=[];
        if (filters.status) { vals.push(filters.status); where.push(`status=$${vals.length}`); }
        if (filters.minAmount) { vals.push(Number(filters.minAmount)||0); where.push(`amount >= $${vals.length}`); }
        if (filters.maxAmount) { vals.push(Number(filters.maxAmount)||0); where.push(`amount <= $${vals.length}`); }
        if (filters.from) { vals.push(new Date(filters.from)); where.push(`created_at >= $${vals.length}`); }
        if (filters.to) { vals.push(new Date(filters.to)); where.push(`created_at <= $${vals.length}`); }
        const whereSql = where.length? `where ${where.join(' and ')}`:'';
        if (action==='delete') { const result = await db.query(`delete from invoices ${whereSql}`, vals); return res.json({ success: true, count: result.rowCount||0 }); }
        if (action==='refund') { const result = await db.query(`update invoices set status='refunded' ${whereSql}`, vals); return res.json({ success: true, count: result.rowCount||0 }); }
      } else {
        if (action === 'delete') { for (const id of ids) await db.query('delete from invoices where id=$1', [id]); }
        else if (action === 'refund') { for (const id of ids) await db.query('update invoices set status=$1 where id=$2', ['refunded', id]); }
        return res.json({ success: true, count: ids.length });
      }
    }
    let rows = invoiceStore.slice();
    if (allFiltered) {
      if (action==='delete') { const remaining = rows.filter(i => !((!filters.status || i.status===filters.status) && (!filters.minAmount || (i.amount||0) >= Number(filters.minAmount)) && (!filters.maxAmount || (i.amount||0) <= Number(filters.maxAmount)) && (!filters.from || new Date(i.createdAt)>=new Date(filters.from)) && (!filters.to || new Date(i.createdAt)<=new Date(filters.to)))); invoiceStore.length=0; invoiceStore.push(...remaining); }
      if (action==='refund') { invoiceStore.forEach(i => { const match = ((!filters.status || i.status===filters.status) && (!filters.minAmount || (i.amount||0) >= Number(filters.minAmount)) && (!filters.maxAmount || (i.amount||0) <= Number(filters.maxAmount)) && (!filters.from || new Date(i.createdAt)>=new Date(filters.from)) && (!filters.to || new Date(i.createdAt)<=new Date(filters.to))); if (match) i.status='refunded'; }); }
      return res.json({ success: true, count: 0 });
    }
    if (action === 'delete') { const remaining = invoiceStore.filter(i => !ids.includes(i.id)); invoiceStore.length = 0; invoiceStore.push(...remaining); }
    else if (action === 'refund') { invoiceStore.forEach(i => { if (ids.includes(i.id)) i.status='refunded'; }); }
    return res.json({ success: true, count: ids.length });
  } catch (e) { return res.status(500).json({ message: 'Bulk invoice action failed' }); }
});

app.get('/api/admin/tracking', authMiddleware, requireAdmin, async (req, res) => {
  const { event = '', from = '', to = '', page='1', pageSize='50', sortBy='t', sortDir='desc' } = req.query || {};
  const p = Math.max(parseInt(page)||1, 1);
  const ps = Math.max(Math.min(parseInt(pageSize)||50, 200), 1);
  const pool = db.getPool && db.getPool();
  try {
    if (pool) {
      const where = []; const vals = [];
      if (event) { vals.push(event); where.push(`event = $${vals.length}`); }
      if (from) { vals.push(Number(new Date(from).getTime())); where.push(`t >= $${vals.length}`); }
      if (to) { vals.push(Number(new Date(to).getTime())); where.push(`t <= $${vals.length}`); }
      const whereSql = where.length? `where ${where.join(' and ')}` : '';
      const total = (await db.query(`select count(*) from events ${whereSql}`, vals)).rows[0].count;
      const orderCol = ['event','t'].includes(String(sortBy).toLowerCase()) ? sortBy : 't';
      const orderDir = String(sortDir).toLowerCase() === 'asc' ? 'asc' : 'desc';
      vals.push(ps, (p-1)*ps);
      const rows = (await db.query(`select * from events ${whereSql} order by ${orderCol} ${orderDir} limit $${vals.length-1} offset $${vals.length}`, vals)).rows;
      return res.json({ data: rows, paging: { total: Number(total), page: p, pageSize: ps } });
    }
    let rows = eventStore.slice().reverse();
    if (event) rows = rows.filter(r => r.event===event);
    if (from) rows = rows.filter(r => new Date(r.t) >= new Date(from));
    if (to) rows = rows.filter(r => new Date(r.t) <= new Date(to));
    if (sortBy) { rows.sort((a,b)=>{ const dir=(String(sortDir).toLowerCase()==='asc')?1:-1; const av=a[sortBy]||''; const bv=b[sortBy]||''; return av>bv?dir:(av<bv?-dir:0); }); }
    const total = rows.length; const start = (p-1)*ps; rows = rows.slice(start, start+ps);
    return res.json({ data: rows, paging: { total, page: p, pageSize: ps } });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list events' });
  }
});

// Bulk tracking actions (delete only)
app.post('/api/admin/tracking/bulk', authMiddleware, requireAdmin, async (req, res) => {
  const { ids = [], allFiltered = false, filters = {} } = req.body || {};
  const pool = db.getPool && db.getPool();
  try {
    if (pool) {
      if (allFiltered) {
        const where=[]; const vals=[];
        if (filters.event) { vals.push(filters.event); where.push(`event=$${vals.length}`); }
        if (filters.from) { vals.push(Number(new Date(filters.from).getTime())); where.push(`t >= $${vals.length}`); }
        if (filters.to) { vals.push(Number(new Date(filters.to).getTime())); where.push(`t <= $${vals.length}`); }
        const whereSql = where.length? `where ${where.join(' and ')}`:'';
        const result = await db.query(`delete from events ${whereSql}`, vals);
        return res.json({ success: true, count: result.rowCount||0 });
      } else {
        for (const id of ids) await db.query('delete from events where id=$1', [id]);
        return res.json({ success: true, count: ids.length });
      }
    }
    let rows = eventStore.slice();
    if (allFiltered) {
      const remaining = rows.filter(e => !((!filters.event || e.event===filters.event) && (!filters.from || new Date(e.t)>=new Date(filters.from)) && (!filters.to || new Date(e.t)<=new Date(filters.to))));
      eventStore.length = 0; eventStore.push(...remaining);
      return res.json({ success: true, count: 0 });
    }
    const remaining = rows.filter(e => !ids.includes(e.id)); eventStore.length=0; eventStore.push(...remaining);
    return res.json({ success: true, count: ids.length });
  } catch (e) { return res.status(500).json({ message: 'Bulk tracking action failed' }); }
});

// --- CSV Exports ---
function toCSV(rows, headers) {
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const head = headers.map(h => esc(h.label)).join(',');
  const body = rows.map(r => headers.map(h => esc(r[h.key])).join(',')).join('\n');
  return head + '\n' + body + '\n';
}

app.get('/api/admin/sessions/export.csv', authMiddleware, requireAdmin, async (req, res) => {
  const { email = '', from = '', to = '', sortBy='created_at', sortDir='desc' } = req.query || {};
  let rows;
  const pool = db.getPool && db.getPool();
  if (pool) {
    const vals=[]; const where=[];
    if (email) { vals.push(`%${email}%`); where.push(`user_email ilike $${vals.length}`); }
    if (from) { vals.push(new Date(from)); where.push(`created_at >= $${vals.length}`); }
    if (to) { vals.push(new Date(to)); where.push(`created_at <= $${vals.length}`); }
    const whereSql = where.length? `where ${where.join(' and ')}`: '';
    const orderCol = ['user_email','created_at','ip'].includes(String(sortBy).toLowerCase()) ? sortBy : 'created_at';
    const orderDir = String(sortDir).toLowerCase() === 'asc' ? 'asc' : 'desc';
    rows = (await db.query(`select * from sessions ${whereSql} order by ${orderCol} ${orderDir}`, vals)).rows;
  } else {
    rows = Array.from(sessionStore.values()).filter(r => email? (r.userEmail||'').includes(email) : true);
    if (from) rows = rows.filter(r => new Date(r.createdAt)>=new Date(from));
    if (to) rows = rows.filter(r => new Date(r.createdAt)<=new Date(to));
  }
  const csv = toCSV(rows, [
    { key: 'id', label: 'id' },
    { key: 'userEmail', label: 'userEmail' },
    { key: 'ip', label: 'ip' },
    { key: 'createdAt', label: 'createdAt' },
  ]);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="sessions.csv"');
  res.send(csv);
});

app.get('/api/admin/feedback/export.csv', authMiddleware, requireAdmin, async (req, res) => {
  const { status='', category='', email='', from='', to='', sortBy='created_at', sortDir='desc' } = req.query || {};
  let rows;
  const pool = db.getPool && db.getPool();
  if (pool) {
    const where=[]; const vals=[];
    if (status) { vals.push(status); where.push(`status = $${vals.length}`); }
    if (category) { vals.push(category); where.push(`category = $${vals.length}`); }
    if (email) { vals.push(`%${email}%`); where.push(`email ilike $${vals.length}`); }
    if (from) { vals.push(new Date(from)); where.push(`created_at >= $${vals.length}`); }
    if (to) { vals.push(new Date(to)); where.push(`created_at <= $${vals.length}`); }
    const whereSql = where.length? `where ${where.join(' and ')}` : '';
    const orderCol = ['email','category','status','created_at'].includes(String(sortBy).toLowerCase()) ? sortBy : 'created_at';
    const orderDir = String(sortDir).toLowerCase() === 'asc' ? 'asc' : 'desc';
    rows = (await db.query(`select * from feedback ${whereSql} order by ${orderCol} ${orderDir}`, vals)).rows;
  } else {
    rows = feedbackStore.filter(r => (
      (!status || r.status===status) && (!category || r.category===category) && (!email || (r.email||'').includes(email))
    ));
    if (from) rows = rows.filter(r => new Date(r.createdAt)>=new Date(from));
    if (to) rows = rows.filter(r => new Date(r.createdAt)<=new Date(to));
  }
  const csv = toCSV(rows, [
    { key: 'id', label: 'id' }, { key: 'email', label: 'email' }, { key: 'category', label: 'category' }, { key: 'message', label: 'message' }, { key: 'status', label: 'status' }, { key: 'createdAt', label: 'createdAt' },
  ]);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="feedback.csv"');
  res.send(csv);
});

app.get('/api/admin/invoices/export.csv', authMiddleware, requireAdmin, async (req, res) => {
  const { status='', minAmount='', maxAmount='', from='', to='', sortBy='created_at', sortDir='desc' } = req.query || {};
  let rows;
  const pool = db.getPool && db.getPool();
  if (pool) {
    const where=[]; const vals=[];
    if (status) { vals.push(status); where.push(`status = $${vals.length}`); }
    if (minAmount) { vals.push(Number(minAmount)||0); where.push(`amount >= $${vals.length}`); }
    if (maxAmount) { vals.push(Number(maxAmount)||0); where.push(`amount <= $${vals.length}`); }
    if (from) { vals.push(new Date(from)); where.push(`created_at >= $${vals.length}`); }
    if (to) { vals.push(new Date(to)); where.push(`created_at <= $${vals.length}`); }
    const whereSql = where.length? `where ${where.join(' and ')}` : '';
    const orderCol = ['status','amount','created_at'].includes(String(sortBy).toLowerCase()) ? sortBy : 'created_at';
    const orderDir = String(sortDir).toLowerCase() === 'asc' ? 'asc' : 'desc';
    rows = (await db.query(`select * from invoices ${whereSql} order by ${orderCol} ${orderDir}`, vals)).rows;
  } else {
    rows = invoiceStore.filter(r => (
      (!status || r.status===status) && (!minAmount || (r.amount||0) >= Number(minAmount)) && (!maxAmount || (r.amount||0) <= Number(maxAmount))
    ));
    if (from) rows = rows.filter(r => new Date(r.createdAt)>=new Date(from));
    if (to) rows = rows.filter(r => new Date(r.createdAt)<=new Date(to));
  }
  const csv = toCSV(rows, [
    { key: 'id', label: 'id' }, { key: 'amount', label: 'amount' }, { key: 'status', label: 'status' }, { key: 'createdAt', label: 'createdAt' },
  ]);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
  res.send(csv);
});

// Users admin endpoints (role management)
app.get('/api/admin/users', authMiddleware, requireAdmin, async (req, res) => {
  const { q = '', page='1', pageSize='20', sortBy='created_at', sortDir='desc' } = req.query || {};
  const p = Math.max(parseInt(page)||1, 1);
  const ps = Math.max(Math.min(parseInt(pageSize)||20, 200), 1);
  const pool = db.getPool && db.getPool();
  try {
    if (pool) {
      const where=[]; const vals=[];
      if (q) { vals.push(`%${q}%`, `%${q}%`); where.push(`(email ilike $${vals.length-1} or name ilike $${vals.length})`); }
      const whereSql = where.length? `where ${where.join(' and ')}`: '';
      const total = (await db.query(`select count(*) from users ${whereSql}`, vals)).rows[0].count;
      const orderCol = ['email','name','role','created_at'].includes(String(sortBy).toLowerCase()) ? sortBy : 'created_at';
      const orderDir = String(sortDir).toLowerCase() === 'asc' ? 'asc' : 'desc';
      vals.push(ps, (p-1)*ps);
      const rows = (await db.query(`select id,name,email,role,created_at from users ${whereSql} order by ${orderCol} ${orderDir} limit $${vals.length-1} offset $${vals.length}`, vals)).rows;
      return res.json({ data: rows, paging: { total: Number(total), page: p, pageSize: ps } });
    }
    let rows = Array.from(userStore.values());
    if (q) rows = rows.filter(u => (u.email||'').includes(q) || (u.name||'').includes(q));
    if (sortBy) rows.sort((a,b)=>{ const dir=(String(sortDir).toLowerCase()==='asc')?1:-1; const av=a[sortBy]||''; const bv=b[sortBy]||''; return av>bv?dir:(av<bv?-dir:0); });
    const total = rows.length; const start=(p-1)*ps; rows = rows.slice(start, start+ps);
    return res.json({ data: rows.map(u=>({id:u.id,name:u.name,email:u.email,role:u.role,created_at:new Date().toISOString()})), paging:{ total, page:p, pageSize:ps } });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list users' });
  }
});

app.patch('/api/admin/users/:id/role', authMiddleware, requireAdmin, async (req, res) => {
  const { id } = req.params; const { role } = req.body || {};
  if (!role || !['user','admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  const pool = db.getPool && db.getPool();
  try {
    if (pool) {
      const result = await db.query('update users set role=$1 where id=$2', [role, id]);
      return res.json({ success: true, count: result.rowCount||0 });
    }
    const user = [...userStore.values()].find(u => u.id===id);
    if (user) { user.role = role; return res.json({ success: true, count: 1 }); }
    return res.status(404).json({ message: 'User not found' });
  } catch (e) { return res.status(500).json({ message: 'Failed to update role' }); }
});

// Tracking CSV export (with filters)
app.get('/api/admin/tracking/export.csv', authMiddleware, requireAdmin, async (req, res) => {
  const { event='', from='', to='', sortBy='t', sortDir='desc' } = req.query || {};
  let rows;
  const pool = db.getPool && db.getPool();
  if (pool) {
    const where=[]; const vals=[];
    if (event) { vals.push(event); where.push(`event = $${vals.length}`); }
    if (from) { vals.push(Number(new Date(from).getTime())); where.push(`t >= $${vals.length}`); }
    if (to) { vals.push(Number(new Date(to).getTime())); where.push(`t <= $${vals.length}`); }
    const whereSql = where.length? `where ${where.join(' and ')}` : '';
    const orderCol = ['event','t'].includes(String(sortBy).toLowerCase()) ? sortBy : 't';
    const orderDir = String(sortDir).toLowerCase() === 'asc' ? 'asc' : 'desc';
    rows = (await db.query(`select * from events ${whereSql} order by ${orderCol} ${orderDir}`, vals)).rows;
  } else {
    rows = eventStore.slice();
    if (event) rows = rows.filter(r => r.event===event);
    if (from) rows = rows.filter(r => new Date(r.t)>=new Date(from));
    if (to) rows = rows.filter(r => new Date(r.t)<=new Date(to));
  }
  const csv = toCSV(rows, [ { key: 'id', label: 'id' }, { key: 'event', label: 'event' }, { key: 't', label: 'timestamp' } ]);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="events.csv"');
  res.send(csv);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      '/',
      '/health',
      '/api/health',
      '/api',
      '/api/info'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Maijjd Backend running on port ${PORT}`);
  console.log(`🔍 Root Health Check: http://localhost:${PORT}/`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  // init db if configured
  db.init().then(ok => {
    if (ok) console.log('🗄️  Database initialized');
    else console.log('🗄️  DATABASE_URL not set, using in-memory stores');
  }).catch(e => console.error('DB init failed:', e));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => { console.log('Process terminated'); });
});
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => { console.log('Process terminated'); });
});

module.exports = app; 