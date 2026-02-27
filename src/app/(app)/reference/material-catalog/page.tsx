"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Card } from "@/components/ui/card";
import { Table, TableRoot } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { useMaterialCatalog } from "@/features/operations/material-catalog/hooks";
import { useProjects } from "@/features/operations/projects/hooks";
import type { Project } from "@/features/operations/projects/types";
import { useCanManageProject } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils/date";
import { useAuth } from "@/providers/auth-provider";
import { inventoryAllocationsSeed, inventoryReturnsSeed } from "@/mocks/stores-workflow";

type StoresStatus = "ALLOCATED_FROM_STORES" | "RECEIVED_IN_STORES" | "DISPATCHED_TO_PROJECT";
type LifecycleStatus =
  | "TRACKING_USAGE"
  | "FULLY_USED_ON_PROJECT"
  | "PARTIALLY_RETURNED_TO_STORES"
  | "RETURNED_TO_STORES";
type ReturnStatus = "RETURN_SENT_TO_STORES" | "RECEIVED_IN_STORES";

type InventoryAllocation = {
  id: string;
  storesRequestId: string;
  projectId: string;
  projectName?: string | null;
  projectManagerName?: string | null;
  itemCode: string;
  itemName: string;
  unit: string;
  requestedQuantity: number;
  allocatedQuantity: number;
  usedQuantity: number;
  returnedQuantity: number;
  storesStatus: StoresStatus;
  lifecycleStatus: LifecycleStatus;
  allocatedAt: string;
  lastUsageAt?: string | null;
  lastReturnAt?: string | null;
  notes?: string | null;
};

type ReturnEvent = {
  id: string;
  allocationId: string;
  storesRequestId: string;
  projectName: string;
  itemName: string;
  quantity: number;
  reason?: string | null;
  status: ReturnStatus;
  createdAt: string;
  receivedAt?: string | null;
};

type CreateAllocationForm = {
  storesRequestId: string;
  projectId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  requestedQuantity: string;
  allocatedQuantity: string;
  storesStatus: StoresStatus;
  notes: string;
};

const storesStatusTone: Record<StoresStatus, string> = {
  ALLOCATED_FROM_STORES: "approved",
  RECEIVED_IN_STORES: "planning",
  DISPATCHED_TO_PROJECT: "completed"
};

const lifecycleTone: Record<LifecycleStatus, string> = {
  TRACKING_USAGE: "active",
  FULLY_USED_ON_PROJECT: "completed",
  PARTIALLY_RETURNED_TO_STORES: "on_hold",
  RETURNED_TO_STORES: "completed"
};

const returnTone: Record<ReturnStatus, string> = {
  RETURN_SENT_TO_STORES: "pending",
  RECEIVED_IN_STORES: "approved"
};

const initialAllocations: InventoryAllocation[] = inventoryAllocationsSeed;

const initialReturns: ReturnEvent[] = inventoryReturnsSeed;

const blankCreateForm: CreateAllocationForm = {
  storesRequestId: "",
  projectId: "",
  itemCode: "",
  itemName: "",
  unit: "",
  requestedQuantity: "",
  allocatedQuantity: "",
  storesStatus: "ALLOCATED_FROM_STORES",
  notes: ""
};

const labelize = (value: string) => value.replace(/_/g, " ");

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const remainingQuantity = (allocation: InventoryAllocation) =>
  Math.max(allocation.allocatedQuantity - allocation.usedQuantity - allocation.returnedQuantity, 0);

const deriveLifecycle = (allocation: InventoryAllocation): LifecycleStatus => {
  const remaining = remainingQuantity(allocation);
  if (remaining === 0 && allocation.returnedQuantity > 0) return "RETURNED_TO_STORES";
  if (remaining === 0) return "FULLY_USED_ON_PROJECT";
  if (allocation.returnedQuantity > 0) return "PARTIALLY_RETURNED_TO_STORES";
  return "TRACKING_USAGE";
};

export default function InventoryManagementPage() {
  const { role } = useAuth();
  const materialsQuery = useMaterialCatalog();
  const projectsQuery = useProjects();
  const canManage = useCanManageProject();
  const { notify } = useToast();

  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [allocations, setAllocations] = useState<InventoryAllocation[]>(() =>
    initialAllocations.map((item) => ({ ...item }))
  );
  const [returns, setReturns] = useState<ReturnEvent[]>(() => initialReturns.map((item) => ({ ...item })));

  const [showCreate, setShowCreate] = useState(false);
  const [createValues, setCreateValues] = useState<CreateAllocationForm>(blankCreateForm);

  const [usageTarget, setUsageTarget] = useState<InventoryAllocation | null>(null);
  const [usageQuantity, setUsageQuantity] = useState("");

  const [returnTarget, setReturnTarget] = useState<InventoryAllocation | null>(null);
  const [returnQuantity, setReturnQuantity] = useState("");
  const [returnReason, setReturnReason] = useState("");

  const projectById = useMemo(() => {
    const map = new Map<string, Project>();
    (projectsQuery.data ?? []).forEach((project) => {
      if (project.id) map.set(project.id, project);
    });
    return map;
  }, [projectsQuery.data]);

  const materialByCode = useMemo(() => {
    const map = new Map<string, { name: string; standardUnit: string }>();
    (materialsQuery.data ?? []).forEach((material) => {
      map.set(material.itemCode, { name: material.name, standardUnit: material.standardUnit });
    });
    return map;
  }, [materialsQuery.data]);

  const resolvedAllocations = useMemo(
    () =>
      allocations.map((allocation) => {
        const project = projectById.get(allocation.projectId);
        const material = materialByCode.get(allocation.itemCode);
        const next: InventoryAllocation = {
          ...allocation,
          projectName: allocation.projectName ?? project?.name ?? allocation.projectId,
          projectManagerName: allocation.projectManagerName ?? project?.siteManagerName ?? null,
          itemName: allocation.itemName || material?.name || allocation.itemCode,
          unit: allocation.unit || material?.standardUnit || "units"
        };
        return {
          ...next,
          lifecycleStatus: deriveLifecycle(next)
        };
      }),
    [allocations, materialByCode, projectById]
  );

  const filteredAllocations = useMemo(() => {
    const term = query.toLowerCase().trim();
    return resolvedAllocations.filter((allocation) => {
      const matchesProject = projectFilter === "ALL" ? true : allocation.projectId === projectFilter;
      if (!matchesProject) return false;
      if (!term) return true;
      const haystack = [
        allocation.storesRequestId,
        allocation.projectId,
        allocation.projectName ?? "",
        allocation.projectManagerName ?? "",
        allocation.itemCode,
        allocation.itemName,
        allocation.storesStatus,
        allocation.lifecycleStatus
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [projectFilter, query, resolvedAllocations]);

  const projectIdByAllocationId = useMemo(() => {
    const map = new Map<string, string>();
    resolvedAllocations.forEach((allocation) => {
      map.set(allocation.id, allocation.projectId);
    });
    return map;
  }, [resolvedAllocations]);

  const projectSummaries = useMemo(() => {
    const summaries = new Map<
      string,
      {
        projectId: string;
        projectName: string;
        projectManagerName: string;
        allocated: number;
        used: number;
        returned: number;
        remaining: number;
      }
    >();

    resolvedAllocations.forEach((allocation) => {
      const key = allocation.projectId;
      const current = summaries.get(key) ?? {
        projectId: key,
        projectName: allocation.projectName ?? key,
        projectManagerName: allocation.projectManagerName ?? "-",
        allocated: 0,
        used: 0,
        returned: 0,
        remaining: 0
      };
      current.allocated += allocation.allocatedQuantity;
      current.used += allocation.usedQuantity;
      current.returned += allocation.returnedQuantity;
      current.remaining += remainingQuantity(allocation);
      summaries.set(key, current);
    });

    return Array.from(summaries.values()).sort((left, right) => left.projectName.localeCompare(right.projectName));
  }, [resolvedAllocations]);

  const kpis = useMemo(() => {
    const allocated = resolvedAllocations.reduce((sum, item) => sum + item.allocatedQuantity, 0);
    const used = resolvedAllocations.reduce((sum, item) => sum + item.usedQuantity, 0);
    const returned = resolvedAllocations.reduce((sum, item) => sum + item.returnedQuantity, 0);
    const remaining = resolvedAllocations.reduce((sum, item) => sum + remainingQuantity(item), 0);
    return {
      activeProjects: new Set(resolvedAllocations.map((item) => item.projectId)).size,
      allocated,
      used,
      returned,
      remaining
    };
  }, [resolvedAllocations]);

  const patchAllocation = (id: string, updater: (current: InventoryAllocation) => InventoryAllocation) => {
    setAllocations((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  };

  const markDispatched = (allocation: InventoryAllocation) => {
    patchAllocation(allocation.id, (current) => ({
      ...current,
      storesStatus: "DISPATCHED_TO_PROJECT"
    }));
    notify({ message: "Allocation marked as dispatched to project", tone: "success" });
  };

  const handleCreateAllocation = () => {
    const requested = toNumber(createValues.requestedQuantity);
    const allocated = toNumber(createValues.allocatedQuantity);

    if (!createValues.storesRequestId.trim()) {
      notify({ message: "Stores request ID is required", tone: "error" });
      return;
    }
    if (!createValues.projectId.trim()) {
      notify({ message: "Project is required", tone: "error" });
      return;
    }
    if (!createValues.itemCode.trim() && !createValues.itemName.trim()) {
      notify({ message: "Material item is required", tone: "error" });
      return;
    }
    if (!Number.isFinite(requested) || requested <= 0) {
      notify({ message: "Requested quantity must be greater than zero", tone: "error" });
      return;
    }
    if (!Number.isFinite(allocated) || allocated <= 0) {
      notify({ message: "Allocated quantity must be greater than zero", tone: "error" });
      return;
    }
    if (allocated > requested) {
      notify({ message: "Allocated quantity cannot exceed requested quantity", tone: "error" });
      return;
    }

    const project = projectById.get(createValues.projectId);
    const material = createValues.itemCode ? materialByCode.get(createValues.itemCode) : undefined;
    const nextId = `INV-${(resolvedAllocations.length + 1).toString().padStart(3, "0")}`;

    const next: InventoryAllocation = {
      id: nextId,
      storesRequestId: createValues.storesRequestId.trim(),
      projectId: createValues.projectId,
      projectName: project?.name ?? createValues.projectId,
      projectManagerName: project?.siteManagerName ?? null,
      itemCode: createValues.itemCode.trim() || "UNCODED",
      itemName: createValues.itemName.trim() || material?.name || createValues.itemCode,
      unit: createValues.unit.trim() || material?.standardUnit || "units",
      requestedQuantity: requested,
      allocatedQuantity: allocated,
      usedQuantity: 0,
      returnedQuantity: 0,
      storesStatus: createValues.storesStatus,
      lifecycleStatus: "TRACKING_USAGE",
      allocatedAt: new Date().toISOString(),
      notes: createValues.notes.trim() || null
    };

    setAllocations((prev) => [next, ...prev]);
    setShowCreate(false);
    setCreateValues(blankCreateForm);
    notify({ message: "Stores allocation captured in inventory", tone: "success" });
  };

  const handleRecordUsage = () => {
    if (!usageTarget) return;
    if (usageTarget.storesStatus !== "DISPATCHED_TO_PROJECT") {
      notify({ message: "Material must be dispatched to project before usage can be logged", tone: "error" });
      return;
    }
    const quantity = toNumber(usageQuantity);
    const remaining = remainingQuantity(usageTarget);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      notify({ message: "Usage quantity must be greater than zero", tone: "error" });
      return;
    }
    if (quantity > remaining) {
      notify({ message: "Usage quantity cannot exceed remaining quantity", tone: "error" });
      return;
    }
    patchAllocation(usageTarget.id, (current) => ({
      ...current,
      usedQuantity: current.usedQuantity + quantity,
      lastUsageAt: new Date().toISOString()
    }));
    setUsageTarget(null);
    setUsageQuantity("");
    notify({ message: "Project material usage recorded", tone: "success" });
  };

  const handleSendBackToStores = () => {
    if (!returnTarget) return;
    const quantity = toNumber(returnQuantity);
    const remaining = remainingQuantity(returnTarget);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      notify({ message: "Return quantity must be greater than zero", tone: "error" });
      return;
    }
    if (quantity > remaining) {
      notify({ message: "Return quantity cannot exceed remaining quantity", tone: "error" });
      return;
    }

    patchAllocation(returnTarget.id, (current) => ({
      ...current,
      returnedQuantity: current.returnedQuantity + quantity,
      lastReturnAt: new Date().toISOString()
    }));

    const nextReturn: ReturnEvent = {
      id: `RET-${Date.now().toString().slice(-6)}`,
      allocationId: returnTarget.id,
      storesRequestId: returnTarget.storesRequestId,
      projectName: returnTarget.projectName ?? returnTarget.projectId,
      itemName: returnTarget.itemName,
      quantity,
      reason: returnReason.trim() || null,
      status: "RETURN_SENT_TO_STORES",
      createdAt: new Date().toISOString()
    };
    setReturns((prev) => [nextReturn, ...prev]);
    setReturnTarget(null);
    setReturnQuantity("");
    setReturnReason("");
    notify({ message: "Leftover material sent back to stores", tone: "success" });
  };

  const markReturnReceivedInStores = (id: string) => {
    setReturns((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              status: "RECEIVED_IN_STORES",
              receivedAt: new Date().toISOString()
            }
          : entry
      )
    );
    notify({ message: "Stores confirmed returned materials", tone: "success" });
  };

  const projects = projectsQuery.data ?? [];
  const materials = materialsQuery.data ?? [];
  const isLoading = projectsQuery.isLoading || materialsQuery.isLoading;
  const hasError = projectsQuery.isError || materialsQuery.isError;
  const canOpenStores = role === "OPERATIONS_DIRECTOR";
  const projectPath = (projectId: string) =>
    role === "SITE_MANAGER" ? `/operations/site-manager/projects/${projectId}` : `/projects/${projectId}`;

  return (
    <PageShell>
      <PageHeader
        title="Inventory Management"
        subtitle="Track project material allocations, usage, and returns back to stores."
        actions={
          <>
            <div className="search-field">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className="search-input"
                placeholder="Search project, request, or material"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
              <option value="ALL">All Projects</option>
              {projects.map((project) =>
                project.id ? (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ) : null
              )}
            </select>
            {canManage ? <Button onClick={() => setShowCreate(true)}>Capture Stores Allocation</Button> : null}
          </>
        }
      />

      <div className="card-grid">
        <Card className="metric-card metric-card--projects">
          <p className="card-title">Active Project Inventories</p>
          <p className="metric">{kpis.activeProjects}</p>
          <p className="metric-caption">Projects with tracked allocations</p>
        </Card>
        <Card className="metric-card metric-card--budget">
          <p className="card-title">Allocated Quantity</p>
          <p className="metric">{kpis.allocated.toLocaleString()}</p>
          <p className="metric-caption">Total issued from stores</p>
        </Card>
        <Card className="metric-card metric-card--pos">
          <p className="card-title">Used on Projects</p>
          <p className="metric">{kpis.used.toLocaleString()}</p>
          <p className="metric-caption">Usage recorded by project managers</p>
        </Card>
        <Card className="metric-card metric-card--invoices">
          <p className="card-title">Returnable / Returned</p>
          <p className="metric">{kpis.remaining.toLocaleString()} / {kpis.returned.toLocaleString()}</p>
          <p className="metric-caption">Leftovers on site / sent back to stores</p>
        </Card>
      </div>

      <div className="grid-two">
        <SectionCard className="chart-card">
          <div className="section-header">
            <h2>Workflow Link</h2>
            <p className="muted">Inventory records are tied to stores allocations from project requests.</p>
          </div>
          <ul className="activity-feed">
            <li className="activity-item">
              <div>
                <p>1. Project requests material through Stores.</p>
                <p className="activity-meta">Stores Request ID captured per inventory allocation.</p>
              </div>
            </li>
            <li className="activity-item">
              <div>
                <p>2. Stores allocates and dispatches to the project.</p>
                <p className="activity-meta">Stores status tracked from allocation to dispatch.</p>
              </div>
            </li>
            <li className="activity-item">
              <div>
                <p>3. Project manager records usage and controls returns.</p>
                <p className="activity-meta">Usage and leftover returns are tracked per project.</p>
              </div>
            </li>
          </ul>
          <Link className="primary-button" href="/stores">
            Open Stores Dashboard →
          </Link>
        </SectionCard>

        <SectionCard className="chart-card">
          <div className="section-header">
            <h2>Project Oversight</h2>
            <p className="muted">Usage and return actions are overseen by project managers.</p>
          </div>
          <p className="muted">
            {canManage
              ? "You can record material usage, dispatch readiness, and return leftovers to stores."
              : "Read-only view. Project manager permission is required to update usage and returns."}
          </p>
        </SectionCard>
      </div>

      <SectionCard>
        <div className="section-header">
          <h2>Project Material Allocations</h2>
          <p className="muted">Per-project material movement from stores allocation through usage and returns.</p>
        </div>
        {isLoading ? (
          <Skeleton className="surface-card" />
        ) : hasError ? (
          <ErrorState message="Unable to load inventory references." onRetry={() => { projectsQuery.refetch(); materialsQuery.refetch(); }} />
        ) : filteredAllocations.length === 0 ? (
          <EmptyState title="No inventory allocations found" description="Capture a stores allocation to begin tracking project inventory." />
        ) : (
          <Table>
            <TableRoot>
              <thead>
                <tr>
                  <th>Stores Ref</th>
                  <th>Project</th>
                  <th>Material</th>
                  <th>Qty (Req / Alloc / Used)</th>
                  <th>Remaining</th>
                  <th>Returned</th>
                  <th>Stores Status</th>
                  <th>Lifecycle</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAllocations.map((allocation) => {
                  const remaining = remainingQuantity(allocation);
                  return (
                    <tr key={allocation.id}>
                      <td>
                        {canOpenStores ? (
                          <div className="table-title">
                            <Link className="table-title" href="/stores">
                              {allocation.storesRequestId}
                            </Link>
                          </div>
                        ) : (
                          <div className="table-title">{allocation.storesRequestId}</div>
                        )}
                        <div className="muted">Captured {formatDateTime(allocation.allocatedAt)}</div>
                      </td>
                      <td>
                        <div className="table-title">
                          <Link className="table-title" href={projectPath(allocation.projectId)}>
                            {allocation.projectName ?? allocation.projectId}
                          </Link>
                        </div>
                        <div className="muted">PM: {allocation.projectManagerName ?? "-"}</div>
                      </td>
                      <td>
                        <div className="table-title">{allocation.itemName}</div>
                        <div className="muted">{allocation.itemCode} · {allocation.unit}</div>
                      </td>
                      <td>
                        {allocation.requestedQuantity} / {allocation.allocatedQuantity} / {allocation.usedQuantity}
                      </td>
                      <td>{remaining}</td>
                      <td>{allocation.returnedQuantity}</td>
                      <td>
                        <Badge label={labelize(allocation.storesStatus)} tone={storesStatusTone[allocation.storesStatus]} />
                      </td>
                      <td>
                        <Badge label={labelize(allocation.lifecycleStatus)} tone={lifecycleTone[allocation.lifecycleStatus]} />
                      </td>
                      <td className="actions-cell">
                        <div className="row-actions">
                          {canManage ? (
                            <>
                              {allocation.storesStatus !== "DISPATCHED_TO_PROJECT" ? (
                                <Button variant="ghost" onClick={() => markDispatched(allocation)}>
                                  Mark Dispatched
                                </Button>
                              ) : null}
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setUsageTarget(allocation);
                                  setUsageQuantity("");
                                }}
                                disabled={allocation.storesStatus !== "DISPATCHED_TO_PROJECT" || remaining === 0}
                              >
                                Record Use
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setReturnTarget(allocation);
                                  setReturnQuantity("");
                                  setReturnReason("");
                                }}
                                disabled={allocation.storesStatus !== "DISPATCHED_TO_PROJECT" || remaining === 0}
                              >
                                Return Leftover
                              </Button>
                            </>
                          ) : (
                            <span className="muted">Project manager only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableRoot>
          </Table>
        )}
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Project Inventory Summary</h2>
          <p className="muted">Totals per project for allocation, usage, and returns.</p>
        </div>
        {projectSummaries.length === 0 ? (
          <EmptyState title="No project inventory summary" description="Project summaries will appear once allocations are captured." />
        ) : (
          <Table>
            <TableRoot>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Project Manager</th>
                  <th>Allocated</th>
                  <th>Used</th>
                  <th>Returned</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {projectSummaries.map((summary) => (
                  <tr key={summary.projectId}>
                    <td>
                      <Link className="table-title" href={projectPath(summary.projectId)}>
                        {summary.projectName}
                      </Link>
                    </td>
                    <td>{summary.projectManagerName}</td>
                    <td>{summary.allocated}</td>
                    <td>{summary.used}</td>
                    <td>{summary.returned}</td>
                    <td>{summary.remaining}</td>
                  </tr>
                ))}
              </tbody>
            </TableRoot>
          </Table>
        )}
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Returns Back to Stores</h2>
          <p className="muted">Track leftover materials sent from projects back to stores.</p>
        </div>
        {returns.length === 0 ? (
          <EmptyState title="No return records" description="Returned leftovers from projects will appear here." />
        ) : (
          <Table>
            <TableRoot>
              <thead>
                <tr>
                  <th>Return Ref</th>
                  <th>Project</th>
                  <th>Material</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="table-title">{entry.id}</div>
                      <div className="muted">{formatDateTime(entry.createdAt)}</div>
                    </td>
                    <td>
                      {projectIdByAllocationId.get(entry.allocationId) ? (
                        <Link className="table-title" href={projectPath(projectIdByAllocationId.get(entry.allocationId) ?? "")}>
                          {entry.projectName}
                        </Link>
                      ) : (
                        entry.projectName
                      )}
                    </td>
                    <td>{entry.itemName}</td>
                    <td>{entry.quantity}</td>
                    <td>
                      <Badge label={labelize(entry.status)} tone={returnTone[entry.status]} />
                    </td>
                    <td>{entry.reason ?? "-"}</td>
                    <td className="actions-cell">
                      {canManage && entry.status === "RETURN_SENT_TO_STORES" ? (
                        <Button variant="ghost" onClick={() => markReturnReceivedInStores(entry.id)}>
                          Mark Received by Stores
                        </Button>
                      ) : (
                        <span className="muted">{entry.receivedAt ? formatDateTime(entry.receivedAt) : "No action"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableRoot>
          </Table>
        )}
      </SectionCard>

      <Modal open={showCreate} title="Capture Stores Allocation" onClose={() => setShowCreate(false)}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Stores Request ID" htmlFor="allocation-stores-request-id">
              <Input
                id="allocation-stores-request-id"
                value={createValues.storesRequestId}
                onChange={(event) => setCreateValues((prev) => ({ ...prev, storesRequestId: event.target.value }))}
                placeholder="SR-1025"
              />
            </FormField>
            <FormField label="Project" htmlFor="allocation-project">
              <select
                id="allocation-project"
                value={createValues.projectId}
                onChange={(event) => setCreateValues((prev) => ({ ...prev, projectId: event.target.value }))}
              >
                <option value="">Select project</option>
                {projects.map((project) =>
                  project.id ? (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ) : null
                )}
              </select>
            </FormField>
            <FormField label="Material Item" htmlFor="allocation-item-code">
              <select
                id="allocation-item-code"
                value={createValues.itemCode}
                onChange={(event) => {
                  const selectedCode = event.target.value;
                  const material = materialByCode.get(selectedCode);
                  setCreateValues((prev) => ({
                    ...prev,
                    itemCode: selectedCode,
                    itemName: material?.name ?? prev.itemName,
                    unit: material?.standardUnit ?? prev.unit
                  }));
                }}
              >
                <option value="">Select material</option>
                {materials.map((material) => (
                  <option key={material.itemCode} value={material.itemCode}>
                    {material.itemCode} - {material.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Material Name" htmlFor="allocation-item-name">
              <Input
                id="allocation-item-name"
                value={createValues.itemName}
                onChange={(event) => setCreateValues((prev) => ({ ...prev, itemName: event.target.value }))}
                placeholder="Enter name if not in catalog"
              />
            </FormField>
            <FormField label="Unit" htmlFor="allocation-unit">
              <Input
                id="allocation-unit"
                value={createValues.unit}
                onChange={(event) => setCreateValues((prev) => ({ ...prev, unit: event.target.value }))}
              />
            </FormField>
            <FormField label="Requested Quantity" htmlFor="allocation-requested-qty">
              <Input
                id="allocation-requested-qty"
                type="number"
                value={createValues.requestedQuantity}
                onChange={(event) => setCreateValues((prev) => ({ ...prev, requestedQuantity: event.target.value }))}
              />
            </FormField>
            <FormField label="Allocated Quantity" htmlFor="allocation-allocated-qty">
              <Input
                id="allocation-allocated-qty"
                type="number"
                value={createValues.allocatedQuantity}
                onChange={(event) => setCreateValues((prev) => ({ ...prev, allocatedQuantity: event.target.value }))}
              />
            </FormField>
            <FormField label="Stores Status" htmlFor="allocation-stores-status">
              <select
                id="allocation-stores-status"
                value={createValues.storesStatus}
                onChange={(event) => setCreateValues((prev) => ({ ...prev, storesStatus: event.target.value as StoresStatus }))}
              >
                <option value="ALLOCATED_FROM_STORES">Allocated From Stores</option>
                <option value="RECEIVED_IN_STORES">Received In Stores</option>
                <option value="DISPATCHED_TO_PROJECT">Dispatched to Project</option>
              </select>
            </FormField>
            <FormField label="Notes" htmlFor="allocation-notes" className="full-width">
              <Input
                id="allocation-notes"
                value={createValues.notes}
                onChange={(event) => setCreateValues((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Any extra project allocation context"
              />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setShowCreate(false);
              setCreateValues(blankCreateForm);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateAllocation}>Save Allocation</Button>
        </ModalFooter>
      </Modal>

      <Modal open={Boolean(usageTarget)} title="Record Material Usage" onClose={() => setUsageTarget(null)}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Allocation" htmlFor="usage-allocation">
              <Input
                id="usage-allocation"
                value={usageTarget ? `${usageTarget.projectName ?? usageTarget.projectId} · ${usageTarget.itemName}` : ""}
                readOnly
              />
            </FormField>
            <FormField label="Quantity Used" htmlFor="usage-qty">
              <Input
                id="usage-qty"
                type="number"
                value={usageQuantity}
                onChange={(event) => setUsageQuantity(event.target.value)}
              />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setUsageTarget(null)}>Cancel</Button>
          <Button onClick={handleRecordUsage}>Record Usage</Button>
        </ModalFooter>
      </Modal>

      <Modal open={Boolean(returnTarget)} title="Send Leftover Back to Stores" onClose={() => setReturnTarget(null)}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Allocation" htmlFor="return-allocation">
              <Input
                id="return-allocation"
                value={returnTarget ? `${returnTarget.projectName ?? returnTarget.projectId} · ${returnTarget.itemName}` : ""}
                readOnly
              />
            </FormField>
            <FormField label="Return Quantity" htmlFor="return-qty">
              <Input
                id="return-qty"
                type="number"
                value={returnQuantity}
                onChange={(event) => setReturnQuantity(event.target.value)}
              />
            </FormField>
            <FormField label="Reason" htmlFor="return-reason" className="full-width">
              <Input
                id="return-reason"
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
                placeholder="Explain why this material is being returned"
              />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setReturnTarget(null)}>Cancel</Button>
          <Button onClick={handleSendBackToStores}>Send Back to Stores</Button>
        </ModalFooter>
      </Modal>
    </PageShell>
  );
}
