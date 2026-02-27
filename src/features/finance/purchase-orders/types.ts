export type POStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "PARTIALLY_RECEIVED" | "FULLY_RECEIVED" | "CANCELLED" | "CLOSED";

export type POLineItem = {
  id?: string;
  purchaseOrderId?: string | null;
  budgetLineItemId: string;
  costCodeCode?: string | null;
  costCodeName?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number | null;
  receivedQuantity?: number | null;
  remainingQuantity?: number | null;
  receivedValue?: number | null;
  receivedPercentage?: number | null;
  unitOfMeasure?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PurchaseOrder = {
  id?: string;
  poNumber?: string;
  projectId: string;
  vendorId: string;
  status?: POStatus;
  orderDate?: string;
  expectedDeliveryDate?: string | null;
  totalValue?: number;
  receivedValue?: number | null;
  description?: string | null;
  paymentTerms?: string | null;
  deliveryAddress?: string | null;
  createdBy: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lineItems?: POLineItem[];
};
