"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useDailyLog } from "@/features/operations/daily-logs/hooks";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/date";
import { useAuth } from "@/providers/auth-provider";

export default function DailyLogDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data, isLoading, error } = useDailyLog(id);
  const { role } = useAuth();

  if (isLoading) return <Skeleton className="surface-card" />;
  if (error || !data) return <ErrorState message="Unable to load log." />;

  const logType = data.logType ?? "PROJECT";
  const projectHref = data.projectId
    ? role === "SITE_MANAGER"
      ? `/operations/site-manager/projects/${data.projectId}`
      : `/projects/${data.projectId}`
    : null;
  const canOpenStaff = role === "OPERATIONS_DIRECTOR";
  const staffHref = canOpenStaff && data.employeeId ? `/operations/staff/${data.employeeId}` : null;

  return (
    <Card>
      <h2>Log</h2>
      <p className="muted">Date: {formatDate(data.date)}</p>
      <p className="muted">Type: {logType === "EMPLOYEE" ? "Employee" : "Project"}</p>
      <p className="muted">
        Project: {projectHref ? <Link href={projectHref}>{data.projectName ?? data.projectId}</Link> : data.projectName ?? data.projectId ?? "-"}
      </p>
      <p className="muted">
        Employee: {staffHref ? <Link href={staffHref}>{data.employeeName ?? data.employeeId}</Link> : data.employeeName ?? data.employeeId ?? "-"}
      </p>
      <p className="muted">Weather: {data.weather ?? "-"}</p>
      <p className="muted">Progress Entries: {data.progressEntries?.length ?? 0}</p>
      <p className="muted">Site Media: {data.siteMedia?.length ?? 0}</p>
      <p style={{ marginTop: "1rem" }}>
        <Link className="secondary-button" href="/daily-logs">Back to Logs</Link>
      </p>
    </Card>
  );
}
