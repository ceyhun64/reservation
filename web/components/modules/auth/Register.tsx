"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { registerUser } from "@/lib/api/auth.api";

export default function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"Receiver" | "Provider">("Receiver");
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
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
          <CardHeader className="pb-2">
            <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">
              — Yeni Hesap
            </p>
            <h1 className="text-3xl">Kayıt Ol</h1>
            <p className="text-sm text-muted-foreground font-light">
              Birkaç adımda hesabınızı oluşturun.
            </p>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="fullName">Ad Soyad</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Adınız Soyadınız"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

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
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+90 5xx xxx xx xx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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

              <div className="flex flex-col gap-2">
                <Label htmlFor="role">Hesap Türü</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as "Receiver" | "Provider")}
                >
                  <SelectTrigger className="w-full" id="role">
                    <SelectValue placeholder="Hesap türü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Receiver">Müşteri</SelectItem>
                    <SelectItem value="Provider">İşletme Sahibi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading} className="w-full mt-1">
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Kayıt yapılıyor...
                  </>
                ) : (
                  "Kayıt Ol"
                )}
              </Button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">veya</span>
              <Separator className="flex-1" />
            </div>

            <p className="text-sm text-muted-foreground text-center font-light">
              Zaten hesabınız var mı?{" "}
              <Link
                href="/auth/login"
                className="text-primary font-medium no-underline hover:underline"
              >
                Giriş Yap
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
