import { apiClient } from "@/lib/http/api-client";
import type { AssetAllocation } from "@/features/operations/asset-allocations/types";

function toPayload(values: AssetAllocation) {
  return {
    project: { id: values.projectId },
    asset: { id: values.assetId },
    allocationDate: values.allocationDate,
    deallocationDate: values.deallocationDate ?? null,
    entryTime: values.entryTime ?? null,
    engineHours: values.engineHours ?? null
  };
}

type AllocationResponse = AssetAllocation & {
  project?: { id?: string; name?: string };
  asset?: { id?: string; assetCode?: string; code?: string };
};

function normalizeAllocation(allocation: AllocationResponse): AssetAllocation {
  return {
    id: allocation.id,
    projectId: allocation.projectId ?? allocation.project?.id ?? "",
    projectName: allocation.projectName ?? allocation.project?.name ?? null,
    assetId: allocation.assetId ?? allocation.asset?.id ?? "",
    assetCode: allocation.assetCode ?? allocation.asset?.assetCode ?? allocation.asset?.code ?? null,
    allocationDate: allocation.allocationDate ?? "",
    deallocationDate: allocation.deallocationDate ?? null,
    entryTime: allocation.entryTime ?? null,
    engineHours: allocation.engineHours ?? null
  };
}

export function createAllocation(values: AssetAllocation) {
  return apiClient.post<AllocationResponse>("/asset-allocations", toPayload(values)).then(normalizeAllocation);
}

export function updateAllocation(id: string, values: AssetAllocation) {
  return apiClient.put<AllocationResponse>(`/asset-allocations/${id}`, toPayload(values)).then(normalizeAllocation);
}

export function deleteAllocation(id: string) {
  return apiClient.del<void>(`/asset-allocations/${id}`);
}

export function fetchAssetAllocations() {
  return apiClient.get<AllocationResponse[]>("/asset-allocations").then((list) => list.map(normalizeAllocation));
}
