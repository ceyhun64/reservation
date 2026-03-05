// web/components/layout/NotificationBell.tsx


"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { useSignalR, type NotificationPayload } from "@/hooks/use-signalr";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ─── Notification item ────────────────────────────────────────
function NotificationItem({ notification }: { notification: NotificationPayload }) {
  const typeColor = {
    appointment: "bg-blue-50 border-blue-200",
    review: "bg-yellow-50 border-yellow-200",
    system: "bg-gray-50 border-gray-200",
  }[notification.type];

  return (
    <div
      className={cn(
        "p-3 rounded-lg border text-sm mb-2 transition-opacity",
        typeColor,
        notification.isRead && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-gray-900">{notification.title}</p>
        {!notification.isRead && (
          <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
        )}
      </div>
      <p className="text-gray-600 mt-0.5 leading-snug">{notification.message}</p>
      <p className="text-gray-400 text-xs mt-1">
        {new Date(notification.createdAt).toLocaleString("tr-TR")}
      </p>
    </div>
  );
}

// ─── Bell component ───────────────────────────────────────────
export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const [open, setOpen] = useState(false);

  const { isConnected, unreadCount } = useSignalR({
    onNotification: (payload) => {
      // Add to local list
      setNotifications((prev) => [payload, ...prev].slice(0, 20)); // keep last 20

      // Show toast popup
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
        description: `${payload.serviceName} — ${new Date(
          payload.appointmentDate
        ).toLocaleString("tr-TR")}`,
        duration: 6000,
      });
    },
  });

  // Mark all as read when popover opens
  const handleOpen = (value: boolean) => {
    setOpen(value);
    if (value) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
          <Bell
            className={cn(
              "w-5 h-5",
              isConnected ? "text-gray-700" : "text-gray-400"
            )}
          />

          {/* Unread badge */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}

          {/* Connection indicator dot */}
          <span
            className={cn(
              "absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full",
              isConnected ? "bg-green-400" : "bg-gray-300"
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-3" align="end">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Bildirimler</h3>
          <span className="text-xs text-gray-400">
            {isConnected ? "🟢 Canlı" : "🔴 Bağlantı yok"}
          </span>
        </div>

        {notifications.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            Henüz bildirim yok
          </p>
        ) : (
          <ScrollArea className="h-72">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}