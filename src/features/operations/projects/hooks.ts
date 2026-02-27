"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import {
  createProject,
  deleteProject,
  fetchProject,
  fetchProjects,
  updateProject,
  fetchProjectMilestones,
  fetchProjectMilestonesList,
  createProjectMilestone,
  updateProjectMilestone,
  deleteProjectMilestone,
  fetchProjectMedia,
  createProjectMedia,
  deleteProjectMedia,
  fetchTeamAssignmentsByProject
} from "@/features/operations/projects/api";
import type { Project, ProjectMedia, ProjectMilestone } from "@/features/operations/projects/types";

export function useProjects() {
  return useQuery({ queryKey: queryKeys.operations.projects.list(), queryFn: fetchProjects });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.operations.projects.detail(id),
    queryFn: () => fetchProject(id),
    enabled: Boolean(id)
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Project) => createProject(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operations.projects.all })
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Project }) => updateProject(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.projects.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.projects.detail(variables.id) });
    }
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operations.projects.all })
  });
}

export function useProjectMilestones(projectId: string) {
  return useQuery({
    queryKey: queryKeys.operations.projectMilestones.byProject(projectId),
    queryFn: () => fetchProjectMilestones(projectId),
    enabled: Boolean(projectId)
  });
}

export function useProjectMilestonesList(enabled = true) {
  return useQuery({
    queryKey: queryKeys.operations.projectMilestones.list(),
    queryFn: fetchProjectMilestonesList,
    enabled
  });
}

export function useCreateProjectMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectMilestone) => createProjectMilestone(payload),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.projectMilestones.byProject(variables.projectId) })
  });
}

export function useUpdateProjectMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProjectMilestone }) =>
      updateProjectMilestone(id, payload),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.projectMilestones.byProject(variables.payload.projectId) })
  });
}

export function useDeleteProjectMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) => deleteProjectMilestone(id),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.projectMilestones.byProject(variables.projectId) })
  });
}

export function useProjectMedia(projectId: string) {
  return useQuery({
    queryKey: queryKeys.operations.projectMedia.byProject(projectId),
    queryFn: () => fetchProjectMedia(projectId),
    enabled: Boolean(projectId)
  });
}

export function useCreateProjectMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectMedia) => createProjectMedia(payload),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.projectMedia.byProject(variables.projectId) })
  });
}

export function useDeleteProjectMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) => deleteProjectMedia(id),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.projectMedia.byProject(variables.projectId) })
  });
}

export function useTeamAssignmentsByProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.operations.teamAssignments.byProject(projectId),
    queryFn: () => fetchTeamAssignmentsByProject(projectId),
    enabled: Boolean(projectId)
  });
}
