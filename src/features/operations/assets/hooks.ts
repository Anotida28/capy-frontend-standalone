"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import {
  createAsset,
  deleteAsset,
  fetchAsset,
  fetchAssets,
  updateAsset,
  fetchAssetMedia,
  createAssetMedia,
  deleteAssetMedia
} from "@/features/operations/assets/api";
import type { Asset, AssetMedia } from "@/features/operations/assets/types";

export function useAssets() {
  return useQuery({ queryKey: queryKeys.operations.assets.list(), queryFn: fetchAssets });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: queryKeys.operations.assets.detail(id),
    queryFn: () => fetchAsset(id),
    enabled: Boolean(id)
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Asset) => createAsset(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operations.assets.all })
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Asset }) => updateAsset(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.assets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.assets.detail(variables.id) });
    }
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operations.assets.all })
  });
}

export function useAssetMedia(assetId: string) {
  return useQuery({
    queryKey: queryKeys.operations.assetMedia.byAsset(assetId),
    queryFn: () => fetchAssetMedia(assetId),
    enabled: Boolean(assetId)
  });
}

export function useCreateAssetMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssetMedia) => createAssetMedia(payload),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.assetMedia.byAsset(variables.assetId) })
  });
}

export function useDeleteAssetMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; assetId: string }) => deleteAssetMedia(id),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.assetMedia.byAsset(variables.assetId) })
  });
}
