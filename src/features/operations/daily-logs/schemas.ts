import type { DailyLog } from "@/features/operations/daily-logs/types";

export function validateDailyLog(values: DailyLog) {
  const errors: Partial<Record<keyof DailyLog, string>> = {};
  const logType = values.logType ?? "PROJECT";
  if (logType === "PROJECT" && !values.projectId?.trim()) {
    errors.projectId = "Project is required for project logs";
  }
  if (logType === "EMPLOYEE" && !values.employeeId?.trim()) {
    errors.employeeId = "Employee is required for employee logs";
  }
  if (!values.date) {
    errors.date = "Date is required";
  }
  return errors;
}
