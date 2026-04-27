const express = require('express');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// ── Database ────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

// ── Middleware ──────────────────────────────────
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Custom render with layout
app.locals.renderWithLayout = (res, view, data) => {
  return res.render(view, {
    ...data,
    layout: true
  });
};

// ── Route Configuration (Single Source of Truth) ────────────────────
const ROUTES_CONFIG = [
  { route: '/', label_sv: 'Översikt', label_en: 'Dashboard', icon: 'dashboard', order: 1 },
  { route: '/sessions', label_sv: 'Aktiviteter', label_en: 'Sessions', icon: 'sessions', order: 2 },
  { route: '/locations', label_sv: 'Platser', label_en: 'Locations', icon: 'locations', order: 3 },
  { route: '/weapons', label_sv: 'Vapen', label_en: 'Weapons', icon: 'weapons', order: 4 },
  { route: '/ammunition', label_sv: 'Ammunition', label_en: 'Ammunition', icon: 'ammunition', order: 5 },
  { route: '/reports', label_sv: 'Rapporter', label_en: 'Reports', icon: 'reports', order: 6 },
  { route: '/settings', label_sv: 'Inställningar', label_en: 'Settings', icon: 'settings', order: 7 }
];

// ── Middleware: Language & Navigation ────────────────────────────────
app.use((req, res, next) => {
  // Detect language from query param or cookie, default to 'sv'
  res.locals.lang = req.query.lang || req.cookies?.lang || 'sv';

  // Pass routes config to all views
  res.locals.routes = ROUTES_CONFIG;
  res.locals.currentRoute = req.path;

  // Helper function to get label in current language
  res.locals.getLabel = (routeObj) => {
    return res.locals.lang === 'en' ? routeObj.label_en : routeObj.label_sv;
  };

  next();
});

// ── Health Check ────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// ── Database Initialization ─────────────────────
async function initDatabase() {
  try {
    // Create locations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location_type VARCHAR(50) NOT NULL CHECK (location_type IN ('skjutbana', 'jaktmark', 'hem', 'annan')),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        address VARCHAR(255),
        county VARCHAR(100),
        country VARCHAR(100) DEFAULT 'Sverige',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        session_type VARCHAR(50) NOT NULL DEFAULT 'hunt',
        location_id INTEGER REFERENCES locations(id),
        date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add session_type column if upgrading existing DB (idempotent)
    await pool.query(`
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_type VARCHAR(50) NOT NULL DEFAULT 'hunt';
    `);

    // Create moose_range_series table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS moose_range_series (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        shot1 VARCHAR(10),
        shot2 VARCHAR(10),
        shot3 VARCHAR(10),
        shot4 VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create weapons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weapons (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        caliber VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create ammunition table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ammunition (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        caliber VARCHAR(50) NOT NULL,
        quantity INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ── New optional fields: Locations ──────────────────────────────────────
    await pool.query(`ALTER TABLE locations ADD COLUMN IF NOT EXISTS county_board_id VARCHAR(50);`);
    await pool.query(`ALTER TABLE locations ADD COLUMN IF NOT EXISTS property_designation VARCHAR(100);`);

    // ── New optional fields: Weapons ─────────────────────────────────────────
    await pool.query(`ALTER TABLE weapons ADD COLUMN IF NOT EXISTS barrel_length NUMERIC;`);

    // ── New optional fields: Sessions (weather) ──────────────────────────────
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS temperature NUMERIC;`);
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS humidity NUMERIC;`);
    await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS air_pressure NUMERIC;`);

    // ── Ammunition: restructure for rifle/shotgun toggle ─────────────────────
    // Make legacy 'type' column nullable (data cleared — no migration needed)
    await pool.query(`ALTER TABLE ammunition ALTER COLUMN type DROP NOT NULL;`).catch(() => {});
    await pool.query(`ALTER TABLE ammunition ADD COLUMN IF NOT EXISTS ammo_type VARCHAR(10);`);
    await pool.query(`ALTER TABLE ammunition ADD COLUMN IF NOT EXISTS bullet_name VARCHAR(100);`);
    await pool.query(`ALTER TABLE ammunition ADD COLUMN IF NOT EXISTS bullet_construction VARCHAR(100);`);
    await pool.query(`ALTER TABLE ammunition ADD COLUMN IF NOT EXISTS lead_free BOOLEAN DEFAULT FALSE;`);
    await pool.query(`ALTER TABLE ammunition ADD COLUMN IF NOT EXISTS bc_value NUMERIC;`);
    await pool.query(`ALTER TABLE ammunition ADD COLUMN IF NOT EXISTS bc_type VARCHAR(5);`);
    await pool.query(`ALTER TABLE ammunition ADD COLUMN IF NOT EXISTS bullet_weight NUMERIC;`);
    await pool.query(`ALTER TABLE ammunition ADD COLUMN IF NOT EXISTS muzzle_velocity NUMERIC;`);
    await pool.query(`ALTER TABLE ammunition ADD COLUMN IF NOT EXISTS shot_size VARCHAR(50);`);
    await pool.query(`ALTER TABLE ammunition ADD COLUMN IF NOT EXISTS charge_weight NUMERIC;`);
    await pool.query(`ALTER TABLE ammunition ADD COLUMN IF NOT EXISTS shot_material VARCHAR(100);`);
    await pool.query(`ALTER TABLE ammunition ADD COLUMN IF NOT EXISTS cartridge_length NUMERIC;`);

    console.log('✅ Database tables initialized');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

initDatabase();

// ── Routes ──────────────────────────────────────

// Dashboard
app.get('/', async (req, res) => {
  try {
    const locations = await pool.query('SELECT COUNT(*) FROM locations');
    const sessions = await pool.query('SELECT COUNT(*) FROM sessions');
    const weapons = await pool.query('SELECT COUNT(*) FROM weapons');

    res.render('dashboard', {
      title: res.locals.lang === 'en' ? 'Dashboard' : 'Översikt',
      stats: {
        locations: parseInt(locations.rows[0]?.count || 0),
        sessions: parseInt(sessions.rows[0]?.count || 0),
        weapons: parseInt(weapons.rows[0]?.count || 0)
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.render('error', { message: 'Dashboard load failed' });
  }
});

// ── Session helpers ─────────────────────────────────────────────────────────

const SESSION_TYPES = {
  hunt:        { sv: 'Jakt',       en: 'Hunting'      },
  shooting:    { sv: 'Skytte',     en: 'Shooting'     },
  maintenance: { sv: 'Underhåll',  en: 'Maintenance'  },
  training:    { sv: 'Utbildning', en: 'Training'     },
  moose_range: { sv: 'Älgbana',    en: 'Moose range'  }
};

const SHOT_POINTS = { '5^1': 5, '5': 5, '4': 4, '3': 3, 'T': 0, 'O': 0, 'X': 0 };

function computeSeriesData(row) {
  const shots = [row.shot1, row.shot2, row.shot3, row.shot4];
  const complete = shots.every(s => s !== null && s !== undefined && s !== '');
  const points = shots.reduce((sum, s) => sum + (SHOT_POINTS[s] || 0), 0);
  const superscriptOnes = shots.filter(s => s === '5^1').length;
  const approved = complete && shots.every(s => !['O', 'X'].includes(s));
  return { ...row, shots, complete, points, superscriptOnes, approved };
}

async function getSessionSummary(sessionId) {
  const result = await pool.query(
    'SELECT * FROM moose_range_series WHERE session_id = $1 ORDER BY sort_order, id',
    [sessionId]
  );
  const series = result.rows.map(computeSeriesData);
  const completeSeries = series.filter(s => s.complete);
  const approvedSeries = completeSeries.filter(s => s.approved);
  return {
    count: series.length,
    approved: approvedSeries.length,
    points: completeSeries.reduce((sum, s) => sum + s.points, 0),
    superscriptOnes: completeSeries.reduce((sum, s) => sum + s.superscriptOnes, 0)
  };
}

function sessionTypeLabel(type, lang) {
  const t = SESSION_TYPES[type] || SESSION_TYPES.hunt;
  return lang === 'en' ? t.en : t.sv;
}

// ── Sessions — List ──────────────────────────────────────────────────────────
app.get('/sessions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, l.name as location_name
      FROM sessions s
      LEFT JOIN locations l ON s.location_id = l.id
      ORDER BY s.date DESC
    `);
    const lang = res.locals.lang;
    const sessions = result.rows.map(s => ({
      ...s,
      type_label: sessionTypeLabel(s.session_type, lang)
    }));

    res.render('sessions', {
      title: lang === 'en' ? 'Sessions' : 'Aktiviteter',
      sessions,
      action: 'list',
      SESSION_TYPES,
      sessionTypeLabel
    });
  } catch (err) {
    console.error('Sessions error:', err);
    res.render('error', { message: 'Sessions load failed' });
  }
});

// ── Sessions — New form ──────────────────────────────────────────────────────
app.get('/sessions/new', async (req, res) => {
  try {
    const locations = await pool.query('SELECT id, name FROM locations ORDER BY name');
    res.render('sessions', {
      title: res.locals.lang === 'en' ? 'New Session' : 'Ny aktivitet',
      session: {},
      locations: locations.rows,
      action: 'new',
      SESSION_TYPES,
      sessionTypeLabel
    });
  } catch (err) {
    console.error('New session error:', err);
    res.render('error', { message: 'Failed to load form' });
  }
});

// ── Sessions — CSV Export ────────────────────────────────────────────────────
app.get('/sessions/export.csv', async (req, res) => {
  try {
    const lang = res.locals.lang;
    const result = await pool.query(`
      SELECT s.*, l.name AS location_name
      FROM sessions s
      LEFT JOIN locations l ON s.location_id = l.id
      ORDER BY s.date DESC
    `);

    const seriesResult = await pool.query(
      'SELECT * FROM moose_range_series ORDER BY session_id, sort_order, id'
    );
    const seriesBySession = {};
    for (const row of seriesResult.rows) {
      if (!seriesBySession[row.session_id]) seriesBySession[row.session_id] = [];
      seriesBySession[row.session_id].push(computeSeriesData(row));
    }

    const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;

    // Determine which optional columns to include (only if at least one row has data)
    const hasTemp = result.rows.some(s => s.temperature != null);
    const hasHumidity = result.rows.some(s => s.humidity != null);
    const hasAirPressure = result.rows.some(s => s.air_pressure != null);

    const baseHeaders = [
      lang === 'en' ? 'ID' : 'ID',
      lang === 'en' ? 'Title' : 'Titel',
      lang === 'en' ? 'Type' : 'Typ',
      lang === 'en' ? 'Date' : 'Datum',
      lang === 'en' ? 'Location' : 'Plats',
      lang === 'en' ? 'Notes' : 'Anteckningar',
      lang === 'en' ? 'Series' : 'Serier',
      lang === 'en' ? 'Series count' : 'Antal serier',
      lang === 'en' ? 'Approved series' : 'Godkända serier',
      lang === 'en' ? 'Total points' : 'Totala poäng',
      lang === 'en' ? '5¹ count' : 'Antal 5¹'
    ];
    if (hasTemp) baseHeaders.push(lang === 'en' ? 'Temperature (°C)' : 'Temperatur (°C)');
    if (hasHumidity) baseHeaders.push(lang === 'en' ? 'Humidity (%)' : 'Relativ luftfuktighet (%)');
    if (hasAirPressure) baseHeaders.push(lang === 'en' ? 'Air pressure (mbar)' : 'Lufttryck (mbar)');

    const rows = result.rows.map(s => {
      const series = seriesBySession[s.id] || [];
      const complete = series.filter(sr => sr.complete);
      const seriesStr = series.map(sr =>
        [sr.shot1, sr.shot2, sr.shot3, sr.shot4]
          .map(v => v === '5^1' ? '5^1' : (v || '-'))
          .join(',')
      ).join(' | ');

      const approvedCount = complete.filter(sr => sr.approved).length;
      const totalPoints = complete.reduce((sum, sr) => sum + sr.points, 0);
      const totalSup = complete.reduce((sum, sr) => sum + sr.superscriptOnes, 0);

      const rowData = [
        s.id,
        s.title,
        sessionTypeLabel(s.session_type, lang),
        s.date ? new Date(s.date).toISOString().slice(0, 10) : '',
        s.location_name || '',
        s.notes || '',
        seriesStr,
        s.session_type === 'moose_range' ? series.length : '',
        s.session_type === 'moose_range' ? approvedCount : '',
        s.session_type === 'moose_range' ? totalPoints : '',
        s.session_type === 'moose_range' ? totalSup : ''
      ];
      if (hasTemp) rowData.push(s.temperature != null ? s.temperature : '');
      if (hasHumidity) rowData.push(s.humidity != null ? s.humidity : '');
      if (hasAirPressure) rowData.push(s.air_pressure != null ? s.air_pressure : '');
      return rowData.map(esc).join(',');
    });

    const csv = [baseHeaders.map(esc).join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="huntledger-sessions.csv"');
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).send('Export failed');
  }
});

// ── Sessions — Create ────────────────────────────────────────────────────────
app.post('/sessions', async (req, res) => {
  const { title, session_type, location_id, date, notes, temperature, humidity, air_pressure } = req.body;
  const lang = res.locals.lang;
  try {
    const result = await pool.query(
      `INSERT INTO sessions (title, session_type, location_id, date, notes, temperature, humidity, air_pressure)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [title, session_type || 'hunt', location_id || null, date, notes || null,
       temperature || null, humidity || null, air_pressure || null]
    );
    res.redirect(`/sessions/${result.rows[0].id}?lang=${lang}`);
  } catch (err) {
    console.error('Create session error:', err);
    res.render('error', { message: 'Failed to create session' });
  }
});

// ── Sessions — Detail ────────────────────────────────────────────────────────
app.get('/sessions/:id', async (req, res) => {
  const lang = res.locals.lang;
  try {
    const result = await pool.query(`
      SELECT s.*, l.name as location_name
      FROM sessions s
      LEFT JOIN locations l ON s.location_id = l.id
      WHERE s.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) return res.render('error', { message: 'Session not found' });

    const session = result.rows[0];
    session.type_label = sessionTypeLabel(session.session_type, lang);

    let series = [];
    let summary = null;
    if (session.session_type === 'moose_range') {
      const sr = await pool.query(
        'SELECT * FROM moose_range_series WHERE session_id = $1 ORDER BY sort_order, id',
        [session.id]
      );
      series = sr.rows.map(computeSeriesData);
      summary = await getSessionSummary(session.id);
    }

    res.render('sessions', {
      title: session.title,
      session,
      series,
      summary,
      action: 'detail',
      SESSION_TYPES,
      sessionTypeLabel
    });
  } catch (err) {
    console.error('Session detail error:', err);
    res.render('error', { message: 'Failed to load session' });
  }
});

// ── Sessions — Edit form ─────────────────────────────────────────────────────
app.get('/sessions/:id/edit', async (req, res) => {
  const lang = res.locals.lang;
  try {
    const result = await pool.query('SELECT * FROM sessions WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.render('error', { message: 'Session not found' });

    const locations = await pool.query('SELECT id, name FROM locations ORDER BY name');
    res.render('sessions', {
      title: lang === 'en' ? 'Edit Session' : 'Redigera aktivitet',
      session: result.rows[0],
      locations: locations.rows,
      action: 'edit',
      SESSION_TYPES,
      sessionTypeLabel
    });
  } catch (err) {
    console.error('Edit session error:', err);
    res.render('error', { message: 'Failed to load session' });
  }
});

// ── Sessions — Update ────────────────────────────────────────────────────────
app.post('/sessions/:id/update', async (req, res) => {
  const { title, session_type, location_id, date, notes, temperature, humidity, air_pressure } = req.body;
  const lang = res.locals.lang;
  try {
    await pool.query(
      `UPDATE sessions SET title=$1, session_type=$2, location_id=$3, date=$4, notes=$5, temperature=$6, humidity=$7, air_pressure=$8, updated_at=NOW()
       WHERE id=$9`,
      [title, session_type || 'hunt', location_id || null, date, notes || null,
       temperature || null, humidity || null, air_pressure || null, req.params.id]
    );
    res.redirect(`/sessions/${req.params.id}?lang=${lang}`);
  } catch (err) {
    console.error('Update session error:', err);
    res.render('error', { message: 'Failed to update session' });
  }
});

// ── Sessions — Delete ────────────────────────────────────────────────────────
app.post('/sessions/:id/delete', async (req, res) => {
  const lang = res.locals.lang;
  try {
    await pool.query('DELETE FROM sessions WHERE id = $1', [req.params.id]);
    res.redirect(`/sessions?lang=${lang}`);
  } catch (err) {
    console.error('Delete session error:', err);
    res.render('error', { message: 'Failed to delete session' });
  }
});

// ── API — Add series to session ──────────────────────────────────────────────
app.post('/api/sessions/:id/series', async (req, res) => {
  try {
    const maxOrder = await pool.query(
      'SELECT COALESCE(MAX(sort_order), -1) AS max_order FROM moose_range_series WHERE session_id = $1',
      [req.params.id]
    );
    const nextOrder = parseInt(maxOrder.rows[0].max_order) + 1;
    const result = await pool.query(
      `INSERT INTO moose_range_series (session_id, sort_order) VALUES ($1, $2) RETURNING *`,
      [req.params.id, nextOrder]
    );
    const series = computeSeriesData(result.rows[0]);
    const summary = await getSessionSummary(req.params.id);
    res.json({ ok: true, series, summary });
  } catch (err) {
    console.error('Add series error:', err);
    res.json({ ok: false, error: err.message });
  }
});

// ── API — Delete series ──────────────────────────────────────────────────────
app.delete('/api/series/:id', async (req, res) => {
  try {
    const sr = await pool.query('SELECT session_id FROM moose_range_series WHERE id = $1', [req.params.id]);
    if (sr.rows.length === 0) return res.json({ ok: false, error: 'Not found' });
    const sessionId = sr.rows[0].session_id;
    await pool.query('DELETE FROM moose_range_series WHERE id = $1', [req.params.id]);
    const summary = await getSessionSummary(sessionId);
    res.json({ ok: true, summary });
  } catch (err) {
    console.error('Delete series error:', err);
    res.json({ ok: false, error: err.message });
  }
});

// ── API — Set shot value ─────────────────────────────────────────────────────
app.post('/api/series/:id/shot', async (req, res) => {
  const { shotIndex, value } = req.body;
  const validValues = ['5^1', '5', '4', '3', 'T', 'O', 'X', '__clear__'];
  if (!validValues.includes(value)) return res.json({ ok: false, error: 'Invalid value' });
  const col = `shot${parseInt(shotIndex) + 1}`;
  if (!['shot1','shot2','shot3','shot4'].includes(col)) return res.json({ ok: false, error: 'Invalid shot index' });
  const dbValue = value === '__clear__' ? null : value;

  try {
    const result = await pool.query(
      `UPDATE moose_range_series SET ${col}=$1 WHERE id=$2 RETURNING *`,
      [dbValue, req.params.id]
    );
    if (result.rows.length === 0) return res.json({ ok: false, error: 'Not found' });
    const series = computeSeriesData(result.rows[0]);
    const summary = await getSessionSummary(series.session_id);
    res.json({ ok: true, series, summary });
  } catch (err) {
    console.error('Set shot error:', err);
    res.json({ ok: false, error: err.message });
  }
});

// Dashboard stats API
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Basic counts
    const locations = await pool.query('SELECT COUNT(*) FROM locations');
    const sessions = await pool.query('SELECT COUNT(*) FROM sessions');
    const weapons = await pool.query('SELECT COUNT(*) FROM weapons');

    // Monthly session data for charts (last 12 months)
    const monthlyData = await pool.query(`
      SELECT
        EXTRACT(YEAR FROM date) as year,
        EXTRACT(MONTH FROM date) as month,
        COUNT(*) as count
      FROM sessions
      WHERE date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY year, month
    `);

    // Recent sessions (last 5)
    const recentSessions = await pool.query(`
      SELECT s.id, s.title, s.session_type, s.date, l.name as location_name
      FROM sessions s
      LEFT JOIN locations l ON s.location_id = l.id
      ORDER BY s.date DESC
      LIMIT 5
    `);

    res.json({
      counts: {
        locations: parseInt(locations.rows[0]?.count || 0),
        sessions: parseInt(sessions.rows[0]?.count || 0),
        weapons: parseInt(weapons.rows[0]?.count || 0)
      },
      monthly: monthlyData.rows.map(r => ({
        year: parseInt(r.year),
        month: parseInt(r.month),
        count: parseInt(r.count)
      })),
      recentSessions: recentSessions.rows
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
});

// Badge qualification summary API
app.get('/api/badges/summary', async (req, res) => {
  try {
    // Get all moose_range sessions with their series data
    const sessions = await pool.query(`
      SELECT s.id, s.title, s.date
      FROM sessions s
      WHERE s.session_type = 'moose_range'
      ORDER BY s.date DESC
    `);

    let totalApproved = 0;
    let totalPoints = 0;
    let totalSuperscriptOnes = 0;
    const sessionIds = sessions.rows.map(s => s.id);

    if (sessionIds.length > 0) {
      const placeholders = sessionIds.map((_, i) => `$${i + 1}`).join(',');
      const allSeries = await pool.query(`
        SELECT shot1, shot2, shot3, shot4
        FROM moose_range_series
        WHERE session_id IN (${placeholders})
      `, sessionIds);

      for (const row of allSeries.rows) {
        const shots = [row.shot1, row.shot2, row.shot3, row.shot4];
        const complete = shots.every(s => s !== null && s !== undefined && s !== '');
        if (!complete) continue;
        const disq = shots.some(s => ['O', 'X'].includes(s));
        if (disq) continue;
        totalApproved++;
        const SHOT_POINTS = { '5^1': 5, '5': 5, '4': 4, '3': 3, 'T': 0 };
        totalPoints += shots.reduce((sum, s) => sum + (SHOT_POINTS[s] || 0), 0);
        totalSuperscriptOnes += shots.filter(s => s === '5^1').length;
      }
    }

    // Determine badge qualification
    const badge = { brons: false, silver: false, guld: false };
    if (totalApproved > 0) {
      if (totalPoints >= 40) {
        badge.guld = true;
        badge.silver = true;
        badge.brons = true;
      } else if (totalPoints >= 35) {
        badge.silver = true;
        badge.brons = true;
      } else if (totalPoints >= 30) {
        badge.brons = true;
      }
    }

    res.json({
      totalSessions: sessions.rows.length,
      totalApproved,
      totalPoints,
      totalSuperscriptOnes,
      badge,
      recentSessions: sessions.rows.slice(0, 5)
    });
  } catch (err) {
    console.error('Badge summary error:', err);
    res.status(500).json({ error: 'Failed to load badge summary' });
  }
});

// Locations - List
app.get('/locations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations ORDER BY name');
    res.render('locations', {
      title: res.locals.lang === 'en' ? 'Locations' : 'Platser',
      locations: result.rows,
      action: 'list'
    });
  } catch (err) {
    console.error('Locations error:', err);
    res.render('error', { message: 'Locations load failed' });
  }
});

// Locations - Create (form)
app.get('/locations/new', (req, res) => {
  res.render('locations', {
    title: res.locals.lang === 'en' ? 'New Location' : 'Ny plats',
    location: {},
    action: 'new'
  });
});

// Locations - Create (POST)
app.post('/locations', async (req, res) => {
  const { name, location_type, latitude, longitude, address, county, country, notes, county_board_id, property_designation } = req.body;
  const lang = res.locals.lang;
  try {
    await pool.query(
      `INSERT INTO locations (name, location_type, latitude, longitude, address, county, country, notes, county_board_id, property_designation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [name, location_type, latitude || null, longitude || null, address, county, country || 'Sverige', notes, county_board_id || null, property_designation || null]
    );
    res.redirect(`/locations?lang=${lang}`);
  } catch (err) {
    console.error('Create location error:', err);
    res.render('error', { message: 'Failed to create location' });
  }
});

// Locations - Detail (view)
app.get('/locations/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.render('error', { message: 'Location not found' });
    }
    res.render('locations', {
      title: result.rows[0].name,
      location: result.rows[0],
      action: 'detail'
    });
  } catch (err) {
    console.error('Detail location error:', err);
    res.render('error', { message: 'Failed to load location' });
  }
});

// Locations - Edit (form)
app.get('/locations/:id/edit', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.render('error', { message: 'Location not found' });
    }
    res.render('locations', {
      title: res.locals.lang === 'en' ? 'Edit Location' : 'Redigera plats',
      location: result.rows[0],
      action: 'edit'
    });
  } catch (err) {
    console.error('Edit location error:', err);
    res.render('error', { message: 'Failed to load location' });
  }
});

// Locations - Update (PUT)
app.post('/locations/:id/update', async (req, res) => {
  const { name, location_type, latitude, longitude, address, county, country, notes, county_board_id, property_designation } = req.body;
  const lang = res.locals.lang;
  try {
    await pool.query(
      `UPDATE locations
       SET name=$1, location_type=$2, latitude=$3, longitude=$4, address=$5, county=$6, country=$7, notes=$8, county_board_id=$9, property_designation=$10, updated_at=NOW()
       WHERE id=$11`,
      [name, location_type, latitude || null, longitude || null, address, county, country || 'Sverige', notes, county_board_id || null, property_designation || null, req.params.id]
    );
    res.redirect(`/locations/${req.params.id}?lang=${lang}`);
  } catch (err) {
    console.error('Update location error:', err);
    res.render('error', { message: 'Failed to update location' });
  }
});

// Locations - Delete
app.post('/locations/:id/delete', async (req, res) => {
  try {
    await pool.query('DELETE FROM locations WHERE id = $1', [req.params.id]);
    res.redirect('/locations');
  } catch (err) {
    console.error('Delete location error:', err);
    res.render('error', { message: 'Failed to delete location' });
  }
});

// ── Weapons — List ───────────────────────────────────────────────────────────
app.get('/weapons', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM weapons ORDER BY name');
    res.render('weapons', {
      title: res.locals.lang === 'en' ? 'Weapons' : 'Vapen',
      weapons: result.rows,
      action: 'list'
    });
  } catch (err) {
    console.error('Weapons error:', err);
    res.render('error', { message: 'Weapons load failed' });
  }
});

// ── Weapons — New form ───────────────────────────────────────────────────────
app.get('/weapons/new', (req, res) => {
  res.render('weapons', {
    title: res.locals.lang === 'en' ? 'New Weapon' : 'Nytt vapen',
    weapon: {},
    action: 'new'
  });
});

// ── Weapons — Create ─────────────────────────────────────────────────────────
app.post('/weapons', async (req, res) => {
  const { name, type, caliber, barrel_length, notes } = req.body;
  const lang = res.locals.lang;
  try {
    const result = await pool.query(
      `INSERT INTO weapons (name, type, caliber, barrel_length, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, type || null, caliber || null, barrel_length || null, notes || null]
    );
    res.redirect(`/weapons/${result.rows[0].id}?lang=${lang}`);
  } catch (err) {
    console.error('Create weapon error:', err);
    res.render('error', { message: 'Failed to create weapon' });
  }
});

// ── Weapons — Detail ─────────────────────────────────────────────────────────
app.get('/weapons/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM weapons WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.render('error', { message: 'Weapon not found' });
    res.render('weapons', {
      title: result.rows[0].name,
      weapon: result.rows[0],
      action: 'detail'
    });
  } catch (err) {
    console.error('Weapon detail error:', err);
    res.render('error', { message: 'Failed to load weapon' });
  }
});

// ── Weapons — Edit form ──────────────────────────────────────────────────────
app.get('/weapons/:id/edit', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM weapons WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.render('error', { message: 'Weapon not found' });
    res.render('weapons', {
      title: res.locals.lang === 'en' ? 'Edit Weapon' : 'Redigera vapen',
      weapon: result.rows[0],
      action: 'edit'
    });
  } catch (err) {
    console.error('Edit weapon error:', err);
    res.render('error', { message: 'Failed to load weapon' });
  }
});

// ── Weapons — Update ─────────────────────────────────────────────────────────
app.post('/weapons/:id/update', async (req, res) => {
  const { name, type, caliber, barrel_length, notes } = req.body;
  const lang = res.locals.lang;
  try {
    await pool.query(
      `UPDATE weapons SET name=$1, type=$2, caliber=$3, barrel_length=$4, notes=$5, updated_at=NOW() WHERE id=$6`,
      [name, type || null, caliber || null, barrel_length || null, notes || null, req.params.id]
    );
    res.redirect(`/weapons/${req.params.id}?lang=${lang}`);
  } catch (err) {
    console.error('Update weapon error:', err);
    res.render('error', { message: 'Failed to update weapon' });
  }
});

// ── Weapons — Delete ─────────────────────────────────────────────────────────
app.post('/weapons/:id/delete', async (req, res) => {
  const lang = res.locals.lang;
  try {
    await pool.query('DELETE FROM weapons WHERE id = $1', [req.params.id]);
    res.redirect(`/weapons?lang=${lang}`);
  } catch (err) {
    console.error('Delete weapon error:', err);
    res.render('error', { message: 'Failed to delete weapon' });
  }
});

// ── Ammunition — List ────────────────────────────────────────────────────────
app.get('/ammunition', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ammunition ORDER BY caliber, bullet_name NULLS LAST, type NULLS LAST');
    res.render('ammunition', {
      title: res.locals.lang === 'en' ? 'Ammunition' : 'Ammunition',
      ammunition: result.rows,
      action: 'list'
    });
  } catch (err) {
    console.error('Ammunition error:', err);
    res.render('error', { message: 'Ammunition load failed' });
  }
});

// ── Ammunition — New form ────────────────────────────────────────────────────
app.get('/ammunition/new', (req, res) => {
  res.render('ammunition', {
    title: res.locals.lang === 'en' ? 'New Ammunition' : 'Ny ammunition',
    ammo: {},
    action: 'new'
  });
});

// ── Ammunition — Create ──────────────────────────────────────────────────────
app.post('/ammunition', async (req, res) => {
  const lang = res.locals.lang;
  const {
    caliber, quantity, notes, ammo_type,
    bullet_name, bullet_construction, lead_free,
    bc_value, bc_type, bullet_weight, muzzle_velocity,
    shot_size, charge_weight, shot_material, cartridge_length
  } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO ammunition (caliber, quantity, notes, ammo_type,
        bullet_name, bullet_construction, lead_free, bc_value, bc_type, bullet_weight, muzzle_velocity,
        shot_size, charge_weight, shot_material, cartridge_length)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
      [
        caliber || null, quantity || null, notes || null, ammo_type || null,
        bullet_name || null, bullet_construction || null, lead_free === 'on' || lead_free === 'true' ? true : false,
        bc_value || null, bc_type || null, bullet_weight || null, muzzle_velocity || null,
        shot_size || null, charge_weight || null, shot_material || null, cartridge_length || null
      ]
    );
    res.redirect(`/ammunition/${result.rows[0].id}?lang=${lang}`);
  } catch (err) {
    console.error('Create ammunition error:', err);
    res.render('error', { message: 'Failed to create ammunition' });
  }
});

// ── Ammunition — Detail ──────────────────────────────────────────────────────
app.get('/ammunition/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ammunition WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.render('error', { message: 'Ammunition not found' });
    res.render('ammunition', {
      title: result.rows[0].bullet_name || result.rows[0].caliber || 'Ammunition',
      ammo: result.rows[0],
      action: 'detail'
    });
  } catch (err) {
    console.error('Ammunition detail error:', err);
    res.render('error', { message: 'Failed to load ammunition' });
  }
});

// ── Ammunition — Edit form ───────────────────────────────────────────────────
app.get('/ammunition/:id/edit', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ammunition WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.render('error', { message: 'Ammunition not found' });
    res.render('ammunition', {
      title: res.locals.lang === 'en' ? 'Edit Ammunition' : 'Redigera ammunition',
      ammo: result.rows[0],
      action: 'edit'
    });
  } catch (err) {
    console.error('Edit ammunition error:', err);
    res.render('error', { message: 'Failed to load ammunition' });
  }
});

// ── Ammunition — Update ──────────────────────────────────────────────────────
app.post('/ammunition/:id/update', async (req, res) => {
  const lang = res.locals.lang;
  const {
    caliber, quantity, notes, ammo_type,
    bullet_name, bullet_construction, lead_free,
    bc_value, bc_type, bullet_weight, muzzle_velocity,
    shot_size, charge_weight, shot_material, cartridge_length
  } = req.body;
  try {
    await pool.query(
      `UPDATE ammunition SET caliber=$1, quantity=$2, notes=$3, ammo_type=$4,
        bullet_name=$5, bullet_construction=$6, lead_free=$7, bc_value=$8, bc_type=$9,
        bullet_weight=$10, muzzle_velocity=$11, shot_size=$12, charge_weight=$13,
        shot_material=$14, cartridge_length=$15, updated_at=NOW()
       WHERE id=$16`,
      [
        caliber || null, quantity || null, notes || null, ammo_type || null,
        bullet_name || null, bullet_construction || null, lead_free === 'on' || lead_free === 'true' ? true : false,
        bc_value || null, bc_type || null, bullet_weight || null, muzzle_velocity || null,
        shot_size || null, charge_weight || null, shot_material || null, cartridge_length || null,
        req.params.id
      ]
    );
    res.redirect(`/ammunition/${req.params.id}?lang=${lang}`);
  } catch (err) {
    console.error('Update ammunition error:', err);
    res.render('error', { message: 'Failed to update ammunition' });
  }
});

// ── Ammunition — Delete ──────────────────────────────────────────────────────
app.post('/ammunition/:id/delete', async (req, res) => {
  const lang = res.locals.lang;
  try {
    await pool.query('DELETE FROM ammunition WHERE id = $1', [req.params.id]);
    res.redirect(`/ammunition?lang=${lang}`);
  } catch (err) {
    console.error('Delete ammunition error:', err);
    res.render('error', { message: 'Failed to delete ammunition' });
  }
});

// Reports
app.get('/reports', async (req, res) => {
  res.render('reports', {
    title: res.locals.lang === 'en' ? 'Reports' : 'Rapporter'
  });
});

// Settings
app.get('/settings', (req, res) => {
  res.render('settings', {
    title: res.locals.lang === 'en' ? 'Settings' : 'Inställningar'
  });
});

// ── 404 ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

// ── Server Start ────────────────────────────────
app.listen(port, () => {
  console.log(`🎯 HuntLedger running on port ${port}`);
  console.log(`📍 Visit: http://localhost:${port}`);
});
