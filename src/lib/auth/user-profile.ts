"use client";

export function resolveStaffIdForUser(username?: string | null) {
  if (!username) return null;
  const normalized = username.toLowerCase();
  if (normalized === "sitemanager") return "staff-002";
  if (normalized === "admin") return "staff-001";
  return null;
}
