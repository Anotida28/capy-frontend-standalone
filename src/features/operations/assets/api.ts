import { apiClient } from "@/lib/http/api-client";
import type { Asset, AssetMedia } from "@/features/operations/assets/types";

export function fetchAssets() {
  return apiClient.get<Asset[]>("/assets");
}

export function fetchAsset(id: string) {
  return apiClient.get<Asset>(`/assets/${id}`);
}

export function createAsset(payload: Asset) {
  return apiClient.post<Asset>("/assets", payload);
}

export function updateAsset(id: string, payload: Asset) {
  return apiClient.put<Asset>(`/assets/${id}`, payload);
}

export function deleteAsset(id: string) {
  return apiClient.del<void>(`/assets/${id}`);
}

export function fetchAssetMedia(assetId: string) {
  return apiClient.get<AssetMedia[]>(`/asset-media/asset/${assetId}`);
}

export function createAssetMedia(payload: AssetMedia) {
  return apiClient.post<AssetMedia>("/asset-media", payload);
}

export function deleteAssetMedia(id: string) {
  return apiClient.del<void>(`/asset-media/${id}`);
}
