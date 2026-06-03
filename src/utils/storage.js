/**
 * storage.js — AsyncStorage helpers
 *
 * Wraps @react-native-async-storage/async-storage with simple get/set/remove
 * helpers that mirror the web app's localStorage usage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/** Read a plain string — returns null if the key doesn't exist or on error. */
export async function storageGet(key) {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Write a plain string — silently ignores errors. */
export async function storageSet(key, value) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {}
}

/** Read and JSON-parse a stored value — returns null if missing or on error. */
export async function storageGetJSON(key) {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

/** JSON-stringify and write a value — silently ignores errors. */
export async function storageSetJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** Remove a key from storage — silently ignores errors. */
export async function storageRemove(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}
