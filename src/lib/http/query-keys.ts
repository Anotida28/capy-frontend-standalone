export const queryKeys = {
  operations: {
    projects: {
      all: ["operations", "projects"] as const,
      list: (params: Record<string, unknown> = {}) => ["operations", "projects", "list", params] as const,
      detail: (id: string) => ["operations", "projects", "detail", id] as const
    },
    assets: {
      all: ["operations", "assets"] as const,
      list: (params: Record<string, unknown> = {}) => ["operations", "assets", "list", params] as const,
      detail: (id: string) => ["operations", "assets", "detail", id] as const
    },
    assetAllocations: {
      all: ["operations", "assetAllocations"] as const,
      list: (params: Record<string, unknown> = {}) => ["operations", "assetAllocations", "list", params] as const
    },
    assetMedia: {
      all: ["operations", "assetMedia"] as const,
      byAsset: (assetId: string) => ["operations", "assetMedia", "asset", assetId] as const
    },
    dailyLogs: {
      all: ["operations", "dailyLogs"] as const,
      list: (params: Record<string, unknown> = {}) => ["operations", "dailyLogs", "list", params] as const,
      detail: (id: string) => ["operations", "dailyLogs", "detail", id] as const
    },
    laborNorms: {
      all: ["operations", "laborNorms"] as const,
      list: (params: Record<string, unknown> = {}) => ["operations", "laborNorms", "list", params] as const,
      detail: (activityCode: string) => ["operations", "laborNorms", "detail", activityCode] as const
    },
    staff: {
      all: ["operations", "staff"] as const,
      list: (params: Record<string, unknown> = {}) => ["operations", "staff", "list", params] as const,
      detail: (id: string) => ["operations", "staff", "detail", id] as const
    },
    materialCatalog: {
      all: ["operations", "materialCatalog"] as const,
      list: (params: Record<string, unknown> = {}) => ["operations", "materialCatalog", "list", params] as const,
      detail: (itemCode: string) => ["operations", "materialCatalog", "detail", itemCode] as const
    },
    vendors: {
      all: ["operations", "vendors"] as const,
      list: (params: Record<string, unknown> = {}) => ["operations", "vendors", "list", params] as const,
      detail: (id: string) => ["operations", "vendors", "detail", id] as const
    },
    scopeItems: {
      all: ["operations", "scopeItems"] as const,
      list: (params: Record<string, unknown> = {}) => ["operations", "scopeItems", "list", params] as const,
      detail: (id: string) => ["operations", "scopeItems", "detail", id] as const
    },
    sheqTemplates: {
      all: ["operations", "sheqTemplates"] as const,
      list: (params: Record<string, unknown> = {}) => ["operations", "sheqTemplates", "list", params] as const,
      detail: (id: string) => ["operations", "sheqTemplates", "detail", id] as const
    },
    teamAssignments: {
      all: ["operations", "teamAssignments"] as const,
      list: (params: Record<string, unknown> = {}) => ["operations", "teamAssignments", "list", params] as const,
      byProject: (projectId: string) => ["operations", "teamAssignments", "project", projectId] as const
    },
    projectMilestones: {
      all: ["operations", "projectMilestones"] as const,
      list: (params: Record<string, unknown> = {}) => ["operations", "projectMilestones", "list", params] as const,
      byProject: (projectId: string) => ["operations", "projectMilestones", "project", projectId] as const
    },
    projectMedia: {
      all: ["operations", "projectMedia"] as const,
      byProject: (projectId: string) => ["operations", "projectMedia", "project", projectId] as const
    },
    timesheets: {
      all: ["operations", "timesheets"] as const,
      list: (params: Record<string, unknown> = {}) => ["operations", "timesheets", "list", params] as const,
      detail: (id: string) => ["operations", "timesheets", "detail", id] as const
    }
  },
  finance: {
    costCodes: {
      all: ["finance", "costCodes"] as const,
      list: (params: Record<string, unknown> = {}) => ["finance", "costCodes", "list", params] as const,
      detail: (id: string) => ["finance", "costCodes", "detail", id] as const,
      byCode: (code: string) => ["finance", "costCodes", "code", code] as const,
      byCategory: (category: string) => ["finance", "costCodes", "category", category] as const,
      active: () => ["finance", "costCodes", "active"] as const,
      search: (term: string) => ["finance", "costCodes", "search", term] as const
    },
    budgets: {
      all: ["finance", "budgets"] as const,
      list: (params: Record<string, unknown> = {}) => ["finance", "budgets", "list", params] as const,
      detail: (id: string) => ["finance", "budgets", "detail", id] as const,
      summary: (id: string) => ["finance", "budgets", "summary", id] as const,
      byStatus: (status: string) => ["finance", "budgets", "status", status] as const,
      byProject: (projectId: string) => ["finance", "budgets", "project", projectId] as const
    },
    budgetLineItems: {
      all: ["finance", "budgetLineItems"] as const,
      byBudget: (budgetId: string) => ["finance", "budgetLineItems", "budget", budgetId] as const,
      detail: (id: string) => ["finance", "budgetLineItems", "detail", id] as const,
      byBudgetAndCostCode: (budgetId: string, costCodeId: string) => ["finance", "budgetLineItems", "budget", budgetId, "costCode", costCodeId] as const
    },
    purchaseOrders: {
      all: ["finance", "purchaseOrders"] as const,
      list: (params: Record<string, unknown> = {}) => ["finance", "purchaseOrders", "list", params] as const,
      detail: (id: string) => ["finance", "purchaseOrders", "detail", id] as const,
      byNumber: (poNumber: string) => ["finance", "purchaseOrders", "number", poNumber] as const,
      byProject: (projectId: string) => ["finance", "purchaseOrders", "project", projectId] as const,
      byStatus: (status: string) => ["finance", "purchaseOrders", "status", status] as const
    },
    invoices: {
      all: ["finance", "invoices"] as const,
      list: (params: Record<string, unknown> = {}) => ["finance", "invoices", "list", params] as const,
      detail: (id: string) => ["finance", "invoices", "detail", id] as const,
      byNumber: (invoiceNumber: string) => ["finance", "invoices", "number", invoiceNumber] as const,
      byStatus: (status: string) => ["finance", "invoices", "status", status] as const,
      overdue: () => ["finance", "invoices", "overdue"] as const
    },
    grns: {
      all: ["finance", "grns"] as const,
      list: (params: Record<string, unknown> = {}) => ["finance", "grns", "list", params] as const,
      detail: (id: string) => ["finance", "grns", "detail", id] as const,
      byNumber: (grnNumber: string) => ["finance", "grns", "number", grnNumber] as const,
      byPurchaseOrder: (purchaseOrderId: string) => ["finance", "grns", "purchaseOrder", purchaseOrderId] as const,
      recent: (days: number) => ["finance", "grns", "recent", days] as const
    },
    threeWayMatch: {
      all: ["finance", "threeWayMatch"] as const,
      requiringReview: () => ["finance", "threeWayMatch", "requiringReview"] as const,
      byInvoice: (invoiceId: string) => ["finance", "threeWayMatch", "invoice", invoiceId] as const,
      byInvoiceLine: (invoiceLineItemId: string) => ["finance", "threeWayMatch", "invoiceLine", invoiceLineItemId] as const
    }
  }
};
