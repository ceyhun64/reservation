"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useSignalR } from "@/hooks/use-signalr";
import { toast } from "sonner";

import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Wrench,
  Bell,
  Heart,
  User,
} from "lucide-react";

// ─── Nav definitions ──────────────────────────────────────────
const NAV_ITEMS = {
  Provider: [
    { label: "Panel", href: "/dashboard", icon: LayoutDashboard },
    {
      label: "Randevularım",
      href: "/dashboard/appointments",
      icon: CalendarDays,
    },
    { label: "İşletmelerim", href: "/dashboard/businesses", icon: Building2 },
    { label: "Hizmetlerim", href: "/dashboard/services", icon: Wrench },
    { label: "Bildirimlerim", href: "/dashboard/notifications", icon: Bell },
  ],
  Receiver: [
    { label: "Panel", href: "/dashboard", icon: LayoutDashboard },
    {
      label: "Randevularım",
      href: "/dashboard/appointments",
      icon: CalendarDays,
    },
    { label: "Profilim", href: "/dashboard/profile", icon: User },
    { label: "Favorilerim", href: "/dashboard/favorites", icon: Heart },
    { label: "Bildirimlerim", href: "/dashboard/notifications", icon: Bell },
  ],
} as const;

// ─── BottomBar ────────────────────────────────────────────────
export default function DashboardBottomBar() {
  const { data: session } = useSession();
  const { appointments } = useDashboardStats();
  const pathname = usePathname();

  // ── SignalR: gerçek zamanlı bildirim sayısı + toast ────────
  const { unreadCount, isConnected } = useSignalR({
    onNotification: (payload) => {
      // Kullanıcı zaten bildirimler sayfasındaysa toast gösterme
      if (pathname === "/dashboard/notifications") return;

      toast(payload.title, {
        description: payload.message,
        duration: 5000,
        icon: payload.type === "appointment" ? "📅" : "🔔",
      });
    },
    onAppointmentStatusChanged: (payload) => {
      if (pathname === "/dashboard/notifications") return;

      const emoji =
        {
          Confirmed: "✅",
          Cancelled: "❌",
          Completed: "🎉",
          Pending: "⏳",
        }[payload.newStatus] ?? "🔔";

      toast(`${emoji} Randevu güncellendi`, {
        description: `${payload.serviceName} — ${new Date(
          payload.appointmentDate,
        ).toLocaleString("tr-TR")}`,
        duration: 6000,
      });
    },
  });
  // ──────────────────────────────────────────────────────────

  const role = (session?.user?.role as keyof typeof NAV_ITEMS) ?? "Receiver";
  const navItems = NAV_ITEMS[role] ?? NAV_ITEMS.Receiver;

  const getBadgeCount = (label: string) => {
    if (label === "Bildirimlerim") return unreadCount; // ← SignalR'dan
    if (label === "Randevularım") return appointments; // ← REST'ten
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md">
      <div className="flex items-stretch justify-around max-w-xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const count = getBadgeCount(item.label);
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-3 transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    "size-5 transition-transform",
                    // Bildirim ikonu bağlantı durumuna göre renk alır
                    item.label === "Bildirimlerim" && !isConnected
                      ? "text-muted-foreground/50"
                      : "",
                  )}
                />

                {/* Okunmamış rozet */}
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white ring-2 ring-background">
                    {count > 9 ? "9+" : count}
                  </span>
                )}

                {/* SignalR canlı bağlantı noktası — sadece bildirim ikonunda */}
                {item.label === "Bildirimlerim" && (
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full ring-1 ring-background",
                      isConnected ? "bg-green-400" : "bg-gray-300",
                    )}
                  />
                )}
              </div>

              <span
                className={cn(
                  "text-[10px]",
                  active ? "font-semibold" : "font-medium",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
