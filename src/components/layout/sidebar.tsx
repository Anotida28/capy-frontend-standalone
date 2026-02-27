"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import type { Role } from "@/lib/auth/access-control";
import { getNavSectionsForRole } from "@/lib/constants/nav";
import type { AuthContextValue } from "@/providers/auth-provider";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ name }: { name?: string }) {
  const commonProps = {
    className: "nav-icon",
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  switch (name) {
    case "LayoutDashboard":
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    case "FolderKanban":
      return (
        <svg {...commonProps}>
          <path d="M3 7h5l2 2h11v8a2 2 0 0 1-2 2H3z" />
          <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8" />
        </svg>
      );
    case "Package":
      return (
        <svg {...commonProps}>
          <path d="M12 2l8 4-8 4-8-4 8-4z" />
          <path d="M4 6v8l8 4 8-4V6" />
          <path d="M12 10v8" />
        </svg>
      );
    case "PieChart":
      return (
        <svg {...commonProps}>
          <path d="M21 12a9 9 0 1 1-9-9v9z" />
          <path d="M12 3a9 9 0 0 1 9 9h-9z" />
        </svg>
      );
    case "Calendar":
      return (
        <svg {...commonProps}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "List":
      return (
        <svg {...commonProps}>
          <path d="M8 6h13M8 12h13M8 18h13" />
          <path d="M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      );
    case "Users":
      return (
        <svg {...commonProps}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "Database":
      return (
        <svg {...commonProps}>
          <ellipse cx="12" cy="5" rx="8" ry="3" />
          <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
          <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
        </svg>
      );
    case "DollarSign":
      return (
        <svg {...commonProps}>
          <path d="M12 1v22" />
          <path d="M17 5H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7" />
        </svg>
      );
    case "Hash":
      return (
        <svg {...commonProps}>
          <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" />
        </svg>
      );
    case "ShoppingCart":
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="20" r="1" />
          <circle cx="17" cy="20" r="1" />
          <path d="M5 6h16l-2 7H7L5 6z" />
          <path d="M5 6L3 3H1" />
        </svg>
      );
    case "ClipboardCheck":
      return (
        <svg {...commonProps}>
          <rect x="9" y="2" width="6" height="4" rx="1" />
          <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      );
    default:
      return null;
  }
}

const roleLabels: Record<string, string> = {
  OPERATIONS_DIRECTOR: "Operations Director",
  FINANCE: "Finance",
  SITE_MANAGER: "Site Manager",
  STORES: "Stores"
};

export default function Sidebar({ user }: { user: AuthContextValue }) {
  const pathname = usePathname();
  const router = useRouter();
  const resolvedRole: Role | null =
    user.role === "OPERATIONS_DIRECTOR" ||
    user.role === "FINANCE" ||
    user.role === "SITE_MANAGER" ||
    user.role === "STORES"
      ? user.role
      : null;
  const navSections = getNavSectionsForRole(resolvedRole);
  const displayName = user.username ?? "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleLabel = resolvedRole ? roleLabels[resolvedRole] ?? resolvedRole : "Signed in";

  const handleLogout = () => {
    user.logout();
    router.replace("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">
          <Image
            className="brand-logo"
            src="/logo.png"
            alt="The GAP Company logo"
            width={220}
            height={72}
            priority
          />
        </span>
      </div>
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.label} className="sidebar-section">
            <p className="sidebar-section-title">{section.label}</p>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(pathname, item.href) ? "active" : ""}
                title={item.label}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
              >
                <NavIcon name={item.icon} />
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="topbar-user sidebar-user">
          <span className="avatar" aria-hidden="true">{initials}</span>
          <div className="user-meta">
            <p className="user-name">{displayName}</p>
            <span className="user-role">{roleLabel}</span>
          </div>
          <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
        <button type="button" className="ghost-button sidebar-signout" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
