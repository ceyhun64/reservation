// lib/api/notifications.api.ts
import { apiRequest } from "./client";
import type { ApiResponse, NotificationResponseDto } from "@/types/index";

/** Bildirimleri getir (opsiyonel: sadece okunmamışlar) */
export async function getNotifications(
  unreadOnly = false,
  token: string,
): Promise<ApiResponse<NotificationResponseDto[]>> {
  return apiRequest(`/api/notifications?unreadOnly=${unreadOnly}`, { token });
}

/** Bildirimi okundu işaretle */
export async function markNotificationRead(
  id: number,
  token: string,
): Promise<ApiResponse<null>> {
  return apiRequest(`/api/notifications/${id}/read`, {
    method: "PATCH",
    token,
  });
}

/** Tüm bildirimleri okundu işaretle */
export async function markAllNotificationsRead(
  token: string,
): Promise<ApiResponse<null>> {
  return apiRequest("/api/notifications/read-all", { method: "PATCH", token });
}
