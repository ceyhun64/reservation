"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getMyAppointments, getNotifications } from "@/lib/api";
import type { AppointmentResponseDto, NotificationResponseDto } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  CalendarDays,
  Bell,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Star,
  MapPin,
  Scissors,
  Building2,
  Activity,
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

const MOCK_FAVOURITES = [
  {
    id: 1,
    name: "Prestige Barber Studio",
    category: "Erkek Kuaförü",
    rating: 4.9,
    city: "İstanbul",
  },
  {
    id: 2,
    name: "Lumière Beauty",
    category: "Güzellik Salonu",
    rating: 4.7,
    city: "Ankara",
  },
  {
    id: 3,
    name: "Form Fitness Club",
    category: "Spor Merkezi",
    rating: 4.8,
    city: "İzmir",
  },
];

export default function ReceiverDashboard() {
  const { data: session } = useSession();
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
      getMyAppointments({ pageSize: 10 }, session.token),
      getNotifications(false, session.token).catch(() => ({ data: [] })),
    ])
      .then(([apptRes, notifRes]) => {
        setAppointments(apptRes.data.items ?? []);
        setNotifications(
          (notifRes.data as NotificationResponseDto[]).slice(0, 5),
        );
      })
      .finally(() => setLoading(false));
  }, [session]);

  const stats = {
    total: appointments.length,
    upcoming: appointments.filter(
      (a) => a.status === "Confirmed" || a.status === "Pending",
    ).length,
    completed: appointments.filter((a) => a.status === "Completed").length,
    unread: notifications.filter((n) => !n.isRead).length,
  };

  const upcomingAppointments = appointments
    .filter((a) => a.status === "Confirmed" || a.status === "Pending")
    .slice(0, 3);

  const recentAppointments = appointments
    .filter((a) => a.status === "Completed")
    .slice(0, 3);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-muted/40 p-6 space-y-6">
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
                  Müşteri Paneli
                </p>
                <h1 className="text-2xl text-background font-bold">
                  Hoş geldin, {user?.name?.split(" ")[0] ?? "Kullanıcı"}
                </h1>
                <p className="text-sm text-primary-foreground/50 mt-0.5">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex divide-x divide-primary-foreground/10">
              {[
                { label: "Toplam", value: stats.total },
                { label: "Yaklaşan", value: stats.upcoming },
                { label: "Tamamlanan", value: stats.completed },
              ].map((s, i) => (
                <div key={i} className="px-6 text-center">
                  <p className="text-2xl text-background font-bold">{s.value}</p>
                  <p className="text-xs text-primary-foreground/80 uppercase tracking-wider mt-1">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* İki Kolon */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol */}
        <div className="space-y-6">
          {/* Kişisel Bilgiler */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Kişisel Bilgiler
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
                  label: "Rol",
                  value: "Müşteri",
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

          {/* Aktivite */}
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
                    label: "Toplam Randevu",
                    value: stats.total,
                    icon: <CalendarDays className="h-5 w-5" />,
                  },
                  {
                    label: "Yaklaşan",
                    value: stats.upcoming,
                    icon: <Clock className="h-5 w-5" />,
                  },
                  {
                    label: "Tamamlanan",
                    value: stats.completed,
                    icon: <CheckCircle2 className="h-5 w-5" />,
                  },
                  {
                    label: "Okunmamış",
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

          {/* Favori İşletmeler */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Favori İşletmeler
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/businesses">
                  Tümünü Gör <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {MOCK_FAVOURITES.map((fav) => (
                <Link
                  key={fav.id}
                  href={`/businesses/${fav.id}`}
                  className="block"
                >
                  <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-3 hover:shadow-sm transition-shadow cursor-pointer">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Scissors className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {fav.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {fav.category}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" /> {fav.city}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      <span className="text-xs font-semibold">
                        {fav.rating}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sağ */}
        <div className="space-y-6">
          {/* Yaklaşan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Yaklaşan Randevular
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/appointments">
                  Tümü <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <EmptySlot
                  icon={<CalendarDays className="h-6 w-6" />}
                  text="Yaklaşan randevunuz bulunmuyor"
                  action={{ label: "Randevu Al", href: "/businesses" }}
                />
              ) : (
                <div className="space-y-2">
                  {upcomingAppointments.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tamamlananlar */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Son Tamamlananlar
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/appointments?status=Completed">
                  Tümü <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentAppointments.length === 0 ? (
                <EmptySlot
                  icon={<CheckCircle2 className="h-6 w-6" />}
                  text="Henüz tamamlanan randevu yok"
                />
              ) : (
                <div className="space-y-2">
                  {recentAppointments.map((a) => (
                    <AppointmentRow key={a.id} appointment={a} />
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
                      <div className="mt-0.5 shrink-0 text-muted-foreground">
                        {!n.isRead ? (
                          <AlertCircle className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Bell className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {n.title && (
                          <p className="text-xs font-semibold mb-0.5">
                            {n.title}
                          </p>
                        )}
                        {n.message && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {n.message}
                          </p>
                        )}
                        {n.createdAt && (
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {new Date(n.createdAt).toLocaleString("tr-TR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
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
                    label: "İşletme Keşfet",
                    href: "/businesses",
                    icon: <Building2 className="h-4 w-4" />,
                  },
                  {
                    label: "Tüm Randevular",
                    href: "/dashboard/appointments",
                    icon: <CalendarDays className="h-4 w-4" />,
                  },
                  {
                    label: "Bildirimler",
                    href: "/dashboard/notifications",
                    icon: <Bell className="h-4 w-4" />,
                  },
                  {
                    label: "Profilim",
                    href: "/dashboard/profile",
                    icon: <User className="h-4 w-4" />,
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

function AppointmentRow({
  appointment: a,
}: {
  appointment: AppointmentResponseDto;
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
