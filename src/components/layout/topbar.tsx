"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import type { Role } from "@/lib/auth/access-control";
import { ContentContainer } from "@/components/layout/content-container";

function resolveHeading(pathname: string, role: Role | null) {
  if (role === "SITE_MANAGER") {
    return { title: "Site Manager", subtitle: "Manage daily site activity." };
  }
  if (role === "STORES" || pathname.startsWith("/stores")) {
    return { title: "Stores", subtitle: "Manage stock requests, allocations, and dispatches." };
  }
  if (pathname.startsWith("/finance")) {
    return { title: "Finance", subtitle: "Track budgets, procurement, and invoices." };
  }
  if (
    pathname.startsWith("/projects") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/allocations") ||
    pathname.startsWith("/daily-logs") ||
    pathname.startsWith("/reference") ||
    pathname.startsWith("/operations")
  ) {
    return { title: "Operations", subtitle: "Manage projects, assets, and daily activity." };
  }
  return { title: "Dashboard", subtitle: "Monitor operations and finance activity." };
}

export default function Topbar() {
  const pathname = usePathname();
  const { role } = useAuth();

  const heading = useMemo(() => resolveHeading(pathname, role as Role | null), [pathname, role]);

  return (
    <header className="topbar">
      <ContentContainer className="topbar-inner">
        <div className="topbar-heading">
          <h2>{heading.title}</h2>
          <p className="muted">{heading.subtitle}</p>
        </div>
      </ContentContainer>
    </header>
  );
}
