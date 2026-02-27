"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useTimesheet, useUpdateTimesheet } from "@/features/operations/timesheets/hooks";
import { useProjects } from "@/features/operations/projects/hooks";
import type { TimesheetEntry } from "@/features/operations/timesheets/types";
import { useAuth } from "@/providers/auth-provider";
import { resolveStaffIdForUser } from "@/lib/auth/user-profile";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { useToast } from "@/components/ui/toast";
import { getStatusTone } from "@/lib/utils/status-tone";

export default function TimesheetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) ?? "";
  const { username } = useAuth();
  const staffId = resolveStaffIdForUser(username);
  const { notify } = useToast();

  const timesheetQuery = useTimesheet(id);
  const updateMutation = useUpdateTimesheet();
  const projectsQuery = useProjects();

  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [extending, setExtending] = useState(false);
  const [extendUntil, setExtendUntil] = useState("");

  const timesheet = timesheetQuery.data;

  const project = useMemo(() => {
    if (!timesheet?.projectId) return null;
    return (projectsQuery.data ?? []).find((item) => item.id === timesheet.projectId) ?? null;
  }, [projectsQuery.data, timesheet?.projectId]);

  if (timesheetQuery.isLoading) return <Skeleton className="surface-card" />;
  if (timesheetQuery.error || !timesheet) return <ErrorState message="Unable to load timesheet." />;

  if (staffId && project?.siteManagerId && project.siteManagerId !== staffId) {
    return <ErrorState message="This timesheet is not tied to your project." />;
  }

  const autoClockoutLabel = timesheet.extendedUntil
    ? formatDateTime(timesheet.extendedUntil)
    : timesheet.autoClockoutTime
    ? formatDateTime(timesheet.autoClockoutTime)
    : project?.autoClockoutTime
    ? `${formatDate(timesheet.date)} ${project.autoClockoutTime}`
    : "-";

  const handleApprove = async () => {
    if (!timesheet.id) return;
    try {
      await updateMutation.mutateAsync({
        id: timesheet.id,
        payload: {
          status: "APPROVED",
          approvedBy: staffId ?? null,
          approvedAt: new Date().toISOString(),
          rejectionReason: null
        }
      });
      notify({ message: "Timesheet approved", tone: "success" });
    } catch {
      notify({ message: "Unable to approve timesheet", tone: "error" });
    }
  };

  const handleReject = async () => {
    if (!timesheet.id) return;
    try {
      await updateMutation.mutateAsync({
        id: timesheet.id,
        payload: {
          status: "REJECTED",
          rejectionReason: rejectReason || "Rejected by site manager"
        }
      });
      notify({ message: "Timesheet rejected", tone: "success" });
    } catch {
      notify({ message: "Unable to reject timesheet", tone: "error" });
    } finally {
      setRejecting(false);
      setRejectReason("");
    }
  };

  const handleExtend = async () => {
    if (!timesheet.id || !extendUntil) return;
    try {
      await updateMutation.mutateAsync({
        id: timesheet.id,
        payload: {
          extendedUntil: extendUntil
        }
      });
      notify({ message: "Shift extended", tone: "success" });
    } catch {
      notify({ message: "Unable to extend shift", tone: "error" });
    } finally {
      setExtending(false);
      setExtendUntil("");
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={`Timesheet • ${timesheet.staffName ?? timesheet.staffId}`}
        subtitle={timesheet.projectName ?? project?.name ?? timesheet.projectId}
        actions={
          <div className="toolbar">
            <Button variant="ghost" onClick={() => router.push("/operations/site-manager/timesheets")}>
              Back to Timesheets
            </Button>
            <Button variant="ghost" onClick={handleApprove} disabled={timesheet.status === "APPROVED"}>
              Approve
            </Button>
            <Button variant="ghost" onClick={() => setRejecting(true)}>
              Reject
            </Button>
            <Button variant="ghost" onClick={() => setExtending(true)}>
              Extend
            </Button>
          </div>
        }
      />

      <SectionCard>
        <div className="form-grid">
          <div>
            <p className="muted">Status</p>
            <Badge label={timesheet.status ?? "PENDING"} tone={getStatusTone(timesheet.status)} />
          </div>
          <div>
            <p className="muted">Date</p>
            <p className="table-title">{formatDate(timesheet.date)}</p>
          </div>
          <div>
            <p className="muted">Clock In</p>
            <p className="table-title">{formatDateTime(timesheet.clockInTime)}</p>
          </div>
          <div>
            <p className="muted">Clock Out</p>
            <p className="table-title">{timesheet.clockOutTime ? formatDateTime(timesheet.clockOutTime) : "-"}</p>
          </div>
          <div>
            <p className="muted">Auto Clockout</p>
            <p className="table-title">{autoClockoutLabel}</p>
          </div>
          <div>
            <p className="muted">Hours Worked</p>
            <p className="table-title">{timesheet.hoursWorked ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Approved By</p>
            <p className="table-title">{timesheet.approvedBy ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Approved At</p>
            <p className="table-title">{timesheet.approvedAt ? formatDateTime(timesheet.approvedAt) : "-"}</p>
          </div>
          <div className="full-width">
            <p className="muted">Rejection Reason</p>
            <p className="table-title">{timesheet.rejectionReason || "None"}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Project Time Policy</h2>
          <p className="muted">Default shift rules for this site.</p>
        </div>
        {project ? (
          <div className="form-grid">
            <div>
              <p className="muted">Shift Start</p>
              <p className="table-title">{project.shiftStartTime ?? "07:00"}</p>
            </div>
            <div>
              <p className="muted">Shift End</p>
              <p className="table-title">{project.shiftEndTime ?? "17:00"}</p>
            </div>
            <div>
              <p className="muted">Auto Clockout</p>
              <p className="table-title">{project.autoClockoutTime ?? project.shiftEndTime ?? "17:00"}</p>
            </div>
            <div>
              <p className="muted">Grace Period</p>
              <p className="table-title">{project.gracePeriodMinutes ?? 0} mins</p>
            </div>
            <div>
              <p className="muted">Overtime Allowed</p>
              <p className="table-title">{project.overtimeAllowed ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="muted">Overtime Max</p>
              <p className="table-title">{project.overtimeMaxHours ?? 0} hrs</p>
            </div>
          </div>
        ) : (
          <p className="muted">No policy available.</p>
        )}
      </SectionCard>

      <Modal open={rejecting} title="Reject timesheet" onClose={() => setRejecting(false)}>
        <ModalBody>
          <FormField label="Rejection reason" htmlFor="reject-reason">
            <Input
              id="reject-reason"
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Provide a short reason"
            />
          </FormField>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setRejecting(false)}>Cancel</Button>
          <Button onClick={handleReject} disabled={!rejectReason.trim()}>
            Reject
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={extending} title="Extend shift" onClose={() => setExtending(false)}>
        <ModalBody>
          <FormField label="Extend until" htmlFor="extend-until" helper="Use full timestamp (YYYY-MM-DDTHH:MM).">
            <Input
              id="extend-until"
              type="datetime-local"
              value={extendUntil}
              onChange={(event) => setExtendUntil(event.target.value)}
              placeholder="2026-02-03T19:00:00"
            />
          </FormField>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setExtending(false)}>Cancel</Button>
          <Button onClick={handleExtend} disabled={!extendUntil.trim()}>
            Extend Shift
          </Button>
        </ModalFooter>
      </Modal>
    </PageShell>
  );
}
