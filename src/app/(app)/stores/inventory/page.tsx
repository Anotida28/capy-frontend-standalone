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
import { inventoryAllocationsSeed, inventoryReturnsSeed, storesRequestsSeed } from "@/mocks/stores-workflow";

const totalAllocatedQuantity = inventoryAllocationsSeed.reduce((sum, item) => sum + item.allocatedQuantity, 0);
const totalUsedQuantity = inventoryAllocationsSeed.reduce((sum, item) => sum + item.usedQuantity, 0);
const totalReturnedQuantity = inventoryAllocationsSeed.reduce((sum, item) => sum + item.returnedQuantity, 0);

const activeAllocations = inventoryAllocationsSeed.filter(
  (item) => item.lifecycleStatus === "TRACKING_USAGE" || item.lifecycleStatus === "PARTIALLY_RETURNED_TO_STORES"
);

const inTransitReturns = inventoryReturnsSeed.filter((item) => item.status === "RETURN_SENT_TO_STORES");

const reorderWatchlist = storesRequestsSeed
  .filter((item) => item.availableInStores < item.requestedQuantity)
  .sort((left, right) => new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime());

function labelize(value: string) {
  return value.replace(/_/g, " ");
}

export default function StoresInventoryPage() {
  return (
    <PageShell>
      <PageHeader
        title="Stores Inventory"
        subtitle="Stock usage and movement management with returns, reorders, and allocation visibility."
      />

      <div className="card-grid">
        <Card className="metric-card metric-card--projects">
          <p className="card-title">Active Allocations</p>
          <p className="metric">{activeAllocations.length}</p>
          <p className="metric-caption">Items currently in project lifecycle</p>
          <a className="primary-button" href="#allocation-register">Open Register →</a>
        </Card>
        <Card className="metric-card metric-card--budget">
          <p className="card-title">Allocated Quantity</p>
          <p className="metric">{totalAllocatedQuantity}</p>
          <p className="metric-caption">Total quantity issued from stores</p>
          <a className="primary-button" href="#allocation-register">View Issued Items →</a>
        </Card>
        <Card className="metric-card metric-card--invoices">
          <p className="card-title">Returned Quantity</p>
          <p className="metric">{totalReturnedQuantity}</p>
          <p className="metric-caption">Stock returned back to stores</p>
          <a className="primary-button" href="#returns-queue">Open Returns →</a>
        </Card>
        <Card className="metric-card metric-card--pos">
          <p className="card-title">In Transit Returns</p>
          <p className="metric">{inTransitReturns.length}</p>
          <p className="metric-caption">Returns sent from site awaiting receipt</p>
          <Link className="primary-button" href={routes.storesWorkQueue}>Open Work Queue →</Link>
        </Card>
      </div>

      <section id="allocation-register">
        <SectionCard>
          <div className="section-header">
            <h2>Allocation Register</h2>
            <p className="muted">Single view of requested, allocated, used, and returned quantities by project.</p>
          </div>
          <Table>
            <TableRoot>
              <thead>
                <tr>
                  <th>Allocation</th>
                  <th>Project</th>
                  <th>Requested</th>
                  <th>Allocated</th>
                  <th>Used</th>
                  <th>Returned</th>
                  <th>Stores Status</th>
                  <th>Lifecycle</th>
                  <th>Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {inventoryAllocationsSeed.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="table-title">{item.itemName}</div>
                      <div className="muted">{item.id} · {item.itemCode}</div>
                    </td>
                    <td>
                      <div className="table-title">{item.projectName}</div>
                      <div className="muted">{item.projectManagerName}</div>
                    </td>
                    <td>{item.requestedQuantity} {item.unit}</td>
                    <td>{item.allocatedQuantity} {item.unit}</td>
                    <td>{item.usedQuantity} {item.unit}</td>
                    <td>{item.returnedQuantity} {item.unit}</td>
                    <td>
                      <Badge label={labelize(item.storesStatus)} tone={getStatusTone(item.storesStatus)} />
                    </td>
                    <td>
                      <Badge label={labelize(item.lifecycleStatus)} tone={getStatusTone(item.lifecycleStatus)} />
                    </td>
                    <td>{formatDateTime(item.lastReturnAt ?? item.lastUsageAt ?? item.allocatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </TableRoot>
          </Table>
        </SectionCard>
      </section>

      <section id="returns-queue">
        <SectionCard>
          <div className="section-header">
            <h2>Returns Queue</h2>
            <p className="muted">Track project returns until they are received and posted back into stock.</p>
          </div>
          {inventoryReturnsSeed.length === 0 ? (
            <p className="muted">No return records available.</p>
          ) : (
            <Table>
              <TableRoot>
                <thead>
                  <tr>
                    <th>Return</th>
                    <th>Project</th>
                    <th>Quantity</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryReturnsSeed.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="table-title">{item.itemName}</div>
                        <div className="muted">{item.id} · {item.allocationId}</div>
                      </td>
                      <td>{item.projectName}</td>
                      <td>{item.quantity}</td>
                      <td>{item.reason ?? "-"}</td>
                      <td>
                        <Badge label={labelize(item.status)} tone={getStatusTone(item.status)} />
                      </td>
                      <td>{formatDateTime(item.createdAt)}</td>
                      <td>{formatDateTime(item.receivedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </TableRoot>
            </Table>
          )}
        </SectionCard>
      </section>

      <section id="reorder-watchlist">
        <SectionCard>
          <div className="section-header">
            <h2>Reorder Watchlist</h2>
            <p className="muted">Requests where available stock is below requested quantity.</p>
          </div>
          {reorderWatchlist.length === 0 ? (
            <p className="muted">No low-stock demand identified from current requests.</p>
          ) : (
            <Table>
              <TableRoot>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Project</th>
                    <th>Requested</th>
                    <th>Available</th>
                    <th>Gap</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reorderWatchlist.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="table-title">{item.itemName}</div>
                        <div className="muted">{item.itemCode}</div>
                      </td>
                      <td>{item.projectName}</td>
                      <td>{item.requestedQuantity} {item.unit}</td>
                      <td>{item.availableInStores} {item.unit}</td>
                      <td>{item.requestedQuantity - item.availableInStores} {item.unit}</td>
                      <td>{item.priority}</td>
                      <td>
                        <Badge label={labelize(item.status)} tone={getStatusTone(item.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableRoot>
            </Table>
          )}
          <p className="muted">Total used quantity across active allocations: {totalUsedQuantity}</p>
        </SectionCard>
      </section>
    </PageShell>
  );
}
