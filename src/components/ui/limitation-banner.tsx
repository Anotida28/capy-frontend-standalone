"use client";

import { InfoBanner } from "@/components/ui/info-banner";
import { cn } from "@/lib/utils/cn";

export function LimitationBanner({
  title = "Limited integration",
  description,
  className
}: {
  title?: string;
  description: string;
  className?: string;
}) {
  return <InfoBanner title={title} description={description} className={cn("limitation-banner", className)} />;
}
