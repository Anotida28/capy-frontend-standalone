import { apiClient } from "@/lib/http/api-client";
import type { Vendor } from "@/features/operations/vendors/types";

export function fetchVendors() {
  return apiClient.get<Vendor[]>("/vendors");
}

export function fetchVendor(id: string) {
  return apiClient.get<Vendor>(`/vendors/${id}`);
}

export function createVendor(values: Vendor) {
  return apiClient.post<Vendor>("/vendors", values);
}

export function updateVendor(id: string, values: Vendor) {
  return apiClient.put<Vendor>(`/vendors/${id}`, values);
}

export function deleteVendor(id: string) {
  return apiClient.del<void>(`/vendors/${id}`);
}
