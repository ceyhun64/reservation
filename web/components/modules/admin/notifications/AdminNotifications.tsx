"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api";
import type { NotificationResponseDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Bell } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AdminPageHeader, NotificationTypeBadge, PageLoader, EmptyState } from "@/components/modules/admin/AdminShared";

export default function AdminNotifications() {
  const { data: session } = useSession();
  const [items, setItems] = useState<NotificationResponseDto[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  async function load() {
    if (!session?.token) return;
    setLoading(true);
    try {
      const res = await getNotifications(unreadOnly, session.token);
      setItems(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [session?.token, unreadOnly]);

  async function handleRead(id: number) {
    if (!session?.token) return;
    setMarking(id);
    try {
      await markNotificationRead(id, session.token);
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* ignore */ }
    finally { setMarking(null); }
  }

  async function handleReadAll() {
    if (!session?.token) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(session.token);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("Tüm bildirimler okundu işaretlendi.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Hata.");
    } finally { setMarkingAll(false); }
  }

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bildirimler"
        description={unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Tüm bildirimler okundu"}
        action={
          unreadCount > 0 ? (
            <Button size="sm" variant="outline" onClick={handleReadAll} disabled={markingAll}>
              <CheckCheck className="size-4 mr-1" />
              Tümünü Okundu İşaretle
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-center gap-2">
        <Switch id="unread" checked={unreadOnly} onCheckedChange={setUnreadOnly} />
        <Label htmlFor="unread" className="text-sm">Sadece okunmamışlar</Label>
      </div>

      <Separator />

      {loading ? <PageLoader /> : items.length === 0 ? (
        <EmptyState message={unreadOnly ? "Okunmamış bildirim yok." : "Bildirim yok."} />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border transition-colors",
                !n.isRead && "bg-muted/40",
              )}
            >
              <Bell className={cn("size-4 mt-0.5 shrink-0", n.isRead ? "text-muted-foreground" : "text-primary")} />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{n.title}</p>
                  <NotificationTypeBadge type={n.type} />
                  {!n.isRead && <Badge variant="secondary" className="text-[10px]">Yeni</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString("tr-TR")}
                </p>
              </div>
              {!n.isRead && (
                <Button size="sm" variant="outline" disabled={marking === n.id}
                  onClick={() => handleRead(n.id)}>
                  Okundu
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}