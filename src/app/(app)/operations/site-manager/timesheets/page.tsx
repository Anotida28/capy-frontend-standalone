"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Table, TableRoot } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HighlightText } from "@/components/ui/highlight-text";
import { FormField } from "@/components/ui/form-field";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useTableKeyboardNavigation } from "@/components/ui/table-navigation";
import { useTimesheets, useUpdateTimesheet } from "@/features/operations/timesheets/hooks";
import type { TimesheetEntry } from "@/features/operations/timesheets/types";
import { useProjects } from "@/features/operations/projects/hooks";
import { useAuth } from "@/providers/auth-provider";
import { resolveStaffIdForUser } from "@/lib/auth/user-profile";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { useToast } from "@/components/ui/toast";
import { getStatusTone } from "@/lib/utils/status-tone";

export default function SiteManagerTimesheetsPage() {
  const router = useRouter();
  const { username } = useAuth();
  const staffId = resolveStaffIdForUser(username);
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [rejecting, setRejecting] = useState<TimesheetEntry | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [extending, setExtending] = useState<TimesheetEntry | null>(null);
  const [extendUntil, setExtendUntil] = useState("");

  const timesheetsQuery = useTimesheets();
  const updateMutation = useUpdateTimesheet();
  const projectsQuery = useProjects();

  const projects = (projectsQuery.data ?? []).filter((project) => project.siteManagerId === staffId);
  const filteredTimesheets = useMemo(() => {
    const projectIds = new Set(projects.map((project) => project.id));
    return (timesheetsQuery.data ?? []).filter((sheet) => {
      if (!projectIds.has(sheet.projectId)) return false;
      if (statusFilter !== "ALL" && sheet.status !== statusFilter) return false;
      if (projectFilter !== "ALL" && sheet.projectId !== projectFilter) return false;
      const haystack = `${sheet.staffName ?? ""} ${sheet.projectName ?? ""}`.toLowerCase();
      return query ? haystack.includes(query.toLowerCase()) : true;
    });
  }, [timesheetsQuery.data, projects, statusFilter, projectFilter, query]);

  const { tableRef, getRowProps } = useTableKeyboardNavigation(filteredTimesheets.length);

  const handleApprove = async (sheet: TimesheetEntry) => {
    if (!sheet.id) return;
    try {
      await updateMutation.mutateAsync({
        id: sheet.id,
        payload: {
          status: "APPROVED",
          approvedBy: staffId ?? null,
          approvedAt: new Date().toISOString()
        }
      });
      notify({ message: "Timesheet approved", tone: "success" });
    } catch {
      notify({ message: "Unable to approve timesheet", tone: "error" });
    }
  };

  const handleReject = async () => {
    if (!rejecting?.id) return;
    try {
      await updateMutation.mutateAsync({
        id: rejecting.id,
        payload: {
          status: "REJECTED",
          rejectionReason: rejectReason || "Rejected by site manager"
        }
      });
      notify({ message: "Timesheet rejected", tone: "success" });
    } catch {
      notify({ message: "Unable to reject timesheet", tone: "error" });
    } finally {
      setRejecting(null);
      setRejectReason("");
    }
  };

  const handleExtend = async () => {
    if (!extending?.id || !extendUntil) return;
    try {
      await updateMutation.mutateAsync({
        id: extending.id,
        payload: {
          extendedUntil: extendUntil
        }
      });
      notify({ message: "Shift extended", tone: "success" });
    } catch {
      notify({ message: "Unable to extend shift", tone: "error" });
    } finally {
      setExtending(null);
      setExtendUntil("");
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Timesheet Approvals"
        subtitle="Approve, reject, and extend shifts for your site."
      />

      <SectionCard>
        <div className="section-header">
          <h2>Daily Clock-ins</h2>
          <p className="muted">Pending approvals are highlighted first.</p>
        </div>
        <div className="toolbar" style={{ marginBottom: "1rem" }}>
          <Input
            placeholder="Search by staff or project"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="AUTO_CLOCKED_OUT">Auto Clocked Out</option>
          </select>
          <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
            <option value="ALL">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <Button variant="ghost" onClick={() => timesheetsQuery.refetch()}>
            Refresh
          </Button>
        </div>
        {timesheetsQuery.isLoading ? (
          <p className="muted">Loading timesheets...</p>
        ) : timesheetsQuery.error ? (
          <ErrorState message="Unable to load timesheets." onRetry={() => timesheetsQuery.refetch()} />
        ) : filteredTimesheets.length === 0 ? (
          <EmptyState title="No timesheets found" description="Timesheets will appear when workers clock in." />
        ) : (
            <>
            <div className="desktop-table">
              <Table>
                <TableRoot ref={tableRef}>
                  <thead>
                    <tr>
                      <th>Staff</th>
                      <th>Project</th>
                      <th>Date</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>Auto Clockout</th>
                      <th>Status</th>
                      <th className="actions-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTimesheets.map((sheet, index) => (
                      <tr
                        key={sheet.id}
                        {...getRowProps(index, {
                          onEnter: () => {
                            if (sheet.id) router.push(`/operations/site-manager/timesheets/${sheet.id}`);
                          },
                          disabled: !sheet.id
                        })}
                      >
                        <td>
                          <div className="table-title">
                            <HighlightText text={sheet.staffName ?? sheet.staffId ?? "-"} query={query} />
                          </div>
                          <div className="muted">
                            <HighlightText text={sheet.staffId} query={query} />
                          </div>
                        </td>
                        <td>
                          <div className="table-title">
                            <HighlightText text={sheet.projectName ?? sheet.projectId ?? "-"} query={query} />
                          </div>
                          <div className="muted">
                            <HighlightText text={sheet.projectId} query={query} />
                          </div>
                        </td>
                        <td>{formatDate(sheet.date)}</td>
                        <td>{formatDateTime(sheet.clockInTime)}</td>
                        <td>{sheet.clockOutTime ? formatDateTime(sheet.clockOutTime) : "-"}</td>
                        <td>
                          <div className="table-title">
                            {sheet.extendedUntil ? formatDateTime(sheet.extendedUntil) : formatDateTime(sheet.autoClockoutTime)}
                          </div>
                          <div className="muted">{sheet.extendedUntil ? "Extended" : "Default"}</div>
                        </td>
                        <td>
                          <Badge label={sheet.status ?? "PENDING"} tone={getStatusTone(sheet.status)} />
                        </td>
                        <td className="actions-cell">
                          <div className="row-actions">
                            <Button
                              variant="ghost"
                              onClick={() => sheet.id && router.push(`/operations/site-manager/timesheets/${sheet.id}`)}
                            >
                              View -&gt;
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleApprove(sheet)}
                              disabled={sheet.status === "APPROVED"}
                            >
                              Approve
                            </Button>
                            <Button variant="ghost" onClick={() => { setRejecting(sheet); setRejectReason(""); }}>
                              Reject
                            </Button>
                            <Button variant="ghost" onClick={() => { setExtending(sheet); setExtendUntil(sheet.extendedUntil ?? ""); }}>
                              Extend
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </TableRoot>
              </Table>
            </div>
            <div className="mobile-list">
              {filteredTimesheets.map((sheet) => (
                <article key={`timesheet-mobile-${sheet.id ?? `${sheet.staffId}-${sheet.date}`}`} className="mobile-card">
                  <div className="mobile-card-head">
                    <div>
                      <p className="mobile-card-title">
                        <HighlightText text={sheet.staffName ?? sheet.staffId ?? "-"} query={query} />
                      </p>
                      <p className="mobile-card-subtitle">
                        <HighlightText text={sheet.projectName ?? sheet.projectId ?? "-"} query={query} />
                      </p>
                    </div>
                    <Badge label={sheet.status ?? "PENDING"} tone={getStatusTone(sheet.status)} />
                  </div>
                  <div className="mobile-card-grid">
                    <div className="mobile-field">
                      <span className="mobile-label">Date</span>
                      <span className="mobile-value">{formatDate(sheet.date)}</span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-label">Clock In</span>
                      <span className="mobile-value">{formatDateTime(sheet.clockInTime)}</span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-label">Clock Out</span>
                      <span className="mobile-value">{sheet.clockOutTime ? formatDateTime(sheet.clockOutTime) : "-"}</span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-label">Auto Clockout</span>
                      <span className="mobile-value">{sheet.extendedUntil ? formatDateTime(sheet.extendedUntil) : formatDateTime(sheet.autoClockoutTime)}</span>
                    </div>
                  </div>
                  <div className="mobile-card-actions">
                    <div className="row-actions">
                      <Button
                        variant="ghost"
                        onClick={() => sheet.id && router.push(`/operations/site-manager/timesheets/${sheet.id}`)}
                      >
                        View -&gt;
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleApprove(sheet)}
                        disabled={sheet.status === "APPROVED"}
                      >
                        Approve
                      </Button>
                      <Button variant="ghost" onClick={() => { setRejecting(sheet); setRejectReason(""); }}>
                        Reject
                      </Button>
                      <Button variant="ghost" onClick={() => { setExtending(sheet); setExtendUntil(sheet.extendedUntil ?? ""); }}>
                        Extend
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <Modal open={Boolean(rejecting)} title="Reject timesheet" onClose={() => setRejecting(null)}>
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
          <Button variant="ghost" onClick={() => setRejecting(null)}>Cancel</Button>
          <Button onClick={handleReject} disabled={!rejectReason.trim()}>
            Reject
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={Boolean(extending)} title="Extend shift" onClose={() => setExtending(null)}>
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
          <Button variant="ghost" onClick={() => setExtending(null)}>Cancel</Button>
          <Button onClick={handleExtend} disabled={!extendUntil.trim()}>
            Extend Shift
          </Button>
        </ModalFooter>
      </Modal>
    </PageShell>
  );
}
