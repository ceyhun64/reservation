"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getServices, getBusinesses } from "@/lib/api";
import type { ServiceResponseDto, BusinessResponseDto } from "@/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  Building2,
  ArrowRight,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
} from "lucide-react";
import AppointmentForm from "@/components/modules/appointments/AppointmentForm";

export default function ServicesPage() {
  const { data: session } = useSession();
  const [allServices, setAllServices] = useState<ServiceResponseDto[]>([]);
  const [businesses, setBusinesses] = useState<BusinessResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [businessId, setBusinessId] = useState<string>("all");

  useEffect(() => {
    // getBusinesses PagedResponse<BusinessResponseDto> döndürür → .data.items
    getBusinesses()
      .then((res) => setBusinesses(res.data.items ?? []))
      .catch(() => setBusinesses([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    getServices({
      businessId: businessId !== "all" ? Number(businessId) : undefined,
    })
      // getServices ApiResponse<ServiceResponseDto[]> döndürür → .data
      .then((res) => setAllServices(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAllServices([]))
      .finally(() => setLoading(false));
  }, [businessId]);

  const services = search.trim()
    ? allServices.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.description?.toLowerCase().includes(search.toLowerCase()) ||
          s.categoryName?.toLowerCase().includes(search.toLowerCase()),
      )
    : allServices;

  // token güvenli erişim
  const token = session?.token ?? undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-border/60">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-primary/[0.05] to-transparent pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 md:px-14 py-16">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/45 font-medium mb-3">
            — Rezervo Platform
          </p>
          <h1 className="text-[40px] md:text-[52px] font-bold tracking-tight leading-[1.05] mb-4">
            Tüm Hizmetleri <span className="text-primary">Keşfedin</span>
          </h1>
          <p className="text-[13px] text-muted-foreground/55 font-light max-w-lg">
            {loading
              ? "Hizmetler yükleniyor..."
              : `${services.length} hizmet listeleniyor — randevu almak için bir hizmet seçin.`}
          </p>
        </div>
      </div>

      {/* Sticky Filters */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 md:px-14 py-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/35" />
              <Input
                placeholder="Hizmet ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-[12px] border-border/50 bg-background"
              />
            </div>
            <Select value={businessId} onValueChange={setBusinessId}>
              <SelectTrigger className="w-48 h-8 text-[12px] border-border/50">
                <SlidersHorizontal className="h-3 w-3 mr-1.5 text-muted-foreground/40" />
                <SelectValue placeholder="İşletme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm İşletmeler</SelectItem>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || businessId !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[11px] uppercase tracking-wider text-muted-foreground/50"
                onClick={() => {
                  setSearch("");
                  setBusinessId("all");
                }}
              >
                Temizle
              </Button>
            )}
            <span className="text-[10px] text-muted-foreground/30 uppercase tracking-wider ml-auto hidden sm:block">
              {services.length} sonuç
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 md:px-14 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3 text-center">
            <span className="text-[48px] text-muted-foreground/10 select-none">
              ◈
            </span>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/40 font-medium">
              Hizmet Bulunamadı
            </p>
            <p className="text-[12px] text-muted-foreground/40 font-light max-w-xs">
              Farklı arama kriterleri deneyin veya filtreleri temizleyin.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[11px] uppercase tracking-wider border-border/50 mt-2"
              onClick={() => {
                setSearch("");
                setBusinessId("all");
              }}
            >
              Filtreleri Temizle
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                isLoggedIn={!!session}
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
  isLoggedIn: boolean;
  token?: string;
}) {
  return (
    <Card className="group flex flex-col border-border/50 hover:border-border/80 hover:shadow-md hover:shadow-black/5 transition-all duration-200 rounded-xl overflow-hidden">
      {/* Top accent */}
      <div className="h-[2px] w-full bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />

      <CardContent className="p-5 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {service.categoryName && (
              <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-primary/60 block mb-1">
                {service.categoryName}
              </span>
            )}
            <h3 className="text-[14px] font-bold leading-tight tracking-tight line-clamp-2">
              {service.name}
            </h3>
          </div>
          <span className="text-[18px] font-bold tracking-tighter text-primary shrink-0">
            ₺{service.price}
          </span>
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-[11px] text-muted-foreground/55 font-light leading-relaxed line-clamp-2 flex-1">
            {service.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1 border-t border-border/30">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
            <Clock className="size-3 text-primary/40" />
            <span>{service.durationMinutes} dk</span>
          </div>
          {service.businessName && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 min-w-0">
              <Building2 className="size-3 text-primary/40 shrink-0" />
              <span className="truncate max-w-[120px]">
                {service.businessName}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-0.5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 border-border/50 text-[11px] uppercase tracking-wider font-medium hover:border-border/80"
            asChild
          >
            <Link href={`/services/${service.id}`}>
              İncele <ArrowRight className="size-3 ml-1.5" />
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
              <Link href="/auth/login">
                Randevu Al
                <ArrowUpRight className="size-3 ml-1.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
