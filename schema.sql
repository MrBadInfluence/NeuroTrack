CREATE TABLE IF NOT EXISTS medications (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT        NOT NULL,               -- generic drug name e.g. "Levetiracetam"
  dosage              TEXT,                               -- dose amount e.g. "1000" (mg)
  frequency           TEXT,                               -- e.g. "Twice Daily"
  purpose             TEXT,
  prescribing_doctor  TEXT,
  start_date          TEXT,                               -- YYYY-MM-DD
  notes               TEXT,
  is_active           BOOLEAN     NOT NULL DEFAULT true,  -- false = discontinued
  created_date        TEXT,
  updated_date        TEXT
);
CREATE INDEX IF NOT EXISTS medications_is_active_idx ON medications (is_active);
CREATE TABLE IF NOT EXISTS seizures (
  id            UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  seizure_type  TEXT,
  date_time     TEXT,                -- ISO 8601 timestamp string
  duration      TEXT,                -- duration in minutes
  severity      INTEGER  CHECK (severity BETWEEN 1 AND 10),  -- user-rated 1–10
  location      TEXT,
  notes         TEXT,
  triggers      TEXT,
  created_date  TEXT,
  updated_date  TEXT
);
CREATE INDEX IF NOT EXISTS seizures_date_time_idx ON seizures (date_time DESC);
-- ============================================================
CREATE TABLE IF NOT EXISTS medication_reminders (
  id             UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id  UUID   NOT NULL REFERENCES medications (id) ON DELETE CASCADE,
  time           TEXT,              -- HH:MM
  days_of_week   JSONB,             -- e.g. ["Mon","Wed","Fri"]
  active_at      TEXT,
  notes          TEXT,
  created_date   TEXT,
  updated_date   TEXT
);
CREATE INDEX IF NOT EXISTS reminders_medication_id_idx ON medication_reminders (medication_id);
-- ============================================================
CREATE TABLE IF NOT EXISTS dose_logs (
  id             UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id  UUID   NOT NULL REFERENCES medications (id) ON DELETE CASCADE,
  timestamp      TEXT,              -- ISO 8601 — when the dose was logged
  status         TEXT   NOT NULL CHECK (status IN ('taken', 'missed', 'skipped')),
  notes          TEXT,
  created_date   TEXT,
  updated_date   TEXT
);
CREATE INDEX IF NOT EXISTS dose_logs_medication_id_idx ON dose_logs (medication_id);
CREATE INDEX IF NOT EXISTS dose_logs_timestamp_idx     ON dose_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS dose_logs_status_idx        ON dose_logs (status);
-- ============================================================
ALTER TABLE medications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE seizures             ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_logs            ENABLE ROW LEVEL SECURITY;
-- ============================================================
-- Fix seizures table to match the app
ALTER TABLE seizures DROP CONSTRAINT IF EXISTS seizures_severity_check;
ALTER TABLE seizures ALTER COLUMN severity TYPE TEXT USING NULL;
ALTER TABLE seizures ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE seizures ADD COLUMN IF NOT EXISTS nocturnal BOOLEAN DEFAULT false;
ALTER TABLE seizures ADD COLUMN IF NOT EXISTS post_ictal_symptoms TEXT;
-- Fix medication_reminders
ALTER TABLE medication_reminders
  ADD COLUMN IF NOT EXISTS medication_name TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
-- Fix dose_logs
ALTER TABLE dose_logs
  ADD COLUMN IF NOT EXISTS medication_name TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_date TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_time TEXT,
  ADD COLUMN IF NOT EXISTS taken_at TEXT;
-- ============================================================
create policy "allow all" on medications          for all using (true) with check (true);
create policy "allow all" on seizures             for all using (true) with check (true);
create policy "allow all" on medication_reminders for all using (true) with check (true);
create policy "allow all" on dose_logs            for all using (true) with check (true);