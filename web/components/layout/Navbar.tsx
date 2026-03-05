"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Menu,
  LogOut,
  User,
  Calendar,
  Settings,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";

// ─── Nav links ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "İşletmeler", href: "/businesses" },
  { label: "Hizmetler", href: "/services" },
  { label: "Nasıl Çalışır?", href: "/#how" },
];

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => pathname === href;

  const name = session?.user?.name ?? "";
  const initials =
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 h-14 px-6 md:px-10",
          "flex items-center justify-between",
          "transition-all duration-200",
          scrolled
            ? "border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm"
            : "border-b border-transparent bg-transparent",
        )}
      >
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5 shrink-0">
          <div className="flex size-7 items-center justify-center border border-primary text-primary text-sm transition-transform duration-300 group-hover:rotate-45">
            ◈
          </div>
          <span className="font-bold text-base tracking-tight">Rezervo</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-xs font-medium uppercase tracking-widest transition-colors",
                isActive(link.href)
                  ? "text-primary border-b border-primary pb-0.5"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2">
          {session ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="size-3.5 mr-1.5" />
                  Panel
                </Link>
              </Button>

              <Separator orientation="vertical" className="h-4" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 pl-2 pr-3"
                  >
                    <Avatar className="size-6">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{name.split(" ")[0]}</span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal">
                    <p className="font-medium text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {session.user?.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer">
                      <User className="size-4" />
                      Profilim
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/appointments"
                      className="cursor-pointer"
                    >
                      <Calendar className="size-4" />
                      Randevularım
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                      <Settings className="size-4" />
                      Ayarlar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Giriş Yap</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/register">Ücretsiz Başla</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger — Sheet kullan */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Menüyü Aç</span>
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-72 p-0">
            {/* Sheet Header */}
            <div className="flex items-center gap-2.5 px-5 h-14 border-b">
              <div className="flex size-6 items-center justify-center border border-primary text-primary text-xs">
                ◈
              </div>
              <span className="font-bold text-base tracking-tight">
                Rezervo
              </span>
            </div>

            <div className="flex flex-col px-4 py-5 gap-1">
              {/* Nav links */}
              {NAV_LINKS.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive(link.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}

              <Separator className="my-3" />

              {/* Auth */}
              {session ? (
                <>
                  {/* Kullanıcı bilgisi */}
                  <div className="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-2.5 mb-2">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>

                  {[
                    {
                      icon: LayoutDashboard,
                      label: "Panel",
                      href: "/dashboard",
                    },
                    {
                      icon: Calendar,
                      label: "Randevularım",
                      href: "/dashboard/appointments",
                    },
                    {
                      icon: User,
                      label: "Profilim",
                      href: "/dashboard/profile",
                    },
                    {
                      icon: Settings,
                      label: "Ayarlar",
                      href: "/dashboard/settings",
                    },
                  ].map(({ icon: Icon, label, href }) => (
                    <SheetClose asChild key={href}>
                      <Link
                        href={href}
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <Icon className="size-4" />
                        {label}
                      </Link>
                    </SheetClose>
                  ))}

                  <Separator className="my-3" />

                  <SheetClose asChild>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                    >
                      <LogOut className="size-4" />
                      Çıkış Yap
                    </button>
                  </SheetClose>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <SheetClose asChild>
                    <Button variant="outline" asChild>
                      <Link href="/auth/login">Giriş Yap</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild>
                      <Link href="/auth/register">Ücretsiz Başla</Link>
                    </Button>
                  </SheetClose>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>

      {/* Spacer — nav yüksekliği kadar */}
      <div className="h-14" aria-hidden />
    </>
  );
}
