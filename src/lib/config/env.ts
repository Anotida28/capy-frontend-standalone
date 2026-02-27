export const ENV = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    "",
  useMockApi:
    process.env.NEXT_PUBLIC_USE_MOCK_API === "true" ||
    process.env.VITE_USE_MOCK_API === "true"
};

export function requireApiBaseUrl() {
  if (!ENV.apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }
  return ENV.apiBaseUrl;
}
