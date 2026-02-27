export type ProjectStatus = "ACTIVE" | "ARCHIVED" | "PENDING";
export type ProjectHealth = "GREEN" | "AMBER" | "RED";
export type ProjectStage = "PLANNING" | "EXECUTION" | "CLOSEOUT" | "ON_HOLD";

export type Project = {
  id?: string;
  name: string;
  status: ProjectStatus;
  geofenceWkt?: string | null;
  budgetId?: string | null;
  locationName?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  clientName?: string | null;
  projectCode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  health?: ProjectHealth | null;
  percentComplete?: number | null;
  stage?: ProjectStage | null;
  siteManagerId?: string | null;
  siteManagerName?: string | null;
  autoClockoutTime?: string | null;
  shiftStartTime?: string | null;
  shiftEndTime?: string | null;
  gracePeriodMinutes?: number | null;
  overtimeAllowed?: boolean | null;
  overtimeMaxHours?: number | null;
};

export type ProjectFormValues = Project;

export type ProjectMilestoneStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETE" | "DELAYED";

export type ProjectMilestone = {
  id?: string;
  projectId: string;
  name: string;
  description?: string | null;
  targetDate: string;
  actualDate?: string | null;
  status: ProjectMilestoneStatus;
  progressPercent?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ProjectMediaType = "PHOTO" | "VIDEO" | "DOCUMENT" | "OTHER";

export type ProjectMedia = {
  id?: string;
  projectId: string;
  mediaUrl: string;
  description?: string | null;
  mediaType: ProjectMediaType;
  capturedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};
