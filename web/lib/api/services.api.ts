// lib/api/services.api.ts
import { apiRequest } from "./client";
import type {
  ApiResponse,
  ServiceDto,
  ServiceQueryParams,
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

/**
 * Hizmet listesi
 * Filtreler: businessId, categoryId, providerId (tüm işletmelerden), keyword
 */
export async function getServices(
  params: ServiceQueryParams = {},
  token?: string,
): Promise<ApiResponse<ServiceResponseDto[]>> {
  const query = buildQuery(params as Record<string, unknown>);
  return apiRequest(`/api/services${query}`, { token });
}

/** Hizmet detayı */
export async function getServiceById(
  id: number,
  token?: string,
): Promise<ApiResponse<ServiceResponseDto>> {
  return apiRequest(`/api/services/${id}`, { token });
}

/**
 * Yeni hizmet oluştur
 * dto.businessId ile hangi işletmeye ait olduğu belirlenir;
 * sahiplik kontrolü backend'de ProviderId üzerinden yapılır.
 */
export async function createService(
  dto: ServiceDto,
  token: string,
): Promise<ApiResponse<ServiceResponseDto>> {
  return apiRequest("/api/services", {
    method: "POST",
    body: dto,
    token,
  });
}

/** Hizmet güncelle */
export async function updateService(
  id: number,
  dto: ServiceDto,
  token: string,
): Promise<ApiResponse<ServiceResponseDto>> {
  return apiRequest(`/api/services/${id}`, {
    method: "PUT",
    body: dto,
    token,
  });
}

/** Hizmet sil (soft delete) */
export async function deleteService(
  id: number,
  token: string,
): Promise<ApiResponse<null>> {
  return apiRequest(`/api/services/${id}`, {
    method: "DELETE",
    token,
  });
}
