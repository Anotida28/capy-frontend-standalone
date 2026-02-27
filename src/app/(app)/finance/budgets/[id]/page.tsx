"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Toolbar } from "@/components/layout/toolbar";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { BudgetLineItems } from "@/features/finance/budgets/components/budget-line-items";
import { useBudget, useBudgetLineItems, useBudgetSummary, useBudgetLineItemByCostCode, useBudgetActions } from "@/features/finance/budgets/hooks";
import { formatMoney } from "@/lib/utils/money";
import { useToast } from "@/components/ui/toast";
import { useCanEdit } from "@/lib/auth/require-role";

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [lookupInput, setLookupInput] = useState("");
  const [lookupCostCodeId, setLookupCostCodeId] = useState("");
  const [showApprove, setShowApprove] = useState(false);
  const [showTotalValue, setShowTotalValue] = useState(false);
  const [showLineItem, setShowLineItem] = useState(false);
  const [approvedBy, setApprovedBy] = useState("");
  const [approvedByError, setApprovedByError] = useState<string | null>(null);
  const [totalValueInput, setTotalValueInput] = useState("");
  const [totalValueError, setTotalValueError] = useState<string | null>(null);
  const [lineCostCodeId, setLineCostCodeId] = useState("");
  const [lineAllocatedAmount, setLineAllocatedAmount] = useState("");
  const [lineNotes, setLineNotes] = useState("");
  const [lineItemError, setLineItemError] = useState<string | null>(null);
  const budgetQuery = useBudget(id);
  const summaryQuery = useBudgetSummary(id);
  const lineItemsQuery = useBudgetLineItems(id);
  const lookupQuery = useBudgetLineItemByCostCode(id, lookupCostCodeId);
  const actions = useBudgetActions();
  const { notify } = useToast();
  const canEdit = useCanEdit();

  const budget = budgetQuery.data;
  const summary = summaryQuery.data;

  useEffect(() => {
    if (budget?.totalValue !== undefined && budget?.totalValue !== null) {
      setTotalValueInput(String(budget.totalValue));
    }
  }, [budget?.totalValue]);

  if (budgetQuery.isLoading || summaryQuery.isLoading || lineItemsQuery.isLoading) {
    return <Skeleton className="surface-card" />;
  }

  if (budgetQuery.error || summaryQuery.error || lineItemsQuery.error) {
    return <ErrorState message="Unable to load budget details." />;
  }

  if (!budget) {
    return <ErrorState message="Budget not found." />;
  }

  const handleApprove = async () => {
    const value = approvedBy.trim();
    if (!value) {
      setApprovedByError("Approved by is required.");
      return;
    }
    try {
      await actions.approve.mutateAsync({ id, approvedBy: value });
      notify({ message: "Budget approved", tone: "success" });
      setShowApprove(false);
      setApprovedBy("");
      setApprovedByError(null);
    } catch {
      notify({ message: "Unable to approve budget", tone: "error" });
    }
  };

  const handleUpdateTotal = async () => {
    const nextValue = Number(totalValueInput);
    if (!Number.isFinite(nextValue) || nextValue < 0) {
      setTotalValueError("Total value must be a valid non-negative number.");
      return;
    }
    try {
      await actions.updateTotalValue.mutateAsync({ id, totalValue: nextValue });
      notify({ message: "Total value updated", tone: "success" });
      setShowTotalValue(false);
      setTotalValueError(null);
    } catch {
      notify({ message: "Unable to update total value", tone: "error" });
    }
  };

  const handleAddLineItem = async () => {
    const costCodeId = lineCostCodeId.trim();
    const allocatedAmount = Number(lineAllocatedAmount);
    if (!costCodeId) {
      setLineItemError("Cost code ID is required.");
      return;
    }
    if (!Number.isFinite(allocatedAmount) || allocatedAmount < 0) {
      setLineItemError("Allocated amount must be a valid non-negative number.");
      return;
    }
    try {
      await actions.addLineItem.mutateAsync({
        budgetId: id,
        costCodeId,
        allocatedAmount,
        notes: lineNotes.trim() || undefined
      });
      notify({ message: "Line item added", tone: "success" });
      setShowLineItem(false);
      setLineCostCodeId("");
      setLineAllocatedAmount("");
      setLineNotes("");
      setLineItemError(null);
    } catch {
      notify({ message: "Unable to add line item", tone: "error" });
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={`Budget ${budget.id ?? ""}`}
        subtitle={`Project ${budget.projectId} • ${budget.status ?? "DRAFT"}`}
        actions={
          canEdit ? (
            <Toolbar>
              <Button variant="ghost" type="button" onClick={() => setShowTotalValue(true)}>
                Update Total
              </Button>
              <Button variant="ghost" type="button" onClick={() => setShowLineItem(true)}>
                Add Line Item
              </Button>
              {budget.status !== "APPROVED" ? (
                <Button type="button" onClick={() => setShowApprove(true)}>
                  Approve Budget
                </Button>
              ) : null}
            </Toolbar>
          ) : null
        }
      />

      <SectionCard>
        <div className="section-header">
          <h2>Budget Summary</h2>
          <p className="muted">High-level totals for this project budget.</p>
        </div>
        <div className="grid-two" style={{ marginTop: "1rem" }}>
          <div className="stat-block">
            <div><span className="stat-label">Total Value</span><span className="stat-value">{formatMoney(budget.totalValue)}</span></div>
            <div><span className="stat-label">Allocated</span><span className="stat-value">{formatMoney(summary?.totalAllocated ?? 0)}</span></div>
            <div><span className="stat-label">Committed</span><span className="stat-value">{formatMoney(summary?.totalCommitted ?? 0)}</span></div>
          </div>
          <div className="stat-block">
            <div><span className="stat-label">Spent</span><span className="stat-value">{formatMoney(summary?.totalSpent ?? 0)}</span></div>
            <div><span className="stat-label">Unallocated</span><span className="stat-value">{formatMoney(summary?.unallocatedAmount ?? 0)}</span></div>
            <div><span className="stat-label">Status</span><span className="stat-value">{budget.status ?? "DRAFT"}</span></div>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Line Items</h2>
          <p className="muted">Budget allocations per cost code.</p>
        </div>
        {lineItemsQuery.data && lineItemsQuery.data.length > 0 ? (
          <BudgetLineItems
            items={lineItemsQuery.data}
            onView={(item) => item.id && router.push(`/finance/budget-line-items/${item.id}`)}
          />
        ) : (
          <p className="muted">No line items available.</p>
        )}
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Lookup Line Item</h2>
          <p className="muted">Find a line item by cost code within this budget.</p>
        </div>
        <div className="form-grid form-grid--inline" style={{ marginTop: "1rem" }}>
          <FormField label="Cost Code ID" htmlFor="budget-line-item-cost-code">
            <Input
              id="budget-line-item-cost-code"
              value={lookupInput}
              onChange={(event) => setLookupInput(event.target.value)}
            />
          </FormField>
          <Button
            variant="ghost"
            onClick={() => setLookupCostCodeId(lookupInput.trim())}
            disabled={!lookupInput.trim()}
          >
            Lookup
          </Button>
        </div>
        {lookupCostCodeId ? (
          lookupQuery.isLoading ? (
            <p className="muted" style={{ marginTop: "1rem" }}>Loading line item...</p>
          ) : lookupQuery.error || !lookupQuery.data ? (
            <p className="muted" style={{ marginTop: "1rem" }}>No line item found for this cost code.</p>
          ) : (
            <div className="surface-card" style={{ marginTop: "1rem" }}>
              <p className="table-title">{lookupQuery.data.costCodeCode ?? lookupQuery.data.costCodeName ?? "Line Item"}</p>
              <p className="muted">Allocated: {formatMoney(lookupQuery.data.allocatedAmount ?? 0)}</p>
              <Button
                variant="ghost"
                onClick={() => lookupQuery.data?.id && router.push(`/finance/budget-line-items/${lookupQuery.data.id}`)}
                style={{ marginTop: "0.5rem" }}
              >
                View Line Item
              </Button>
            </div>
          )
        ) : null}
      </SectionCard>

      <Modal open={showApprove} title="Approve Budget" onClose={() => { setShowApprove(false); setApprovedByError(null); }}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Approved By" htmlFor="budget-approved-by" error={approvedByError ?? undefined}>
              <Input
                id="budget-approved-by"
                value={approvedBy}
                onChange={(event) => {
                  setApprovedBy(event.target.value);
                  setApprovedByError(null);
                }}
                placeholder="Finance Manager"
              />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" type="button" onClick={() => { setShowApprove(false); setApprovedByError(null); }}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApprove} disabled={actions.approve.isPending}>
            {actions.approve.isPending ? "Approving..." : "Approve"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={showTotalValue} title="Update Total Value" onClose={() => { setShowTotalValue(false); setTotalValueError(null); }}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Total Value" htmlFor="budget-total-value" error={totalValueError ?? undefined}>
              <Input
                id="budget-total-value"
                type="number"
                value={totalValueInput}
                onChange={(event) => {
                  setTotalValueInput(event.target.value);
                  setTotalValueError(null);
                }}
              />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" type="button" onClick={() => { setShowTotalValue(false); setTotalValueError(null); }}>
            Cancel
          </Button>
          <Button type="button" onClick={handleUpdateTotal} disabled={actions.updateTotalValue.isPending}>
            {actions.updateTotalValue.isPending ? "Saving..." : "Save"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={showLineItem} title="Add Budget Line Item" onClose={() => { setShowLineItem(false); setLineItemError(null); }}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Cost Code ID" htmlFor="budget-line-cost-code">
              <Input
                id="budget-line-cost-code"
                value={lineCostCodeId}
                onChange={(event) => {
                  setLineCostCodeId(event.target.value);
                  setLineItemError(null);
                }}
              />
            </FormField>
            <FormField label="Allocated Amount" htmlFor="budget-line-amount" className="full-width">
              <Input
                id="budget-line-amount"
                type="number"
                value={lineAllocatedAmount}
                onChange={(event) => {
                  setLineAllocatedAmount(event.target.value);
                  setLineItemError(null);
                }}
              />
            </FormField>
            <FormField label="Notes (optional)" htmlFor="budget-line-notes" className="full-width">
              <Input
                id="budget-line-notes"
                value={lineNotes}
                onChange={(event) => setLineNotes(event.target.value)}
              />
            </FormField>
            {lineItemError ? <p className="form-field-error full-width">{lineItemError}</p> : null}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" type="button" onClick={() => { setShowLineItem(false); setLineItemError(null); }}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAddLineItem} disabled={actions.addLineItem.isPending}>
            {actions.addLineItem.isPending ? "Adding..." : "Add Line Item"}
          </Button>
        </ModalFooter>
      </Modal>
    </PageShell>
  );
}
