export type TeamAssignmentPayload = {
  projectId: string;
  staffId: string;
  assignmentDate: string;
  startDate: string;
  endDate: string;
  deactivationDate?: string | null;
};

export type TeamAssignment = {
  id?: string;
  project?: { id?: string } | null;
  projectName?: string | null;
  staff?: { id?: string } | null;
  staffName?: string | null;
  assignmentDate: string;
  startDate: string;
  endDate: string;
  deactivationDate?: string | null;
};
