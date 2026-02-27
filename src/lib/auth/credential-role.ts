"use client";

import type { Role } from "@/lib/auth/access-control";

const ROLE_BY_USERNAME: Record<string, Role> = {
  admin: "OPERATIONS_DIRECTOR",
  finance: "FINANCE",
  sitemanager: "SITE_MANAGER",
  stores: "STORES"
};

const ROLE_BY_CREDENTIAL: Record<string, Role> = {
  "admin:admin": "OPERATIONS_DIRECTOR",
  "admin:admin123": "OPERATIONS_DIRECTOR",
  "finance:finance": "FINANCE",
  "sitemanager:sitemanager": "SITE_MANAGER",
  "sitemanager:site123": "SITE_MANAGER",
  "stores:stores": "STORES"
};

export function resolveRoleFromUsername(username: string): Role | null {
  if (!username) return null;
  const key = username.trim().toLowerCase();
  return ROLE_BY_USERNAME[key] ?? null;
}

export function resolveRoleFromCredentials(username: string, password: string): Role | null {
  if (!username || !password) return null;
  const key = `${username.trim().toLowerCase()}:${password}`;
  return ROLE_BY_CREDENTIAL[key] ?? null;
}
