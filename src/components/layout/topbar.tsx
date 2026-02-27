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

export default function Topbar({
  onToggleNav,
  isNavOpen
}: {
  onToggleNav: () => void;
  isNavOpen: boolean;
}) {
  const pathname = usePathname();
  const { role } = useAuth();

  const heading = useMemo(() => resolveHeading(pathname, role as Role | null), [pathname, role]);

  return (
    <header className="topbar">
      <ContentContainer className="topbar-inner">
        <button
          type="button"
          className="topbar-menu-button"
          aria-label={isNavOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isNavOpen}
          onClick={onToggleNav}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {isNavOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
        <div className="topbar-heading">
          <h2>{heading.title}</h2>
          <p className="muted">{heading.subtitle}</p>
        </div>
      </ContentContainer>
    </header>
  );
}
