import { apiRequest } from "./client";
import type { ApiResponse } from "@/types/index";
import type { RegisterDto, AuthResponseDto } from "@/types/index";

export async function registerUser(
  dto: RegisterDto,
): Promise<ApiResponse<AuthResponseDto>> {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: dto,
  });
}
