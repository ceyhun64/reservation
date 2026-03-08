"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createBusiness } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "../DashboardShared";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  MapPin,
  Phone,
  Globe,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  icon: React.ElementType;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  span?: boolean;
}

const FIELDS: FieldProps[] = [
  {
    id: "name",
    name: "name",
    label: "İşletme Adı",
    placeholder: "Örn: Prestige Barber Studio",
    icon: Building2,
    required: true,
  },
  {
    id: "city",
    name: "city",
    label: "Şehir",
    placeholder: "İstanbul",
    icon: MapPin,
  },
  {
    id: "address",
    name: "address",
    label: "Adres",
    placeholder: "Mahalle, Sokak, No...",
    icon: MapPin,
    span: true,
  },
  {
    id: "phone",
    name: "phone",
    label: "Telefon",
    placeholder: "+90 555 000 00 00",
    icon: Phone,
  },
  {
    id: "website",
    name: "website",
    label: "Web Sitesi",
    placeholder: "https://",
    icon: Globe,
  },
  {
    id: "description",
    name: "description",
    label: "Açıklama",
    placeholder: "İşletmenizi kısaca tanıtın...",
    icon: FileText,
    textarea: true,
    span: true,
  },
];

export default function CreateBusiness() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.token) return;

    setError(null);
    const formData = new FormData(e.currentTarget);

    const payload = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      city: (formData.get("city") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      website: (formData.get("website") as string) || undefined,
    };

    setLoading(true);
    try {
      const res = await createBusiness(payload, session.token);
      if (res.success) {
        setSuccess(true);
        setTimeout(
          () => router.push(`/dashboard/businesses/${res.data.id}`),
          1500,
        );
      } else {
        setError("İşletme oluşturulamadı. Lütfen tekrar deneyin.");
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader
        tag="İşletme Yönetimi"
        title="Yeni İşletme Oluştur"
        description="İşletmenizin temel bilgilerini girerek platforma ekleyin."
      />

      {success ? (
        <Card className="border-emerald-500/20 bg-emerald-500/[0.03]">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-emerald-700">
                İşletme başarıyla oluşturuldu!
              </p>
              <p className="text-[12px] text-emerald-600/70 font-light mt-0.5">
                İşletme sayfanıza yönlendiriliyorsunuz...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FIELDS.map((field) => (
                  <div
                    key={field.id}
                    className={cn("space-y-1.5", field.span && "sm:col-span-2")}
                  >
                    <Label
                      htmlFor={field.id}
                      className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-medium flex items-center gap-1.5"
                    >
                      <field.icon className="size-3 text-muted-foreground/30" />
                      {field.label}
                      {field.required && (
                        <span className="text-primary">*</span>
                      )}
                    </Label>

                    {field.textarea ? (
                      <Textarea
                        id={field.id}
                        name={field.name}
                        placeholder={field.placeholder}
                        rows={3}
                        className="text-[13px] border-border/50 focus:border-primary/40 bg-background resize-none"
                      />
                    ) : (
                      <Input
                        id={field.id}
                        name={field.name}
                        type={field.type ?? "text"}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="h-9 text-[13px] border-border/50 focus:border-primary/40 bg-background"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
                  <AlertCircle className="size-4 text-destructive shrink-0" />
                  <p className="text-[12px] text-destructive font-light">
                    {error}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 text-[11px] uppercase tracking-wider border-border/50"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-9 text-[11px] uppercase tracking-[0.12em] font-semibold flex-1 sm:flex-none sm:min-w-44"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Building2 className="size-3.5 mr-1.5" />
                      İşletme Oluştur
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
