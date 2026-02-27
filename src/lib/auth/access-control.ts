"use client";

import { routes } from "@/lib/constants/routes";

export type Role = "OPERATIONS_DIRECTOR" | "FINANCE" | "SITE_MANAGER" | "STORES";

const operationsPrefixes = [
  routes.dashboard,
  routes.projects,
  routes.assets,
  routes.allocations,
  routes.dailyLogs,
  routes.reference,
  "/operations"
];

const financePrefixes = ["/finance", "/operations/vendors"];
const storesPrefixes = [routes.storesDashboard, "/stores"];

const siteManagerPrefixes = [
  routes.siteManagerDashboard,
  routes.siteManagerProjects,
  routes.siteManagerTimesheets,
  routes.dailyLogs,
  routes.inventoryManagement,
  "/operations/daily-logs"
];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isRouteAllowed(role: Role, pathname: string) {
  const prefixes =
    role === "FINANCE"
      ? financePrefixes
      : role === "STORES"
      ? storesPrefixes
      : role === "SITE_MANAGER"
      ? siteManagerPrefixes
      : [...operationsPrefixes, ...storesPrefixes, ...financePrefixes];
  return prefixes.some((prefix) => matchesPrefix(pathname, prefix));
}

export function getDefaultRouteForRole(role: Role) {
  if (role === "FINANCE") return routes.financeDashboard;
  if (role === "STORES") return routes.storesDashboard;
  if (role === "SITE_MANAGER") return routes.dailyLogs;
  return routes.dashboard;
}
