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
  Star,
  MapPin,
  Scissors,
  Building2,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  AppointmentResponseDto["status"],
  { label: string; dot: string }
> = {
  Pending: { label: "Beklemede", dot: "bg-amber-400" },
  Confirmed: { label: "Onaylandı", dot: "bg-emerald-400" },
  Completed: { label: "Tamamlandı", dot: "bg-blue-400" },
  Rejected: { label: "Reddedildi", dot: "bg-red-400" },
  CancelledByReceiver: { label: "İptal Edildi", dot: "bg-red-300" },
  NoShow: { label: "Gelmedi", dot: "bg-gray-400" },
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
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-primary/[0.05] to-transparent pointer-events-none" />

        <div className="relative px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[16px] font-bold text-primary">
                {initials}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50 mb-0.5 font-medium">
                  Müşteri Paneli
                </p>
                <h2 className="text-[20px] font-bold tracking-tight">
                  Hoş geldin, {user?.name?.split(" ")[0] ?? "Kullanıcı"}
                </h2>
                <p className="text-[12px] text-muted-foreground/50 mt-0.5">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex divide-x divide-border/50">
                {[
                  { label: "Toplam", value: stats.total },
                  { label: "Yaklaşan", value: stats.upcoming },
                  { label: "Tamamlanan", value: stats.completed },
                ].map((s, i) => (
                  <div key={i} className="px-5 text-center">
                    <p className="text-[28px] font-bold tracking-tighter leading-none">
                      {s.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mt-1">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                asChild
                className="h-8 text-[11px] uppercase tracking-wider shrink-0"
              >
                <Link href="/businesses">
                  Randevu Al
                  <ArrowUpRight className="h-3 w-3 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Toplam Randevu",
            value: stats.total,
            icon: CalendarDays,
            href: "/dashboard/appointments",
          },
          {
            label: "Yaklaşan",
            value: stats.upcoming,
            icon: Clock,
            href: "/dashboard/appointments",
            accent: stats.upcoming > 0,
          },
          {
            label: "Tamamlanan",
            value: stats.completed,
            icon: CheckCircle2,
            href: "/dashboard/appointments?status=Completed",
          },
          {
            label: "Okunmamış",
            value: stats.unread,
            icon: Bell,
            href: "/dashboard/notifications",
            accent: stats.unread > 0,
          },
        ].map((s, i) => (
          <Link key={i} href={s.href} className="block group">
            <Card
              className={cn(
                "border-border/50 hover:border-border/90 transition-all duration-200 hover:shadow-sm hover:shadow-black/5",
                s.accent && "border-primary/20 bg-primary/[0.02]",
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <s.icon
                    className={cn(
                      "h-4 w-4",
                      s.accent ? "text-primary" : "text-muted-foreground/40",
                    )}
                  />
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
                </div>
                <p
                  className={cn(
                    "text-[30px] font-bold tracking-tighter leading-none",
                    s.accent && "text-primary",
                  )}
                >
                  {s.value}
                </p>
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mt-1.5">
                  {s.label}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left */}
        <div className="space-y-5">
          {/* Personal info */}
          <SectionCard
            title="Kişisel Bilgiler"
            action={{ label: "Düzenle", href: "/dashboard/profile" }}
          >
            <div className="space-y-1.5">
              {[
                { icon: User, label: "Ad Soyad", value: user?.name ?? "—" },
                {
                  icon: () => <span className="text-[11px]">@</span>,
                  label: "E-posta",
                  value: user?.email ?? "—",
                },
                { icon: Activity, label: "Rol", value: "Müşteri" },
                {
                  icon: CheckCircle2,
                  label: "Durum",
                  value: "Aktif",
                  badge: true,
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5"
                >
                  <row.icon className="size-3.5 text-muted-foreground/40 shrink-0" />
                  <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider w-16 shrink-0">
                    {row.label}
                  </span>
                  <span className="text-[12px] font-medium truncate flex-1">
                    {row.value}
                  </span>
                  {row.badge && (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/8 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Aktif
                    </span>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Favorites */}
          <SectionCard
            title="Favori İşletmeler"
            action={{ label: "Keşfet", href: "/businesses" }}
          >
            <div className="space-y-1.5">
              {MOCK_FAVOURITES.map((fav) => (
                <Link
                  key={fav.id}
                  href={`/businesses/${fav.id}`}
                  className="block group"
                >
                  <div className="flex items-center gap-3 rounded-lg border border-border/40 hover:border-border/70 px-3 py-2.5 transition-all">
                    <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                      <Scissors className="h-3.5 w-3.5 text-primary/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold truncate">
                        {fav.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground/50">
                          {fav.category}
                        </span>
                        <span className="text-muted-foreground/30 text-[10px]">
                          ·
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5" /> {fav.city}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-[11px] font-semibold">
                        {fav.rating}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right */}
        <div className="space-y-5">
          {/* Upcoming */}
          <SectionCard
            title="Yaklaşan Randevular"
            badge={stats.upcoming}
            action={{ label: "Tümü", href: "/dashboard/appointments" }}
          >
            {upcomingAppointments.length === 0 ? (
              <EmptySlot
                icon={CalendarDays}
                text="Yaklaşan randevunuz bulunmuyor"
                action={{ label: "Randevu Al", href: "/businesses" }}
              />
            ) : (
              <div className="space-y-1.5">
                {upcomingAppointments.map((a) => (
                  <AppointmentRow key={a.id} appointment={a} />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Completed */}
          <SectionCard
            title="Son Tamamlananlar"
            action={{
              label: "Tümü",
              href: "/dashboard/appointments?status=Completed",
            }}
          >
            {recentAppointments.length === 0 ? (
              <EmptySlot
                icon={CheckCircle2}
                text="Henüz tamamlanan randevu yok"
              />
            ) : (
              <div className="space-y-1.5">
                {recentAppointments.map((a) => (
                  <AppointmentRow key={a.id} appointment={a} />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Notifications */}
          <SectionCard
            title="Bildirimler"
            badge={stats.unread}
            badgeDestructive
            action={{ label: "Tümü", href: "/dashboard/notifications" }}
          >
            {notifications.length === 0 ? (
              <EmptySlot icon={Bell} text="Yeni bildirim yok" />
            ) : (
              <div className="space-y-1.5">
                {notifications.map((n, i) => (
                  <div
                    key={n.id ?? i}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border px-3 py-2.5",
                      !n.isRead
                        ? "border-primary/15 bg-primary/[0.02]"
                        : "border-border/30",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 rounded-full shrink-0",
                        !n.isRead ? "bg-primary" : "bg-muted-foreground/20",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold truncate">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground/50 line-clamp-1 font-light">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/35 mt-0.5 font-mono">
                        {new Date(n.createdAt).toLocaleString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Quick access */}
      <Card className="border-border/50">
        <CardHeader className="pb-3 pt-4">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
            Hızlı Erişim
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "İşletme Keşfet", href: "/businesses", icon: Building2 },
              {
                label: "Tüm Randevular",
                href: "/dashboard/appointments",
                icon: CalendarDays,
              },
              {
                label: "Bildirimler",
                href: "/dashboard/notifications",
                icon: Bell,
              },
              { label: "Profilim", href: "/dashboard/profile", icon: User },
            ].map((item, i) => (
              <Button
                key={i}
                variant="outline"
                className="justify-start gap-2 h-9 border-border/50 text-[11px] uppercase tracking-wider font-medium"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground/50" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  badge,
  badgeDestructive,
  action,
  children,
}: {
  title: string;
  badge?: number;
  badgeDestructive?: boolean;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">
            {title}
          </CardTitle>
          {badge !== undefined && badge > 0 && (
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                badgeDestructive
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-primary/10 text-primary border border-primary/20",
              )}
            >
              {badge}
            </span>
          )}
        </div>
        {action && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-7 px-2 text-[11px] text-muted-foreground/50 hover:text-foreground uppercase tracking-wider"
          >
            <Link href={action.href}>
              {action.label} <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="pb-4">{children}</CardContent>
    </Card>
  );
}

function AppointmentRow({
  appointment: a,
}: {
  appointment: AppointmentResponseDto;
}) {
  const st = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.Pending;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/30 hover:border-border/60 px-3 py-2.5 transition-colors">
      <div className="size-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/40" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold truncate">
          {a.serviceName ?? "Hizmet"}
        </p>
        <p className="text-[11px] text-muted-foreground/50 font-light">
          {new Date(a.startTime).toLocaleString("tr-TR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`size-1.5 rounded-full ${st.dot}`} />
        <span className="text-[10px] text-muted-foreground/50">{st.label}</span>
      </div>
    </div>
  );
}

function EmptySlot({
  icon: Icon,
  text,
  action,
}: {
  icon: React.ElementType;
  text: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2.5">
      <Icon className="h-5 w-5 text-muted-foreground/15" />
      <p className="text-[11px] text-muted-foreground/40 text-center font-light">
        {text}
      </p>
      {action && (
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-7 text-[11px] uppercase tracking-wider border-border/50 mt-1"
        >
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5">
        {[200, 260, 240, 200].map((h, i) => (
          <Skeleton key={i} className="rounded-xl" style={{ height: h }} />
        ))}
      </div>
    </div>
  );
}
