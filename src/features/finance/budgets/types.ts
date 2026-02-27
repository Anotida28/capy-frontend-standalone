export type BudgetStatus = "DRAFT" | "APPROVED" | "LOCKED" | "CLOSED";

export type BudgetLineItem = {
  id?: string;
  budgetId?: string;
  costCodeId?: string;
  costCodeCode?: string;
  costCodeName?: string;
  costCodeCategory?: string;
  allocatedAmount?: number;
  committedAmount?: number;
  spentAmount?: number;
  availableAmount?: number;
  utilizationPercentage?: number;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ProjectBudget = {
  id?: string;
  projectId: string;
  totalValue: number;
  status?: BudgetStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  totalAllocated?: number;
  totalCommitted?: number;
  totalSpent?: number;
  unallocatedAmount?: number;
  lineItems?: BudgetLineItem[];
};

export type ProjectBudgetCreate = {
  projectId: string;
  totalValue: number;
  status?: BudgetStatus;
};
