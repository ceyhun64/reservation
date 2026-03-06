"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ShieldCheck,
  ShieldOff,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import {
  getTwoFactorSetup,
  confirmPendingSecret,
  enableTwoFactor,
  disableTwoFactor,
  getTwoFactorStatus,
  revokeTrustedDevice,
} from "@/lib/api/auth.api";
import type { TwoFactorStatusDto } from "@/types/index";

// ─── Component ────────────────────────────────────────────────────────────────

export default function TwoFactorSetup() {
  const { data: session } = useSession();
  const qc = useQueryClient();

  // Setup dialog
  const [setupOpen, setSetupOpen] = useState(false);
  const [qrUri, setQrUri] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [setupStep, setSetupStep] = useState<"qr" | "confirm">("qr");
  const [setupError, setSetupError] = useState("");

  // Disable dialog
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disableError, setDisableError] = useState("");

  const token = session?.token;

  // ── 2FA durumunu çek ──────────────────────────────────────────────────────

  const { data: status, isLoading } = useQuery<TwoFactorStatusDto>({
    queryKey: ["2fa-status"],
    queryFn: () => getTwoFactorStatus(token!).then((r) => r.data),
    enabled: !!token,
  });

  // ── Etkinleştirme akışı ───────────────────────────────────────────────────

  async function openSetup() {
    setSetupError("");
    setCode("");
    setSetupStep("qr");
    setSetupOpen(true);

    try {
      const res = await getTwoFactorSetup(token!);
      setQrUri(res.data.qrCodeUri);
      setSecret(res.data.secret);
      // Secret'ı Redis'e kaydet; /2fa/enable bunu doğrulamak için kullanır
      await confirmPendingSecret(token!, res.data.secret);
    } catch (err) {
      setSetupError(
        err instanceof Error ? err.message : "Kurulum başlatılamadı.",
      );
      setSetupOpen(false);
    }
  }

  const enableMutation = useMutation({
    mutationFn: () => enableTwoFactor(token!, code.replace(/\s/g, "")),
    onSuccess: () => {
      setSetupOpen(false);
      setCode("");
      qc.invalidateQueries({ queryKey: ["2fa-status"] });
    },
    onError: (err) => {
      setSetupError(err instanceof Error ? err.message : "Geçersiz kod.");
    },
  });

  // ── Devre dışı bırakma akışı ──────────────────────────────────────────────

  const disableMutation = useMutation({
    mutationFn: () => disableTwoFactor(token!, disableCode.replace(/\s/g, "")),
    onSuccess: () => {
      setDisableOpen(false);
      setDisableCode("");
      qc.invalidateQueries({ queryKey: ["2fa-status"] });
    },
    onError: (err) => {
      setDisableError(err instanceof Error ? err.message : "Geçersiz kod.");
    },
  });

  // ── Güvenilen cihaz kaldırma ──────────────────────────────────────────────

  const revokeMutation = useMutation({
    mutationFn: (deviceId: number) => revokeTrustedDevice(token!, deviceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["2fa-status"] }),
  });

  // ── Secret kopyalama ──────────────────────────────────────────────────────

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Kod input formatter ───────────────────────────────────────────────────

  function formatCode(raw: string, setter: (v: string) => void) {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    setter(
      digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits,
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="size-4 animate-spin" />
        Yükleniyor...
      </div>
    );
  }

  const enabled = status?.enabled ?? false;

  return (
    <div className="space-y-6">
      {/* ── Durum kartı ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-xl border p-5">
        <div className="flex items-center gap-4">
          <div
            className={`size-10 rounded-full flex items-center justify-center ${
              enabled ? "bg-green-500/10" : "bg-muted"
            }`}
          >
            {enabled ? (
              <ShieldCheck className="size-5 text-green-500" />
            ) : (
              <ShieldOff className="size-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm flex items-center gap-2">
              İki Adımlı Doğrulama
              <Badge
                variant={enabled ? "default" : "secondary"}
                className="text-xs"
              >
                {enabled ? "Etkin" : "Devre Dışı"}
              </Badge>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {enabled
                ? "Hesabınız Google Authenticator ile korunuyor."
                : "2FA etkinleştirerek hesabınızı daha güvenli yapın."}
            </p>
          </div>
        </div>

        {enabled ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDisableError("");
              setDisableCode("");
              setDisableOpen(true);
            }}
          >
            Kapat
          </Button>
        ) : (
          <Button size="sm" onClick={openSetup}>
            Etkinleştir
          </Button>
        )}
      </div>

      {/* ── Güvenilen cihazlar ───────────────────────────────────────────── */}
      {enabled && (status?.trustedDevices?.length ?? 0) > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Güvenilen Cihazlar</p>
          {status!.trustedDevices.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium truncate max-w-[260px]">
                  {d.userAgent
                    ? simplifyUserAgent(d.userAgent)
                    : "Bilinmeyen cihaz"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {d.ipAddress && `${d.ipAddress} · `}
                  {new Date(d.expiresAt).toLocaleDateString("tr-TR")} tarihine
                  kadar güvenilir
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive shrink-0 ml-2"
                onClick={() => revokeMutation.mutate(d.id)}
                disabled={revokeMutation.isPending}
              >
                {revokeMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Kaldır"
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* ── Etkinleştirme dialog'u ───────────────────────────────────────── */}
      <Dialog
        open={setupOpen}
        onOpenChange={(open) => {
          setSetupOpen(open);
          if (!open) {
            setCode("");
            setSetupError("");
            setSetupStep("qr");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>İki Adımlı Doğrulamayı Etkinleştir</DialogTitle>
            <DialogDescription>
              {setupStep === "qr"
                ? "Google Authenticator uygulamasıyla QR kodu tarayın."
                : "Uygulamadaki 6 haneli kodu girerek kurulumu tamamlayın."}
            </DialogDescription>
          </DialogHeader>

          {/* Adım 1: QR kod */}
          {setupStep === "qr" && (
            <div className="flex flex-col items-center gap-5 py-2">
              {qrUri ? (
                <div className="p-3 border rounded-xl bg-white">
                  <QRCodeSVG value={qrUri} size={180} />
                </div>
              ) : (
                <div className="size-[206px] rounded-xl border bg-muted animate-pulse" />
              )}

              <div className="w-full">
                <p className="text-xs text-muted-foreground mb-2">
                  QR kodu tarayamıyor musunuz? Kodu manuel girin:
                </p>
                <div className="flex gap-2">
                  <Input
                    value={secret}
                    readOnly
                    className="font-mono text-xs tracking-widest"
                  />
                  <Button variant="outline" size="icon" onClick={copySecret}>
                    {copied ? (
                      <Check className="size-4 text-green-500" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => setSetupStep("confirm")}
              >
                Devam Et
              </Button>
            </div>
          )}

          {/* Adım 2: Kodu onayla */}
          {setupStep === "confirm" && (
            <div className="flex flex-col gap-4 py-2">
              {setupError && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{setupError}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="setup-code">Doğrulama Kodu</Label>
                <Input
                  id="setup-code"
                  inputMode="numeric"
                  maxLength={7}
                  placeholder="123 456"
                  value={code}
                  onChange={(e) => formatCode(e.target.value, setCode)}
                  className="text-center text-xl tracking-[0.4em] font-mono"
                  autoComplete="one-time-code"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSetupStep("qr");
                    setSetupError("");
                  }}
                >
                  Geri
                </Button>
                <Button
                  className="flex-1"
                  disabled={
                    code.replace(/\s/g, "").length < 6 ||
                    enableMutation.isPending
                  }
                  onClick={() => enableMutation.mutate()}
                >
                  {enableMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Doğrulanıyor...
                    </>
                  ) : (
                    "Etkinleştir"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Devre dışı bırakma dialog'u ─────────────────────────────────── */}
      <AlertDialog
        open={disableOpen}
        onOpenChange={(open) => {
          setDisableOpen(open);
          if (!open) {
            setDisableCode("");
            setDisableError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>2FA&apos;yı Devre Dışı Bırak</AlertDialogTitle>
            <AlertDialogDescription>
              Devam etmek için Google Authenticator uygulamanızdaki kodu girin.
              Tüm güvenilen cihazlar da silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3 py-2">
            {disableError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{disableError}</AlertDescription>
              </Alert>
            )}
            <Input
              inputMode="numeric"
              maxLength={7}
              placeholder="123 456"
              value={disableCode}
              onChange={(e) => formatCode(e.target.value, setDisableCode)}
              className="text-center text-xl tracking-[0.4em] font-mono"
              autoComplete="one-time-code"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => disableMutation.mutate()}
              disabled={
                disableCode.replace(/\s/g, "").length < 6 ||
                disableMutation.isPending
              }
            >
              {disableMutation.isPending ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Devre Dışı Bırakılıyor...
                </>
              ) : (
                "Devre Dışı Bırak"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Yardımcı fonksiyon ────────────────────────────────────────────────────────

function simplifyUserAgent(ua: string): string {
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) return "Android cihaz";
  if (ua.includes("Mac")) return "Mac";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Linux")) return "Linux";
  return `${ua.slice(0, 40)}…`;
}
