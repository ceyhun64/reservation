"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getMyAppointments, updateAppointmentStatus } from "@/lib/api";
import type { AppointmentResponseDto, AppointmentQueryParams } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import {
  AdminPageHeader,
  AppointmentStatusBadge,
  AdminTable,
  Th,
  Td,
  Pagination,
  PageLoader,
  EmptyState,
} from "@/components/modules/admin/AdminShared";

const PAGE_SIZE = 15;
const STATUSES = [
  "",
  "Pending",
  "Confirmed",
  "Rejected",
  "Completed",
  "CancelledByReceiver",
  "NoShow",
];
const STATUS_LABELS: Record<string, string> = {
  "": "Tüm Durumlar",
  Pending: "Beklemede",
  Confirmed: "Onaylandı",
  Rejected: "Reddedildi",
  Completed: "Tamamlandı",
  CancelledByReceiver: "İptal (Müşteri)",
  NoShow: "Gelmedi",
};

export default function AdminAppointments() {
  const { data: session } = useSession();
  const [items, setItems] = useState<AppointmentResponseDto[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AppointmentResponseDto | null>(null);
  const [actioning, setActioning] = useState(false);

  async function load(p = 1) {
    if (!session?.token) return;
    setLoading(true);
    const params: AppointmentQueryParams = {
      page: p,
      pageSize: PAGE_SIZE,
      status: status || undefined,
      from: from || undefined,
      to: to || undefined,
    };
    try {
      const res = await getMyAppointments(params, session.token);
      setItems(res.data.items);
      setTotalPages(res.data.totalPages);
      setPage(p);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, [session?.token]);

  async function handleAction(
    id: number,
    action: "confirm" | "reject" | "complete" | "noshow",
  ) {
    if (!session?.token) return;
    setActioning(true);
    try {
      const res = await updateAppointmentStatus(id, { action }, session.token);
      setItems((prev) => prev.map((a) => (a.id === id ? res.data : a)));
      if (detail?.id === id) setDetail(res.data);
      toast.success("Durum güncellendi.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Hata.");
    } finally {
      setActioning(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Randevular" />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={status}
          onValueChange={(v) => setStatus(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Durum filtrele" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s || "all"} value={s || "all"}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          className="w-44"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          type="date"
          className="w-44"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <Button variant="outline" onClick={() => load(1)}>
          Filtrele
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setStatus("");
            setFrom("");
            setTo("");
          }}
        >
          Temizle
        </Button>
      </div>

      <Separator />

      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <AdminTable>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Müşteri</Th>
                <Th>Hizmet</Th>
                <Th>İşletme</Th>
                <Th>Tarih</Th>
                <Th>Ücret</Th>
                <Th>Durum</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-muted/40 transition-colors">
                  <Td className="text-muted-foreground">#{a.id}</Td>
                  <Td className="font-medium">{a.receiverName ?? "—"}</Td>
                  <Td>{a.serviceName ?? "—"}</Td>
                  <Td className="text-muted-foreground">
                    {a.businessName ?? "—"}
                  </Td>
                  <Td className="text-muted-foreground">
                    {new Date(a.startTime).toLocaleDateString("tr-TR")}
                  </Td>
                  <Td className="font-medium">₺{a.pricePaid}</Td>
                  <Td>
                    <AppointmentStatusBadge status={a.status} />
                  </Td>
                  <Td>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDetail(a)}
                    >
                      <Eye className="size-4" />
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
          <Pagination page={page} totalPages={totalPages} onPage={load} />
        </>
      )}

      {/* Detail sheet */}
      <Sheet
        open={!!detail}
        onOpenChange={(o) => {
          if (!o) setDetail(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {detail && (
            <div className="space-y-6 pt-2">
              <SheetHeader>
                <SheetTitle>Randevu #{detail.id}</SheetTitle>
                <AppointmentStatusBadge status={detail.status} />
              </SheetHeader>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Müşteri", value: detail.receiverName ?? "—" },
                  { label: "Provider", value: detail.providerName ?? "—" },
                  { label: "Hizmet", value: detail.serviceName ?? "—" },
                  { label: "İşletme", value: detail.businessName ?? "—" },
                  { label: "Kategori", value: detail.categoryName ?? "—" },
                  { label: "Ücret", value: `₺${detail.pricePaid}` },
                  {
                    label: "Başlangıç",
                    value: new Date(detail.startTime).toLocaleString("tr-TR"),
                  },
                  {
                    label: "Bitiş",
                    value: new Date(detail.endTime).toLocaleString("tr-TR"),
                  },
                ].map((row, i) => (
                  <Card key={i} className="rounded-md">
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs text-muted-foreground">
                        {row.label}
                      </p>
                      <p className="text-sm font-semibold">{row.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {detail.receiverNotes && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Müşteri Notu
                  </p>
                  <p className="text-sm border rounded-md p-3">
                    {detail.receiverNotes}
                  </p>
                </div>
              )}

              {detail.cancellationReason && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    İptal Sebebi
                  </p>
                  <p className="text-sm border rounded-md p-3">
                    {detail.cancellationReason}
                  </p>
                </div>
              )}

              <Separator />

              {/* Action buttons */}
              {detail.status === "Pending" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={actioning}
                    onClick={() => handleAction(detail.id, "confirm")}
                  >
                    Onayla
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    disabled={actioning}
                    onClick={() => handleAction(detail.id, "reject")}
                  >
                    Reddet
                  </Button>
                </div>
              )}
              {detail.status === "Confirmed" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={actioning}
                    onClick={() => handleAction(detail.id, "complete")}
                  >
                    Tamamlandı
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={actioning}
                    onClick={() => handleAction(detail.id, "noshow")}
                  >
                    Gelmedi
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
