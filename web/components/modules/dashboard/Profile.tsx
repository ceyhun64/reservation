"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/modules/dashboard/DashboardShared";
import {
  Shield,
  Mail,
  User,
  Briefcase,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  Provider: "İşletme Sahibi",
  Receiver: "Müşteri",
  Admin: "Yönetici",
};

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export default function UserProfile() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-2">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className="size-1.5 rounded-full bg-primary animate-pulse"
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <span className="text-[40px] text-primary/15 select-none">◈</span>
        <p className="text-[12px] text-muted-foreground/50 uppercase tracking-wider">
          Lütfen giriş yapın.
        </p>
      </div>
    );
  }

  const user = session.user;
  const role = user?.role ?? "Receiver";
  const initials = getInitials(user?.name);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        tag={role === "Provider" ? "İşletme Yönetimi" : "Hesabım"}
        title="Profilim"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Avatar card */}
        <Card className="border-border/50 lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center gap-4">
            <div className="relative">
              <Avatar className="size-20 ring-4 ring-border/40">
                <AvatarFallback className="text-[22px] font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Online dot */}
              <span className="absolute bottom-1 right-1 size-3 rounded-full bg-emerald-400 ring-2 ring-background" />
            </div>

            <div>
              <h3 className="text-[15px] font-bold tracking-tight">
                {user?.name ?? "—"}
              </h3>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                {user?.email}
              </p>
            </div>

            <div
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg border",
                role === "Provider"
                  ? "bg-primary/8 border-primary/20 text-primary"
                  : role === "Admin"
                    ? "bg-amber-500/8 border-amber-500/20 text-amber-600"
                    : "bg-emerald-500/8 border-emerald-500/20 text-emerald-600",
              )}
            >
              {ROLE_LABEL[role] ?? role}
            </div>

            <div className="w-full pt-2 border-t border-border/40">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span className="font-medium">Hesap Aktif</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info card */}
        <Card className="border-border/50 lg:col-span-2">
          <CardContent className="p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/45 mb-4">
              Hesap Bilgileri
            </p>

            <div className="space-y-2">
              {[
                {
                  icon: User,
                  label: "Ad Soyad",
                  value: user?.name ?? "—",
                },
                {
                  icon: Mail,
                  label: "E-posta",
                  value: user?.email ?? "—",
                },
                {
                  icon: Shield,
                  label: "Rol",
                  value: ROLE_LABEL[role] ?? role,
                },
                {
                  icon: Briefcase,
                  label: "Hesap Türü",
                  value:
                    role === "Provider" ? "İşletme Hesabı" : "Bireysel Hesap",
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
                  className="flex items-center gap-4 rounded-lg bg-muted/25 border border-border/30 px-4 py-3"
                >
                  <row.icon className="size-4 text-muted-foreground/30 shrink-0" />
                  <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider w-20 shrink-0 font-medium">
                    {row.label}
                  </span>
                  <span className="text-[13px] font-medium flex-1 truncate">
                    {row.badge ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 text-[11px] font-semibold bg-emerald-500/8 border border-emerald-500/20 px-2 py-0.5 rounded">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        {row.value}
                      </span>
                    ) : (
                      row.value
                    )}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider extra card */}
      {role === "Provider" && (
        <Card className="border-primary/15 bg-primary/[0.02]">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="size-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Shield className="size-4 text-primary/70" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary/70 mb-0.5">
                Onaylı İşletme Hesabı
              </p>
              <p className="text-[12px] text-muted-foreground/55 font-light">
                Hesabınız işletme yönetimi için aktif edilmiştir.
                İşletmelerinizi, hizmetlerinizi ve randevularınızı
                yönetebilirsiniz.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
