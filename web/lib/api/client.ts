// lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5191";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
  /** Ek HTTP başlıkları — token ile birlikte merge edilir */
  headers?: Record<string, string>;
  /** Cookie davranışı. Trusted-device cookie için "include" gerekli. */
  credentials?: RequestCredentials;
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    token,
    headers: extraHeaders,
    credentials,
  } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    credentials: credentials ?? "same-origin",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : { success: res.ok };

  if (!res.ok || !data.success) {
    const message =
      data?.message || data?.errors?.join(", ") || "Bir hata oluştu";
    throw new Error(message);
  }

  return data as T;
}
