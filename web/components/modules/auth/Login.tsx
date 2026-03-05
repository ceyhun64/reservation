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
import { AlertCircle, Loader2 } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Email veya şifre hatalı.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
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
              — Hoş Geldiniz
            </p>
            <h1 className="text-3xl">Giriş Yap</h1>
            <p className="text-sm text-muted-foreground font-light">
              Hesabınıza erişmek için bilgilerinizi girin.
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

              <Button type="submit" disabled={loading} className="w-full mt-1">
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
        </Card>
      </div>
    </div>
  );
}
