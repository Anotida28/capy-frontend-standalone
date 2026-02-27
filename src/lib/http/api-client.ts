"use client";

import { encodeBasicAuth } from "@/lib/auth/basic-auth";
import { clearAuth, getAuth } from "@/lib/auth/auth-store";
import { ENV } from "@/lib/config/env";
import { ApiError, extractErrorMessage } from "@/lib/http/errors";
import { mockRequest } from "@/lib/http/mock-api";

const API_PREFIX = "/api/v1";

async function request<T>(input: string, init: RequestInit = {}) {
  const { username, password } = getAuth();
  const baseUrl = ENV.apiBaseUrl || "";
  const url = input.startsWith("http") ? input : `${baseUrl}${API_PREFIX}${input}`;

  if (ENV.useMockApi) {
    return mockRequest<T>(url, init);
  }

  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (username && password) {
    headers.set("Authorization", `Basic ${encodeBasicAuth(username, password)}`);
  }

  const response = await fetch(url, {
    ...init,
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  const hasJson = contentType.includes("application/json");
  const data = hasJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login?reason=expired";
      }
    }
    const message =
      response.status === 403
        ? "You do not have permission"
        : extractErrorMessage(data) || response.statusText || "Request failed";
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" })
};
