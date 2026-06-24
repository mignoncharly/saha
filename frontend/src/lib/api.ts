import { getAuthHeaders } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Turn an unknown thrown value into a human-readable message. Handles DRF's
 * shapes: {"detail": "..."}, {"field": ["msg", ...]}, and plain strings.
 */
export function parseApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    try {
      const data = JSON.parse(err.message);
      if (typeof data === "string") return data;
      if (data.detail) return String(data.detail);
      const messages: string[] = [];
      for (const [key, value] of Object.entries(data)) {
        if (key === "status_code") continue;
        const text = Array.isArray(value) ? value.join(" ") : String(value);
        messages.push(text);
      }
      if (messages.length) return messages.join(" ");
    } catch {
      if (err.message) return err.message;
    }
  }
  return fallback;
}

async function request<T>(endpoint: string, options?: RequestInit, isFormData = false): Promise<T> {
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) || {}),
    ...getAuthHeaders(),
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new ApiError(errorText || res.statusText, res.status);
  }
  // 204 No Content (e.g. DELETE) and empty bodies must not be parsed as JSON.
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function requestBlob(endpoint: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new ApiError(errorText || res.statusText, res.status);
  }
  return res.blob();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  patch: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  put: <T>(endpoint: string, data: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
  postFormData: <T>(endpoint: string, formData: FormData) =>
    request<T>(
      endpoint,
      {
        method: "POST",
        body: formData,
      },
      true
    ),
  getBlob: (endpoint: string) => requestBlob(endpoint),
};

/** Fetches a protected file (with auth header) and triggers a browser download. */
export async function downloadFile(endpoint: string, filename: string): Promise<void> {
  const blob = await api.getBlob(endpoint);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
