import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());

// ---------------------------------------------------------------------------
// Data directory — all JSON files live here
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Entity → filename mapping
const FILES = {
  Seizure:           'seizures.json',
  Medication:        'medications.json',
  MedicationReminder:'reminders.json',
  DoseLog:           'dose_logs.json',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readAll(entity) {
  const file = path.join(DATA_DIR, FILES[entity]);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function writeAll(entity, records) {
  const file = path.join(DATA_DIR, FILES[entity]);
  fs.writeFileSync(file, JSON.stringify(records, null, 2), 'utf8');
}

// Sort helper — mirrors Base44's "-field" descending / "field" ascending syntax
function sortRecords(records, orderBy) {
  if (!orderBy) return records;
  const desc = orderBy.startsWith('-');
  const field = desc ? orderBy.slice(1) : orderBy;
  return [...records].sort((a, b) => {
    const av = a[field] ?? '';
    const bv = b[field] ?? '';
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

// ---------------------------------------------------------------------------
// Generic CRUD routes for each entity
// GET    /api/:entity          — list (supports ?order_by=&limit=)
// POST   /api/:entity          — create
// PUT    /api/:entity/:id      — update
// DELETE /api/:entity/:id      — delete
// ---------------------------------------------------------------------------
app.get('/api/:entity', (req, res) => {
  const { entity } = req.params;
  if (!FILES[entity]) return res.status(404).json({ error: 'Unknown entity' });

  let records = readAll(entity);
  const { order_by, limit } = req.query;
  if (order_by) records = sortRecords(records, order_by);
  if (limit)    records = records.slice(0, parseInt(limit, 10));

  res.json(records);
});

app.post('/api/:entity', (req, res) => {
  const { entity } = req.params;
  if (!FILES[entity]) return res.status(404).json({ error: 'Unknown entity' });

  const records = readAll(entity);
  const now = new Date().toISOString();
  const newRecord = {
    ...req.body,
    id: randomUUID(),
    created_date: now,
    updated_date: now,
  };
  records.push(newRecord);
  writeAll(entity, records);
  res.status(201).json(newRecord);
});

app.put('/api/:entity/:id', (req, res) => {
  const { entity, id } = req.params;
  if (!FILES[entity]) return res.status(404).json({ error: 'Unknown entity' });

  const records = readAll(entity);
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  records[idx] = {
    ...records[idx],
    ...req.body,
    id,                              // never overwrite id
    created_date: records[idx].created_date,
    updated_date: new Date().toISOString(),
  };
  writeAll(entity, records);
  res.json(records[idx]);
});

app.delete('/api/:entity/:id', (req, res) => {
  const { entity, id } = req.params;
  if (!FILES[entity]) return res.status(404).json({ error: 'Unknown entity' });

  const records = readAll(entity);
  const filtered = records.filter(r => r.id !== id);
  if (filtered.length === records.length) return res.status(404).json({ error: 'Not found' });

  writeAll(entity, filtered);
  res.json({ success: true });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`NeuroTrack API server running at http://localhost:${PORT}`);
  console.log(`Data stored in: ${DATA_DIR}`);
});
