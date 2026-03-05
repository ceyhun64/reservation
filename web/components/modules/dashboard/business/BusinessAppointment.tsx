"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getMyAppointments, getProviderAppointments } from "@/lib/api";
import type { AppointmentResponseDto } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cancelAppointment, updateAppointmentStatus } from "@/lib/api";
import { isAppointmentCancellable } from "@/components/modules/dashboard/DashboardShared";
import {
  LoadingDots,
  EmptyState,
  StatBar,
  AppointmentCard,
  PageHeader,
} from "@/components/modules/dashboard/DashboardShared";

const STATUS_OPTIONS = [
  { value: "all", label: "Tümü" },
  { value: "Pending", label: "Beklemede" },
  { value: "Confirmed", label: "Onaylanan" },
  { value: "Rejected", label: "Reddedildi" },
  { value: "Completed", label: "Tamamlanan" },
  { value: "CancelledByReceiver", label: "İptal Edildi" },
  { value: "NoShow", label: "Gelmedi" },
];

export default function BusinessAppointments() {
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
      <PageHeader
        tag={isProvider ? "İşletme Randevuları" : "Randevularım"}
        title={isProvider ? "Gelen Randevular" : "Rezervasyonlarım"}
        action={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Durum filtrele" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <StatBar
        stats={[
          { label: "Toplam", value: stats.total },
          { label: "Onaylanan", value: stats.confirmed, highlight: true },
          { label: "Bekleyen", value: stats.pending, highlight: true },
        ]}
      />

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
