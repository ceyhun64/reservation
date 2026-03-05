// lib/api/providers.api.ts
import { apiRequest } from "./client";
import type {
  ApiResponse,
  PagedResponse,
  ProviderDto,
  ProviderQueryParams,
  ProviderResponseDto,
  ServiceResponseDto,
} from "@/types/index";

function buildQuery(params: Record<string, unknown>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
    )
    .join("&");
  return qs ? `?${qs}` : "";
}

/** Tüm providerları ara / filtrele */
export async function getProviders(
  params: ProviderQueryParams = {},
  token?: string,
): Promise<ApiResponse<PagedResponse<ProviderResponseDto>>> {
  const query = buildQuery(params as Record<string, unknown>);
  return apiRequest(`/api/providers${query}`, { token });
}

/** Tek provider detayı */
export async function getProviderById(
  id: number,
  token?: string,
): Promise<ApiResponse<ProviderResponseDto>> {
  return apiRequest(`/api/providers/${id}`, { token });
}

/**
 * Giriş yapmış Provider kullanıcısının kendi profili
 * GET /api/providers/me
 */
export async function getMyProvider(
  token: string,
): Promise<ApiResponse<ProviderResponseDto>> {
  return apiRequest("/api/providers/me", { token });
}

/**
 * Provider profili oluştur (rol: Provider)
 * NOT: BusinessId artık ProviderDto'da yok —
 *      işletmeler ayrıca POST /api/businesses ile eklenir.
 */
export async function createProvider(
  dto: ProviderDto,
  token: string,
): Promise<ApiResponse<ProviderResponseDto>> {
  return apiRequest("/api/providers", {
    method: "POST",
    body: dto,
    token,
  });
}

/** Provider profilini güncelle */
export async function updateProvider(
  id: number,
  dto: ProviderDto,
  token: string,
): Promise<ApiResponse<ProviderResponseDto>> {
  return apiRequest(`/api/providers/${id}`, {
    method: "PUT",
    body: dto,
    token,
  });
}

/**
 * Provider'ın tüm işletmelerindeki hizmetler
 * GET /api/providers/{id}/services
 */
export async function getProviderServices(
  providerId: number,
  token?: string,
): Promise<ApiResponse<ServiceResponseDto[]>> {
  return apiRequest(`/api/providers/${providerId}/services`, { token });
}
