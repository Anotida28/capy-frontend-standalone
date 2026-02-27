import path from "node:path";

type BasicUserMap = Map<string, string>;

const DEFAULT_USERS = "admin:admin,finance:finance,sitemanager:sitemanager,stores:stores";

function resolveDbFilePath(dbFile?: string) {
  const value = dbFile?.trim() || "src/db/data.json";
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

function parsePort(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8080;
}

function parseBasicUsers(value?: string): BasicUserMap {
  const source = value?.trim() || DEFAULT_USERS;
  const pairs = source
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const map: BasicUserMap = new Map();
  for (const pair of pairs) {
    const separator = pair.indexOf(":");
    if (separator <= 0 || separator === pair.length - 1) {
      continue;
    }
    const username = pair.slice(0, separator).trim();
    const password = pair.slice(separator + 1).trim();
    if (!username || !password) continue;
    map.set(username, password);
  }

  if (map.size === 0) {
    return parseBasicUsers(DEFAULT_USERS);
  }

  return map;
}

export const CONFIG = {
  port: parsePort(process.env.PORT),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  dbFile: resolveDbFilePath(process.env.DB_FILE),
  basicUsers: parseBasicUsers(process.env.BASIC_AUTH_USERS)
};
