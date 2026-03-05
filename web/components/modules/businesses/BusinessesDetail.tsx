"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getBusinessById, getServices } from "@/lib/api";
import type { BusinessResponseDto, ServiceResponseDto } from "@/types";
import AppointmentForm from "@/components/modules/appointments/AppointmentForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, Clock, User } from "lucide-react";

export default function BusinessDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [business, setBusiness] = useState<BusinessResponseDto | null>(null);
  const [services, setServices] = useState<ServiceResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const id = Number(params?.id);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getBusinessById(id),
      // getServices: businessId filtresiyle bu işletmenin hizmetleri
      getServices({ businessId: id }),
    ])
      .then(([bRes, sRes]) => {
        setBusiness(bRes.data);
        setServices(sRes.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-6 py-20 md:px-16">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-12 w-3/5" />
          <Skeleton className="h-5 w-2/5" />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">İşletme bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="relative border-b px-6 py-16 md:px-16 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none">
          <div className="size-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto">
          <Badge
            variant="outline"
            className="mb-4 uppercase tracking-widest text-xs"
          >
            {business.isVerified ? "Onaylı İşletme" : "İşletme"}
          </Badge>

          <h1 className="mb-5">{business.name}</h1>

          {business.description && (
            <p className="text-muted-foreground leading-relaxed max-w-xl mb-8 font-light">
              {business.description}
            </p>
          )}

          <div className="flex flex-wrap gap-5">
            {business.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0 text-primary" />
                {business.address}
              </div>
            )}
            {business.city && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-primary text-xs">◎</span>
                {business.city}
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-4 shrink-0 text-primary" />
                {business.phone}
              </div>
            )}
            {business.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-primary text-xs">@</span>
                {business.email}
              </div>
            )}
            {/* providerName — BusinessResponseDto.providerName (eski: ownerName) */}
            {business.providerName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="size-4 shrink-0 text-primary" />
                {business.providerName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="max-w-4xl mx-auto px-6 py-14 md:px-16">
        <div className="mb-10">
          <Badge
            variant="outline"
            className="mb-3 uppercase tracking-widest text-xs"
          >
            Hizmetler
          </Badge>
          <h2>Sunulan Hizmetler</h2>
        </div>

        {services.length === 0 ? (
          <div className="py-16 text-center border border-dashed rounded-lg">
            <span className="text-4xl text-muted-foreground/20 block mb-4">
              ◈
            </span>
            <p className="text-muted-foreground text-sm">
              Bu işletmede henüz hizmet tanımlanmamış.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                token={session?.token}
                isLoggedIn={!!session}
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
  token,
  isLoggedIn,
}: {
  service: ServiceResponseDto;
  token?: string;
  isLoggedIn: boolean;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-1">
        <CardTitle className="text-lg">{service.name}</CardTitle>
        {service.description && (
          <CardDescription className="leading-relaxed">
            {service.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <Separator className="mb-4" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-3.5 text-primary" />
            <span>{service.durationMinutes} dk</span>
          </div>
          {/* service.price — ServiceResponseDto.price */}
          <span className="text-xl font-semibold text-foreground">
            ₺{service.price}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        {isLoggedIn && token ? (
          <AppointmentForm serviceId={service.id} />
        ) : (
          <Button asChild className="w-full">
            <a href="/auth/login">Randevu Al</a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
