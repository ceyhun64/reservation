// web/components/layout/NotificationBell.tsx
"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useSignalR, type NotificationPayload } from "@/hooks/use-signalr";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function NotificationItem({
  notification,
}: {
  notification: NotificationPayload;
}) {
  const typeColors = {
    appointment: "border-blue-500/20 bg-blue-500/[0.04]",
    review: "border-amber-500/20 bg-amber-500/[0.04]",
    system: "border-border/40 bg-muted/20",
  };

  const color =
    typeColors[notification.type as keyof typeof typeColors] ??
    typeColors.system;

  return (
    <div
      className={cn(
        "p-3 rounded-lg border text-[12px] mb-1.5 transition-opacity",
        color,
        notification.isRead && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-[12px] leading-tight">
          {notification.title}
        </p>
        {!notification.isRead && (
          <span className="size-1.5 rounded-full bg-primary mt-0.5 flex-shrink-0" />
        )}
      </div>
      <p className="text-muted-foreground/60 mt-1 leading-snug font-light text-[11px]">
        {notification.message}
      </p>
      <p className="text-muted-foreground/40 text-[10px] mt-1.5 font-mono">
        {new Date(notification.createdAt).toLocaleString("tr-TR")}
      </p>
    </div>
  );
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [open, setOpen] = useState(false);

  const { isConnected, unreadCount } = useSignalR({
    onNotification: (payload) => {
      setNotifications((prev) => [payload, ...prev].slice(0, 20));
      toast(payload.title, {
        description: payload.message,
        duration: 5000,
        icon: payload.type === "appointment" ? "📅" : "🔔",
      });
    },
    onAppointmentStatusChanged: (payload) => {
      const statusEmoji = {
        Confirmed: "✅",
        Cancelled: "❌",
        Completed: "🎉",
        Pending: "⏳",
      }[payload.newStatus];
      toast(`${statusEmoji} Randevu ${payload.newStatus}`, {
        description: `${payload.serviceName} — ${new Date(payload.appointmentDate).toLocaleString("tr-TR")}`,
        duration: 6000,
      });
    },
  });

  const handleOpen = (value: boolean) => {
    setOpen(value);
    if (value) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <Bell
            className={cn(
              "w-[18px] h-[18px]",
              isConnected ? "" : "text-muted-foreground",
            )}
          />

          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-white ring-[1.5px] ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}

          <span
            className={cn(
              "absolute bottom-1.5 right-1.5 size-1.5 rounded-full",
              isConnected ? "bg-emerald-400" : "bg-muted-foreground/20",
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 border-border/70" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h3 className="font-medium text-foreground text-[13px] tracking-tight">
            Bildirimler
          </h3>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-1.5 rounded-full",
                isConnected ? "bg-emerald-400" : "bg-muted-foreground/30",
              )}
            />
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
              {isConnected ? "Canlı" : "Çevrimdışı"}
            </span>
          </div>
        </div>

        <div className="p-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Bell className="size-6 text-muted-foreground/20" />
              <p className="text-[12px] text-muted-foreground/40 font-light">
                Henüz bildirim yok
              </p>
            </div>
          ) : (
            <ScrollArea className="h-72">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
