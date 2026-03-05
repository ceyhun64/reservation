// lib/api/appointments.api.ts
import { apiRequest } from "./client";
import type {
  ApiResponse,
  AppointmentCreateDto,
  AppointmentQueryParams,
  AppointmentResponseDto,
  AppointmentUpdateStatusDto,
  CancelDto,
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

/** Müşterinin kendi randevuları */
export async function getMyAppointments(
  params: AppointmentQueryParams = {},
  token: string,
): Promise<ApiResponse<PagedResponse<AppointmentResponseDto>>> {
  const query = buildQuery(params as Record<string, unknown>);
  return apiRequest(`/api/appointments/my${query}`, { token });
}

/** Provider olarak gelen randevular */
export async function getProviderAppointments(
  params: AppointmentQueryParams = {},
  token: string,
): Promise<ApiResponse<PagedResponse<AppointmentResponseDto>>> {
  const query = buildQuery(params as Record<string, unknown>);
  return apiRequest(`/api/appointments/provider${query}`, { token });
}

/**
 * Belirli bir işletmenin randevuları
 * GET /api/appointments/business/{businessId}
 */
export async function getBusinessAppointments(
  businessId: number,
  params: AppointmentQueryParams = {},
  token: string,
): Promise<ApiResponse<PagedResponse<AppointmentResponseDto>>> {
  const query = buildQuery(params as Record<string, unknown>);
  return apiRequest(`/api/appointments/business/${businessId}${query}`, {
    token,
  });
}

/**
 * Randevu oluştur
 * Fiyat backend'de Service.Price üzerinden otomatik belirlenir —
 * artık CustomPrice yoktur (ProviderService tablosu kaldırıldı).
 */
export async function createAppointment(
  dto: AppointmentCreateDto,
  token: string,
): Promise<ApiResponse<AppointmentResponseDto>> {
  return apiRequest("/api/appointments", {
    method: "POST",
    body: dto,
    token,
  });
}

/** Randevu durumunu güncelle (confirm / reject / complete / noshow) */
export async function updateAppointmentStatus(
  id: number,
  dto: AppointmentUpdateStatusDto,
  token: string,
): Promise<ApiResponse<AppointmentResponseDto>> {
  return apiRequest(`/api/appointments/${id}/status`, {
    method: "PATCH",
    body: dto,
    token,
  });
}

/** Randevu iptal et (müşteri) */
export async function cancelAppointment(
  id: number,
  dto: CancelDto,
  token: string,
): Promise<ApiResponse<null>> {
  return apiRequest(`/api/appointments/${id}/cancel`, {
    method: "PATCH",
    body: dto,
    token,
  });
}
