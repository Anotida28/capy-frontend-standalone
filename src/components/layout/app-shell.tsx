"use client";

import type { ReactNode } from "react";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";
import { ContentContainer } from "@/components/layout/content-container";
import { useAuth } from "@/providers/auth-provider";

export default function AppShell({ children }: { children: ReactNode }) {
  const user = useAuth();

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <div className="app-main">
        <Topbar />
        <main className="app-content">
          <ContentContainer>{children}</ContentContainer>
        </main>
      </div>
    </div>
  );
}
