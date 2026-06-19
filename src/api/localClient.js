/**
 * localClient.js — Supabase-primary API client with AsyncStorage offline fallback
 *
 * Strategy:
 *   READ  — Try Supabase. On success, cache the result. On network failure, return cache.
 *   WRITE — Try Supabase. On network failure, save locally + enqueue the op.
 *   SYNC  — Call syncOfflineQueue() on app start / foreground. Flushes pending ops to Supabase.
 */

import supabase from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TABLES = {
  Seizure:            'seizures',
  Medication:         'medications',
  MedicationReminder: 'medication_reminders',
  DoseLog:            'dose_logs',
};

const QUEUE_KEY      = 'neurotrack_offline_queue';
const DEAD_QUEUE_KEY = 'neurotrack_dead_queue';   // ops that failed for non-network reasons
const cacheKey       = (table) => `neurotrack_cache_${table}`;
const tempId         = () => `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// Detects a network-level failure vs a real Supabase / data error
function isNetworkError(err) {
  const msg = (err?.message || '').toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network request failed') ||
    msg.includes('fetch failed') ||
    msg.includes('network error') ||
    msg.includes('unable to resolve') ||
    msg.includes('etimedout') ||
    msg.includes('econnrefused') ||
    msg.includes('timeout')
  );
}

// ── AsyncStorage helpers ──────────────────────────────────────────────────────

async function readCache(table) {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(table));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeCache(table, data) {
  try {
    await AsyncStorage.setItem(cacheKey(table), JSON.stringify(data));
  } catch {}
}

async function readQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue) {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

async function enqueue(op) {
  const queue = await readQueue();
  queue.push(op);
  await writeQueue(queue);
}

async function readDeadQueue() {
  try {
    const raw = await AsyncStorage.getItem(DEAD_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeDeadQueue(queue) {
  try {
    await AsyncStorage.setItem(DEAD_QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

/** Returns the number of operations that failed to sync for non-network reasons. */
export async function getFailedSyncCount() {
  const dq = await readDeadQueue();
  return dq.length;
}

/** Clears the dead-letter queue (call after user acknowledges failures). */
export async function clearDeadQueue() {
  await writeDeadQueue([]);
}

// ── Sync offline queue to Supabase ────────────────────────────────────────────
// Call this on app start and whenever the app returns to foreground.

export async function syncOfflineQueue() {
  const queue = await readQueue();
  if (queue.length === 0) return;

  const remaining = [];

  for (const op of queue) {
    try {
      const now = new Date().toISOString();

      if (op.type === 'create') {
        const { data: row, error } = await supabase
          .from(op.table)
          .insert({ ...op.data, created_date: now, updated_date: now })
          .select()
          .single();
        if (error) throw error;

        // Swap the temp id for the real Supabase id in the cache
        const cached = await readCache(op.table);
        const idx = cached.findIndex(r => r.id === op.tempId);
        if (idx >= 0) cached[idx] = row; else cached.unshift(row);
        await writeCache(op.table, cached);

      } else if (op.type === 'update') {
        const { id: _id, created_date: _cd, ...fields } = op.data;
        const { data: row, error } = await supabase
          .from(op.table)
          .update({ ...fields, updated_date: now })
          .eq('id', op.id)
          .select()
          .single();
        if (error) throw error;

        const cached = await readCache(op.table);
        const idx = cached.findIndex(r => r.id === op.id);
        if (idx >= 0) cached[idx] = row;
        await writeCache(op.table, cached);

      } else if (op.type === 'delete') {
        const { error } = await supabase.from(op.table).delete().eq('id', op.id);
        if (error) throw error;
      }

    } catch (err) {
      if (isNetworkError(err)) {
        remaining.push(op); // still offline — keep in queue
      } else {
        // Non-network error (constraint violation, permission denied, etc.)
        // Move to dead-letter queue so the user can be informed rather than
        // silently losing the data.
        console.error('[NeuroTrack] Sync op failed permanently:', err?.message, op);
        const dead = await readDeadQueue();
        dead.push({ ...op, error: err?.message || 'Unknown error', failedAt: new Date().toISOString() });
        await writeDeadQueue(dead);
      }
    }
  }

  await writeQueue(remaining);
}

// ── Generic CRUD factory ──────────────────────────────────────────────────────

function makeEntity(entityName) {
  const table = TABLES[entityName];

  return {
    /** Fetch from Supabase, cache on success. Fall back to cache when offline. */
    async list(orderBy = '-created_date', limit = 100) {
      try {
        let query = supabase.from(table).select('*');
        if (orderBy) {
          const desc  = orderBy.startsWith('-');
          const field = desc ? orderBy.slice(1) : orderBy;
          query = query.order(field, { ascending: !desc });
        }
        if (limit) query = query.limit(limit);

        const { data, error } = await query;
        if (error) throw error;

        const result = data || [];
        await writeCache(table, result); // keep local cache fresh
        return result;
      } catch (err) {
        if (isNetworkError(err)) return readCache(table);
        throw err;
      }
    },

    /** Write to Supabase. If offline, save locally + queue for later sync. */
    async create(data) {
      const now = new Date().toISOString();

      // Attach the signed-in user's id so Supabase RLS can enforce row ownership.
      // getSession() returns the cached token without a network round-trip.
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const payload = { ...data, created_date: now, updated_date: now };
      if (userId) payload.user_id = userId;

      try {
        const { data: row, error } = await supabase
          .from(table)
          .insert(payload)
          .select()
          .single();
        if (error) throw error;

        // Update cache with the real row
        const cached = await readCache(table);
        cached.unshift(row);
        await writeCache(table, cached);
        return row;

      } catch (err) {
        if (!isNetworkError(err)) throw err;

        // Offline — save locally with a temp id and enqueue with user_id included
        const id     = tempId();
        const record = { ...payload, id };
        const cached = await readCache(table);
        cached.unshift(record);
        await writeCache(table, cached);
        await enqueue({ type: 'create', table, data: { ...data, user_id: userId }, tempId: id });
        return record;
      }
    },

    async update(id, data) {
      const now = new Date().toISOString();

      // Record was created offline and hasn't synced yet — update locally only
      if (String(id).startsWith('temp_')) {
        const updated = { ...data, id, updated_date: now };
        const cached  = await readCache(table);
        const idx     = cached.findIndex(r => r.id === id);
        if (idx >= 0) cached[idx] = updated;
        await writeCache(table, cached);
        const queue = await readQueue();
        const qi    = queue.findIndex(op => op.type === 'create' && op.tempId === id);
        // Merge rather than replace so fields from the original create (e.g. user_id) are preserved.
        if (qi >= 0) queue[qi].data = { ...queue[qi].data, ...data };
        await writeQueue(queue);
        return updated;
      }

      const { id: _id, created_date: _cd, ...fields } = data;

      try {
        const { data: row, error } = await supabase
          .from(table)
          .update({ ...fields, updated_date: now })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;

        const cached = await readCache(table);
        const idx    = cached.findIndex(r => r.id === id);
        if (idx >= 0) cached[idx] = row;
        await writeCache(table, cached);
        return row;

      } catch (err) {
        if (!isNetworkError(err)) throw err;

        // Offline — update cache and queue
        const updated = { ...data, id, updated_date: now };
        const cached  = await readCache(table);
        const idx     = cached.findIndex(r => r.id === id);
        if (idx >= 0) cached[idx] = updated;
        await writeCache(table, cached);
        await enqueue({ type: 'update', table, id, data });
        return updated;
      }
    },

    async delete(id) {
      // Record was created offline — just remove locally and cancel the create op
      if (String(id).startsWith('temp_')) {
        const cached = await readCache(table);
        await writeCache(table, cached.filter(r => r.id !== id));
        const queue = await readQueue();
        await writeQueue(queue.filter(op => !(op.type === 'create' && op.tempId === id)));
        return { success: true };
      }

      try {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        await enqueue({ type: 'delete', table, id });
      }

      // Always remove from local cache immediately
      const cached = await readCache(table);
      await writeCache(table, cached.filter(r => r.id !== id));
      return { success: true };
    },
  };
}

// ── Public client ─────────────────────────────────────────────────────────────

export const localClient = {
  entities: {
    Seizure:            makeEntity('Seizure'),
    Medication:         makeEntity('Medication'),
    MedicationReminder: makeEntity('MedicationReminder'),
    DoseLog:            makeEntity('DoseLog'),
  },
};
