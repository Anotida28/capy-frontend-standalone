export type ScopeItem = {
  id?: string;
  projectId: string;
  projectName?: string | null;
  boqCode?: string | null;
  targetQuantity?: number | null;
  laborNormFactor?: number | null;
  plannedHours?: number | null;
  isOverridden?: boolean;
  overrideReason?: string | null;
};
