"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getServiceById } from "@/lib/api";
import type { ServiceResponseDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Clock,
  Tag,
  Building2,
  User,
  CalendarDays,
} from "lucide-react";
import AppointmentForm from "@/components/modules/appointments/AppointmentForm";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  serviceId: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ServiceDetail({ serviceId }: Props) {
  const router = useRouter();
  const { data: session } = useSession();

  const [service, setService] = useState<ServiceResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Fetch ───────────────────────────────────────────────────────────────

  useEffect(() => {
    getServiceById(serviceId)
      .then((res) => setService(res.data))
      .finally(() => setLoading(false));
  }, [serviceId]);

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-3/5" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  // ─── Not found ────────────────────────────────────────────────────────────

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
        <span className="text-4xl text-primary/20 select-none">◈</span>
        <p className="text-sm text-muted-foreground">Hizmet bulunamadı.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Geri Dön
        </Button>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Back nav */}
      <div className="border-b px-6 py-4 md:px-16">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="size-4" /> Geri
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="border-b px-6 py-12 md:px-16">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {service.categoryName && (
              <Badge variant="outline" className="text-xs">
                {service.categoryName}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              Aktif
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
          {service.description && (
            <p className="text-muted-foreground leading-relaxed max-w-xl">
              {service.description}
            </p>
          )}

          {/* Key info row */}
          <div className="flex flex-wrap gap-5 pt-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="size-4 text-primary" />
              {service.durationMinutes} dakika
            </div>
            {service.businessName && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="size-4 text-primary" />
                {service.businessName}
              </div>
            )}
            {service.providerName && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="size-4 text-primary" />
                {service.providerName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-10 md:px-16 flex flex-col gap-8">
        {/* Price + Appointment CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 border rounded-lg bg-muted/30">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
              Fiyat
            </p>
            <p className="text-3xl font-bold">₺{service.price}</p>
          </div>

          <div className="sm:min-w-44">
            {session?.token ? (
              <AppointmentForm serviceId={service.id} />
            ) : (
              <Button className="w-full" asChild>
                <Link href="/auth/login">
                  <CalendarDays className="size-4 mr-2" />
                  Randevu Al
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: <Tag className="size-4 text-primary" />,
              label: "Kategori",
              value: service.categoryName ?? "—",
            },
            {
              icon: <Clock className="size-4 text-primary" />,
              label: "Süre",
              value: `${service.durationMinutes} dk`,
            },
            {
              icon: <Building2 className="size-4 text-primary" />,
              label: "İşletme",
              value: service.businessName ?? "—",
            },
            {
              icon: <User className="size-4 text-primary" />,
              label: "Uzman",
              value: service.providerName ?? "—",
            },
          ].map((item, i) => (
            <Card key={i} className="rounded-md">
              <CardContent className="pt-3 pb-3 flex flex-col gap-1.5">
                {item.icon}
                <p className="text-[11px] text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-sm font-semibold truncate">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        {/* Business link */}
        {service.businessId && (
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/businesses/${service.businessId}`}>
                <Building2 className="size-3.5 mr-1" />
                İşletmeyi Görüntüle
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/services?businessId=${service.businessId}`}>
                Diğer Hizmetler
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
