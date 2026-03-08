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
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  StickyNote,
} from "lucide-react";

interface Props {
  serviceId: number;
  triggerLabel?: string;
}

type Step = "date" | "time" | "notes" | "confirm";

export default function AppointmentForm({
  serviceId,
  triggerLabel = "Randevu Al",
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("date");
  const [providerId, setProviderId] = useState<number | null>(null);
  const [slots, setSlots] = useState<TimeSlotResponseDto[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open || providerId !== null) return;
    getServiceById(serviceId, session?.token)
      .then((res) => setProviderId(res.data.providerId))
      .catch(() => setError("Hizmet bilgisi alınamadı."));
  }, [open, serviceId, session?.token, providerId]);

  useEffect(() => {
    if (!selectedDate || !open || providerId === null) return;
    setLoadingSlots(true);
    setSelectedSlotId(null);
    getTimeSlots(providerId, selectedDate, session?.token)
      .then((res) => setSlots(res.data ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, open, providerId, session?.token]);

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      setTimeout(() => {
        setSelectedDate("");
        setSelectedSlotId(null);
        setNotes("");
        setError("");
        setSlots([]);
        setStep("date");
        setSuccess(false);
      }, 300);
    }
  }

  async function handleSubmit() {
    if (!selectedSlotId || !session?.token || providerId === null) return;
    setError("");
    setSubmitting(true);
    try {
      await createAppointment(
        {
          providerId,
          serviceId,
          timeSlotId: selectedSlotId,
          receiverNotes: notes || undefined,
        },
        session.token,
      );
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        router.push("/dashboard");
      }, 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    {
      key: "date",
      label: "Tarih",
      icon: <CalendarDays className="size-3.5" />,
    },
    { key: "time", label: "Saat", icon: <Clock className="size-3.5" /> },
    { key: "notes", label: "Not", icon: <StickyNote className="size-3.5" /> },
    {
      key: "confirm",
      label: "Onay",
      icon: <CheckCircle2 className="size-3.5" />,
    },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full h-9 text-[11px] uppercase tracking-widest font-semibold">
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[420px] p-0 gap-0 overflow-hidden border-border/60">
        {/* Top bar */}
        <div className="relative px-6 pt-6 pb-5 border-b border-border/40 bg-muted/20">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-[15px] font-semibold tracking-tight">
              Randevu Oluştur
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground/55 mt-0.5">
              {success
                ? "Randevunuz alındı."
                : step === "date"
                  ? "Uygun bir tarih seçin"
                  : step === "time"
                    ? "Müsait bir saat seçin"
                    : step === "notes"
                      ? "Varsa notlarınızı ekleyin"
                      : "Bilgileri onaylayın"}
            </p>
          </DialogHeader>

          {/* Step indicator */}
          {!success && (
            <div className="flex items-center gap-0">
              {steps.map((s, i) => (
                <div key={s.key} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => i < stepIndex && setStep(s.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-widest transition-all",
                      i === stepIndex
                        ? "bg-primary text-primary-foreground"
                        : i < stepIndex
                          ? "text-primary/70 hover:text-primary cursor-pointer"
                          : "text-muted-foreground/30 cursor-default",
                    )}
                  >
                    {s.icon}
                    {s.label}
                  </button>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-px w-4 mx-0.5 transition-colors",
                        i < stepIndex ? "bg-primary/40" : "bg-border/40",
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 min-h-[260px] flex flex-col">
          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-[12px] text-destructive mb-4">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SUCCESS */}
          {success ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
              <div className="size-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="size-7 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-semibold tracking-tight mb-1">
                  Randevu Alındı
                </p>
                <p className="text-[11px] text-muted-foreground/55">
                  Panele yönlendiriliyorsunuz...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* STEP: DATE */}
              {step === "date" && (
                <div className="flex-1 flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
                      Tarih
                    </Label>
                    <input
                      type="date"
                      min={today}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-[13px] font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                    />
                  </div>

                  {selectedDate && (
                    <div className="mt-auto pt-2 flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <CalendarDays className="size-3.5 text-primary/60 shrink-0" />
                      <span className="text-[12px] text-foreground/70">
                        {new Date(
                          selectedDate + "T00:00:00",
                        ).toLocaleDateString("tr-TR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* STEP: TIME */}
              {step === "time" && (
                <div className="flex-1 flex flex-col gap-3">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
                    Müsait Saatler
                  </Label>

                  {loadingSlots ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground/50 gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span className="text-[12px]">Yükleniyor...</span>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8 border border-dashed border-border/40 rounded-xl">
                      <Clock className="size-6 text-muted-foreground/20" />
                      <p className="text-[11px] text-muted-foreground/40 uppercase tracking-wider">
                        Bu tarihte müsait saat yok
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5 overflow-y-auto max-h-[180px] pr-0.5">
                      {slots.map((slot) => {
                        const time = new Date(
                          slot.startTime,
                        ).toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const isSelected = selectedSlotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={cn(
                              "rounded-lg border py-2.5 text-[12px] font-semibold transition-all duration-150",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                : "border-border/50 bg-background hover:border-border hover:bg-muted/40 text-foreground/70",
                            )}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedSlot && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 mt-auto">
                      <CheckCircle2 className="size-3.5 text-primary/60 shrink-0" />
                      <span className="text-[11px] text-foreground/65">
                        {new Date(selectedSlot.startTime).toLocaleString(
                          "tr-TR",
                          {
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}{" "}
                        seçildi
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* STEP: NOTES */}
              {step === "notes" && (
                <div className="flex-1 flex flex-col gap-3">
                  <div className="space-y-2 flex-1">
                    <Label
                      htmlFor="apt-notes"
                      className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold"
                    >
                      Notlar{" "}
                      <span className="normal-case text-muted-foreground/35 font-normal">
                        — opsiyonel
                      </span>
                    </Label>
                    <Textarea
                      id="apt-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Uzmanın bilmesini istediğiniz detaylar..."
                      rows={5}
                      className="resize-none text-[13px] border-border/50 focus:border-border"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground/35 uppercase tracking-wider">
                    Bu adımı atlayabilirsiniz
                  </p>
                </div>
              )}

              {/* STEP: CONFIRM */}
              {step === "confirm" && selectedSlot && (
                <div className="flex-1 flex flex-col gap-3">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
                    Özet
                  </Label>

                  <div className="rounded-xl border border-border/50 bg-muted/20 divide-y divide-border/30 overflow-hidden">
                    <SummaryRow
                      icon={<CalendarDays className="size-3.5" />}
                      label="Tarih"
                      value={new Date(
                        selectedDate + "T00:00:00",
                      ).toLocaleDateString("tr-TR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    />
                    <SummaryRow
                      icon={<Clock className="size-3.5" />}
                      label="Saat"
                      value={new Date(
                        selectedSlot.startTime,
                      ).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    />
                    {notes && (
                      <SummaryRow
                        icon={<StickyNote className="size-3.5" />}
                        label="Not"
                        value={notes}
                      />
                    )}
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2.5 text-[12px] text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-6 pb-5 flex items-center gap-2 border-t border-border/30 pt-4 bg-muted/10">
            {stepIndex > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 text-[11px] uppercase tracking-widest text-muted-foreground/50 hover:text-foreground"
                onClick={() => setStep(steps[stepIndex - 1].key)}
              >
                Geri
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              className="ml-auto h-9 text-[11px] uppercase tracking-widest font-semibold min-w-[120px]"
              disabled={
                (step === "date" && !selectedDate) ||
                (step === "time" && !selectedSlotId) ||
                (step === "confirm" && (submitting || providerId === null))
              }
              onClick={() => {
                if (step === "date") setStep("time");
                else if (step === "time") setStep("notes");
                else if (step === "notes") setStep("confirm");
                else if (step === "confirm") handleSubmit();
              }}
            >
              {step === "confirm" ? (
                submitting ? (
                  <>
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                    Gönderiliyor
                  </>
                ) : (
                  <>
                    Onayla
                    <CheckCircle2 className="ml-2 size-3.5" />
                  </>
                )
              ) : (
                <>
                  Devam Et
                  <ArrowRight className="ml-2 size-3.5" />
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="text-muted-foreground/40 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-semibold mb-0.5">
          {label}
        </p>
        <p className="text-[13px] font-medium text-foreground/80 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}
