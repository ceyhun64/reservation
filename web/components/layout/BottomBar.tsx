"use client";

import { useSession,  } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Wrench,
  Bell,
  Heart,
  User,
} from "lucide-react";

// ─── Nav definitions ─────────────────────────────────────────────────────────

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

const ROLE_LABEL: Record<string, string> = {
  Provider: "İşletme Sahibi",
  Receiver: "Müşteri",
};

// ─── BottomBar ────────────────────────────────────────────────────────────────

export default function DashboardBottomBar() {
  const { data: session } = useSession();
  const { notifications, appointments } = useDashboardStats(); // Verileri al
  const pathname = usePathname();

  const role = (session?.user?.role as keyof typeof NAV_ITEMS) ?? "Receiver";
  const navItems = NAV_ITEMS[role] ?? NAV_ITEMS.Receiver;

  // Sayı eşleştirme fonksiyonu
  const getBadgeCount = (label: string) => {
    if (label === "Bildirimler") return notifications;
    if (label === "Randevular") return appointments;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md">
      <div className="flex items-stretch justify-around max-w-xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const count = getBadgeCount(item.label); // Sayıyı al
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
                <Icon className="size-5" />
                {/* ROZET BURADA: Eğer count 0'dan büyükse göster */}
                {count > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white ring-2 ring-background">
                    {count > 9 ? "9+" : count}
                  </span>
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
