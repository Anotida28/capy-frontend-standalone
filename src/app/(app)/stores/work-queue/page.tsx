import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableRoot } from "@/components/ui/table";
import { routes } from "@/lib/constants/routes";
import { formatDateTime } from "@/lib/utils/date";
import { getStatusTone } from "@/lib/utils/status-tone";
import { storesRequestsSeed } from "@/mocks/stores-workflow";

type StoresRequest = (typeof storesRequestsSeed)[number];

const priorityRank = {
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

const incomingRequests = storesRequestsSeed
  .filter((item) => item.status === "PENDING_STORES_REVIEW")
  .sort(sortByPriorityAndDate);

const procurementQueue = storesRequestsSeed
  .filter((item) => item.status === "ESCALATED_TO_FINANCE" || item.status === "ORDERED_BY_FINANCE")
  .sort((left, right) => new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime());

const dispatchQueue = storesRequestsSeed
  .filter((item) => item.status === "ALLOCATED_FROM_STORES" || item.status === "RECEIVED_IN_STORES")
  .sort((left, right) => new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime());

const completedDispatches = storesRequestsSeed.filter((item) => item.status === "DISPATCHED_TO_PROJECT");

export default function StoresWorkQueuePage() {
  return (
    <PageShell>
      <PageHeader
        title="Stores Work Queue"
        subtitle="Combined intake, procurement handoff, receiving, and dispatch in one operational queue."
      />

      <div className="card-grid">
        <Card className="metric-card metric-card--projects">
          <p className="card-title">Awaiting Review</p>
          <p className="metric">{incomingRequests.length}</p>
          <p className="metric-caption">Site requests requiring stores decision</p>
          <a className="primary-button" href="#intake">Open Intake →</a>
        </Card>
        <Card className="metric-card metric-card--pos">
          <p className="card-title">Procurement Queue</p>
          <p className="metric">{procurementQueue.length}</p>
          <p className="metric-caption">Escalated items tracked with Finance</p>
          <a className="primary-button" href="#procurement">Open Procurement →</a>
        </Card>
        <Card className="metric-card metric-card--budget">
          <p className="card-title">Ready to Dispatch</p>
          <p className="metric">{dispatchQueue.length}</p>
          <p className="metric-caption">Allocated/received and pending handoff to site</p>
          <a className="primary-button" href="#dispatch">Open Dispatch →</a>
        </Card>
        <Card className="metric-card metric-card--invoices">
          <p className="card-title">Completed Dispatches</p>
          <p className="metric">{completedDispatches.length}</p>
          <p className="metric-caption">Requests already completed by stores</p>
          <Link className="primary-button" href={routes.storesReports}>See Reports →</Link>
        </Card>
      </div>

      <section id="intake">
        <SectionCard>
          <div className="section-header">
            <h2>Intake and Review</h2>
            <p className="muted">Requests entering stores for stock allocation or finance escalation.</p>
          </div>
          {incomingRequests.length === 0 ? (
            <p className="muted">No requests are waiting for stores review.</p>
          ) : (
            <>
              <div className="desktop-table">
                <Table>
                  <TableRoot>
                    <thead>
                      <tr>
                        <th>Request</th>
                        <th>Project</th>
                        <th>Quantity</th>
                        <th>Stock</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Recommended Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomingRequests.map((item) => {
                        const hasSufficientStock = item.availableInStores >= item.requestedQuantity;
                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="table-title">{item.itemName}</div>
                              <div className="muted">{item.id} - {item.requestType}</div>
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
                            <td>{hasSufficientStock ? "Allocate from stores" : "Escalate to Finance"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </TableRoot>
                </Table>
              </div>
              <div className="mobile-list">
                {incomingRequests.map((item) => {
                  const hasSufficientStock = item.availableInStores >= item.requestedQuantity;
                  return (
                    <article key={`intake-mobile-${item.id}`} className="mobile-card">
                      <div className="mobile-card-head">
                        <div>
                          <p className="mobile-card-title">{item.itemName}</p>
                          <p className="mobile-card-subtitle">{item.id} - {item.requestType}</p>
                        </div>
                        <Badge label={labelize(item.status)} tone={getStatusTone(item.status)} />
                      </div>
                      <div className="mobile-card-grid">
                        <div className="mobile-field">
                          <span className="mobile-label">Project</span>
                          <span className="mobile-value">{item.projectName}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-label">Requested By</span>
                          <span className="mobile-value">{item.requestedBy}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-label">Quantity</span>
                          <span className="mobile-value">{item.requestedQuantity} {item.unit}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-label">Stock</span>
                          <span className="mobile-value">{item.availableInStores} {item.unit}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-label">Priority</span>
                          <span className="mobile-value">{item.priority}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-label">Recommended</span>
                          <span className="mobile-value">{hasSufficientStock ? "Allocate from stores" : "Escalate to Finance"}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </SectionCard>
      </section>

      <section id="procurement">
        <SectionCard>
          <div className="section-header">
            <h2>Procurement and Receiving</h2>
            <p className="muted">Items escalated to Finance until stock is physically received in stores.</p>
          </div>
          {procurementQueue.length === 0 ? (
            <p className="muted">No requests currently waiting on Finance procurement.</p>
          ) : (
            <>
              <div className="desktop-table">
                <Table>
                  <TableRoot>
                    <thead>
                      <tr>
                        <th>Request</th>
                        <th>Project</th>
                        <th>Finance Ref</th>
                        <th>Status</th>
                        <th>Last Update</th>
                        <th>Next Step</th>
                      </tr>
                    </thead>
                    <tbody>
                      {procurementQueue.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="table-title">{item.itemName}</div>
                            <div className="muted">{item.id}</div>
                          </td>
                          <td>{item.projectName}</td>
                          <td>{item.financeReference ?? "-"}</td>
                          <td>
                            <Badge label={labelize(item.status)} tone={getStatusTone(item.status)} />
                          </td>
                          <td>{formatDateTime(item.orderedAt ?? item.requestedAt)}</td>
                          <td>{item.status === "ORDERED_BY_FINANCE" ? "Receive into stores" : "Await PO / vendor"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </TableRoot>
                </Table>
              </div>
              <div className="mobile-list">
                {procurementQueue.map((item) => (
                  <article key={`procurement-mobile-${item.id}`} className="mobile-card">
                    <div className="mobile-card-head">
                      <div>
                        <p className="mobile-card-title">{item.itemName}</p>
                        <p className="mobile-card-subtitle">{item.id}</p>
                      </div>
                      <Badge label={labelize(item.status)} tone={getStatusTone(item.status)} />
                    </div>
                    <div className="mobile-card-grid">
                      <div className="mobile-field">
                        <span className="mobile-label">Project</span>
                        <span className="mobile-value">{item.projectName}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-label">Finance Ref</span>
                        <span className="mobile-value">{item.financeReference ?? "-"}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-label">Last Update</span>
                        <span className="mobile-value">{formatDateTime(item.orderedAt ?? item.requestedAt)}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-label">Next Step</span>
                        <span className="mobile-value">{item.status === "ORDERED_BY_FINANCE" ? "Receive into stores" : "Await PO / vendor"}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </section>

      <section id="dispatch">
        <SectionCard>
          <div className="section-header">
            <h2>Dispatch Queue</h2>
            <p className="muted">Requests approved by stores and pending final dispatch to project teams.</p>
          </div>
          {dispatchQueue.length === 0 ? (
            <p className="muted">No requests currently waiting for dispatch.</p>
          ) : (
            <>
              <div className="desktop-table">
                <Table>
                  <TableRoot>
                    <thead>
                      <tr>
                        <th>Request</th>
                        <th>Project</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Ready Since</th>
                        <th>Next Step</th>
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
                          <td>{formatDateTime(item.receivedAt ?? item.requestedAt)}</td>
                          <td>Dispatch to project</td>
                        </tr>
                      ))}
                    </tbody>
                  </TableRoot>
                </Table>
              </div>
              <div className="mobile-list">
                {dispatchQueue.map((item) => (
                  <article key={`dispatch-mobile-${item.id}`} className="mobile-card">
                    <div className="mobile-card-head">
                      <div>
                        <p className="mobile-card-title">{item.itemName}</p>
                        <p className="mobile-card-subtitle">{item.id}</p>
                      </div>
                      <Badge label={labelize(item.status)} tone={getStatusTone(item.status)} />
                    </div>
                    <div className="mobile-card-grid">
                      <div className="mobile-field">
                        <span className="mobile-label">Project</span>
                        <span className="mobile-value">{item.projectName}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-label">Quantity</span>
                        <span className="mobile-value">{item.requestedQuantity} {item.unit}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-label">Ready Since</span>
                        <span className="mobile-value">{formatDateTime(item.receivedAt ?? item.requestedAt)}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-label">Next Step</span>
                        <span className="mobile-value">Dispatch to project</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </section>
    </PageShell>
  );
}
