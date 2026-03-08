"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getServiceById } from "@/lib/api";
import type { ServiceResponseDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Tag,
  Building2,
  User,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import AppointmentForm from "@/components/modules/appointments/AppointmentForm";

interface Props {
  serviceId: number;
}

export default function ServiceDetail({ serviceId }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [service, setService] = useState<ServiceResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId || isNaN(serviceId)) {
      setLoading(false);
      return;
    }
    getServiceById(serviceId)
      .then((res) => setService(res.data))
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [serviceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border/60 px-6 py-4 md:px-14">
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="border-b border-border/60 px-6 py-12 md:px-14">
          <div className="max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-3/5" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 md:px-14 py-10 space-y-4">
          <Skeleton className="h-28 rounded-xl" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 text-center">
        <span className="text-[48px] text-primary/10 select-none">◈</span>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 font-medium">
          Hizmet Bulunamadı
        </p>
        <Button
          variant="outline"
          className="h-8 text-[11px] uppercase tracking-wider border-border/50"
          onClick={() => router.back()}
        >
          Geri Dön
        </Button>
      </div>
    );
  }

  // session.token null olabilir, güvenli erişim
  const token = session?.token ?? undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Back nav */}
      <div className="border-b border-border/50 px-6 py-3 md:px-14">
        <div className="max-w-4xl mx-auto flex items-center gap-1 text-[11px] text-muted-foreground/40">
          <Link
            href="/services"
            className="hover:text-foreground transition-colors uppercase tracking-wider"
          >
            Hizmetler
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground/60 uppercase tracking-wider truncate max-w-xs">
            {service.name}
          </span>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/60">
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-primary/[0.05] to-transparent pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 md:px-14 py-12">
          <div className="flex items-center gap-2 flex-wrap mb-5">
            {service.categoryName && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] bg-primary/8 border border-primary/15 text-primary/70 px-2.5 py-1 rounded">
                {service.categoryName}
              </span>
            )}
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] bg-emerald-500/8 border border-emerald-500/15 text-emerald-600 px-2.5 py-1 rounded">
              Aktif
            </span>
          </div>

          <h1 className="text-[32px] md:text-[42px] font-bold tracking-tight leading-tight mb-3">
            {service.name}
          </h1>

          {service.description && (
            <p className="text-[13px] text-muted-foreground/55 font-light leading-relaxed max-w-xl mb-5">
              {service.description}
            </p>
          )}

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/55">
              <Clock className="size-3.5 text-primary/50" />
              <span>{service.durationMinutes} dakika</span>
            </div>
            {service.businessName && (
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/55">
                <Building2 className="size-3.5 text-primary/50" />
                <span>{service.businessName}</span>
              </div>
            )}
            {service.providerName && (
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/55">
                <User className="size-3.5 text-primary/50" />
                <span>{service.providerName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-6 md:px-14 py-10 flex flex-col gap-6">
        {/* Price + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-border/60 bg-card p-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/40 mb-1.5 font-medium">
              Hizmet Ücreti
            </p>
            <p className="text-[42px] font-bold tracking-tighter leading-none">
              ₺{service.price}
            </p>
            <p className="text-[11px] text-muted-foreground/40 mt-1.5">
              Tek seans · {service.durationMinutes} dakika
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:min-w-52">
            {token ? (
              <AppointmentForm serviceId={service.id} />
            ) : (
              <Button
                className="h-10 text-[11px] uppercase tracking-wider font-medium"
                asChild
              >
                <Link href="/auth/login">
                  <CalendarDays className="size-4 mr-2" />
                  Randevu Al
                </Link>
              </Button>
            )}
            <p className="text-[10px] text-muted-foreground/35 text-center font-light">
              Ücretsiz iptal · Online randevu
            </p>
          </div>
        </div>

        {/* Detail cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: Tag,
              label: "Kategori",
              value: service.categoryName ?? "—",
            },
            {
              icon: Clock,
              label: "Süre",
              value: `${service.durationMinutes} dk`,
            },
            {
              icon: Building2,
              label: "İşletme",
              value: service.businessName ?? "—",
            },
            { icon: User, label: "Uzman", value: service.providerName ?? "—" },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-4"
            >
              <item.icon className="size-4 text-muted-foreground/30 mb-2.5" />
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/40 font-medium mb-1">
                {item.label}
              </p>
              <p className="text-[13px] font-semibold truncate">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Highlights */}
        <div className="rounded-xl border border-border/50 bg-muted/20 p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/40 font-medium mb-4">
            Bu Hizmet Hakkında
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              "Online randevu alma imkânı",
              "Uzman profesyonel kadro",
              "Ücretsiz iptal politikası",
              "Hızlı onay süreci",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                <span className="text-[12px] text-muted-foreground/60 font-light">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Business links */}
        {service.businessId && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-border/50 text-[11px] uppercase tracking-wider font-medium hover:border-border/80"
              asChild
            >
              <Link href={`/businesses/${service.businessId}`}>
                <Building2 className="size-3.5 mr-1.5" />
                İşletmeyi Görüntüle
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[11px] uppercase tracking-wider text-muted-foreground/50 hover:text-foreground"
              asChild
            >
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
