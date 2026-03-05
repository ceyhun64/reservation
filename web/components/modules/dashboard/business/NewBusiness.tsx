"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createBusiness } from "@/lib/api/businesses.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import type { BusinessDto } from "@/types/index";

const DEFAULT_FORM: BusinessDto = {
  name: "",
  description: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  website: "",
};

type FormErrors = Partial<Record<keyof BusinessDto, string>>;

function validate(form: BusinessDto): FormErrors {
  const errs: FormErrors = {};
  if (!form.name.trim()) errs.name = "İşletme adı zorunludur.";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errs.email = "Geçerli bir e-posta adresi girin.";
  if (form.website && !/^https?:\/\/.+/.test(form.website))
    errs.website = "Web sitesi http:// veya https:// ile başlamalıdır.";
  return errs;
}

export default function CreateBusiness() {
  const { data: session } = useSession();
  const router = useRouter();
  const [form, setForm] = useState<BusinessDto>(DEFAULT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof BusinessDto]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!session?.token) {
      toast.error("Oturum açmanız gerekiyor.");
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    try {
      const res = await createBusiness(form, session.token); // ← session.token
      if (res.success) {
        toast.success("İşletme başarıyla oluşturuldu.");
        router.push(`/dashboard/businesses/${res.data.id}`);
      } else {
        toast.error(res.message ?? "Bir hata oluştu.");
      }
    } catch {
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container max-w-2xl py-10 mx-auto">
      {/* Sayfa Başlığı */}
      <div className="mb-8 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Yeni İşletme
            </h1>
            <p className="text-sm text-muted-foreground">
              İşletmenizi platforma ekleyin
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-6">
          {/* Temel Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Temel Bilgiler</CardTitle>
              <CardDescription>İşletmenizin adı ve açıklaması</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  İşletme Adı <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Örn. Güzellik Salonu Ayşe"
                  value={form.name}
                  onChange={handleChange}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="İşletmeniz hakkında kısa bir açıklama yazın..."
                  rows={4}
                  value={form.description ?? ""}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* İletişim Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">İletişim Bilgileri</CardTitle>
              <CardDescription>
                Müşterilerinizin size ulaşabileceği bilgiler
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="ornek@mail.com"
                    value={form.email ?? ""}
                    onChange={handleChange}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+90 555 000 00 00"
                    value={form.phone ?? ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Web Sitesi</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://www.isletmeniz.com"
                  value={form.website ?? ""}
                  onChange={handleChange}
                  aria-invalid={!!errors.website}
                />
                {errors.website && (
                  <p className="text-sm text-destructive">{errors.website}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Konum */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Konum</CardTitle>
              <CardDescription>
                İşletmenizin bulunduğu adres bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="city">Şehir</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="İstanbul"
                  value={form.city ?? ""}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="Mahalle, cadde, sokak, bina no..."
                  rows={3}
                  value={form.address ?? ""}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Aksiyon Butonları */}
          <Separator />
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Oluşturuluyor..." : "İşletmeyi Oluştur"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
