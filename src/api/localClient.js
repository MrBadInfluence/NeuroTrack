/**
 * localClient.js
 *
 * Device-local storage client for NeuroTrack.
 * All data is persisted in localStorage on the device — no server required.
 *
 * Interface:
 *   localClient.entities.Seizure.list(orderBy, limit)
 *   localClient.entities.Seizure.create(data)
 *   localClient.entities.Seizure.update(id, data)
 *   localClient.entities.Seizure.delete(id)
 *   (same for Medication, MedicationReminder, DoseLog)
 */

const STORAGE_KEYS = {
  Seizure:            'neurotrack_seizures',
  Medication:         'neurotrack_medications',
  MedicationReminder: 'neurotrack_reminders',
  DoseLog:            'neurotrack_dose_logs',
};

function getRecords(entityName) {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS[entityName]) || '[]');
  } catch {
    return [];
  }
}

function saveRecords(entityName, records) {
  localStorage.setItem(STORAGE_KEYS[entityName], JSON.stringify(records));
}

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

function makeEntity(entityName) {
  return {
    list(orderBy, limit) {
      let records = getRecords(entityName);
      if (orderBy) records = sortRecords(records, orderBy);
      if (limit)   records = records.slice(0, limit);
      return Promise.resolve(records);
    },

    create(data) {
      const records = getRecords(entityName);
      const now = new Date().toISOString();
      const newRecord = {
        ...data,
        id: crypto.randomUUID(),
        created_date: now,
        updated_date: now,
      };
      records.push(newRecord);
      saveRecords(entityName, records);
      return Promise.resolve(newRecord);
    },

    update(id, data) {
      const records = getRecords(entityName);
      const idx = records.findIndex(r => r.id === id);
      if (idx === -1) return Promise.reject(new Error('Record not found'));
      records[idx] = {
        ...records[idx],
        ...data,
        id,
        created_date: records[idx].created_date,
        updated_date: new Date().toISOString(),
      };
      saveRecords(entityName, records);
      return Promise.resolve(records[idx]);
    },

    delete(id) {
      const records = getRecords(entityName);
      saveRecords(entityName, records.filter(r => r.id !== id));
      return Promise.resolve({ id });
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
