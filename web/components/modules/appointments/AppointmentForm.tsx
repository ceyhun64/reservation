"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createAppointment, getTimeSlots, getServiceById } from "@/lib/api";
import type { TimeSlotResponseDto } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock, AlertCircle, Loader2 } from "lucide-react";

// ─── Props ────────────────────────────────────────────────────────────────────
// token prop kaldırıldı — useSession ile alınıyor
// providerId prop kaldırıldı — service.providerId üzerinden türetiliyor
interface Props {
  serviceId: number;
  triggerLabel?: string;
}

export default function AppointmentForm({
  serviceId,
  triggerLabel = "Randevu Al",
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  // providerId — ServiceResponseDto.providerId üzerinden çözülür
  const [providerId, setProviderId] = useState<number | null>(null);
  const [slots, setSlots] = useState<TimeSlotResponseDto[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Dialog açıldığında servisten providerId'yi çöz
  useEffect(() => {
    if (!open || providerId !== null) return;
    // GET /api/services/{id} → ServiceResponseDto.providerId
    getServiceById(serviceId, session?.token)
      .then((res) => setProviderId(res.data.providerId))
      .catch(() => setError("Hizmet bilgisi alınamadı."));
  }, [open, serviceId, session?.token, providerId]);

  // Tarih seçilince o güne ait müsait slotları getir
  useEffect(() => {
    if (!selectedDate || !open || providerId === null) return;
    setLoadingSlots(true);
    setSelectedSlotId(null);
    // GET /api/timeslots/provider/{providerId}?date=...
    getTimeSlots(providerId, selectedDate, session?.token)
      .then((res) => setSlots(res.data ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, open, providerId, session?.token]);

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      setSelectedDate("");
      setSelectedSlotId(null);
      setNotes("");
      setError("");
      setSlots([]);
      // providerId'yi sıfırlama — aynı servis için tekrar açılırsa yeniden fetch etmemek için
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlotId) {
      setError("Lütfen bir zaman dilimi seçin.");
      return;
    }
    if (!session?.token) {
      setError("Oturum açmanız gerekiyor.");
      return;
    }
    if (providerId === null) {
      setError("Provider bilgisi alınamadı, lütfen tekrar deneyin.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      // AppointmentCreateDto: providerId, serviceId, timeSlotId, receiverNotes?
      await createAppointment(
        {
          providerId,
          serviceId,
          timeSlotId: selectedSlotId,
          receiverNotes: notes || undefined,
        },
        session.token,
      );
      setOpen(false);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full">{triggerLabel}</Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Randevu Al
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Hata */}
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tarih */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">
              <CalendarDays className="h-3.5 w-3.5" />
              Tarih Seçin
            </Label>
            <input
              type="date"
              min={today}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Saat */}
          {selectedDate && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                <Clock className="h-3.5 w-3.5" />
                Saat Seçin
              </Label>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm">Müsait saatler yükleniyor...</span>
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Bu tarihte müsait saat bulunamadı.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => {
                    const time = new Date(slot.startTime).toLocaleTimeString(
                      "tr-TR",
                      { hour: "2-digit", minute: "2-digit" },
                    );
                    const isSelected = selectedSlotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={cn(
                          "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedSlotId && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {new Date(
                      slots.find((s) => s.id === selectedSlotId)?.startTime ??
                        "",
                    ).toLocaleString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Badge>
                  seçildi
                </p>
              )}
            </div>
          )}

          {/* Notlar */}
          <div className="space-y-2">
            <Label
              htmlFor="apt-notes"
              className="text-xs uppercase tracking-wider text-muted-foreground font-medium"
            >
              Notlar <span className="normal-case">(opsiyonel)</span>
            </Label>
            <Textarea
              id="apt-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Eklemek istediğiniz notlar..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !selectedSlotId || providerId === null}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? "Gönderiliyor..." : "Randevuyu Onayla"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
