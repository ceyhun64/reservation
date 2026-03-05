// lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5191";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : { success: res.ok };

  if (!res.ok || !data.success) {
    const message =
      data?.message || data?.errors?.join(", ") || "Bir hata oluştu";
    throw new Error(message);
  }

  return data;
}
