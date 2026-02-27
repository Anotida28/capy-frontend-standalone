import { routes } from "@/lib/constants/routes";
import type { Role } from "@/lib/auth/access-control";

const operationsSection = {
  label: "Operations",
  items: [
    { label: "Dashboard", href: routes.dashboard, icon: "LayoutDashboard" },
    { label: "Projects", href: routes.projects, icon: "FolderKanban" },
    { label: "Asset Register", href: routes.assets, icon: "Package" },
    { label: "Team Assignments", href: routes.teamAssignments, icon: "Users" },
    { label: "Logs", href: routes.dailyLogs, icon: "Calendar" },
    { label: "Inventory Management", href: routes.inventoryManagement, icon: "Database" },
    { label: "SHEQ Templates", href: routes.sheqTemplates, icon: "ClipboardCheck" }
  ]
};

const storesSection = {
  label: "Stores",
  items: [
    { label: "Dashboard", href: routes.storesDashboard, icon: "LayoutDashboard" },
    { label: "Work Queue", href: routes.storesWorkQueue, icon: "List" },
    { label: "Inventory", href: routes.storesInventory, icon: "Database" },
    { label: "Reports", href: routes.storesReports, icon: "ClipboardCheck" }
  ]
};

const financeSection = {
  label: "Finance",
  items: [
    { label: "Dashboard", href: routes.financeDashboard, icon: "LayoutDashboard" },
    { label: "Budgets", href: routes.financeBudgets, icon: "DollarSign" },
    { label: "Cost Codes", href: routes.financeCostCodes, icon: "Hash" },
    { label: "Purchase Orders", href: routes.financePurchaseOrders, icon: "ShoppingCart" },
    { label: "GRNs", href: routes.financeGrns, icon: "ClipboardCheck" },
    { label: "Invoices", href: routes.financeInvoices, icon: "ClipboardCheck" }
  ]
};

const siteManagerSection = {
  label: "Site Manager",
  items: [
    { label: "Dashboard", href: routes.siteManagerDashboard, icon: "LayoutDashboard" },
    { label: "My Projects", href: routes.siteManagerProjects, icon: "FolderKanban" },
    { label: "Timesheets", href: routes.siteManagerTimesheets, icon: "Calendar" },
    { label: "Logs", href: routes.dailyLogs, icon: "Calendar" },
    { label: "Inventory Management", href: routes.inventoryManagement, icon: "Database" }
  ]
};

export function getNavSectionsForRole(role: Role | null) {
  if (role === "FINANCE") return [financeSection];
  if (role === "STORES") return [storesSection];
  if (role === "SITE_MANAGER") return [siteManagerSection];
  if (role === "OPERATIONS_DIRECTOR") return [operationsSection, storesSection, financeSection];
  return [];
}
