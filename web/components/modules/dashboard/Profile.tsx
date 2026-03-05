"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader, InfoRow } from "@/components/modules/dashboard/DashboardShared";

const ROLE_LABEL: Record<string, string> = {
  Provider: "İşletme Sahibi",
  Receiver: "Müşteri",
  Admin: "Yönetici",
};

// İsimden baş harfleri çıkaran yardımcı fonksiyonu dışarı aldık
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
  // İsmi daha genel yaptık
  const { data: session, status } = useSession();

  // Yükleme durumu kontrolü
  if (status === "loading") return <div>Yükleniyor...</div>;
  if (!session) return <div>Lütfen giriş yapın.</div>;

  const user = session.user;
  const role = user?.role ?? "Receiver";
  const initials = getInitials(user?.name);

  return (
    <div className="flex flex-col gap-8">
      {/* Başlığı role göre dinamik yapabilirsin */}
      <PageHeader
        tag={role === "Provider" ? "İşletme Yönetimi" : "Hesabım"}
        title="Profilim"
      />

      <Card className="rounded-lg max-w-xl border-border/50 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-4 pb-4">
          <Avatar className="size-14 ring-2 ring-primary/5">
            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1.5">
            <CardTitle className="text-base leading-tight">
              {user?.name}
            </CardTitle>
            <Badge
              variant={role === "Provider" ? "default" : "secondary"}
              className="w-fit text-[10px] px-2 py-0.5"
            >
              {ROLE_LABEL[role] ?? role}
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="flex flex-col gap-3 pt-5 pb-5">
          {user?.email && <InfoRow icon="@" text={user.email} muted />}

          <div className="pt-2 pb-1">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
              Hesap Bilgileri
            </p>
            <Separator />
          </div>

          <InfoRow icon="◉" text={`Rol: ${ROLE_LABEL[role] ?? role}`} muted />

          {/* Provider'a özel ekstra bir bilgi göstermek istersen: */}
          {role === "Provider" && (
            <InfoRow icon="★" text="Onaylı İşletme Hesabı" muted />
          )}

          <div className="flex items-center gap-2.5 mt-1">
            <span className="text-[11px] text-primary">◎</span>
            <span className="text-xs text-muted-foreground font-light">
              Durum:
            </span>
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 border-green-500 text-green-600"
            >
              Aktif
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
