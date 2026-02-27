export type StaffRole = "WORKER" | "SUPERVISOR" | "MANAGER";

export type Staff = {
  id?: string;
  fullName: string;
  nationalId: string;
  role: StaffRole;
};
