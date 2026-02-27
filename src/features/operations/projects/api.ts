import { apiClient } from "@/lib/http/api-client";
import type { Project, ProjectMedia, ProjectMilestone } from "@/features/operations/projects/types";
import type { TeamAssignment } from "@/features/operations/team-assignments/types";

export function fetchProjects() {
  return apiClient.get<Project[]>("/projects");
}

export function fetchProject(id: string) {
  return apiClient.get<Project>(`/projects/${id}`);
}

export function createProject(payload: Project) {
  return apiClient.post<Project>("/projects", payload);
}

export function updateProject(id: string, payload: Project) {
  return apiClient.put<Project>(`/projects/${id}`, payload);
}

export function deleteProject(id: string) {
  return apiClient.del<void>(`/projects/${id}`);
}

export function fetchProjectMilestones(projectId: string) {
  return apiClient.get<ProjectMilestone[]>(`/project-milestones/project/${projectId}`);
}

export function fetchProjectMilestonesList() {
  return apiClient.get<ProjectMilestone[]>("/project-milestones");
}

export function createProjectMilestone(payload: ProjectMilestone) {
  return apiClient.post<ProjectMilestone>("/project-milestones", payload);
}

export function updateProjectMilestone(id: string, payload: ProjectMilestone) {
  return apiClient.put<ProjectMilestone>(`/project-milestones/${id}`, payload);
}

export function deleteProjectMilestone(id: string) {
  return apiClient.del<void>(`/project-milestones/${id}`);
}

export function fetchProjectMedia(projectId: string) {
  return apiClient.get<ProjectMedia[]>(`/project-media/project/${projectId}`);
}

export function createProjectMedia(payload: ProjectMedia) {
  return apiClient.post<ProjectMedia>("/project-media", payload);
}

export function deleteProjectMedia(id: string) {
  return apiClient.del<void>(`/project-media/${id}`);
}

export function fetchTeamAssignmentsByProject(projectId: string) {
  return apiClient.get<TeamAssignment[]>(`/team-assignments/project/${projectId}`);
}
