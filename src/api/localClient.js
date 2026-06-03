/**
 * localClient.js — Supabase API client
 *
 * Drop-in replacement for the old Express REST client.
 * Exposes the same interface (localClient.entities.X.list/create/update/delete)
 * so no other files need to change.
 *
 * Tables:  seizures · medications · medication_reminders · dose_logs
 */

import supabase from '../lib/supabase';

// ── Entity → table name map ───────────────────────────────────────────────────
const TABLES = {
  Seizure:            'seizures',
  Medication:         'medications',
  MedicationReminder: 'medication_reminders',
  DoseLog:            'dose_logs',
};

// ── Generic CRUD factory ──────────────────────────────────────────────────────
function makeEntity(entityName) {
  const table = TABLES[entityName];

  return {
    /** list(orderBy, limit)  —  orderBy prefix '-' = descending */
    async list(orderBy = '-created_date', limit = 100) {
      let query = supabase.from(table).select('*');

      if (orderBy) {
        const desc  = orderBy.startsWith('-');
        const field = desc ? orderBy.slice(1) : orderBy;
        query = query.order(field, { ascending: !desc });
      }

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    /** create(data) */
    async create(data) {
      const now = new Date().toISOString();
      const { data: row, error } = await supabase
        .from(table)
        .insert({ ...data, created_date: now, updated_date: now })
        .select()
        .single();
      if (error) throw error;
      return row;
    },

    /** update(id, data) */
    async update(id, data) {
      // Strip immutable fields so Postgres doesn't reject them
      const { id: _id, created_date: _cd, ...fields } = data;
      const { data: row, error } = await supabase
        .from(table)
        .update({ ...fields, updated_date: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return row;
    },

    /** delete(id) */
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
  };
}

// ── Public client ─────────────────────────────────────────────────────────────
export const localClient = {
  /** Medication name search — used by MedicationForm combobox */
  async searchMedications({ query, limit = 5 }) {
    const { data, error } = await supabase
      .from('medications')
      .select('id, name, dosage')
      .ilike('name', `%${query}%`)
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  entities: {
    Seizure:            makeEntity('Seizure'),
    Medication:         makeEntity('Medication'),
    MedicationReminder: makeEntity('MedicationReminder'),
    DoseLog:            makeEntity('DoseLog'),
  },
};
