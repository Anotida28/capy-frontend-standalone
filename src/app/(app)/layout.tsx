"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { isAuthenticated } from "@/lib/auth/auth-store";
import { useAuth } from "@/providers/auth-provider";
import { getDefaultRouteForRole, isRouteAllowed } from "@/lib/auth/access-control";
import type { Role } from "@/lib/auth/access-control";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuth();

  const isRole = (value: string | null): value is Role =>
    value === "OPERATIONS_DIRECTOR" || value === "FINANCE" || value === "SITE_MANAGER" || value === "STORES";

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (isRole(role) && !isRouteAllowed(role, pathname)) {
      router.replace(getDefaultRouteForRole(role));
    }
  }, [router, pathname, role]);

  return <AppShell>{children}</AppShell>;
}
