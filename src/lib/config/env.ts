const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.VITE_API_BASE_URL || "";
const apiBaseUrl = rawApiBaseUrl.trim();
const rawUseMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API || process.env.VITE_USE_MOCK_API || "";
const useMockApiFlag = rawUseMockApi.trim().toLowerCase() === "true";

export const ENV = {
  apiBaseUrl,
  // Demo-safe default: if API base URL is not configured, automatically use local mock data.
  useMockApi: useMockApiFlag || !apiBaseUrl
};

export function requireApiBaseUrl() {
  if (!ENV.apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }
  return ENV.apiBaseUrl;
}
