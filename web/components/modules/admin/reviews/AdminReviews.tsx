"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getProviders, getProviderReviews, hideReview } from "@/lib/api";
import type { ReviewResponseDto, ProviderResponseDto } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  AdminPageHeader, AdminTable, Th, Td, Pagination, PageLoader, EmptyState,
} from "@/components/modules/admin/AdminShared";

const PAGE_SIZE = 15;

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i}
          className={`size-3.5 ${i <= rating ? "fill-current text-yellow-500" : "text-muted-foreground/30"}`} />
      ))}
    </span>
  );
}

export default function AdminReviews() {
  const { data: session } = useSession();
  const [providers, setProviders] = useState<ProviderResponseDto[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [items, setItems] = useState<ReviewResponseDto[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hiding, setHiding] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.token) return;
    getProviders({ pageSize: 100 }, session.token)
      .then((r) => setProviders(r.data.items))
      .catch(() => {});
  }, [session?.token]);

  async function load(providerId: number, p = 1) {
    if (!session?.token) return;
    setLoading(true);
    try {
      const res = await getProviderReviews(providerId, { page: p, pageSize: PAGE_SIZE }, session.token);
      setItems(res.data.items);
      setTotalPages(res.data.totalPages);
      setPage(p);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  function handleProviderChange(val: string) {
    setSelectedProvider(val);
    if (val !== "all") load(Number(val), 1);
    else { setItems([]); setTotalPages(0); }
  }

  async function handleHide(id: number) {
    if (!session?.token) return;
    setHiding(id);
    try {
      await hideReview(id, session.token);
      setItems((prev) => prev.filter((r) => r.id !== id));
      toast.success("Değerlendirme gizlendi.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Hata.");
    } finally { setHiding(null); }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Değerlendirmeler" />

      <div className="flex flex-wrap gap-2 items-center">
        <Select value={selectedProvider} onValueChange={handleProviderChange}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Provider seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Provider Seçin</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.userFullName} — {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {selectedProvider === "all" ? (
        <EmptyState message="Değerlendirmeleri görmek için bir provider seçin." />
      ) : loading ? <PageLoader /> : items.length === 0 ? <EmptyState /> : (
        <>
          <AdminTable>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Yazar</Th>
                <Th>Puan</Th>
                <Th>Yorum</Th>
                <Th>Provider Yanıtı</Th>
                <Th>Tarih</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                  <Td className="text-muted-foreground">#{r.id}</Td>
                  <Td className="font-medium">{r.authorName}</Td>
                  <Td><StarRating rating={r.rating} /></Td>
                  <Td className="max-w-xs">
                    <p className="text-sm truncate">{r.comment ?? "—"}</p>
                  </Td>
                  <Td className="max-w-xs">
                    {r.providerReply ? (
                      <p className="text-xs text-muted-foreground truncate">{r.providerReply}</p>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td className="text-muted-foreground text-xs">
                    {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                  </Td>
                  <Td>
                    <Button variant="ghost" size="icon" disabled={hiding === r.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleHide(r.id)}
                      title="Gizle">
                      <EyeOff className="size-4" />
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
          <Pagination page={page} totalPages={totalPages}
            onPage={(p) => load(Number(selectedProvider), p)} />
        </>
      )}
    </div>
  );
}