// lib/api/categories.api.ts
import { apiRequest } from "./client";
import type {
  ApiResponse,
  CategoryDto,
  CategoryResponseDto,
} from "@/types/index";

export async function getCategories(
  token?: string,
): Promise<ApiResponse<CategoryResponseDto[]>> {
  return apiRequest("/api/categories", { token });
}

export async function getCategoryById(
  id: number,
  token?: string,
): Promise<ApiResponse<CategoryResponseDto>> {
  return apiRequest(`/api/categories/${id}`, { token });
}

export async function createCategory(
  dto: CategoryDto,
  token: string,
): Promise<ApiResponse<CategoryResponseDto>> {
  return apiRequest("/api/categories", { method: "POST", body: dto, token });
}

export async function updateCategory(
  id: number,
  dto: CategoryDto,
  token: string,
): Promise<ApiResponse<CategoryResponseDto>> {
  return apiRequest(`/api/categories/${id}`, {
    method: "PUT",
    body: dto,
    token,
  });
}

export async function deleteCategory(
  id: number,
  token: string,
): Promise<ApiResponse<null>> {
  return apiRequest(`/api/categories/${id}`, { method: "DELETE", token });
}
