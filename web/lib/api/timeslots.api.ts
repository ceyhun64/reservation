// lib/api/timeslots.api.ts
import { apiRequest } from "./client";
import type {
  ApiResponse,
  BulkTimeSlotCreateDto,
  TimeSlotCreateDto,
  TimeSlotResponseDto,
} from "@/types/index";

/** Provider'ın müsait slotları; opsiyonel olarak belirli bir güne göre filtre */
export async function getTimeSlots(
  providerId: number,
  date?: string,
  token?: string,
): Promise<ApiResponse<TimeSlotResponseDto[]>> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return apiRequest(`/api/timeslots/provider/${providerId}${query}`, { token });
}

/** Tekli slot ekle */
export async function createTimeSlot(
  providerId: number,
  dto: TimeSlotCreateDto,
  token: string,
): Promise<ApiResponse<TimeSlotResponseDto>> {
  return apiRequest(`/api/timeslots/provider/${providerId}`, {
    method: "POST",
    body: dto,
    token,
  });
}

/** Toplu slot oluştur (gün bazlı) */
export async function createBulkTimeSlots(
  providerId: number,
  dto: BulkTimeSlotCreateDto,
  token: string,
): Promise<ApiResponse<{ created: number }>> {
  return apiRequest(`/api/timeslots/provider/${providerId}/bulk`, {
    method: "POST",
    body: dto,
    token,
  });
}

/** Slotu bloke et */
export async function blockTimeSlot(
  slotId: number,
  token: string,
): Promise<ApiResponse<null>> {
  return apiRequest(`/api/timeslots/${slotId}/block`, {
    method: "PATCH",
    token,
  });
}

/** Slotu sil (sadece Available olanlar) */
export async function deleteTimeSlot(
  slotId: number,
  token: string,
): Promise<ApiResponse<null>> {
  return apiRequest(`/api/timeslots/${slotId}`, { method: "DELETE", token });
}
