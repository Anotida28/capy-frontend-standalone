export type StoresRequestPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type StoresRequestType = "MATERIAL" | "TOOL" | "PPE";
export type StoresRequestStatus =
  | "PENDING_STORES_REVIEW"
  | "ALLOCATED_FROM_STORES"
  | "ESCALATED_TO_FINANCE"
  | "ORDERED_BY_FINANCE"
  | "RECEIVED_IN_STORES"
  | "DISPATCHED_TO_PROJECT";

export type StoresRequestSeed = {
  id: string;
  projectId: string;
  projectName: string;
  requestedBy: string;
  itemCode: string;
  itemName: string;
  requestType: StoresRequestType;
  requestedQuantity: number;
  unit: string;
  availableInStores: number;
  priority: StoresRequestPriority;
  requestedAt: string;
  status: StoresRequestStatus;
  financeReference?: string;
  orderedAt?: string;
  receivedAt?: string;
  dispatchedAt?: string;
};

export type InventoryStoresStatus = "ALLOCATED_FROM_STORES" | "RECEIVED_IN_STORES" | "DISPATCHED_TO_PROJECT";
export type InventoryLifecycleStatus =
  | "TRACKING_USAGE"
  | "FULLY_USED_ON_PROJECT"
  | "PARTIALLY_RETURNED_TO_STORES"
  | "RETURNED_TO_STORES";
export type InventoryReturnStatus = "RETURN_SENT_TO_STORES" | "RECEIVED_IN_STORES";

export type InventoryAllocationSeed = {
  id: string;
  storesRequestId: string;
  projectId: string;
  projectName: string;
  projectManagerName: string;
  itemCode: string;
  itemName: string;
  unit: string;
  requestedQuantity: number;
  allocatedQuantity: number;
  usedQuantity: number;
  returnedQuantity: number;
  storesStatus: InventoryStoresStatus;
  lifecycleStatus: InventoryLifecycleStatus;
  allocatedAt: string;
  lastUsageAt?: string;
  lastReturnAt?: string;
  notes?: string;
};

export type InventoryReturnSeed = {
  id: string;
  allocationId: string;
  storesRequestId: string;
  projectName: string;
  itemName: string;
  quantity: number;
  reason?: string;
  status: InventoryReturnStatus;
  createdAt: string;
  receivedAt?: string;
};

export const storesRequestsSeed: StoresRequestSeed[] = [
  {
    id: "SR-1001",
    projectId: "proj-001",
    projectName: "Office Renovation",
    requestedBy: "Jordan Site",
    itemCode: "MAT-001",
    itemName: "Rebar 12mm",
    requestType: "MATERIAL",
    requestedQuantity: 1200,
    unit: "kg",
    availableInStores: 200,
    priority: "HIGH",
    requestedAt: "2026-02-20T07:50:00.000Z",
    status: "DISPATCHED_TO_PROJECT",
    dispatchedAt: "2026-02-20T10:45:00.000Z"
  },
  {
    id: "SR-1002",
    projectId: "proj-002",
    projectName: "Bridge Expansion",
    requestedBy: "Sam Supervisor",
    itemCode: "MAT-002",
    itemName: "Concrete Grade 30",
    requestType: "MATERIAL",
    requestedQuantity: 240,
    unit: "m3",
    availableInStores: 40,
    priority: "HIGH",
    requestedAt: "2026-02-21T08:10:00.000Z",
    status: "DISPATCHED_TO_PROJECT",
    dispatchedAt: "2026-02-21T11:40:00.000Z"
  },
  {
    id: "SR-1003",
    projectId: "proj-001",
    projectName: "Office Renovation",
    requestedBy: "Jordan Site",
    itemCode: "TOOL-001",
    itemName: "Scaffolding Clamps",
    requestType: "TOOL",
    requestedQuantity: 120,
    unit: "units",
    availableInStores: 120,
    priority: "MEDIUM",
    requestedAt: "2026-02-24T10:00:00.000Z",
    status: "ALLOCATED_FROM_STORES"
  },
  {
    id: "SR-1004",
    projectId: "proj-002",
    projectName: "Bridge Expansion",
    requestedBy: "Sam Supervisor",
    itemCode: "PPE-001",
    itemName: "Safety Helmets",
    requestType: "PPE",
    requestedQuantity: 30,
    unit: "units",
    availableInStores: 8,
    priority: "CRITICAL",
    requestedAt: "2026-02-26T07:35:00.000Z",
    status: "PENDING_STORES_REVIEW"
  },
  {
    id: "SR-1005",
    projectId: "proj-002",
    projectName: "Bridge Expansion",
    requestedBy: "Sam Supervisor",
    itemCode: "MAT-003",
    itemName: "Copper Cable 4mm",
    requestType: "MATERIAL",
    requestedQuantity: 240,
    unit: "m",
    availableInStores: 0,
    priority: "HIGH",
    requestedAt: "2026-02-25T13:10:00.000Z",
    status: "ORDERED_BY_FINANCE",
    financeReference: "FIN-REQ-1005",
    orderedAt: "2026-02-25T14:10:00.000Z"
  },
  {
    id: "SR-1006",
    projectId: "proj-001",
    projectName: "Office Renovation",
    requestedBy: "Jordan Site",
    itemCode: "MAT-004",
    itemName: "Door Hinges",
    requestType: "MATERIAL",
    requestedQuantity: 40,
    unit: "sets",
    availableInStores: 40,
    priority: "LOW",
    requestedAt: "2026-02-23T08:10:00.000Z",
    status: "DISPATCHED_TO_PROJECT",
    dispatchedAt: "2026-02-23T12:45:00.000Z"
  }
];

export const inventoryAllocationsSeed: InventoryAllocationSeed[] = [
  {
    id: "INV-001",
    storesRequestId: "SR-1001",
    projectId: "proj-001",
    projectName: "Office Renovation",
    projectManagerName: "Jordan Site",
    itemCode: "MAT-001",
    itemName: "Rebar 12mm",
    unit: "kg",
    requestedQuantity: 1200,
    allocatedQuantity: 1000,
    usedQuantity: 520,
    returnedQuantity: 80,
    storesStatus: "DISPATCHED_TO_PROJECT",
    lifecycleStatus: "PARTIALLY_RETURNED_TO_STORES",
    allocatedAt: "2026-02-20T08:20:00.000Z",
    lastUsageAt: "2026-02-26T14:15:00.000Z",
    lastReturnAt: "2026-02-26T15:10:00.000Z",
    notes: "Phase 1 slab and beams"
  },
  {
    id: "INV-002",
    storesRequestId: "SR-1002",
    projectId: "proj-002",
    projectName: "Bridge Expansion",
    projectManagerName: "Sam Supervisor",
    itemCode: "MAT-002",
    itemName: "Concrete Grade 30",
    unit: "m3",
    requestedQuantity: 240,
    allocatedQuantity: 200,
    usedQuantity: 190,
    returnedQuantity: 0,
    storesStatus: "DISPATCHED_TO_PROJECT",
    lifecycleStatus: "TRACKING_USAGE",
    allocatedAt: "2026-02-21T09:00:00.000Z",
    lastUsageAt: "2026-02-26T12:30:00.000Z",
    notes: "Deck casting"
  },
  {
    id: "INV-003",
    storesRequestId: "SR-1003",
    projectId: "proj-001",
    projectName: "Office Renovation",
    projectManagerName: "Jordan Site",
    itemCode: "TOOL-001",
    itemName: "Scaffolding Clamps",
    unit: "units",
    requestedQuantity: 120,
    allocatedQuantity: 120,
    usedQuantity: 0,
    returnedQuantity: 0,
    storesStatus: "ALLOCATED_FROM_STORES",
    lifecycleStatus: "TRACKING_USAGE",
    allocatedAt: "2026-02-24T10:10:00.000Z",
    notes: "Awaiting dispatch to site"
  }
];

export const inventoryReturnsSeed: InventoryReturnSeed[] = [
  {
    id: "RET-001",
    allocationId: "INV-001",
    storesRequestId: "SR-1001",
    projectName: "Office Renovation",
    itemName: "Rebar 12mm",
    quantity: 80,
    reason: "Leftover after slab completion",
    status: "RETURN_SENT_TO_STORES",
    createdAt: "2026-02-26T15:10:00.000Z"
  }
];
