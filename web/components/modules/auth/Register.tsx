"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Loader2,
  ArrowUpRight,
  Building2,
  User,
} from "lucide-react";
import { registerUser } from "@/lib/api/auth.api";
import { cn } from "@/lib/utils";

export default function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"Receiver" | "Provider">("Receiver");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await registerUser({
        fullName,
        email,
        password,
        phone: phone.replace(/\s/g, ""),
        role,
      });
      if (!data.success) {
        setError(data.message || "Kayıt başarısız.");
        return;
      }
      router.push("/auth/login");
    } catch {
      setError("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
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
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 mb-5 font-medium">
            Hesap Türünüzü Seçin
          </p>
          <div className="space-y-3">
            {[
              {
                type: "Receiver" as const,
                icon: User,
                title: "Müşteri",
                desc: "İşletmelerde randevu alın ve takip edin.",
              },
              {
                type: "Provider" as const,
                icon: Building2,
                title: "İşletme Sahibi",
                desc: "İşletmenizi yönetin, randevuları takip edin.",
              },
            ].map(({ type, icon: Icon, title, desc }) => (
              <button
                key={type}
                type="button"
                onClick={() => setRole(type)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all duration-200",
                  role === type
                    ? "border-primary/40 bg-primary/[0.04] text-foreground"
                    : "border-border/40 hover:border-border/70 text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "size-4",
                      role === type
                        ? "text-primary"
                        : "text-muted-foreground/40",
                    )}
                  />
                  <div>
                    <p className="text-[13px] font-semibold">{title}</p>
                    <p className="text-[11px] text-muted-foreground/50 font-light mt-0.5">
                      {desc}
                    </p>
                  </div>
                </div>
              </button>
            ))}
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
          <Link href="/" className="flex items-center gap-2.5 mb-12 lg:hidden">
            <div className="flex size-7 items-center justify-center border border-primary/60 text-primary text-[11px]">
              ◈
            </div>
            <span className="font-bold text-[15px] tracking-tight">
              Rezervo
            </span>
          </Link>

          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 font-medium">
              — Yeni Hesap
            </p>
            <h1 className="text-[32px] font-bold tracking-[-0.02em] mb-2">
              Kayıt Ol
            </h1>
            <p className="text-[13px] text-muted-foreground/60 font-light">
              Birkaç adımda hesabınızı oluşturun.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
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
                Ad Soyad
              </Label>
              <Input
                type="text"
                placeholder="Adınız Soyadınız"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-10 text-[13px] border-border/60"
              />
            </div>

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
                className="h-10 text-[13px] border-border/60"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                Telefon
              </Label>
              <Input
                type="tel"
                placeholder="+90 5xx xxx xx xx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-10 text-[13px] border-border/60"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                Şifre
              </Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 text-[13px] border-border/60"
              />
            </div>

            {/* Mobile role selector */}
            <div className="space-y-1.5 lg:hidden">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                Hesap Türü
              </Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "Receiver" | "Provider")}
              >
                <SelectTrigger className="h-10 text-[13px] border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receiver">Müşteri</SelectItem>
                  <SelectItem value="Provider">İşletme Sahibi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 text-[11px] uppercase tracking-[0.12em] font-semibold mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 mr-2 animate-spin" /> Kayıt
                  yapılıyor...
                </>
              ) : (
                <>
                  Hesap Oluştur <ArrowUpRight className="size-3 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border/40" />
            <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">
              veya
            </span>
            <div className="flex-1 h-px bg-border/40" />
          </div>

          <p className="text-[12px] text-muted-foreground/50 text-center">
            Zaten hesabınız var mı?{" "}
            <Link
              href="/auth/login"
              className="text-primary font-medium hover:underline"
            >
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
