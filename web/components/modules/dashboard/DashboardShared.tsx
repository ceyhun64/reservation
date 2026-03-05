"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import type { AppointmentResponseDto } from "@/types";

// ─── Status config ────────────────────────────────────────────────────────────
// AppointmentResponseDto.status: "Pending" | "Confirmed" | "Rejected" | "Completed" | "CancelledByReceiver" | "NoShow"

export const STATUS_MAP: Record<
  AppointmentResponseDto["status"],
  {
    label: string;
    variant: "secondary" | "default" | "destructive" | "outline";
  }
> = {
  Pending: { label: "Beklemede", variant: "secondary" },
  Confirmed: { label: "Onaylandı", variant: "default" },
  Rejected: { label: "Reddedildi", variant: "destructive" },
  Completed: { label: "Tamamlandı", variant: "outline" },
  CancelledByReceiver: { label: "İptal Edildi", variant: "destructive" },
  NoShow: { label: "Gelmedi", variant: "secondary" },
};

/** Randevunun iptal edilebilir olup olmadığını kontrol eder */
export function isAppointmentCancellable(
  status: AppointmentResponseDto["status"],
): boolean {
  return status === "Pending" || status === "Confirmed";
}

// ─── LoadingDots ──────────────────────────────────────────────────────────────

export function LoadingDots() {
  return (
    <div className="flex items-center justify-center min-h-[300px] gap-2">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 rounded-full bg-primary animate-pulse"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

interface PageHeaderProps {
  tag: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({
  tag,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
          — {tag}
        </p>
        <h1 className="text-3xl font-bold leading-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground font-light mt-1">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
      <span className="text-4xl text-primary/20 select-none">◈</span>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        — {title}
      </p>
      <p className="text-sm text-muted-foreground font-light max-w-xs">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Button asChild className="mt-2">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}

// ─── StatBar ──────────────────────────────────────────────────────────────────

interface StatBarProps {
  stats: { label: string; value: number | string; highlight?: boolean }[];
}

export function StatBar({ stats }: StatBarProps) {
  return (
    <div
      className="grid border border-border"
      style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}
    >
      {stats.map((s, i) => (
        <div
          key={i}
          className={[
            "flex flex-col items-center justify-center py-6 px-4 text-center gap-1",
            i < stats.length - 1 ? "border-r border-border" : "",
          ].join(" ")}
        >
          <span
            className={[
              "text-3xl font-bold leading-none",
              s.highlight ? "text-primary" : "text-foreground",
            ].join(" ")}
          >
            {s.value}
          </span>
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── AppointmentCard ──────────────────────────────────────────────────────────

interface AppointmentCardProps {
  appointment: AppointmentResponseDto;
  showReceiver?: boolean;
  actionLabel?: string;
  actionVariant?: React.ComponentProps<typeof Button>["variant"];
  onAction?: (id: number) => void;
  actionLoading?: boolean;
  secondaryActionLabel?: string;
  secondaryActionVariant?: React.ComponentProps<typeof Button>["variant"];
  onSecondaryAction?: (id: number) => void;
  secondaryActionLoading?: boolean;
}

export function AppointmentCard({
  appointment: a,
  showReceiver,
  actionLabel,
  actionVariant = "default",
  onAction,
  actionLoading,
  secondaryActionLabel,
  secondaryActionVariant = "destructive",
  onSecondaryAction,
  secondaryActionLoading,
}: AppointmentCardProps) {
  const status = STATUS_MAP[a.status] ?? STATUS_MAP.Pending;

  return (
    <Card className="flex flex-col rounded-md">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <CardTitle className="text-sm font-semibold leading-snug">
          {a.serviceName ?? "Hizmet"}
        </CardTitle>
        <Badge variant={status.variant}>{status.label}</Badge>
      </CardHeader>

      <Separator />

      <CardContent className="flex flex-col gap-2 pt-4 pb-5">
        {showReceiver && a.receiverName && (
          <InfoRow icon="◉" text={a.receiverName} />
        )}
        {a.businessName && <InfoRow icon="◈" text={a.businessName} muted />}
        {a.providerName && <InfoRow icon="◎" text={a.providerName} muted />}
        <InfoRow
          icon="◷"
          muted
          text={new Date(a.startTime).toLocaleString("tr-TR", {
            weekday: "short",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
        {/* pricePaid - AppointmentResponseDto'daki alan adı */}
        {a.pricePaid !== undefined && a.pricePaid > 0 && (
          <InfoRow icon="₺" text={String(a.pricePaid)} highlight />
        )}
        {/* receiverNotes - AppointmentResponseDto'daki alan adı */}
        {a.receiverNotes && (
          <InfoRow icon="◦" text={a.receiverNotes} muted italic />
        )}

        <div className="flex flex-col gap-2 mt-2">
          {onAction && actionLabel && (
            <Button
              variant={actionVariant}
              size="sm"
              className="w-full"
              disabled={actionLoading}
              onClick={() => onAction(a.id)}
            >
              {actionLoading ? "İşleniyor..." : actionLabel}
            </Button>
          )}
          {onSecondaryAction && secondaryActionLabel && (
            <Button
              variant={secondaryActionVariant}
              size="sm"
              className="w-full"
              disabled={secondaryActionLoading}
              onClick={() => onSecondaryAction(a.id)}
            >
              {secondaryActionLoading ? "İşleniyor..." : secondaryActionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

export function InfoRow({
  icon,
  text,
  muted,
  highlight,
  italic,
}: {
  icon: string;
  text: string;
  muted?: boolean;
  highlight?: boolean;
  italic?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-[11px] text-primary mt-0.5 shrink-0">{icon}</span>
      <span
        className={[
          "text-xs leading-relaxed",
          muted
            ? "text-muted-foreground font-light"
            : "text-foreground font-medium",
          highlight ? "text-primary font-medium" : "",
          italic ? "italic" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {text}
      </span>
    </div>
  );
}
