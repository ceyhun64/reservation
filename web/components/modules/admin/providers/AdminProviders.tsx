"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getProviders, updateProvider } from "@/lib/api";
import type { ProviderResponseDto, ProviderDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Pencil, Search, Star, Building2, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  AdminPageHeader, AdminTable, Th, Td, Pagination, PageLoader, EmptyState,
} from "@/components/modules/admin/AdminShared";

const PAGE_SIZE = 15;

export default function AdminProviders() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ProviderResponseDto[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [editTarget, setEditTarget] = useState<ProviderResponseDto | null>(null);
  const [form, setForm] = useState<ProviderDto>({ title: "", bio: "" });
  const [saving, setSaving] = useState(false);

  const [detailTarget, setDetailTarget] = useState<ProviderResponseDto | null>(null);

  async function load(p = 1) {
    if (!session?.token) return;
    setLoading(true);
    try {
      const res = await getProviders({ keyword: search || undefined, page: p, pageSize: PAGE_SIZE }, session.token);
      setItems(res.data.items);
      setTotalPages(res.data.totalPages);
      setPage(p);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(1); }, [session?.token]);

  function openEdit(p: ProviderResponseDto) {
    setForm({ title: p.title, bio: p.bio ?? "", acceptsOnlineBooking: p.acceptsOnlineBooking });
    setEditTarget(p);
  }

  async function handleUpdate() {
    if (!session?.token || !editTarget) return;
    setSaving(true);
    try {
      const res = await updateProvider(editTarget.id, form, session.token);
      setItems((prev) => prev.map((x) => x.id === editTarget.id ? res.data : x));
      toast.success("Provider güncellendi.");
      setEditTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Hata.");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Providerlar" />

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Provider ara..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(1)} />
        </div>
        <Button variant="outline" onClick={() => load(1)}>Ara</Button>
      </div>

      <Separator />

      {loading ? <PageLoader /> : items.length === 0 ? <EmptyState /> : (
        <>
          <AdminTable>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Ad</Th>
                <Th>Unvan</Th>
                <Th>Puan</Th>
                <Th>Yorum</Th>
                <Th>Online Randevu</Th>
                <Th>İşletmeler</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                  <Td className="text-muted-foreground">#{p.id}</Td>
                  <Td className="font-medium">{p.userFullName}</Td>
                  <Td className="text-muted-foreground">{p.title}</Td>
                  <Td>
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="size-3.5 fill-current text-yellow-500" />
                      {p.averageRating.toFixed(1)}
                    </span>
                  </Td>
                  <Td className="text-muted-foreground">{p.totalReviews}</Td>
                  <Td>
                    <Badge variant={p.acceptsOnlineBooking ? "default" : "secondary"}>
                      {p.acceptsOnlineBooking ? "Evet" : "Hayır"}
                    </Badge>
                  </Td>
                  <Td className="text-muted-foreground">{p.businesses.length}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setDetailTarget(p)}>
                        <Eye className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="size-4" />
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
          <Pagination page={page} totalPages={totalPages} onPage={load} />
        </>
      )}

      {/* Detail sheet */}
      <Sheet open={!!detailTarget} onOpenChange={(o) => { if (!o) setDetailTarget(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {detailTarget && (
            <div className="space-y-6 pt-2">
              <SheetHeader>
                <SheetTitle>{detailTarget.userFullName}</SheetTitle>
                <p className="text-sm text-muted-foreground">{detailTarget.title}</p>
              </SheetHeader>
              {detailTarget.bio && <p className="text-sm text-muted-foreground">{detailTarget.bio}</p>}
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Ortalama Puan", value: detailTarget.averageRating.toFixed(1) },
                  { label: "Toplam Yorum",  value: detailTarget.totalReviews },
                  { label: "Online Randevu", value: detailTarget.acceptsOnlineBooking ? "Evet" : "Hayır" },
                  { label: "İşletme Sayısı", value: detailTarget.businesses.length },
                ].map((s, i) => (
                  <Card key={i} className="rounded-md">
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-sm font-semibold">{s.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {detailTarget.businesses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">İşletmeler</p>
                  {detailTarget.businesses.map((b) => (
                    <div key={b.id} className="flex items-center gap-2 text-sm p-2 rounded-md border">
                      <Building2 className="size-3.5 text-muted-foreground" />
                      <span className="font-medium">{b.name}</span>
                      <span className="text-muted-foreground text-xs">— {b.city}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Provider Düzenle</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Unvan</Label>
              <Input value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea rows={4} className="resize-none" value={form.bio ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="online"
                checked={form.acceptsOnlineBooking ?? false}
                onChange={(e) => setForm((p) => ({ ...p, acceptsOnlineBooking: e.target.checked }))} />
              <Label htmlFor="online">Online Randevu Kabul Et</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={saving}>İptal</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {saving ? "Kaydediliyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}