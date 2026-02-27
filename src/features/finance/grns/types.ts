export type GRNLineItem = {
  id?: string;
  goodsReceivedNoteId?: string | null;
  poLineItemId: string;
  description: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity?: number;
  acceptanceRate?: number | null;
  unitOfMeasure?: string;
  conditionNotes?: string;
  notes?: string;
  fullyAccepted?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type GRN = {
  id?: string;
  grnNumber?: string;
  purchaseOrderId: string;
  receivedDate?: string;
  deliveryNote?: string;
  notes?: string;
  conditionNotes?: string;
  receivedBy: string;
  documentPath?: string;
  totalRejectedQuantity?: number | null;
  allGoodsAcceptable?: boolean | null;
  lineItems?: GRNLineItem[];
  createdAt?: string | null;
  updatedAt?: string | null;
};
