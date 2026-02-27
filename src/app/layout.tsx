import "../globals.css";
import type { ReactNode } from "react";
import { ReactQueryProvider } from "@/providers/react-query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { ToastProvider } from "@/components/ui/toast";

export const metadata = {
  title: "UCMS Operations & Finance",
  description: "Operations and Finance workspace"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
