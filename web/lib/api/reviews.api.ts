// lib/api/reviews.api.ts
import { apiRequest } from "./client";
import type {
  ApiResponse,
  PagedResponse,
  ReviewCreateDto,
  ReviewReplyDto,
  ReviewResponseDto,
} from "@/types/index";

/** Provider'a ait değerlendirmeler */
export async function getProviderReviews(
  providerId: number,
  params: { page?: number; pageSize?: number } = {},
  token?: string,
): Promise<ApiResponse<PagedResponse<ReviewResponseDto>>> {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const query = qs ? `?${qs}` : "";
  return apiRequest(`/api/reviews/provider/${providerId}${query}`, { token });
}

/** Değerlendirme yaz (tamamlanan randevu gerekli) */
export async function createReview(
  dto: ReviewCreateDto,
  token: string,
): Promise<ApiResponse<ReviewResponseDto>> {
  return apiRequest("/api/reviews", { method: "POST", body: dto, token });
}

/** Provider olarak değerlendirmeye cevap yaz */
export async function replyToReview(
  id: number,
  dto: ReviewReplyDto,
  token: string,
): Promise<ApiResponse<ReviewResponseDto>> {
  return apiRequest(`/api/reviews/${id}/reply`, {
    method: "PATCH",
    body: dto,
    token,
  });
}

/** Değerlendirmeyi gizle (Admin) */
export async function hideReview(
  id: number,
  token: string,
): Promise<ApiResponse<null>> {
  return apiRequest(`/api/reviews/${id}/hide`, { method: "PATCH", token });
}
