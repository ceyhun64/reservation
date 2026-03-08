"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  getMyAppointments,
  getProviderAppointments,
  cancelAppointment,
  updateAppointmentStatus,
} from "@/lib/api";
import type { AppointmentResponseDto } from "@/types";
import {
  LoadingDots,
  EmptyState,
  StatBar,
  AppointmentCard,
  PageHeader,
  isAppointmentCancellable,
  STATUS_MAP,
} from "./DashboardShared";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "Tümü" },
  { value: "Pending", label: "Beklemede" },
  { value: "Confirmed", label: "Onaylanan" },
  { value: "Rejected", label: "Reddedildi" },
  { value: "Completed", label: "Tamamlanan" },
  { value: "CancelledByReceiver", label: "İptal Edildi" },
  { value: "NoShow", label: "Gelmedi" },
];

export default function AppointmentsModule() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<AppointmentResponseDto[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionId, setActionId] = useState<number | null>(null);

  const isProvider =
    session?.user?.role === "Provider" || session?.user?.role === "Admin";

  useEffect(() => {
    if (!session?.token) return;
    setLoading(true);
    const fn = isProvider ? getProviderAppointments : getMyAppointments;
    fn(
      { status: statusFilter !== "all" ? statusFilter : undefined },
      session.token,
    )
      .then((res) => setAppointments(res.data.items))
      .finally(() => setLoading(false));
  }, [session, statusFilter, isProvider]);

  async function handleConfirm(id: number) {
    if (!session?.token) return;
    setActionId(id);
    await updateAppointmentStatus(id, { action: "confirm" }, session.token);
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "Confirmed" as const } : a,
      ),
    );
    setActionId(null);
  }

  async function handleCancel(id: number) {
    if (!session?.token) return;
    setActionId(id);
    await cancelAppointment(id, {}, session.token);
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "CancelledByReceiver" as const } : a,
      ),
    );
    setActionId(null);
  }

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === "Confirmed").length,
    pending: appointments.filter((a) => a.status === "Pending").length,
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <PageHeader
        tag={isProvider ? "İşletme Randevuları" : "Randevularım"}
        title={isProvider ? "Gelen Randevular" : "Rezervasyonlarım"}
      />

      {/* Stats */}
      <StatBar
        stats={[
          { label: "Toplam", value: stats.total },
          { label: "Onaylanan", value: stats.confirmed, highlight: true },
          { label: "Bekleyen", value: stats.pending, highlight: true },
        ]}
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((opt) => {
          const isActive = statusFilter === opt.value;
          const cfg =
            opt.value !== "all"
              ? STATUS_MAP[opt.value as AppointmentResponseDto["status"]]
              : null;

          return (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                "inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all border",
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "border-border/40 text-muted-foreground/50 hover:border-border/70 hover:text-foreground bg-transparent",
              )}
            >
              {cfg && !isActive && (
                <span
                  className={cn("size-1.5 rounded-full shrink-0", cfg.dot)}
                />
              )}
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingDots />
      ) : appointments.length === 0 ? (
        <EmptyState
          title="Randevu Bulunamadı"
          description="Seçili filtreye uygun randevu yok."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((a) => {
            const canCancel = isAppointmentCancellable(a.status);
            const canConfirm = isProvider && a.status === "Pending";
            return (
              <AppointmentCard
                key={a.id}
                appointment={a}
                showReceiver={isProvider}
                actionLabel={canConfirm ? "Onayla" : undefined}
                actionVariant="default"
                onAction={canConfirm ? handleConfirm : undefined}
                actionLoading={actionId === a.id}
                secondaryActionLabel={canCancel ? "İptal Et" : undefined}
                secondaryActionVariant="destructive"
                onSecondaryAction={canCancel ? handleCancel : undefined}
                secondaryActionLoading={actionId === a.id}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
