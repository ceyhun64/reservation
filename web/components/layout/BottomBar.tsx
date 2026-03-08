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

const NAV_ITEMS = {
  Provider: [
    { label: "Panel", href: "/dashboard", icon: LayoutDashboard },
    {
      label: "Randevular",
      href: "/dashboard/appointments",
      icon: CalendarDays,
    },
    { label: "İşletmeler", href: "/dashboard/businesses", icon: Building2 },
    { label: "Hizmetler", href: "/dashboard/services", icon: Wrench },
    { label: "Bildirimler", href: "/dashboard/notifications", icon: Bell },
  ],
  Receiver: [
    { label: "Panel", href: "/dashboard", icon: LayoutDashboard },
    {
      label: "Randevular",
      href: "/dashboard/appointments",
      icon: CalendarDays,
    },
    { label: "Profil", href: "/dashboard/profile", icon: User },
    { label: "Favoriler", href: "/dashboard/favorites", icon: Heart },
    { label: "Bildirimler", href: "/dashboard/notifications", icon: Bell },
  ],
} as const;

export default function DashboardBottomBar() {
  const { data: session } = useSession();
  const { appointments } = useDashboardStats();
  const pathname = usePathname();

  const { unreadCount, isConnected } = useSignalR({
    onNotification: (payload) => {
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
        { Confirmed: "✅", Cancelled: "❌", Completed: "🎉", Pending: "⏳" }[
          payload.newStatus
        ] ?? "🔔";
      toast(`${emoji} Randevu güncellendi`, {
        description: `${payload.serviceName} — ${new Date(payload.appointmentDate).toLocaleString("tr-TR")}`,
        duration: 6000,
      });
    },
  });

  const role = (session?.user?.role as keyof typeof NAV_ITEMS) ?? "Receiver";
  const navItems = NAV_ITEMS[role] ?? NAV_ITEMS.Receiver;

  const getBadgeCount = (label: string) => {
    if (label === "Bildirimler") return unreadCount;
    if (label === "Randevular") return appointments;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/70 bg-background/98 backdrop-blur-xl">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

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
                "flex flex-col items-center justify-center gap-1 flex-1 py-3 transition-all duration-200",
                "relative group",
                active
                  ? "text-primary"
                  : "text-muted-foreground/80 hover:text-muted-foreground",
              )}
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary rounded-b-full" />
              )}

              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    "size-[18px] transition-all duration-200",
                    active ? "scale-110" : "group-hover:scale-105",
                    item.label === "Bildirimler" && !isConnected
                      ? "opacity-40"
                      : "",
                  )}
                />

                {/* Badge */}
                {count > 0 && (
                  <span className="absolute -top-2 -right-2.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-white ring-[1.5px] ring-background">
                    {count > 9 ? "9+" : count}
                  </span>
                )}

                {/* Connection dot */}
                {item.label === "Bildirimler" && (
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 size-1.5 rounded-full ring-[1.5px] ring-background",
                      isConnected ? "bg-emerald-400" : "bg-muted-foreground/30",
                    )}
                  />
                )}
              </div>

              <span
                className={cn(
                  "text-[9px] uppercase tracking-[0.08em] text-foreground font-medium transition-all duration-200",
                  active ? "opacity-100" : "opacity-60",
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
