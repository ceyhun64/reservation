"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";

// ─── Appointment status badge ─────────────────────────────────────────────────

export function AppointmentStatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    Pending: { label: "Beklemede", variant: "secondary" },
    Confirmed: { label: "Onaylandı", variant: "default" },
    Rejected: { label: "Reddedildi", variant: "destructive" },
    Completed: { label: "Tamamlandı", variant: "outline" },
    CancelledByReceiver: { label: "İptal (Müşteri)", variant: "destructive" },
    NoShow: { label: "Gelmedi", variant: "destructive" },
  };
  const { label, variant } = map[status] ?? {
    label: status,
    variant: "secondary" as const,
  };
  return <Badge variant={variant}>{label}</Badge>;
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <Badge variant={verified ? "default" : "secondary"}>
      {verified ? "Onaylı" : "Onaysız"}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, "default" | "secondary" | "outline"> = {
    Admin: "default",
    Provider: "secondary",
    Receiver: "outline",
  };
  return <Badge variant={map[role] ?? "outline"}>{role}</Badge>;
}

export function NotificationTypeBadge({ type }: { type: string }) {
  const map: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    Info: "secondary",
    Success: "default",
    Warning: "outline",
    Error: "destructive",
  };
  return <Badge variant={map[type] ?? "secondary"}>{type}</Badge>;
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

export function DeleteButton({
  description,
  onConfirm,
  disabled,
}: {
  description: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Silme Onayı</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Page loader ──────────────────────────────────────────────────────────────

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

export function EmptyState({
  message = "Kayıt bulunamadı.",
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <span className="text-4xl text-muted-foreground/20 select-none">◈</span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── Page header ─────────────────────────────────────────────────────────────

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

export function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Önceki
      </Button>
      <span className="text-sm text-muted-foreground">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Sonraki
      </Button>
    </div>
  );
}

// ─── Table wrapper ────────────────────────────────────────────────────────────

export function AdminTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50 ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 align-middle ${className ?? ""}`}>{children}</td>
  );
}
