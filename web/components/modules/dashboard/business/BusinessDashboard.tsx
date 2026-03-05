"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  getMyBusinesses,
  getMyProvider,
  getProviderAppointments,
  getNotifications,
} from "@/lib/api";
import type {
  BusinessResponseDto,
  AppointmentResponseDto,
  NotificationResponseDto,
  ProviderResponseDto,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  CalendarDays,
  Bell,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  MapPin,
  Plus,
  Activity,
  User,
} from "lucide-react";

const STATUS_CONFIG: Record<
  AppointmentResponseDto["status"],
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  Pending: { label: "Beklemede", variant: "outline" },
  Confirmed: { label: "Onaylandı", variant: "default" },
  Completed: { label: "Tamamlandı", variant: "secondary" },
  Rejected: { label: "Reddedildi", variant: "destructive" },
  CancelledByReceiver: { label: "İptal Edildi", variant: "destructive" },
  NoShow: { label: "Gelmedi", variant: "outline" },
};

export default function BusinessDashboard() {
  const { data: session } = useSession();
  // Provider profili (title, businesses[])
  const [provider, setProvider] = useState<ProviderResponseDto | null>(null);
  // getMyBusinesses: GET /api/businesses/my — sadece bu provider'ın işletmeleri
  const [businesses, setBusinesses] = useState<BusinessResponseDto[]>([]);
  const [appointments, setAppointments] = useState<AppointmentResponseDto[]>(
    [],
  );
  const [notifications, setNotifications] = useState<NotificationResponseDto[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const user = session?.user;
  const initials =
    user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  useEffect(() => {
    if (!session?.token) return;
    Promise.all([
      // Kendi provider profilini al (title, businesses[] için)
      getMyProvider(session.token).catch(() => ({ data: null })),
      // Kendi işletmelerini al (BusinessResponseDto[] — doğrudan dizi)
      getMyBusinesses(session.token).catch(() => ({ data: [] })),
      getProviderAppointments({ pageSize: 10 }, session.token).catch(() => ({
        data: { items: [] },
      })),
      getNotifications(false, session.token).catch(() => ({ data: [] })),
    ])
      .then(([provRes, bizRes, aptRes, notifRes]) => {
        setProvider(provRes.data);
        // getMyBusinesses → ApiResponse<BusinessResponseDto[]> (dizi, items değil)
        setBusinesses(bizRes.data ?? []);
        setAppointments(aptRes.data.items ?? []);
        setNotifications(
          (notifRes.data as NotificationResponseDto[]).slice(0, 5),
        );
      })
      .finally(() => setLoading(false));
  }, [session?.token]);

  if (loading) return <DashboardSkeleton />;

  const stats = {
    total: businesses.length,
    pending: appointments.filter((a) => a.status === "Pending").length,
    confirmed: appointments.filter((a) => a.status === "Confirmed").length,
    unread: notifications.filter((n) => !n.isRead).length,
  };

  const pendingAppointments = appointments
    .filter((a) => a.status === "Pending")
    .slice(0, 3);

  const recentAppointments = appointments
    .filter((a) => a.status === "Confirmed" || a.status === "Completed")
    .slice(0, 3);

  return (
    <div className="min-h-screen space-y-6">
      {/* Hero */}
      <Card className="bg-primary text-primary-foreground border-0">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 flex items-center justify-center text-xl font-bold">
                {initials}
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-primary-foreground/60 mb-1">
                  İşletme Paneli
                </p>
                <h1 className="text-2xl font-bold text-background">
                  Hoş geldin, {user?.name?.split(" ")[0] ?? "Kullanıcı"}
                </h1>
                {/* provider.title — ProviderResponseDto.title */}
                <p className="text-sm text-primary-foreground/50 mt-0.5">
                  {provider?.title ?? user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex divide-x divide-primary-foreground/10">
                {[
                  { label: "İşletme", value: stats.total },
                  { label: "Bekleyen", value: stats.pending },
                  { label: "Onaylanan", value: stats.confirmed },
                ].map((s, i) => (
                  <div key={i} className="px-6 text-center">
                    <p className="text-2xl font-bold text-background">{s.value}</p>
                    <p className="text-xs text-primary-foreground/70 uppercase tracking-wider mt-1">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="secondary"
                asChild
                className="shrink-0"
              >
                <Link href="/dashboard/businesses/new">
                  <Plus className="h-4 w-4 mr-1" />
                  İşletme Ekle
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* İki Kolon */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol */}
        <div className="space-y-6">
          {/* Hesap Bilgileri */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Hesap Bilgileri
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/profile">
                  Düzenle <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  icon: <User className="h-4 w-4" />,
                  label: "Ad Soyad",
                  value: user?.name ?? "—",
                },
                {
                  icon: <span className="text-sm">@</span>,
                  label: "E-posta",
                  value: user?.email ?? "—",
                },
                {
                  icon: <Activity className="h-4 w-4" />,
                  label: "Ünvan",
                  // provider.title — ProviderResponseDto.title
                  value: provider?.title ?? "—",
                },
                {
                  icon: <CheckCircle2 className="h-4 w-4" />,
                  label: "Durum",
                  value: "Aktif",
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2.5"
                >
                  <span className="text-muted-foreground shrink-0">
                    {row.icon}
                  </span>
                  <span className="text-xs text-muted-foreground w-20 shrink-0">
                    {row.label}
                  </span>
                  <span className="text-sm font-medium truncate flex-1">
                    {row.value}
                  </span>
                  {row.label === "Durum" && (
                    <Badge variant="default" className="text-xs">
                      Aktif
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Aktivite Özeti */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Aktivite Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "İşletmelerim",
                    value: stats.total,
                    icon: <Building2 className="h-5 w-5" />,
                  },
                  {
                    label: "Bekleyen",
                    value: stats.pending,
                    icon: <Clock className="h-5 w-5" />,
                  },
                  {
                    label: "Onaylanan",
                    value: stats.confirmed,
                    icon: <CheckCircle2 className="h-5 w-5" />,
                  },
                  {
                    label: "Bildirimler",
                    value: stats.unread,
                    icon: <Bell className="h-5 w-5" />,
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg border bg-card p-4 space-y-2 hover:shadow-sm transition-shadow"
                  >
                    <span className="text-muted-foreground">{s.icon}</span>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* İşletmelerim */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                İşletmelerim
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/businesses">
                  Tümünü Gör <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {businesses.length === 0 ? (
                <EmptySlot
                  icon={<Building2 className="h-6 w-6" />}
                  text="Henüz işletme eklenmemiş"
                  action={{
                    label: "İşletme Ekle",
                    href: "/dashboard/businesses/new",
                  }}
                />
              ) : (
                businesses.slice(0, 3).map((b) => (
                  <Link
                    key={b.id}
                    href={`/dashboard/businesses/${b.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-3 hover:shadow-sm transition-shadow cursor-pointer">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {b.name}
                        </p>
                        {b.city && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-2.5 w-2.5" /> {b.city}
                          </span>
                        )}
                      </div>
                      {b.isVerified && (
                        <Badge variant="default" className="text-xs shrink-0">
                          Onaylı
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sağ */}
        <div className="space-y-6">
          {/* Bekleyen Randevular */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Bekleyen Randevular
                </CardTitle>
                {stats.pending > 0 && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0">
                    {stats.pending}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/appointments?status=Pending">
                  Tümü <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {pendingAppointments.length === 0 ? (
                <EmptySlot
                  icon={<Clock className="h-6 w-6" />}
                  text="Bekleyen randevu yok"
                />
              ) : (
                <div className="space-y-2">
                  {pendingAppointments.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} showReceiver />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Son Randevular */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Son Randevular
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/appointments">
                  Tümü <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentAppointments.length === 0 ? (
                <EmptySlot
                  icon={<CalendarDays className="h-6 w-6" />}
                  text="Henüz randevu bulunmuyor"
                />
              ) : (
                <div className="space-y-2">
                  {recentAppointments.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} showReceiver />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bildirimler */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Bildirimler
                </CardTitle>
                {stats.unread > 0 && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0">
                    {stats.unread}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/notifications">
                  Tümü <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <EmptySlot
                  icon={<Bell className="h-6 w-6" />}
                  text="Yeni bildirim yok"
                />
              ) : (
                <div className="space-y-2">
                  {notifications.map((n, i) => (
                    <div
                      key={n.id ?? i}
                      className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${
                        !n.isRead
                          ? "bg-muted/60 border-border"
                          : "bg-background"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {!n.isRead ? (
                          <AlertCircle className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold mb-0.5">
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {new Date(n.createdAt).toLocaleString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {!n.isRead && (
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hızlı Erişim */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Hızlı Erişim
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "İşletmelerim",
                    href: "/dashboard/businesses",
                    icon: <Building2 className="h-4 w-4" />,
                  },
                  {
                    label: "Tüm Randevular",
                    href: "/dashboard/appointments",
                    icon: <CalendarDays className="h-4 w-4" />,
                  },
                  // NOT: "Çalışanlarım" kaldırıldı — tek provider modeli, ayrı çalışan yok
                  {
                    label: "Hizmetlerim",
                    href: "/dashboard/services",
                    icon: <Activity className="h-4 w-4" />,
                  },
                  {
                    label: "Bildirimler",
                    href: "/dashboard/notifications",
                    icon: <Bell className="h-4 w-4" />,
                  },
                ].map((item, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="justify-start gap-2 h-10"
                    asChild
                  >
                    <Link href={item.href}>
                      {item.icon}
                      <span className="text-xs font-medium">{item.label}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AppointmentRow({
  appointment: a,
  showReceiver = false,
}: {
  appointment: AppointmentResponseDto;
  showReceiver?: boolean;
}) {
  const st = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.Pending;
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {a.serviceName ?? "Hizmet"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {showReceiver && a.receiverName ? `${a.receiverName} · ` : ""}
          {/* businessName — AppointmentResponseDto.businessName */}
          {a.businessName ? `${a.businessName} · ` : ""}
          {new Date(a.startTime).toLocaleString("tr-TR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <Badge variant={st.variant} className="text-xs shrink-0">
        {st.label}
      </Badge>
    </div>
  );
}

function EmptySlot({
  icon,
  text,
  action,
}: {
  icon: React.ReactNode;
  text: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div className="text-muted-foreground/40">{icon}</div>
      <p className="text-xs text-muted-foreground text-center">{text}</p>
      {action && (
        <Button variant="outline" size="sm" asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-6">
        {[220, 180, 200, 220, 180, 200].map((h, i) => (
          <Skeleton key={i} className="rounded-xl" style={{ height: h }} />
        ))}
      </div>
    </div>
  );
}
