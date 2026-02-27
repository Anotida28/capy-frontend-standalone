export type TimesheetStatus = "PENDING" | "APPROVED" | "REJECTED" | "AUTO_CLOCKED_OUT";

export type TimesheetEntry = {
  id?: string;
  projectId: string;
  projectName?: string | null;
  staffId: string;
  staffName?: string | null;
  date: string;
  clockInTime: string;
  clockOutTime?: string | null;
  autoClockoutTime?: string | null;
  extendedUntil?: string | null;
  hoursWorked?: number | null;
  status?: TimesheetStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
};
