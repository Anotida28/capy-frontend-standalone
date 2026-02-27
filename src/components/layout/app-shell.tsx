"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { ContentContainer } from "@/components/layout/content-container";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils/cn";

export default function AppShell({ children }: { children: ReactNode }) {
  const user = useAuth();
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("nav-open", isMobileNavOpen);
    return () => document.body.classList.remove("nav-open");
  }, [isMobileNavOpen]);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileNavOpen]);

  return (
    <div className={cn("app-shell", isMobileNavOpen && "app-shell--nav-open")}>
      <Sidebar user={user} isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
      <button
        type="button"
        aria-label="Close navigation"
        className="mobile-nav-backdrop"
        onClick={() => setIsMobileNavOpen(false)}
      />
      <div className="app-main">
        <Topbar onToggleNav={() => setIsMobileNavOpen((prev) => !prev)} isNavOpen={isMobileNavOpen} />
        <main className="app-content">
          <ContentContainer>{children}</ContentContainer>
        </main>
      </div>
    </div>
  );
}
