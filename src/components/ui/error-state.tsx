"use client";

import { Button } from "@/components/ui/button";

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-card">
      <p>{message}</p>
      {onRetry ? (
        <div style={{ marginTop: "0.5rem" }}>
          <Button variant="ghost" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}
