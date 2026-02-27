import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableRoot } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils/date";
import { getStatusTone } from "@/lib/utils/status-tone";
import { inventoryAllocationsSeed, inventoryReturnsSeed, storesRequestsSeed } from "@/mocks/stores-workflow";

type LedgerEntry = {
  id: string;
  happenedAt: string;
  event: string;
  reference: string;
  projectName: string;
  quantity: number;
  unit: string;
  status: string;
};

function labelize(value: string) {
  return value.replace(/_/g, " ");
}

function formatPercent(value: number) {
  if (Number.isNaN(value) || !Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

const totalRequests = storesRequestsSeed.length;
const dispatchedCount = storesRequestsSeed.filter((item) => item.status === "DISPATCHED_TO_PROJECT").length;
const escalatedCount = storesRequestsSeed.filter(
  (item) => item.status === "ESCALATED_TO_FINANCE" || item.status === "ORDERED_BY_FINANCE"
).length;

const fulfillmentRate = totalRequests === 0 ? 0 : (dispatchedCount / totalRequests) * 100;
const escalationRate = totalRequests === 0 ? 0 : (escalatedCount / totalRequests) * 100;

const leadTimesHours = storesRequestsSeed
  .filter((item) => item.dispatchedAt)
  .map((item) => {
    const requestedAt = new Date(item.requestedAt).getTime();
    const dispatchedAt = new Date(item.dispatchedAt as string).getTime();
    return (dispatchedAt - requestedAt) / (1000 * 60 * 60);
  })
  .filter((value) => value >= 0);

const averageLeadTimeHours =
  leadTimesHours.length === 0 ? 0 : leadTimesHours.reduce((sum, item) => sum + item, 0) / leadTimesHours.length;

const statusCounts = storesRequestsSeed.reduce<Record<string, number>>((acc, item) => {
  acc[item.status] = (acc[item.status] ?? 0) + 1;
  return acc;
}, {});

const requestTypeCounts = storesRequestsSeed.reduce<Record<string, number>>((acc, item) => {
  acc[item.requestType] = (acc[item.requestType] ?? 0) + 1;
  return acc;
}, {});

const projectConsumption = Object.values(
  inventoryAllocationsSeed.reduce<
    Record<
      string,
      {
        projectName: string;
        allocated: number;
        used: number;
        returned: number;
      }
    >
  >((acc, item) => {
    const current = acc[item.projectId] ?? {
      projectName: item.projectName,
      allocated: 0,
      used: 0,
      returned: 0
    };
    current.allocated += item.allocatedQuantity;
    current.used += item.usedQuantity;
    current.returned += item.returnedQuantity;
    acc[item.projectId] = current;
    return acc;
  }, {})
).sort((left, right) => right.used - left.used);

const ledgerEntries: LedgerEntry[] = [
  ...storesRequestsSeed.map((item) => ({
    id: `${item.id}-REQUESTED`,
    happenedAt: item.requestedAt,
    event: "Request Submitted",
    reference: item.id,
    projectName: item.projectName,
    quantity: item.requestedQuantity,
    unit: item.unit,
    status: item.status
  })),
  ...storesRequestsSeed
    .filter((item) => item.orderedAt)
    .map((item) => ({
      id: `${item.id}-ORDERED`,
      happenedAt: item.orderedAt as string,
      event: "Finance Ordered",
      reference: item.financeReference ?? item.id,
      projectName: item.projectName,
      quantity: item.requestedQuantity,
      unit: item.unit,
      status: "ORDERED_BY_FINANCE"
    })),
  ...storesRequestsSeed
    .filter((item) => item.receivedAt)
    .map((item) => ({
      id: `${item.id}-RECEIVED`,
      happenedAt: item.receivedAt as string,
      event: "Received in Stores",
      reference: item.id,
      projectName: item.projectName,
      quantity: item.requestedQuantity,
      unit: item.unit,
      status: "RECEIVED_IN_STORES"
    })),
  ...storesRequestsSeed
    .filter((item) => item.dispatchedAt)
    .map((item) => ({
      id: `${item.id}-DISPATCHED`,
      happenedAt: item.dispatchedAt as string,
      event: "Dispatched to Project",
      reference: item.id,
      projectName: item.projectName,
      quantity: item.requestedQuantity,
      unit: item.unit,
      status: "DISPATCHED_TO_PROJECT"
    })),
  ...inventoryReturnsSeed.map((item) => ({
    id: `${item.id}-RETURN`,
    happenedAt: item.receivedAt ?? item.createdAt,
    event: item.receivedAt ? "Return Received in Stores" : "Return Sent to Stores",
    reference: item.id,
    projectName: item.projectName,
    quantity: item.quantity,
    unit: "units",
    status: item.status
  }))
]
  .sort((left, right) => new Date(right.happenedAt).getTime() - new Date(left.happenedAt).getTime())
  .slice(0, 20);

export default function StoresReportsPage() {
  return (
    <PageShell>
      <PageHeader
        title="Stores Reports"
        subtitle="Operational KPIs, status distribution, project consumption, and movement ledger."
      />

      <div className="card-grid">
        <Card className="metric-card metric-card--projects">
          <p className="card-title">Total Requests</p>
          <p className="metric">{totalRequests}</p>
          <p className="metric-caption">All store-handled requests in current dataset</p>
        </Card>
        <Card className="metric-card metric-card--budget">
          <p className="card-title">Fulfillment Rate</p>
          <p className="metric">{formatPercent(fulfillmentRate)}</p>
          <p className="metric-caption">Requests dispatched to project</p>
        </Card>
        <Card className="metric-card metric-card--pos">
          <p className="card-title">Escalation Rate</p>
          <p className="metric">{formatPercent(escalationRate)}</p>
          <p className="metric-caption">Requests escalated to Finance procurement</p>
        </Card>
        <Card className="metric-card metric-card--invoices">
          <p className="card-title">Avg Lead Time</p>
          <p className="metric">{averageLeadTimeHours.toFixed(1)}h</p>
          <p className="metric-caption">Requested to dispatched cycle time</p>
        </Card>
      </div>

      <div className="grid-two">
        <SectionCard>
          <div className="section-header">
            <h2>Request Status Summary</h2>
            <p className="muted">Distribution of operational request statuses.</p>
          </div>
          <div className="desktop-table">
            <Table>
              <TableRoot>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <tr key={status}>
                      <td>
                        <Badge label={labelize(status)} tone={getStatusTone(status)} />
                      </td>
                      <td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </TableRoot>
            </Table>
          </div>
          <div className="mobile-list">
            {Object.entries(statusCounts).map(([status, count]) => (
              <article key={`status-mobile-${status}`} className="mobile-card">
                <div className="mobile-card-head">
                  <div>
                    <p className="mobile-card-title">{labelize(status)}</p>
                    <p className="mobile-card-subtitle">Request Status</p>
                  </div>
                  <Badge label={labelize(status)} tone={getStatusTone(status)} />
                </div>
                <div className="mobile-card-grid">
                  <div className="mobile-field">
                    <span className="mobile-label">Count</span>
                    <span className="mobile-value">{count}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="section-header">
            <h2>Request Type Mix</h2>
            <p className="muted">Demand split by material, tools, and PPE.</p>
          </div>
          <div className="desktop-table">
            <Table>
              <TableRoot>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(requestTypeCounts).map(([type, count]) => (
                    <tr key={type}>
                      <td>{type}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </TableRoot>
            </Table>
          </div>
          <div className="mobile-list">
            {Object.entries(requestTypeCounts).map(([type, count]) => (
              <article key={`type-mobile-${type}`} className="mobile-card">
                <div className="mobile-card-head">
                  <div>
                    <p className="mobile-card-title">{type}</p>
                    <p className="mobile-card-subtitle">Request Type</p>
                  </div>
                </div>
                <div className="mobile-card-grid">
                  <div className="mobile-field">
                    <span className="mobile-label">Count</span>
                    <span className="mobile-value">{count}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>

      <section>
        <SectionCard>
          <div className="section-header">
            <h2>Project Consumption Snapshot</h2>
            <p className="muted">Allocated vs used vs returned quantities by project.</p>
          </div>
          <div className="desktop-table">
            <Table>
              <TableRoot>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Allocated</th>
                    <th>Used</th>
                    <th>Returned</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {projectConsumption.map((item) => {
                    const utilization = item.allocated === 0 ? 0 : (item.used / item.allocated) * 100;
                    return (
                      <tr key={item.projectName}>
                        <td>{item.projectName}</td>
                        <td>{item.allocated}</td>
                        <td>{item.used}</td>
                        <td>{item.returned}</td>
                        <td>{formatPercent(utilization)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </TableRoot>
            </Table>
          </div>
          <div className="mobile-list">
            {projectConsumption.map((item) => {
              const utilization = item.allocated === 0 ? 0 : (item.used / item.allocated) * 100;
              return (
                <article key={`consumption-mobile-${item.projectName}`} className="mobile-card">
                  <div className="mobile-card-head">
                    <div>
                      <p className="mobile-card-title">{item.projectName}</p>
                      <p className="mobile-card-subtitle">Project Consumption</p>
                    </div>
                    <span className="mobile-value">{formatPercent(utilization)}</span>
                  </div>
                  <div className="mobile-card-grid">
                    <div className="mobile-field">
                      <span className="mobile-label">Allocated</span>
                      <span className="mobile-value">{item.allocated}</span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-label">Used</span>
                      <span className="mobile-value">{item.used}</span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-label">Returned</span>
                      <span className="mobile-value">{item.returned}</span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-label">Utilization</span>
                      <span className="mobile-value">{formatPercent(utilization)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </SectionCard>
      </section>

      <section>
        <SectionCard>
          <div className="section-header">
            <h2>Latest Item Ledger</h2>
            <p className="muted">Recent lifecycle events for requests, procurement, dispatch, and returns.</p>
          </div>
          <div className="desktop-table">
            <Table>
              <TableRoot>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Event</th>
                    <th>Reference</th>
                    <th>Project</th>
                    <th>Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTime(entry.happenedAt)}</td>
                      <td>{entry.event}</td>
                      <td>{entry.reference}</td>
                      <td>{entry.projectName}</td>
                      <td>{entry.quantity} {entry.unit}</td>
                      <td>
                        <Badge label={labelize(entry.status)} tone={getStatusTone(entry.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableRoot>
            </Table>
          </div>
          <div className="mobile-list">
            {ledgerEntries.map((entry) => (
              <article key={`ledger-mobile-${entry.id}`} className="mobile-card">
                <div className="mobile-card-head">
                  <div>
                    <p className="mobile-card-title">{entry.event}</p>
                    <p className="mobile-card-subtitle">{formatDateTime(entry.happenedAt)}</p>
                  </div>
                  <Badge label={labelize(entry.status)} tone={getStatusTone(entry.status)} />
                </div>
                <div className="mobile-card-grid">
                  <div className="mobile-field">
                    <span className="mobile-label">Reference</span>
                    <span className="mobile-value">{entry.reference}</span>
                  </div>
                  <div className="mobile-field">
                    <span className="mobile-label">Project</span>
                    <span className="mobile-value">{entry.projectName}</span>
                  </div>
                  <div className="mobile-field">
                    <span className="mobile-label">Quantity</span>
                    <span className="mobile-value">{entry.quantity} {entry.unit}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </section>
    </PageShell>
  );
}
