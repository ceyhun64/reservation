"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getBusinessById, getServices } from "@/lib/api";
import type { BusinessResponseDto, ServiceResponseDto } from "@/types";
import AppointmentForm from "@/components/modules/appointments/AppointmentForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Phone,
  Clock,
  User,
  Mail,
  CheckCircle2,
  Building2,
  ArrowRight,
  Tag,
} from "lucide-react";
import Link from "next/link";

export default function BusinessDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [business, setBusiness] = useState<BusinessResponseDto | null>(null);
  const [services, setServices] = useState<ServiceResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = rawId ? Number(rawId) : NaN;

  useEffect(() => {
    if (!id || isNaN(id)) return;
    Promise.all([getBusinessById(id), getServices({ businessId: id })])
      .then(([bRes, sRes]) => {
        setBusiness(bRes.data);
        setServices(Array.isArray(sRes.data) ? sRes.data : []);
      })
      .catch(() => {
        setBusiness(null);
        setServices([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border/50 px-6 py-16 md:px-16">
          <div className="max-w-5xl mx-auto space-y-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-11 w-2/5" />
            <Skeleton className="h-4 w-3/5" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-12 md:px-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Building2 className="size-10 text-muted-foreground/15" />
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/40 font-medium">
          İşletme Bulunamadı
        </p>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[11px] uppercase tracking-wider border-border/50"
          asChild
        >
          <Link href="/businesses">Geri Dön</Link>
        </Button>
      </div>
    );
  }

  const isLoggedIn = !!session;
  const token = session?.token ?? undefined;

  const metaItems = [
    business.address && {
      icon: <MapPin className="size-3.5" />,
      value: business.address,
    },
    business.city && {
      icon: <MapPin className="size-3.5 opacity-0" />,
      value: business.city,
      city: true,
    },
    business.phone && {
      icon: <Phone className="size-3.5" />,
      value: business.phone,
    },
    business.email && {
      icon: <Mail className="size-3.5" />,
      value: business.email,
    },
    business.providerName && {
      icon: <User className="size-3.5" />,
      value: business.providerName,
    },
  ].filter(Boolean) as {
    icon: React.ReactNode;
    value: string;
    city?: boolean;
  }[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Hero ── */}
      <div className="relative border-b border-border/50 overflow-hidden">
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.018] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* glow */}
        <div className="absolute right-0 top-0 bottom-0 w-[480px] bg-gradient-to-l from-primary/[0.06] to-transparent pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 md:px-16 py-16">
          {/* Verified badge */}
          <div className="flex items-center gap-2 mb-5">
            {business.isVerified ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-600 bg-emerald-500/8 border border-emerald-500/20 px-2.5 py-1 rounded">
                <CheckCircle2 className="size-3" />
                Onaylı İşletme
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50 bg-muted/40 border border-border/50 px-2.5 py-1 rounded">
                <Building2 className="size-3" />
                İşletme
              </span>
            )}
          </div>

          <h1 className="text-[36px] md:text-[48px] font-bold tracking-tight leading-[1.08] mb-4">
            {business.name}
          </h1>

          {business.description && (
            <p className="text-[13px] text-muted-foreground/60 font-light leading-relaxed max-w-2xl mb-8">
              {business.description}
            </p>
          )}

          {/* Meta pills */}
          <div className="flex flex-wrap gap-2">
            {metaItems.map((item, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 text-[11px] text-muted-foreground/60 bg-muted/30 border border-border/40 px-3 py-1.5 rounded-full"
              >
                <span className="text-primary/50">{item.icon}</span>
                {item.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Services ── */}
      <div className="max-w-5xl mx-auto px-6 md:px-16 py-14">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 font-semibold mb-1.5">
              — Hizmetler
            </p>
            <h2 className="text-[22px] font-bold tracking-tight">
              Sunulan Hizmetler
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground/35 uppercase tracking-wider hidden sm:block">
            {services.length} hizmet
          </span>
        </div>

        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-border/40 rounded-2xl">
            <span className="text-[40px] text-muted-foreground/10 select-none">
              ◈
            </span>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/35 font-medium">
              Henüz Hizmet Yok
            </p>
            <p className="text-[12px] text-muted-foreground/40 font-light">
              Bu işletmede henüz hizmet tanımlanmamış.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isLoggedIn={isLoggedIn}
                token={token}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  isLoggedIn,
  token,
}: {
  service: ServiceResponseDto;
  token?: string;
  isLoggedIn: boolean;
}) {
  return (
    <div className="group flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden hover:border-border/80 hover:shadow-lg hover:shadow-black/5 transition-all duration-200">
      {/* Top accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-primary/40 via-primary/15 to-transparent" />

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {service.categoryName && (
              <div className="flex items-center gap-1 mb-1.5">
                <Tag className="size-2.5 text-primary/50" />
                <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-primary/60">
                  {service.categoryName}
                </span>
              </div>
            )}
            <h3 className="text-[15px] font-bold tracking-tight leading-snug line-clamp-2">
              {service.name}
            </h3>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[22px] font-bold tracking-tighter text-foreground leading-none">
              ₺{service.price}
            </span>
          </div>
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-[11px] text-muted-foreground/55 font-light leading-relaxed line-clamp-2 flex-1">
            {service.description}
          </p>
        )}

        {/* Duration */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-border/30">
          <Clock className="size-3 text-primary/40" />
          <span className="text-[11px] text-muted-foreground/50">
            {service.durationMinutes} dakika
          </span>
        </div>

        {/* CTA */}
        <div className="flex gap-2 pt-0.5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 border-border/50 text-[11px] uppercase tracking-wider font-medium hover:border-border/80"
            asChild
          >
            <Link href={`/services/${service.id}`}>
              İncele
              <ArrowRight className="size-3 ml-1.5" />
            </Link>
          </Button>

          {isLoggedIn && token ? (
            <div className="flex-1">
              <AppointmentForm serviceId={service.id} />
            </div>
          ) : (
            <Button
              size="sm"
              className="flex-1 h-8 text-[11px] uppercase tracking-wider font-medium"
              asChild
            >
              <Link href="/auth/login">Randevu Al</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
