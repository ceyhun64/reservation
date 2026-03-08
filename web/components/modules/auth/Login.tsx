"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  Loader2,
  ShieldCheck,
  ChevronLeft,
  ArrowUpRight,
} from "lucide-react";
import { loginUser, verifyTwoFactor } from "@/lib/api/auth.api";
import { cn } from "@/lib/utils";

type Step = "credentials" | "twoFactor";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<Step>("credentials");
  const [tempToken, setTempToken] = useState("");
  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      if (data.data.requiresTwoFactor) {
        setTempToken(data.data.tempToken!);
        setStep("twoFactor");
        return;
      }
      await finalizeSession({
        token: data.data.token!,
        role: data.data.role!,
        fullName: data.data.fullName!,
        userId: data.data.userId!,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

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
    router.refresh();
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] border-r border-border/60 px-12 py-12 bg-muted/[0.015]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center border border-primary/60 text-primary text-[11px]">
            ◈
          </div>
          <span className="font-bold text-[15px] tracking-tight">Rezervo</span>
        </Link>

        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 mb-6 font-medium">
            Güvenilir Platform
          </p>
          <blockquote className="text-[15px] text-muted-foreground/60 leading-relaxed font-light italic">
            "Rezervo ile randevu yönetimi artık çok daha kolay. Müşterilerimiz
            memnun, biz de."
          </blockquote>
          <div className="flex items-center gap-3 mt-6">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
              AK
            </div>
            <div>
              <p className="text-[12px] font-semibold">Ayşe Kaya</p>
              <p className="text-[11px] text-muted-foreground/50">
                Güzellik Salonu Sahibi
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {["10K+\nİşletme", "500K+\nRandevu", "98%\nMemnuniyet"].map(
            (s, i) => {
              const [val, label] = s.split("\n");
              return (
                <div key={i}>
                  <p className="text-[18px] font-bold">{val}</p>
                  <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">
                    {label}
                  </p>
                </div>
              );
            },
          )}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-12 lg:hidden">
            <div className="flex size-7 items-center justify-center border border-primary/60 text-primary text-[11px]">
              ◈
            </div>
            <span className="font-bold text-[15px] tracking-tight">
              Rezervo
            </span>
          </Link>

          {step === "credentials" ? (
            <>
              <div className="mb-8">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 font-medium">
                  — Hoş Geldiniz
                </p>
                <h1 className="text-[32px] font-bold tracking-[-0.02em] mb-2">
                  Giriş Yap
                </h1>
                <p className="text-[13px] text-muted-foreground/60 font-light">
                  Hesabınıza erişmek için bilgilerinizi girin.
                </p>
              </div>

              <form onSubmit={handleCredentials} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="py-2.5 text-[12px]">
                    <AlertCircle className="size-3.5" />
                    <AlertDescription className="text-[12px]">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                    Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="ornek@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-10 text-[13px] border-border/60 focus:border-primary/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                      Şifre
                    </Label>
                    <Link
                      href="/auth/forgot"
                      className="text-[11px] text-primary/70 hover:text-primary transition-colors"
                    >
                      Unuttum
                    </Link>
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-10 text-[13px] border-border/60 focus:border-primary/50"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 text-[11px] uppercase tracking-[0.12em] font-semibold mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-3.5 mr-2 animate-spin" /> Giriş
                      yapılıyor...
                    </>
                  ) : (
                    <>
                      Giriş Yap <ArrowUpRight className="size-3 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">
                  veya
                </span>
                <div className="flex-1 h-px bg-border/40" />
              </div>

              <p className="text-[12px] text-muted-foreground/50 text-center">
                Hesabınız yok mu?{" "}
                <Link
                  href="/auth/register"
                  className="text-primary font-medium hover:underline"
                >
                  Kayıt Ol
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="size-4 text-primary" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-medium">
                    — İki Adımlı Doğrulama
                  </p>
                </div>
                <h1 className="text-[32px] font-bold tracking-[-0.02em] mb-2">
                  Kodu Girin
                </h1>
                <p className="text-[13px] text-muted-foreground/60 font-light">
                  Google Authenticator uygulamanızdaki 6 haneli kodu girin.
                </p>
              </div>

              <form onSubmit={handleTwoFactor} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="py-2.5">
                    <AlertCircle className="size-3.5" />
                    <AlertDescription className="text-[12px]">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                    Doğrulama Kodu
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="123 456"
                    maxLength={7}
                    value={code}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setCode(
                        raw.length > 3
                          ? `${raw.slice(0, 3)} ${raw.slice(3)}`
                          : raw,
                      );
                    }}
                    className="h-12 text-center text-2xl tracking-[0.5em] font-mono border-border/60"
                    autoComplete="one-time-code"
                    required
                  />
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-border/50 p-3 bg-muted/20">
                  <Checkbox
                    id="remember"
                    checked={rememberDevice}
                    onCheckedChange={(v) => setRememberDevice(v === true)}
                    className="mt-0.5"
                  />
                  <div>
                    <Label
                      htmlFor="remember"
                      className="cursor-pointer text-[12px] font-medium"
                    >
                      Bu cihaza güven
                    </Label>
                    <p className="text-[11px] text-muted-foreground/50 font-light mt-0.5">
                      30 gün boyunca tekrar kod istenmez.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || code.replace(/\s/g, "").length < 6}
                  className="w-full h-10 text-[11px] uppercase tracking-[0.12em] font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-3.5 mr-2 animate-spin" />{" "}
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
                className="flex items-center gap-1 mt-5 mx-auto text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors uppercase tracking-wider"
              >
                <ChevronLeft className="size-3" />
                Farklı hesapla giriş yap
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
