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
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  AppointmentResponseDto["status"],
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    dot: string;
  }
> = {
  Pending: { label: "Beklemede", variant: "outline", dot: "bg-amber-400" },
  Confirmed: { label: "Onaylandı", variant: "default", dot: "bg-emerald-400" },
  Completed: { label: "Tamamlandı", variant: "secondary", dot: "bg-blue-400" },
  Rejected: { label: "Reddedildi", variant: "destructive", dot: "bg-red-400" },
  CancelledByReceiver: {
    label: "İptal Edildi",
    variant: "destructive",
    dot: "bg-red-300",
  },
  NoShow: { label: "Gelmedi", variant: "outline", dot: "bg-gray-400" },
};

export default function BusinessDashboard() {
  const { data: session } = useSession();
  const [provider, setProvider] = useState<ProviderResponseDto | null>(null);
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
      getMyProvider(session.token).catch(() => ({ data: null })),
      getMyBusinesses(session.token).catch(() => ({ data: [] })),
      getProviderAppointments({ pageSize: 10 }, session.token).catch(() => ({
        data: { items: [] },
      })),
      getNotifications(false, session.token).catch(() => ({ data: [] })),
    ])
      .then(([provRes, bizRes, aptRes, notifRes]) => {
        setProvider(provRes.data);
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
    .slice(0, 4);
  const recentAppointments = appointments
    .filter((a) => a.status === "Confirmed" || a.status === "Completed")
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute right-0 top-0 bottom-0 w-72 bg-gradient-to-l from-primary/[0.06] to-transparent pointer-events-none" />

        <div className="relative px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-[16px] font-bold text-primary">
                {initials}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50 mb-0.5 font-medium">
                  İşletme Paneli
                </p>
                <h2 className="text-[20px] font-bold tracking-tight">
                  Hoş geldin, {user?.name?.split(" ")[0] ?? "Kullanıcı"}
                </h2>
                <p className="text-[12px] text-muted-foreground/50 mt-0.5">
                  {provider?.title ?? user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex divide-x divide-border/50">
                {[
                  { label: "İşletme", value: stats.total },
                  { label: "Bekleyen", value: stats.pending },
                  { label: "Onaylanan", value: stats.confirmed },
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
                <Link href="/dashboard/businesses/new">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  İşletme Ekle
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stat mini cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "İşletmelerim",
            value: stats.total,
            icon: Building2,
            href: "/dashboard/businesses",
          },
          {
            label: "Bekleyen",
            value: stats.pending,
            icon: Clock,
            href: "/dashboard/appointments?status=Pending",
            accent: stats.pending > 0,
          },
          {
            label: "Onaylanan",
            value: stats.confirmed,
            icon: CheckCircle2,
            href: "/dashboard/appointments?status=Confirmed",
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
          {/* Account info */}
          <SectionCard
            title="Hesap Bilgileri"
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
                {
                  icon: Activity,
                  label: "Ünvan",
                  value: provider?.title ?? "—",
                },
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

          {/* Businesses */}
          <SectionCard
            title="İşletmelerim"
            badge={businesses.length}
            action={{ label: "Tümünü Gör", href: "/dashboard/businesses" }}
          >
            {businesses.length === 0 ? (
              <EmptySlot
                icon={Building2}
                text="Henüz işletme eklenmemiş"
                action={{
                  label: "İşletme Ekle",
                  href: "/dashboard/businesses/new",
                }}
              />
            ) : (
              <div className="space-y-1.5">
                {businesses.slice(0, 3).map((b) => (
                  <Link
                    key={b.id}
                    href={`/dashboard/businesses/${b.id}`}
                    className="block group"
                  >
                    <div className="flex items-center gap-3 rounded-lg border border-border/40 hover:border-border/70 px-3 py-2.5 transition-all">
                      <div className="size-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-primary/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate">
                          {b.name}
                        </p>
                        {b.city && (
                          <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-2.5 w-2.5" /> {b.city}
                          </span>
                        )}
                      </div>
                      {b.isVerified && (
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/8 border border-emerald-500/20 px-2 py-0.5 rounded shrink-0">
                          Onaylı
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right */}
        <div className="space-y-5">
          {/* Pending appointments */}
          <SectionCard
            title="Bekleyen Randevular"
            badge={stats.pending}
            badgeDestructive
            action={{
              label: "Tümü",
              href: "/dashboard/appointments?status=Pending",
            }}
          >
            {pendingAppointments.length === 0 ? (
              <EmptySlot icon={Clock} text="Bekleyen randevu yok" />
            ) : (
              <div className="space-y-1.5">
                {pendingAppointments.map((a) => (
                  <AppointmentRow key={a.id} appointment={a} showReceiver />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Recent appointments */}
          <SectionCard
            title="Son Randevular"
            action={{ label: "Tümü", href: "/dashboard/appointments" }}
          >
            {recentAppointments.length === 0 ? (
              <EmptySlot icon={CalendarDays} text="Henüz randevu bulunmuyor" />
            ) : (
              <div className="space-y-1.5">
                {recentAppointments.map((a) => (
                  <AppointmentRow key={a.id} appointment={a} showReceiver />
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
                      "flex items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                      !n.isRead
                        ? "border-primary/15 bg-primary/[0.02]"
                        : "border-border/30 bg-transparent",
                    )}
                  >
                    <div className="mt-1 shrink-0">
                      {!n.isRead ? (
                        <span className="size-1.5 rounded-full bg-primary block" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-muted-foreground/20 block" />
                      )}
                    </div>
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
              {
                label: "İşletmelerim",
                href: "/dashboard/businesses",
                icon: Building2,
              },
              {
                label: "Tüm Randevular",
                href: "/dashboard/appointments",
                icon: CalendarDays,
              },
              {
                label: "Hizmetlerim",
                href: "/dashboard/services",
                icon: Activity,
              },
              {
                label: "Bildirimler",
                href: "/dashboard/notifications",
                icon: Bell,
              },
            ].map((item, i) => (
              <Button
                key={i}
                variant="outline"
                className="justify-start gap-2 h-9 border-border/50 hover:border-border/80 text-[11px] uppercase tracking-wider font-medium"
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
  showReceiver = false,
}: {
  appointment: AppointmentResponseDto;
  showReceiver?: boolean;
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
        <p className="text-[11px] text-muted-foreground/50 font-light mt-0.5">
          {showReceiver && a.receiverName ? `${a.receiverName} · ` : ""}
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
        <span className="text-[10px] text-muted-foreground/50 font-medium">
          {st.label}
        </span>
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
