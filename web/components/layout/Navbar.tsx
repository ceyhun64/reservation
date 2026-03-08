"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
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
  ArrowUpRight,
} from "lucide-react";

const NAV_LINKS = [
  { label: "İşletmeler", href: "/businesses" },
  { label: "Hizmetler", href: "/services" },
  { label: "Nasıl Çalışır?", href: "/#how" },
];

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
          "transition-all duration-300",
          scrolled
            ? "border-b border-border/80 bg-background/98 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.5)]"
            : "border-b border-transparent bg-transparent",
        )}
      >
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5 shrink-0">
          <div className="flex size-7 items-center justify-center border border-primary/60 text-primary text-[11px] transition-all duration-500 group-hover:rotate-[135deg] group-hover:border-primary group-hover:bg-primary/5">
            ◈
          </div>
          <span className="font-bold text-[15px] tracking-tight">Rezervo</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-[11px] font-medium uppercase tracking-[0.12em] transition-all duration-200 relative py-1",
                "after:absolute after:bottom-0 after:left-0 after:h-px after:bg-primary after:transition-all after:duration-200",
                isActive(link.href)
                  ? "text-foreground after:w-full"
                  : "text-muted-foreground hover:text-foreground after:w-0 hover:after:w-full",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2.5">
          {session ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-[11px] font-medium uppercase tracking-wider h-8 px-3"
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="size-3.5 mr-1.5" />
                  Panel
                </Link>
              </Button>

              <div className="w-px h-4 bg-border" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 pl-1.5 pr-2.5 h-8 border-border/70 hover:border-border"
                  >
                    <Avatar className="size-5">
                      <AvatarFallback className="bg-primary text-primary-foreground text-[9px] font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[12px] font-medium">
                      {name.split(" ")[0]}
                    </span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-52 border-border/80"
                >
                  <DropdownMenuLabel className="font-normal py-2.5">
                    <p className="font-semibold text-[13px]">{name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {session.user?.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/profile"
                      className="cursor-pointer text-[12px]"
                    >
                      <User className="size-3.5" />
                      Profilim
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/appointments"
                      className="cursor-pointer text-[12px]"
                    >
                      <Calendar className="size-3.5" />
                      Randevularım
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/settings"
                      className="cursor-pointer text-[12px]"
                    >
                      <Settings className="size-3.5" />
                      Ayarlar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer text-[12px]"
                  >
                    <LogOut className="size-3.5" />
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-[11px] font-medium uppercase tracking-wider h-8 px-3 text-muted-foreground hover:text-foreground"
              >
                <Link href="/auth/login">Giriş Yap</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="text-[11px] font-medium uppercase tracking-wider h-8 px-4"
              >
                <Link href="/auth/register">
                  Ücretsiz Başla
                  <ArrowUpRight className="size-3 ml-1" />
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden size-8">
              <Menu className="size-4" />
              <span className="sr-only">Menüyü Aç</span>
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-72 p-0 border-border/80">
            <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border/60">
              <div className="flex size-6 items-center justify-center border border-primary/60 text-primary text-[10px]">
                ◈
              </div>
              <span className="font-bold text-[15px] tracking-tight">
                Rezervo
              </span>
            </div>

            <div className="flex flex-col px-3 py-4 gap-0.5">
              {NAV_LINKS.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center rounded px-3 py-2.5 text-[11px] font-medium uppercase tracking-widest transition-colors",
                      isActive(link.href)
                        ? "bg-primary/8 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}

              <div className="h-px bg-border/60 my-3 mx-1" />

              {session ? (
                <>
                  <div className="flex items-center gap-3 rounded bg-muted/50 px-3 py-2.5 mb-1">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold truncate">
                        {name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
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
                        className="flex items-center gap-3 rounded px-3 py-2.5 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Icon className="size-3.5" />
                        {label}
                      </Link>
                    </SheetClose>
                  ))}

                  <div className="h-px bg-border/60 my-3 mx-1" />

                  <SheetClose asChild>
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-3 rounded px-3 py-2.5 text-[12px] font-medium text-destructive hover:bg-destructive/8 transition-colors w-full text-left"
                    >
                      <LogOut className="size-3.5" />
                      Çıkış Yap
                    </button>
                  </SheetClose>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-1 px-1">
                  <SheetClose asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full text-[11px] uppercase tracking-wider"
                    >
                      <Link href="/auth/login">Giriş Yap</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      size="sm"
                      asChild
                      className="w-full text-[11px] uppercase tracking-wider"
                    >
                      <Link href="/auth/register">Ücretsiz Başla</Link>
                    </Button>
                  </SheetClose>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>

      <div className="h-14" aria-hidden />
    </>
  );
}
