import { promises as fs } from "node:fs";
import path from "node:path";
import { CONFIG } from "../config.js";

export type DbRow = Record<string, unknown>;
export type DbShape = Record<string, DbRow[]>;

let queue: Promise<unknown> = Promise.resolve();

function clone<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

async function ensureDbFile() {
  const dir = path.dirname(CONFIG.dbFile);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(CONFIG.dbFile);
  } catch {
    await fs.writeFile(CONFIG.dbFile, "{}\n", "utf8");
  }
}

async function readDbUnsafe(): Promise<DbShape> {
  await ensureDbFile();
  const raw = await fs.readFile(CONFIG.dbFile, "utf8");
  const parsed = JSON.parse(raw || "{}") as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid DB file shape");
  }

  const normalized: DbShape = {};
  for (const [key, value] of Object.entries(parsed)) {
    normalized[key] = Array.isArray(value) ? (value as DbRow[]) : [];
  }

  return normalized;
}

async function writeDbUnsafe(db: DbShape): Promise<void> {
  await ensureDbFile();
  const tmpFile = `${CONFIG.dbFile}.tmp`;
  const payload = `${JSON.stringify(db, null, 2)}\n`;
  await fs.writeFile(tmpFile, payload, "utf8");
  await fs.rename(tmpFile, CONFIG.dbFile);
}

function ensureCollection(db: DbShape, name: string): DbRow[] {
  if (!Array.isArray(db[name])) {
    db[name] = [];
  }
  return db[name];
}

export function readDb() {
  return runExclusive(async () => clone(await readDbUnsafe()));
}

export function writeDb(db: DbShape) {
  return runExclusive(async () => {
    await writeDbUnsafe(clone(db));
  });
}

export function getCollection(name: string) {
  return runExclusive(async () => {
    const db = await readDbUnsafe();
    return clone(ensureCollection(db, name));
  });
}

export function findById(name: string, id: string, idKey: string = "id") {
  return runExclusive(async () => {
    const db = await readDbUnsafe();
    const list = ensureCollection(db, name);
    const found = list.find((item) => item[idKey] === id);
    return clone(found);
  });
}

export function create(name: string, payload: DbRow) {
  return runExclusive(async () => {
    const db = await readDbUnsafe();
    const list = ensureCollection(db, name);
    list.push(payload);
    await writeDbUnsafe(db);
    return clone(payload);
  });
}

export function update(name: string, id: string, payload: DbRow, idKey: string = "id") {
  return runExclusive(async () => {
    const db = await readDbUnsafe();
    const list = ensureCollection(db, name);
    const index = list.findIndex((item) => item[idKey] === id);
    if (index < 0) {
      return undefined;
    }

    const current = list[index];
    const next = { ...current, ...payload, [idKey]: id };
    list[index] = next;
    await writeDbUnsafe(db);
    return clone(next);
  });
}

export function remove(name: string, id: string, idKey: string = "id") {
  return runExclusive(async () => {
    const db = await readDbUnsafe();
    const list = ensureCollection(db, name);
    const index = list.findIndex((item) => item[idKey] === id);
    if (index < 0) {
      return false;
    }
    list.splice(index, 1);
    await writeDbUnsafe(db);
    return true;
  });
}

export function mutateCollection<T>(name: string, mutator: (collection: DbRow[], db: DbShape) => T) {
  return runExclusive(async () => {
    const db = await readDbUnsafe();
    const collection = ensureCollection(db, name);
    const result = mutator(collection, db);
    await writeDbUnsafe(db);
    return clone(result);
  });
}
