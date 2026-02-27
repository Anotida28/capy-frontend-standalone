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
import { getStatusTone } from "@/lib/utils/status-tone";
import { formatDateTime } from "@/lib/utils/date";
import { storesRequestsSeed } from "@/mocks/stores-workflow";

type RequestPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type RequestType = "MATERIAL" | "TOOL" | "PPE";
type StoresStatus =
  | "PENDING_STORES_REVIEW"
  | "ALLOCATED_FROM_STORES"
  | "ESCALATED_TO_FINANCE"
  | "ORDERED_BY_FINANCE"
  | "RECEIVED_IN_STORES"
  | "DISPATCHED_TO_PROJECT";

type StoresRequest = {
  id: string;
  projectId: string;
  projectName: string;
  requestedBy: string;
  itemCode: string;
  itemName: string;
  requestType: RequestType;
  requestedQuantity: number;
  unit: string;
  availableInStores: number;
  priority: RequestPriority;
  requestedAt: string;
  status: StoresStatus;
  financeReference?: string;
  orderedAt?: string;
  receivedAt?: string;
  dispatchedAt?: string;
};

const initialRequests: StoresRequest[] = storesRequestsSeed;

const priorityRank: Record<RequestPriority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3
};

function labelize(value: string) {
  return value.replace(/_/g, " ");
}

function sortByPriorityAndDate(left: StoresRequest, right: StoresRequest) {
  const rank = priorityRank[left.priority] - priorityRank[right.priority];
  if (rank !== 0) return rank;
  return new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime();
}

export default function StoresDashboardPage() {
  const [requests, setRequests] = useState<StoresRequest[]>(() => initialRequests.map((item) => ({ ...item })));

  const incomingRequests = useMemo(
    () => requests.filter((item) => item.status === "PENDING_STORES_REVIEW").sort(sortByPriorityAndDate),
    [requests]
  );

  const financeQueue = useMemo(
    () => requests.filter((item) => item.status === "ESCALATED_TO_FINANCE" || item.status === "ORDERED_BY_FINANCE"),
    [requests]
  );

  const dispatchQueue = useMemo(
    () =>
      requests.filter(
        (item) =>
          item.status === "ALLOCATED_FROM_STORES" ||
          item.status === "RECEIVED_IN_STORES" ||
          item.status === "DISPATCHED_TO_PROJECT"
      ),
    [requests]
  );

  const kpis = useMemo(() => {
    const awaitingReview = requests.filter((item) => item.status === "PENDING_STORES_REVIEW").length;
    const allocatedFromStores = requests.filter((item) => item.status === "ALLOCATED_FROM_STORES").length;
    const waitingFinance = requests.filter(
      (item) => item.status === "ESCALATED_TO_FINANCE" || item.status === "ORDERED_BY_FINANCE"
    ).length;
    const readyToDispatch = requests.filter(
      (item) => item.status === "ALLOCATED_FROM_STORES" || item.status === "RECEIVED_IN_STORES"
    ).length;
    return {
      awaitingReview,
      allocatedFromStores,
      waitingFinance,
      readyToDispatch
    };
  }, [requests]);

  const activity = useMemo(() => {
    return [...requests]
      .sort((left, right) => {
        const leftDate = new Date(left.dispatchedAt ?? left.receivedAt ?? left.orderedAt ?? left.requestedAt).getTime();
        const rightDate = new Date(right.dispatchedAt ?? right.receivedAt ?? right.orderedAt ?? right.requestedAt).getTime();
        return rightDate - leftDate;
      })
      .slice(0, 5);
  }, [requests]);

  const patchRequest = (id: string, mutator: (current: StoresRequest) => StoresRequest) => {
    setRequests((prev) => prev.map((item) => (item.id === id ? mutator(item) : item)));
  };

  const allocateFromStores = (id: string) => {
    patchRequest(id, (current) => {
      if (current.status !== "PENDING_STORES_REVIEW") return current;
      if (current.availableInStores < current.requestedQuantity) return current;
      return {
        ...current,
        status: "ALLOCATED_FROM_STORES",
        availableInStores: current.availableInStores - current.requestedQuantity
      };
    });
  };

  const escalateToFinance = (id: string) => {
    patchRequest(id, (current) => {
      if (current.status !== "PENDING_STORES_REVIEW") return current;
      return {
        ...current,
        status: "ESCALATED_TO_FINANCE",
        financeReference: current.financeReference ?? `FIN-REQ-${current.id.replace("SR-", "")}`
      };
    });
  };

  const markFinanceOrdered = (id: string) => {
    patchRequest(id, (current) => {
      if (current.status !== "ESCALATED_TO_FINANCE") return current;
      return {
        ...current,
        status: "ORDERED_BY_FINANCE",
        orderedAt: new Date().toISOString()
      };
    });
  };

  const markReceivedInStores = (id: string) => {
    patchRequest(id, (current) => {
      if (current.status !== "ORDERED_BY_FINANCE") return current;
      return {
        ...current,
        status: "RECEIVED_IN_STORES",
        receivedAt: new Date().toISOString(),
        availableInStores: current.availableInStores + current.requestedQuantity
      };
    });
  };

  const dispatchToProject = (id: string) => {
    patchRequest(id, (current) => {
      if (current.status === "DISPATCHED_TO_PROJECT") return current;
      if (current.status !== "ALLOCATED_FROM_STORES" && current.status !== "RECEIVED_IN_STORES") return current;
      return {
        ...current,
        status: "DISPATCHED_TO_PROJECT",
        dispatchedAt: new Date().toISOString()
      };
    });
  };

  const addDemoRequest = () => {
    const nextId = `SR-${(1000 + requests.length + 1).toString()}`;
    const now = new Date().toISOString();
    setRequests((prev) => [
      {
        id: nextId,
        projectId: "proj-001",
        projectName: "Office Renovation",
        requestedBy: "Jordan Site",
        itemCode: "MAT-001",
        itemName: "Rebar 12mm",
        requestType: "MATERIAL",
        requestedQuantity: 200,
        unit: "kg",
        availableInStores: 30,
        priority: "HIGH",
        requestedAt: now,
        status: "PENDING_STORES_REVIEW"
      },
      ...prev
    ]);
  };

  return (
    <PageShell>
      <PageHeader
        title="Stores Dashboard"
        subtitle="Operations requests arrive here first. Stores can allocate stock or escalate procurement to Finance."
        actions={<Button onClick={addDemoRequest}>Simulate Site Request</Button>}
      />

      <div className="card-grid">
        <Card className="metric-card metric-card--projects">
          <p className="card-title">Incoming Requests</p>
          <p className="metric">{kpis.awaitingReview}</p>
          <p className="metric-caption">Waiting for stores review</p>
          <Link className="primary-button" href="#incoming-requests">
            Open Queue →
          </Link>
        </Card>
        <Card className="metric-card metric-card--budget">
          <p className="card-title">Allocated From Stores</p>
          <p className="metric">{kpis.allocatedFromStores}</p>
          <p className="metric-caption">Stock available and reserved</p>
          <Link className="primary-button" href="#dispatch-queue">
            Dispatch Queue →
          </Link>
        </Card>
        <Card className="metric-card metric-card--pos">
          <p className="card-title">Waiting on Finance</p>
          <p className="metric">{kpis.waitingFinance}</p>
          <p className="metric-caption">Escalated procurement requests</p>
          <Link className="primary-button" href="#finance-queue">
            Procurement Queue →
          </Link>
        </Card>
        <Card className="metric-card metric-card--invoices">
          <p className="card-title">Ready to Dispatch</p>
          <p className="metric">{kpis.readyToDispatch}</p>
          <p className="metric-caption">Can be sent to project now</p>
          <Link className="primary-button" href="#dispatch-queue">
            Send to Site →
          </Link>
        </Card>
      </div>

      <div className="grid-two">
        <SectionCard className="chart-card">
          <div className="section-header">
            <h2>Process Flow</h2>
            <p className="muted">Frontend model for your stores operation workflow.</p>
          </div>
          <ul className="activity-feed">
            <li className="activity-item">
              <div>
                <p>1. Operations submits site material/tool request.</p>
                <p className="activity-meta">Status: PENDING_STORES_REVIEW</p>
              </div>
            </li>
            <li className="activity-item">
              <div>
                <p>2. Stores reviews stock and either allocates or escalates to Finance.</p>
                <p className="activity-meta">Statuses: ALLOCATED_FROM_STORES or ESCALATED_TO_FINANCE</p>
              </div>
            </li>
            <li className="activity-item">
              <div>
                <p>3. Finance procurement is tracked until items are received in Stores.</p>
                <p className="activity-meta">Statuses: ORDERED_BY_FINANCE then RECEIVED_IN_STORES</p>
              </div>
            </li>
            <li className="activity-item">
              <div>
                <p>4. Stores dispatches approved items to the project site.</p>
                <p className="activity-meta">Status: DISPATCHED_TO_PROJECT</p>
              </div>
            </li>
          </ul>
        </SectionCard>

        <SectionCard className="chart-card">
          <div className="section-header">
            <h2>Recent Stores Activity</h2>
            <p className="muted">Latest movement across request, procurement, and dispatch.</p>
          </div>
          <ul className="activity-feed">
            {activity.map((item) => (
              <li key={item.id} className="activity-item">
                <div>
                  <p>
                    {item.id} · {item.itemName} ({item.projectName})
                  </p>
                  <p className="activity-meta">
                    {labelize(item.status)} · {formatDateTime(item.dispatchedAt ?? item.receivedAt ?? item.orderedAt ?? item.requestedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <section id="incoming-requests">
        <SectionCard>
          <div className="section-header">
            <h2>Incoming Site Requests</h2>
            <p className="muted">Review and decide whether to allocate from stock or escalate to Finance.</p>
          </div>
          {incomingRequests.length === 0 ? (
            <p className="muted">No incoming requests right now.</p>
          ) : (
            <Table>
              <TableRoot>
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Project</th>
                    <th>Quantity</th>
                    <th>Stores Stock</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th className="actions-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomingRequests.map((item) => {
                    const hasSufficientStock = item.availableInStores >= item.requestedQuantity;
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="table-title">{item.itemName}</div>
                          <div className="muted">
                            {item.id} · {item.requestType}
                          </div>
                        </td>
                        <td>
                          <div className="table-title">{item.projectName}</div>
                          <div className="muted">{item.requestedBy}</div>
                        </td>
                        <td>{item.requestedQuantity} {item.unit}</td>
                        <td>{item.availableInStores} {item.unit}</td>
                        <td>{item.priority}</td>
                        <td>
                          <Badge label={labelize(item.status)} tone={getStatusTone(item.status)} />
                        </td>
                        <td className="actions-cell">
                          <div className="row-actions">
                            <Button variant="ghost" onClick={() => allocateFromStores(item.id)} disabled={!hasSufficientStock}>
                              Allocate
                            </Button>
                            <Button variant="ghost" onClick={() => escalateToFinance(item.id)}>
                              Escalate to Finance
                            </Button>
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
      </section>

      <section id="finance-queue">
        <SectionCard>
          <div className="section-header">
            <h2>Finance Procurement Queue</h2>
            <p className="muted">Requests escalated by Stores and waiting for purchase and receipt.</p>
          </div>
          {financeQueue.length === 0 ? (
            <p className="muted">No finance escalations currently.</p>
          ) : (
            <Table>
              <TableRoot>
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Project</th>
                    <th>Finance Ref</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th className="actions-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {financeQueue.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="table-title">{item.itemName}</div>
                        <div className="muted">{item.id}</div>
                      </td>
                      <td>{item.projectName}</td>
                      <td>{item.financeReference ?? "-"}</td>
                      <td>{item.requestedQuantity} {item.unit}</td>
                      <td>
                        <Badge label={labelize(item.status)} tone={getStatusTone(item.status)} />
                      </td>
                      <td className="actions-cell">
                        <div className="row-actions">
                          <Button
                            variant="ghost"
                            onClick={() => markFinanceOrdered(item.id)}
                            disabled={item.status !== "ESCALATED_TO_FINANCE"}
                          >
                            Mark Ordered
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => markReceivedInStores(item.id)}
                            disabled={item.status !== "ORDERED_BY_FINANCE"}
                          >
                            Mark Received
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableRoot>
            </Table>
          )}
        </SectionCard>
      </section>

      <section id="dispatch-queue">
        <SectionCard>
          <div className="section-header">
            <h2>Dispatch to Project</h2>
            <p className="muted">Final handoff from Stores to site once stock is allocated or received.</p>
          </div>
          {dispatchQueue.length === 0 ? (
            <p className="muted">Nothing to dispatch yet.</p>
          ) : (
            <Table>
              <TableRoot>
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Project</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Last Update</th>
                    <th className="actions-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchQueue.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="table-title">{item.itemName}</div>
                        <div className="muted">{item.id}</div>
                      </td>
                      <td>{item.projectName}</td>
                      <td>{item.requestedQuantity} {item.unit}</td>
                      <td>
                        <Badge label={labelize(item.status)} tone={getStatusTone(item.status)} />
                      </td>
                      <td>{formatDateTime(item.dispatchedAt ?? item.receivedAt ?? item.requestedAt)}</td>
                      <td className="actions-cell">
                        <Button
                          variant="ghost"
                          onClick={() => dispatchToProject(item.id)}
                          disabled={item.status === "DISPATCHED_TO_PROJECT"}
                        >
                          Dispatch to Project
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableRoot>
            </Table>
          )}
        </SectionCard>
      </section>
    </PageShell>
  );
}
