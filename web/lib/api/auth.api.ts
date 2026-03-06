import { apiRequest } from "./client";
import type { ApiResponse } from "@/types/index";
import type {
  RegisterDto,
  AuthResponseDto,
  TwoFactorSetupResponseDto,
  TwoFactorStatusDto,
  LoginDto,
  TwoFactorVerifyDto,
} from "@/types/index";

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function registerUser(
  dto: RegisterDto,
): Promise<ApiResponse<AuthResponseDto>> {
  return apiRequest("/api/auth/register", { method: "POST", body: dto });
}

/**
 * Called directly (not through NextAuth) so we can inspect the
 * requiresTwoFactor flag before creating a session.
 * credentials:"include" sends the trusted_device cookie if present.
 */
export async function loginUser(
  dto: LoginDto,
): Promise<ApiResponse<AuthResponseDto>> {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: dto,
    credentials: "include",
  });
}

// ── 2FA — login flow ─────────────────────────────────────────────────────────

/**
 * Second step of login when 2FA is required.
 * credentials:"include" lets the browser receive the trusted_device cookie
 * that the backend sets when rememberDevice=true.
 */
export async function verifyTwoFactor(
  dto: TwoFactorVerifyDto,
): Promise<ApiResponse<AuthResponseDto>> {
  return apiRequest("/api/auth/2fa/verify", {
    method: "POST",
    body: dto,
    credentials: "include",
  });
}

// ── 2FA — settings ───────────────────────────────────────────────────────────

/** Returns the new TOTP secret + QR-code URI. Does NOT enable 2FA yet. */
export async function getTwoFactorSetup(
  token: string,
): Promise<ApiResponse<TwoFactorSetupResponseDto>> {
  return apiRequest("/api/auth/2fa/setup", { token });
}

/**
 * Persists the pending secret in Redis (server-side) so /2fa/enable
 * can verify and activate it. Call immediately after getTwoFactorSetup.
 */
export async function confirmPendingSecret(
  token: string,
  secret: string,
): Promise<ApiResponse<string>> {
  return apiRequest("/api/auth/2fa/setup/confirm-secret", {
    method: "POST",
    body: secret,
    token,
  });
}

/** Verifies the first TOTP code from the authenticator app, then enables 2FA. */
export async function enableTwoFactor(
  token: string,
  code: string,
): Promise<ApiResponse<string>> {
  return apiRequest("/api/auth/2fa/enable", {
    method: "POST",
    body: { code },
    token,
  });
}

/** Disables 2FA. Requires a live TOTP code to prevent unauthorized disable. */
export async function disableTwoFactor(
  token: string,
  code: string,
): Promise<ApiResponse<string>> {
  return apiRequest("/api/auth/2fa/disable", {
    method: "POST",
    body: { code },
    token,
  });
}

/** Returns current 2FA status and the list of trusted devices. */
export async function getTwoFactorStatus(
  token: string,
): Promise<ApiResponse<TwoFactorStatusDto>> {
  return apiRequest("/api/auth/2fa/status", { token });
}

/** Revokes a single trusted device by id. */
export async function revokeTrustedDevice(
  token: string,
  deviceId: number,
): Promise<ApiResponse<string>> {
  return apiRequest(`/api/auth/2fa/trusted-devices/${deviceId}`, {
    method: "DELETE",
    token,
  });
}
