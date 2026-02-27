export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function extractErrorMessage(data: unknown) {
  if (!data || typeof data !== "object") return null;
  const maybe = data as { message?: string };
  return maybe.message ?? null;
}
