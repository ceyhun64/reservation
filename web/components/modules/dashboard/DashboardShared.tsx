"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { AppointmentResponseDto } from "@/types";
import {
  Calendar,
  Building2,
  User,
  Clock,
  Banknote,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
  HelpCircle,
  TimerOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Status config ─────────────────────────────────────────────────────────────

export const STATUS_MAP: Record<
  AppointmentResponseDto["status"],
  {
    label: string;
    color: string; // text color
    bg: string; // bg + border
    dot: string;
    icon: React.ReactNode;
  }
> = {
  Pending: {
    label: "Beklemede",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/8 border-amber-500/20",
    dot: "bg-amber-400",
    icon: <AlertCircle className="size-3" />,
  },
  Confirmed: {
    label: "Onaylandı",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/8 border-emerald-500/20",
    dot: "bg-emerald-400",
    icon: <CheckCircle2 className="size-3" />,
  },
  Rejected: {
    label: "Reddedildi",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/8 border-red-500/20",
    dot: "bg-red-400",
    icon: <XCircle className="size-3" />,
  },
  Completed: {
    label: "Tamamlandı",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/8 border-blue-500/20",
    dot: "bg-blue-400",
    icon: <CheckCircle2 className="size-3" />,
  },
  CancelledByReceiver: {
    label: "İptal Edildi",
    color: "text-muted-foreground/60",
    bg: "bg-muted/40 border-border/40",
    dot: "bg-muted-foreground/30",
    icon: <MinusCircle className="size-3" />,
  },
  NoShow: {
    label: "Gelmedi",
    color: "text-muted-foreground/50",
    bg: "bg-muted/30 border-border/30",
    dot: "bg-muted-foreground/25",
    icon: <TimerOff className="size-3" />,
  },
};

export function isAppointmentCancellable(
  status: AppointmentResponseDto["status"],
): boolean {
  return status === "Pending" || status === "Confirmed";
}

// ─── LoadingDots ──────────────────────────────────────────────────────────────

export function LoadingDots() {
  return (
    <div className="flex items-center justify-center min-h-[320px] gap-1.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 rounded-full bg-primary/35 animate-pulse"
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
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/40 mb-2">
          — {tag}
        </p>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-[13px] text-muted-foreground/55 font-light mt-1">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
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
    <div className="flex flex-col items-center justify-center min-h-[340px] text-center gap-4 border border-dashed border-border/35 rounded-2xl">
      <span className="text-[44px] text-muted-foreground/8 select-none font-bold">
        ◈
      </span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/35 mb-1.5">
          {title}
        </p>
        <p className="text-[12px] text-muted-foreground/45 font-light max-w-xs">
          {description}
        </p>
      </div>
      {actionLabel && actionHref && (
        <Button
          asChild
          size="sm"
          className="mt-1 h-8 text-[11px] uppercase tracking-widest font-semibold"
        >
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
      className="grid rounded-xl border border-border/50 bg-muted/15 overflow-hidden"
      style={{ gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}
    >
      {stats.map((s, i) => (
        <div
          key={i}
          className={cn(
            "flex flex-col items-center justify-center py-5 px-4 text-center gap-1.5 relative",
            i < stats.length - 1 && "border-r border-border/40",
          )}
        >
          {s.highlight && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 bg-primary/40 rounded-full" />
          )}
          <span
            className={cn(
              "text-[34px] font-bold leading-none tracking-tighter tabular-nums",
              s.highlight ? "text-primary" : "text-foreground/80",
            )}
          >
            {s.value}
          </span>
          <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/40 font-semibold">
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
    <div className="group flex flex-col rounded-xl border border-border/45 bg-card overflow-hidden hover:border-border/75 hover:shadow-md hover:shadow-black/5 transition-all duration-200">
      {/* Status accent line */}
      <div className={cn("h-[2px] w-full", status.dot.replace("bg-", "bg-"))} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">
            #{String(a.id).padStart(5, "0")}
          </p>
          <h3 className="text-[14px] font-bold tracking-tight leading-snug truncate">
            {a.serviceName ?? "Hizmet"}
          </h3>
        </div>

        {/* Status badge */}
        <span
          className={cn(
            "shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border",
            status.color,
            status.bg,
          )}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/30 mx-4" />

      {/* Body */}
      <div className="flex flex-col gap-2 px-4 pt-3 pb-4 flex-1">
        {showReceiver && a.receiverName && (
          <MetaRow
            icon={<User className="size-3" />}
            value={a.receiverName}
            bold
          />
        )}
        {a.businessName && (
          <MetaRow
            icon={<Building2 className="size-3" />}
            value={a.businessName}
          />
        )}
        {a.providerName && (
          <MetaRow icon={<User className="size-3" />} value={a.providerName} />
        )}
        <MetaRow
          icon={<Clock className="size-3" />}
          value={new Date(a.startTime).toLocaleString("tr-TR", {
            weekday: "short",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
        {a.pricePaid !== undefined && a.pricePaid > 0 && (
          <MetaRow
            icon={<Banknote className="size-3" />}
            value={`₺${a.pricePaid}`}
            accent
          />
        )}
        {a.receiverNotes && (
          <MetaRow
            icon={<FileText className="size-3" />}
            value={a.receiverNotes}
            muted
            italic
          />
        )}

        {/* Actions */}
        {(onAction || onSecondaryAction) && (
          <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-border/25">
            {onAction && actionLabel && (
              <Button
                variant={actionVariant}
                size="sm"
                className="w-full h-8 text-[11px] uppercase tracking-widest font-semibold"
                disabled={actionLoading}
                onClick={() => onAction(a.id)}
              >
                {actionLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-current animate-pulse" />
                    İşleniyor
                  </span>
                ) : (
                  actionLabel
                )}
              </Button>
            )}
            {onSecondaryAction && secondaryActionLabel && (
              <Button
                variant={secondaryActionVariant}
                size="sm"
                className="w-full h-8 text-[11px] uppercase tracking-widest font-semibold"
                disabled={secondaryActionLoading}
                onClick={() => onSecondaryAction(a.id)}
              >
                {secondaryActionLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-current animate-pulse" />
                    İşleniyor
                  </span>
                ) : (
                  secondaryActionLabel
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MetaRow ──────────────────────────────────────────────────────────────────

export function MetaRow({
  icon,
  value,
  bold,
  accent,
  muted,
  italic,
}: {
  icon: React.ReactNode;
  value: string;
  bold?: boolean;
  accent?: boolean;
  muted?: boolean;
  italic?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-primary/35 mt-0.5 shrink-0">{icon}</span>
      <span
        className={cn(
          "text-[12px] leading-relaxed",
          bold && "font-semibold text-foreground",
          accent && "font-bold text-primary",
          muted && "text-muted-foreground/50 font-light",
          italic && "italic",
          !bold && !accent && !muted && "text-foreground/70",
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ─── InfoRow (legacy alias) ───────────────────────────────────────────────────
// Geriye dönük uyumluluk için tutuldu
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
    <MetaRow
      icon={<span className="text-[10px]">{icon}</span>}
      value={text}
      muted={muted}
      accent={highlight}
      italic={italic}
    />
  );
}
