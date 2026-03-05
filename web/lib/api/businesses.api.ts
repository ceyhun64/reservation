// lib/api/businesses.api.ts
import { apiRequest } from "./client";
import type {
  ApiResponse,
  BusinessDto,
  BusinessQueryParams,
  BusinessResponseDto,
  PagedResponse,
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

/** Tüm işletmeleri listele */
export async function getBusinesses(
  params: BusinessQueryParams = {},
  token?: string,
): Promise<ApiResponse<PagedResponse<BusinessResponseDto>>> {
  const query = buildQuery(params as Record<string, unknown>);
  return apiRequest(`/api/businesses${query}`, { token });
}

/** İşletme detayı */
export async function getBusinessById(
  id: number,
  token?: string,
): Promise<ApiResponse<BusinessResponseDto>> {
  return apiRequest(`/api/businesses/${id}`, { token });
}

/**
 * Giriş yapmış Provider'ın kendi işletmeleri
 * GET /api/businesses/my
 */
export async function getMyBusinesses(
  token: string,
): Promise<ApiResponse<BusinessResponseDto[]>> {
  return apiRequest("/api/businesses/my", { token });
}

/**
 * Yeni işletme oluştur (rol: Provider)
 * Artık sahiplik UserId üzerinden değil, token'dan çözülen Provider profiliyle belirlenir.
 */
export async function createBusiness(
  dto: BusinessDto,
  token: string,
): Promise<ApiResponse<BusinessResponseDto>> {
  return apiRequest("/api/businesses", {
    method: "POST",
    body: dto,
    token,
  });
}

/** İşletme güncelle */
export async function updateBusiness(
  id: number,
  dto: BusinessDto,
  token: string,
): Promise<ApiResponse<BusinessResponseDto>> {
  return apiRequest(`/api/businesses/${id}`, {
    method: "PUT",
    body: dto,
    token,
  });
}

/** İşletme sil (soft delete) */
export async function deleteBusiness(
  id: number,
  token: string,
): Promise<ApiResponse<null>> {
  return apiRequest(`/api/businesses/${id}`, {
    method: "DELETE",
    token,
  });
}
