"use client";

import type { Role } from "@/lib/auth/access-control";

const ROLE_BY_CREDENTIAL: Record<string, Role> = {
  "admin:admin": "OPERATIONS_DIRECTOR",
  "finance:finance": "FINANCE",
  "sitemanager:sitemanager": "SITE_MANAGER",
  "stores:stores": "STORES"
};

export function resolveRoleFromCredentials(username: string, password: string): Role | null {
  if (!username || !password) return null;
  const key = `${username}:${password}`;
  return ROLE_BY_CREDENTIAL[key] ?? null;
}
