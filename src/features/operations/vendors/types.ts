export type VendorType = "SUBCONTRACTOR" | "SUPPLIER";

export type Vendor = {
  id?: string;
  companyName: string;
  type: VendorType;
  taxClearanceExpiry?: string | null;
  performanceRating?: number | null;
};
