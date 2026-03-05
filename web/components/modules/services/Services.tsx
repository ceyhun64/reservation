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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Building2, ArrowRight } from "lucide-react";
import AppointmentForm from "@/components/modules/appointments/AppointmentForm";

export default function ServicesPage() {
  const { data: session } = useSession();
  const [allServices, setAllServices] = useState<ServiceResponseDto[]>([]);
  const [businesses, setBusinesses] = useState<BusinessResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [businessId, setBusinessId] = useState<string>("all");

  useEffect(() => {
    getBusinesses().then((res) => setBusinesses(res.data.items));
  }, []);

  // API'ye sadece işletme filtresi gider — search client tarafında yapılır
  useEffect(() => {
    setLoading(true);
    getServices({
      businessId: businessId !== "all" ? Number(businessId) : undefined,
    })
      .then((res) => setAllServices(res.data))
      .finally(() => setLoading(false));
  }, [businessId]);

  // Client-side arama filtresi — API çağrısı tetiklenmez
  const services = search.trim()
    ? allServices.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.description?.toLowerCase().includes(search.toLowerCase()) ||
          s.categoryName?.toLowerCase().includes(search.toLowerCase()),
      )
    : allServices;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Header */}
      <div className="border-b px-6 py-16 md:px-16">
        <div className="max-w-6xl mx-auto">
          <Badge variant="outline" className="mb-4">
            Hizmetler
          </Badge>
          <h1 className="mb-3">Tüm Hizmetleri Keşfedin</h1>
          <p className="text-muted-foreground text-sm">
            {loading
              ? "Yükleniyor..."
              : services.length > 0
                ? `${services.length} hizmet listeleniyor`
                : "Arama kriterlerinize uygun hizmet arayın"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-6 py-4 md:px-16">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          <Input
            placeholder="Hizmet ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={businessId} onValueChange={setBusinessId}>
            <SelectTrigger className="w-52">
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
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12 md:px-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-4/5 mb-2" />
                  <Skeleton className="h-4 w-3/5" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-px w-full mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <span className="text-5xl text-muted-foreground/20">◈</span>
            <h3>Hizmet bulunamadı</h3>
            <p className="text-muted-foreground text-sm">
              Farklı arama kriterleri deneyin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <ServiceCard
                key={s.id}
                service={s}
                isLoggedIn={!!session}
                token={session?.token}
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
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-snug">{service.name}</CardTitle>
          {service.categoryName && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {service.categoryName}
            </Badge>
          )}
        </div>
        {service.description && (
          <CardDescription className="line-clamp-2 leading-relaxed">
            {service.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <Separator className="mb-4" />
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3 text-primary" />
              <span>{service.durationMinutes} dk</span>
            </div>
            {service.businessName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="size-3 text-primary" />
                <span className="truncate max-w-36">
                  {service.businessName}
                </span>
              </div>
            )}
          </div>
          <span className="text-xl font-semibold">₺{service.price}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link href={`/services/${service.id}`}>
            İncele <ArrowRight className="size-3.5 ml-1" />
          </Link>
        </Button>

        {isLoggedIn && token ? (
          <div className="flex-1">
            <AppointmentForm serviceId={service.id} />
          </div>
        ) : (
          <Button size="sm" className="flex-1" asChild>
            <Link href="/auth/login">Randevu Al</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
