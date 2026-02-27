import type { Response } from "express";

export type ApiResult =
  | { status: number; data: unknown }
  | { status: number; message: string };

export const ok = (data: unknown): ApiResult => ({ status: 200, data });
export const created = (data: unknown): ApiResult => ({ status: 201, data });
export const noContent = (): ApiResult => ({ status: 204, data: null });
export const badRequest = (message: string): ApiResult => ({ status: 400, message });
export const notFound = (message: string): ApiResult => ({ status: 404, message });

export function respond(res: Response, result: ApiResult) {
  if (result.status === 204) {
    return res.status(204).send();
  }

  if ("message" in result) {
    return res.status(result.status).json({ message: result.message });
  }

  return res.status(result.status).json(result.data);
}

export function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function queryValue(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

export function nowIso() {
  return new Date().toISOString();
}

export function generateId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
