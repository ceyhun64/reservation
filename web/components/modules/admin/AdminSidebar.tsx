"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarDays,
  Star,
  Tag,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Bell,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NAV = [
  {
    id: "dashboard",
    label: "Genel Bakış",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    id: "businesses",
    label: "İşletmeler",
    icon: Building2,
    href: "/admin/businesses",
  },
  {
    id: "providers",
    label: "Providerlar",
    icon: ShieldCheck,
    href: "/admin/providers",
  },
  { id: "users", label: "Kullanıcılar", icon: Users, href: "/admin/users" },
  {
    id: "appointments",
    label: "Randevular",
    icon: CalendarDays,
    href: "/admin/appointments",
  },
  { id: "services", label: "Hizmetler", icon: Wrench, href: "/admin/services" },
  {
    id: "categories",
    label: "Kategoriler",
    icon: Tag,
    href: "/admin/categories",
  },
  {
    id: "reviews",
    label: "Değerlendirmeler",
    icon: Star,
    href: "/admin/reviews",
  },
  {
    id: "notifications",
    label: "Bildirimler",
    icon: Bell,
    href: "/admin/notifications",
  },
] as const;

export default function AdminSidebar() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await signOut({ redirect: false });
    toast.success("Çıkış yapıldı.");
    router.push("/admin");
  }

  const Content = (
    <div className="flex flex-col h-full border-r bg-background">
      <div className="h-16 flex items-center px-6 border-b gap-2">
        <ShieldCheck className="size-5 text-primary" />
        <span className="font-bold tracking-tight">Admin Panel</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV.map(({ id, label, icon: Icon, href }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={id}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="p-3">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          Çıkış Yap
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </Button>
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col">
        {Content}
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            className="fixed inset-y-0 left-0 w-64 flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {Content}
          </aside>
        </div>
      )}
    </>
  );
}
