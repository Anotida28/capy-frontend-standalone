import { apiClient } from "@/lib/http/api-client";
import type { TeamAssignment, TeamAssignmentPayload } from "@/features/operations/team-assignments/types";

function toRequest(payload: TeamAssignmentPayload): TeamAssignment {
  return {
    project: { id: payload.projectId },
    staff: { id: payload.staffId },
    assignmentDate: payload.assignmentDate,
    startDate: payload.startDate,
    endDate: payload.endDate,
    deactivationDate: payload.deactivationDate ?? null
  };
}

export function createTeamAssignment(payload: TeamAssignmentPayload) {
  return apiClient.post<TeamAssignment>("/team-assignments", toRequest(payload));
}

export function updateTeamAssignment(id: string, payload: TeamAssignmentPayload) {
  return apiClient.put<TeamAssignment>(`/team-assignments/${id}`, toRequest(payload));
}

export function deleteTeamAssignment(id: string) {
  return apiClient.del<void>(`/team-assignments/${id}`);
}

export function fetchTeamAssignments() {
  return apiClient.get<TeamAssignment[]>("/team-assignments");
}
