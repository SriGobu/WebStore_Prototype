import { SEED } from "./seedData";

// Single in-memory "database" that behaves like the backend: it is seeded
// once, persisted to localStorage so changes survive a refresh, and can be
// reset from the main page.

const STORAGE_KEY = "webstore-mock-db-v1";

const clone = (v) => JSON.parse(JSON.stringify(v));

function readStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

let db = readStorage() ?? clone(SEED);

export function getDb() {
  return db;
}

export function saveDb() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // storage full / unavailable — data simply stays in memory for this session
  }
}

export function resetDb() {
  db = clone(SEED);
  saveDb();
}

let counter = Date.now();
export function newId(prefix) {
  counter += 1;
  return `${prefix}_${counter.toString(36)}`;
}

export const nowIso = () => new Date().toISOString();
