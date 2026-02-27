import { apiClient } from "@/lib/http/api-client";
import type { MaterialCatalogItem } from "@/features/operations/material-catalog/types";

export function fetchMaterialCatalog() {
  return apiClient.get<MaterialCatalogItem[]>("/material-catalog");
}

export function createMaterial(values: MaterialCatalogItem) {
  return apiClient.post<MaterialCatalogItem>("/material-catalog", values);
}

export function updateMaterial(itemCode: string, values: MaterialCatalogItem) {
  return apiClient.put<MaterialCatalogItem>(`/material-catalog/${itemCode}`, values);
}

export function deleteMaterial(itemCode: string) {
  return apiClient.del<void>(`/material-catalog/${itemCode}`);
}
