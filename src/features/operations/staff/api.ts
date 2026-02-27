import { apiClient } from "@/lib/http/api-client";
import type { Staff } from "@/features/operations/staff/types";

export function fetchStaff() {
  return apiClient.get<Staff[]>("/staff");
}

export function fetchStaffMember(id: string) {
  return apiClient.get<Staff>(`/staff/${id}`);
}

export function createStaff(values: Staff) {
  return apiClient.post<Staff>("/staff", values);
}

export function updateStaff(id: string, values: Staff) {
  return apiClient.put<Staff>(`/staff/${id}`, values);
}

export function deleteStaff(id: string) {
  return apiClient.del<void>(`/staff/${id}`);
}
