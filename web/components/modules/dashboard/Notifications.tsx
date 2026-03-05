"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api";
// NotificationResponseDto — types/index.ts'ten
// type: "Info" | "Success" | "Warning" | "Error"  (önceki local Notification interface'i kaldırıldı)
import type { NotificationResponseDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, CheckCheck } from "lucide-react";
import { LoadingDots, EmptyState, PageHeader } from "./DashboardShared";

const TYPE_VARIANT: Record<
  NotificationResponseDto["type"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  Success: "default",
  Info: "secondary",
  Warning: "outline",
  Error: "destructive",
};

export default function NotificationsModule() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationResponseDto[]>(
    [],
  );
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!session?.token) return;
    setLoading(true);
    // getNotifications → ApiResponse<NotificationResponseDto[]>
    getNotifications(unreadOnly, session.token)
      .then((res) => setNotifications(res.data))
      .finally(() => setLoading(false));
  }, [session, unreadOnly]);

  async function handleMarkRead(id: number) {
    if (!session?.token) return;
    await markNotificationRead(id, session.token);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }

  async function handleMarkAll() {
    if (!session?.token) return;
    setMarkingAll(true);
    await markAllNotificationsRead(session.token);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setMarkingAll(false);
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) return <LoadingDots />;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        tag="Bildirimler"
        title="Bildirimlerim"
        action={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="unread-only"
                checked={unreadOnly}
                onCheckedChange={setUnreadOnly}
              />
              <Label
                htmlFor="unread-only"
                className="text-xs text-muted-foreground"
              >
                Sadece okunmamış
              </Label>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAll}
                disabled={markingAll}
              >
                <CheckCheck className="size-4 mr-1" />
                Tümünü Okundu Say
              </Button>
            )}
          </div>
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="Bildirim Yok"
          description={
            unreadOnly
              ? "Okunmamış bildirim yok."
              : "Henüz bildiriminiz bulunmuyor."
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={[
                "rounded-md transition-colors",
                !n.isRead ? "border-primary/30 bg-primary/5" : "",
              ].join(" ")}
            >
              <CardContent className="flex items-start gap-4 py-4">
                <div className="shrink-0 mt-0.5">
                  <Bell
                    className={[
                      "size-4",
                      !n.isRead ? "text-primary" : "text-muted-foreground",
                    ].join(" ")}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {/* title — NotificationResponseDto.title (zorunlu alan) */}
                  <p className="text-sm font-medium leading-tight mb-0.5">
                    {n.title}
                  </p>
                  {/* message — NotificationResponseDto.message (zorunlu alan) */}
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleString("tr-TR")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* type — "Info" | "Success" | "Warning" | "Error" */}
                  <Badge
                    variant={TYPE_VARIANT[n.type] ?? "secondary"}
                    className="text-[10px]"
                  >
                    {n.type}
                  </Badge>
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => handleMarkRead(n.id)}
                    >
                      Okundu
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
