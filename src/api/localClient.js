/**
 * localClient.js
 *
 * API client for NeuroTrack.
 * All data is stored in JSON files on disk via the local Express server (server.js).
 *
 * Exposes the interface that the pages use:
 *   localClient.entities.Seizure.list(orderBy, limit)
 *   localClient.entities.Seizure.create(data)
 *   localClient.entities.Seizure.update(id, data)
 *   localClient.entities.Seizure.delete(id)
 *   (same for Medication, MedicationReminder, DoseLog)
 */

// Vite proxies /api → http://localhost:3001/api during development
// In production you'd point this at your actual server
const API_BASE = '/api';

async function apiFetch(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function makeEntity(entityName) {
  return {
    /**
     * List records, optionally sorted and limited.
     * @param {string} orderBy  e.g. '-date_time' (descending) or 'created_date'
     * @param {number} limit
     */
    list(orderBy, limit) {
      const params = new URLSearchParams();
      if (orderBy) params.set('order_by', orderBy);
      if (limit)   params.set('limit', limit);
      const qs = params.toString() ? `?${params}` : '';
      return apiFetch('GET', `/${entityName}${qs}`);
    },

    /** Create a new record. Returns the created record (with generated id). */
    create(data) {
      return apiFetch('POST', `/${entityName}`, data);
    },

    /** Update an existing record by id. Returns the updated record. */
    update(id, data) {
      return apiFetch('PUT', `/${entityName}/${id}`, data);
    },

    /** Delete a record by id. */
    delete(id) {
      return apiFetch('DELETE', `/${entityName}/${id}`);
    },
  };
}

export const localClient = {
  entities: {
    Seizure:            makeEntity('Seizure'),
    Medication:         makeEntity('Medication'),
    MedicationReminder: makeEntity('MedicationReminder'),
    DoseLog:            makeEntity('DoseLog'),
  },
};
