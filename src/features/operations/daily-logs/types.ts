export type LogType = "PROJECT" | "EMPLOYEE";

export type ProgressEntry = {
  id?: string;
  scopeItemId: string;
  scopeItemBoqCode?: string | null;
  quantityCompleted: number;
};

export type SiteMedia = {
  id?: string;
  mediaUrl: string;
  description?: string | null;
};

export type DailyLog = {
  id?: string;
  logType?: LogType | null;
  projectId?: string | null;
  projectName?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
  date: string;
  weather?: string | null;
  delayNotes?: string | null;
  progressEntries?: ProgressEntry[];
  siteMedia?: SiteMedia[];
};
