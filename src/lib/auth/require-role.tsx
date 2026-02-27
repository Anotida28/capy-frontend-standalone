"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";

export function RoleGate({
  allowed,
  children,
  fallback = null
}: {
  allowed: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { role } = useAuth();
  if (!role || !allowed.includes(role)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

export function useCanEdit() {
  const { role } = useAuth();
  return role === "OPERATIONS_DIRECTOR";
}

export function useCanManageProject() {
  const { role } = useAuth();
  return role === "OPERATIONS_DIRECTOR" || role === "SITE_MANAGER";
}

export function useCanView() {
  const { role } = useAuth();
  return role === "OPERATIONS_DIRECTOR" || role === "FINANCE" || role === "SITE_MANAGER" || role === "STORES";
}
