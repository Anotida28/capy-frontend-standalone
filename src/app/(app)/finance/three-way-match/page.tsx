"use client";

import PageHeader from "@/components/layout/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchTable } from "@/features/finance/three-way-match/components/match-table";
import { useThreeWayMatchReview } from "@/features/finance/three-way-match/hooks";

export default function ThreeWayMatchPage() {
  const { data, isLoading, error, refetch } = useThreeWayMatchReview();

  return (
    <div className="page">
      <PageHeader title="3-Way Match" subtitle="Review invoice matches requiring attention." />

      {isLoading ? (
        <Skeleton className="surface-card" />
      ) : error ? (
        <ErrorState message="Unable to load matches." onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No matches requiring review" description="You're all caught up." />
      ) : (
        <MatchTable items={data} />
      )}
    </div>
  );
}
