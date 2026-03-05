// web/hooks/use-signalr.ts
// npm install @microsoft/signalr  ← önce bunu çalıştır

"use client";

import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types (backend'deki record'larla eşleşmeli) ──────────────
export interface NotificationPayload {
  id: number;
  title: string;
  message: string;
  type: "appointment" | "review" | "system";
  isRead: boolean;
  createdAt: string;
}

export interface AppointmentStatusPayload {
  appointmentId: number;
  newStatus: "Pending" | "Confirmed" | "Cancelled" | "Completed";
  serviceName: string;
  appointmentDate: string;
}

interface UseSignalROptions {
  onNotification?: (payload: NotificationPayload) => void;
  onAppointmentStatusChanged?: (payload: AppointmentStatusPayload) => void;
  onUnreadCountUpdated?: (count: number) => void;
}

interface UseSignalRReturn {
  isConnected: boolean;
  connectionState: HubConnectionState | null;
  unreadCount: number;
}

const HUB_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") + "/hubs/notifications";

// ─── Hook ─────────────────────────────────────────────────────
export function useSignalR(options: UseSignalROptions = {}): UseSignalRReturn {
  const { data: session } = useSession();
  const connectionRef = useRef<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] =
    useState<HubConnectionState | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Stable callbacks via ref to avoid reconnect on every render
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const startConnection = useCallback(async (token: string) => {
    // Clean up existing connection
    if (connectionRef.current) {
      await connectionRef.current.stop();
    }

    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect({
        // Exponential backoff: 0s, 2s, 10s, 30s
        nextRetryDelayInMilliseconds: (retryContext) => {
          const delays = [0, 2000, 10000, 30000];
          return delays[retryContext.previousRetryCount] ?? 30000;
        },
      })
      .configureLogging(
        process.env.NODE_ENV === "development" ? LogLevel.Information : LogLevel.Error
      )
      .build();

    // ── Event Handlers ────────────────────────────────────────
    connection.on("ReceiveNotification", (payload: NotificationPayload) => {
      optionsRef.current.onNotification?.(payload);
    });

    connection.on(
      "AppointmentStatusChanged",
      (payload: AppointmentStatusPayload) => {
        optionsRef.current.onAppointmentStatusChanged?.(payload);
      }
    );

    connection.on("UnreadCountUpdated", (count: number) => {
      setUnreadCount(count);
      optionsRef.current.onUnreadCountUpdated?.(count);
    });

    // ── Connection State Tracking ─────────────────────────────
    connection.onreconnecting(() => {
      setIsConnected(false);
      setConnectionState(HubConnectionState.Reconnecting);
    });

    connection.onreconnected(() => {
      setIsConnected(true);
      setConnectionState(HubConnectionState.Connected);
    });

    connection.onclose(() => {
      setIsConnected(false);
      setConnectionState(HubConnectionState.Disconnected);
    });

    try {
      await connection.start();
      connectionRef.current = connection;
      setIsConnected(true);
      setConnectionState(HubConnectionState.Connected);
    } catch (err) {
      console.error("[SignalR] Connection failed:", err);
      setConnectionState(HubConnectionState.Disconnected);
    }
  }, []);

  // Connect when session is available, disconnect on logout
  useEffect(() => {
    const token = (session as any)?.accessToken;
    if (!token) return;

    startConnection(token);

    return () => {
      connectionRef.current?.stop();
    };
  }, [session, startConnection]);

  return { isConnected, connectionState, unreadCount };
}