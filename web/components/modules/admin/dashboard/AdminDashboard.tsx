"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  getBusinesses,
  getProviders,
  getMyAppointments,
  getServices,
  getCategories,
} from "@/lib/api";
import type { AppointmentResponseDto } from "@/types";
import {
  Building2,
  ShieldCheck,
  CalendarDays,
  Wrench,
  Tag,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AdminPageHeader,
  StatCard,
  AppointmentStatusBadge,
  AdminTable,
  Th,
  Td,
  PageLoader,
  EmptyState,
} from "@/components/modules/admin/AdminShared";

export default function AdminDashboard() {
  const { data: session } = useSession();

  const [stats, setStats] = useState({
    businesses: 0,
    providers: 0,
    services: 0,
    categories: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<
    AppointmentResponseDto[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.token) return;
    const token = session.token;

    Promise.allSettled([
      getBusinesses({}, token),
      getProviders({}, token),
      getServices({}, token),
      getCategories(token),
      getMyAppointments({ pageSize: 10 }, token),
    ]).then(([biz, prov, svc, cat, appt]) => {
      setStats({
        businesses:
          biz.status === "fulfilled" ? (biz.value.data.totalCount ?? 0) : 0,
        providers:
          prov.status === "fulfilled" ? (prov.value.data.totalCount ?? 0) : 0,
        services:
          svc.status === "fulfilled"
            ? ((svc.value.data as unknown as AppointmentResponseDto[]).length ??
              0)
            : 0,
        categories: cat.status === "fulfilled" ? cat.value.data.length : 0,
      });
      if (appt.status === "fulfilled") {
        setRecentAppointments(appt.value.data.items ?? []);
      }
      setLoading(false);
    });
  }, [session?.token]);

  if (loading) return <PageLoader />;

  const STATS = [
    {
      label: "İşletmeler",
      value: stats.businesses,
      icon: <Building2 className="size-5" />,
      href: "/admin/businesses",
    },
    {
      label: "Providerlar",
      value: stats.providers,
      icon: <ShieldCheck className="size-5" />,
      href: "/admin/providers",
    },
    {
      label: "Hizmetler",
      value: stats.services,
      icon: <Wrench className="size-5" />,
      href: "/admin/services",
    },
    {
      label: "Kategoriler",
      value: stats.categories,
      icon: <Tag className="size-5" />,
      href: "/admin/categories",
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Genel Bakış"
        description="Sistem özeti ve son aktiviteler."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <Link key={s.label} href={s.href}>
            <StatCard icon={s.icon} label={s.label} value={s.value} />
          </Link>
        ))}
      </div>

      <Separator />

      {/* Recent appointments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Son Randevular</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/appointments">Tümünü Gör</Link>
          </Button>
        </div>

        {recentAppointments.length === 0 ? (
          <EmptyState message="Henüz randevu yok." />
        ) : (
          <AdminTable>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Müşteri</Th>
                <Th>Hizmet</Th>
                <Th>İşletme</Th>
                <Th>Tarih</Th>
                <Th>Durum</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentAppointments.map((a) => (
                <tr key={a.id} className="hover:bg-muted/40 transition-colors">
                  <Td className="text-muted-foreground">#{a.id}</Td>
                  <Td className="font-medium">{a.receiverName ?? "—"}</Td>
                  <Td>{a.serviceName ?? "—"}</Td>
                  <Td className="text-muted-foreground">
                    {a.businessName ?? "—"}
                  </Td>
                  <Td className="text-muted-foreground">
                    {new Date(a.startTime).toLocaleDateString("tr-TR")}
                  </Td>
                  <Td>
                    <AppointmentStatusBadge status={a.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </div>
    </div>
  );
}
