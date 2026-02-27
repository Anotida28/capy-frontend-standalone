export type AssetAllocation = {
  id?: string;
  projectId: string;
  projectName?: string | null;
  assetId: string;
  assetCode?: string | null;
  allocationDate: string;
  deallocationDate?: string | null;
  entryTime?: string | null;
  engineHours?: number | null;
};
