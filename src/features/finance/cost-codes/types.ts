export type CostCodeCategory = "MATERIALS" | "LABOR" | "EQUIPMENT" | "SUBCONTRACTOR" | "OVERHEAD" | "OTHER";

export type CostCode = {
  id?: string;
  code: string;
  name: string;
  category: CostCodeCategory;
  description?: string | null;
  active?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};
