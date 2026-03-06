"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Loader2, ShieldCheck, ChevronLeft } from "lucide-react";
import { loginUser, verifyTwoFactor } from "@/lib/api/auth.api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "credentials" | "twoFactor";

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginForm() {
  const router = useRouter();

  // Step A — kimlik bilgileri
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step B — 2FA
  const [step, setStep] = useState<Step>("credentials");
  const [tempToken, setTempToken] = useState("");
  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);

  // Ortak
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Step A: Email + şifre ─────────────────────────────────────────────────

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // loginUser() direkt API'yi çağırır — NextAuth devreye girmez.
      // requiresTwoFactor bayrağını burada okuyabilmek için bu yaklaşım gerekli.
      const data = await loginUser({ email, password });

      if (data.data.requiresTwoFactor) {
        setTempToken(data.data.tempToken!);
        setStep("twoFactor");
        return;
      }

      // 2FA yok → JWT'yi NextAuth session'ına yaz
      await finalizeSession({
        token: data.data.token!,
        role: data.data.role!,
        fullName: data.data.fullName!,
        userId: data.data.userId!,
      });
    } catch (err) {
      // apiRequest, backend hatasını throw new Error(message) ile fırlatır
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step B: TOTP kodu ─────────────────────────────────────────────────────

  async function handleTwoFactor(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await verifyTwoFactor({
        tempToken,
        code: code.replace(/\s/g, ""),
        rememberDevice,
      });

      await finalizeSession({
        token: data.data.token!,
        role: data.data.role!,
        fullName: data.data.fullName!,
        userId: data.data.userId!,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Geçersiz doğrulama kodu.");
    } finally {
      setLoading(false);
    }
  }

  // ── Session oluştur ───────────────────────────────────────────────────────
  // Backend JWT'si alındıktan sonra NextAuth'a "verifiedToken" path'i üzerinden
  // paslanır — authorize() ekstra API isteği yapmadan session oluşturur.

  async function finalizeSession(args: {
    token: string;
    role: string;
    fullName: string;
    userId: number;
  }) {
    const res = await signIn("credentials", {
      email,
      verifiedToken: args.token,
      verifiedRole: args.role,
      verifiedName: args.fullName,
      verifiedId: String(args.userId),
      redirect: false,
    });

    if (res?.error) {
      setError("Oturum oluşturulamadı. Lütfen tekrar deneyin.");
      return;
    }

    // refresh() — NextAuth session'ının server component'lara
    // hemen yansıması için gerekli
    router.refresh();
    router.push("/dashboard");
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-12">
          <div className="size-7 border border-primary flex items-center justify-center text-primary text-sm">
            ◈
          </div>
          <Link
            href="/"
            className="text-xl font-bold tracking-wide no-underline text-foreground"
          >
            Rezervo
          </Link>
        </div>

        <Card>
          {/* ── Step A: Kimlik bilgileri ──────────────────────────────────── */}
          {step === "credentials" && (
            <>
              <CardHeader className="pb-2">
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">
                  — Hoş Geldiniz
                </p>
                <h1 className="text-3xl">Giriş Yap</h1>
                <p className="text-sm text-muted-foreground font-light">
                  Hesabınıza erişmek için bilgilerinizi girin.
                </p>
              </CardHeader>

              <CardContent className="pt-4">
                <form
                  onSubmit={handleCredentials}
                  className="flex flex-col gap-5"
                >
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ornek@mail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password">Şifre</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Giriş yapılıyor...
                      </>
                    ) : (
                      "Giriş Yap"
                    )}
                  </Button>
                </form>

                <div className="flex items-center gap-4 my-6">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">veya</span>
                  <Separator className="flex-1" />
                </div>

                <p className="text-sm text-muted-foreground text-center font-light">
                  Hesabınız yok mu?{" "}
                  <Link
                    href="/auth/register"
                    className="text-primary font-medium no-underline hover:underline"
                  >
                    Kayıt Ol
                  </Link>
                </p>
              </CardContent>
            </>
          )}

          {/* ── Step B: TOTP kodu ─────────────────────────────────────────── */}
          {step === "twoFactor" && (
            <>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="size-5 text-primary" />
                  <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                    — İki Adımlı Doğrulama
                  </p>
                </div>
                <h1 className="text-3xl">Kodu Girin</h1>
                <p className="text-sm text-muted-foreground font-light">
                  Google Authenticator uygulamanızdaki 6 haneli kodu girin.
                </p>
              </CardHeader>

              <CardContent className="pt-4">
                <form
                  onSubmit={handleTwoFactor}
                  className="flex flex-col gap-5"
                >
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="code">Doğrulama Kodu</Label>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      placeholder="123 456"
                      maxLength={7}
                      value={code}
                      onChange={(e) => {
                        const raw = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        setCode(
                          raw.length > 3
                            ? `${raw.slice(0, 3)} ${raw.slice(3)}`
                            : raw,
                        );
                      }}
                      className="text-center text-xl tracking-[0.4em] font-mono"
                      autoComplete="one-time-code"
                      required
                    />
                  </div>

                  {/* Cihaza güven */}
                  <div className="flex items-start gap-3 rounded-lg border p-3 bg-muted/30">
                    <Checkbox
                      id="remember"
                      checked={rememberDevice}
                      onCheckedChange={(v) => setRememberDevice(v === true)}
                      className="mt-0.5"
                    />
                    <div className="flex flex-col gap-0.5">
                      <Label
                        htmlFor="remember"
                        className="cursor-pointer font-medium"
                      >
                        Bu cihaza güven
                      </Label>
                      <p className="text-xs text-muted-foreground font-light">
                        30 gün boyunca bu cihazda tekrar kod istenmez.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || code.replace(/\s/g, "").length < 6}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Doğrulanıyor...
                      </>
                    ) : (
                      "Doğrula"
                    )}
                  </Button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setError("");
                    setCode("");
                  }}
                  className="flex items-center gap-1 mt-5 mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="size-3" />
                  Farklı hesapla giriş yap
                </button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
