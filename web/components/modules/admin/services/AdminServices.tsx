"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getServices, deleteService, updateService, getCategories, getBusinesses } from "@/lib/api";
import type { ServiceResponseDto, ServiceDto, CategoryResponseDto, BusinessResponseDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import {
  AdminPageHeader, DeleteButton, AdminTable, Th, Td, PageLoader, EmptyState,
} from "@/components/modules/admin/AdminShared";

export default function AdminServices() {
  const { data: session } = useSession();
  const [allItems, setAllItems] = useState<ServiceResponseDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
  const [businesses, setBusinesses] = useState<BusinessResponseDto[]>([]);

  const [editTarget, setEditTarget] = useState<ServiceResponseDto | null>(null);
  const [form, setForm] = useState<ServiceDto>({ name: "", price: 0, durationMinutes: 30, categoryId: 0, businessId: 0 });
  const [saving, setSaving] = useState(false);

  const items = search.trim()
    ? allItems.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.businessName?.toLowerCase().includes(search.toLowerCase()) ||
        s.categoryName?.toLowerCase().includes(search.toLowerCase()))
    : allItems;

  useEffect(() => {
    if (!session?.token) return;
    const t = session.token;
    Promise.all([
      getServices({}, t),
      getCategories(t),
      getBusinesses({}, t),
    ]).then(([svc, cat, biz]) => {
      setAllItems(svc.data);
      setCategories(cat.data.filter((c) => !!c.parentCategoryId));
      setBusinesses(biz.data.items);
    }).finally(() => setLoading(false));
  }, [session?.token]);

  function openEdit(s: ServiceResponseDto) {
    setForm({
      name: s.name, description: s.description,
      price: s.price, durationMinutes: s.durationMinutes,
      categoryId: s.categoryId, businessId: s.businessId,
    });
    setEditTarget(s);
  }

  async function handleUpdate() {
    if (!session?.token || !editTarget) return;
    setSaving(true);
    try {
      const res = await updateService(editTarget.id, form, session.token);
      setAllItems((prev) => prev.map((s) => s.id === editTarget.id ? res.data : s));
      toast.success("Hizmet güncellendi.");
      setEditTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Hata.");
    } finally { setSaving(false); }
  }

  async function handleDelete(s: ServiceResponseDto) {
    if (!session?.token) return;
    try {
      await deleteService(s.id, session.token);
      setAllItems((prev) => prev.filter((x) => x.id !== s.id));
      toast.success("Hizmet silindi.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Silinemedi.");
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Hizmetler" description={`${allItems.length} hizmet`} />

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Hizmet ara..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Separator />

      {loading ? <PageLoader /> : items.length === 0 ? <EmptyState /> : (
        <AdminTable>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Ad</Th>
              <Th>Kategori</Th>
              <Th>İşletme</Th>
              <Th>Provider</Th>
              <Th>Fiyat</Th>
              <Th>Süre</Th>
              <Th> </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((s) => (
              <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                <Td className="text-muted-foreground">#{s.id}</Td>
                <Td className="font-medium">{s.name}</Td>
                <Td className="text-muted-foreground">{s.categoryName ?? "—"}</Td>
                <Td className="text-muted-foreground">{s.businessName ?? "—"}</Td>
                <Td className="text-muted-foreground">{s.providerName ?? "—"}</Td>
                <Td className="font-medium">₺{s.price}</Td>
                <Td className="text-muted-foreground">{s.durationMinutes} dk</Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Pencil className="size-4" />
                    </Button>
                    <DeleteButton
                      description={`"${s.name}" hizmeti silinecek.`}
                      onConfirm={() => handleDelete(s)}
                    />
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Hizmeti Düzenle</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Ad <span className="text-destructive">*</span></Label>
              <Input value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Açıklama</Label>
              <Textarea rows={3} className="resize-none" value={form.description ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fiyat (₺)</Label>
                <Input type="number" min={0} value={form.price || ""}
                  onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Süre (dk)</Label>
                <Input type="number" min={5} step={5} value={form.durationMinutes || ""}
                  onChange={(e) => setForm((p) => ({ ...p, durationMinutes: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={form.categoryId ? String(form.categoryId) : ""}
                onValueChange={(v) => setForm((p) => ({ ...p, categoryId: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Kategori seçin" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>İşletme</Label>
              <Select value={form.businessId ? String(form.businessId) : ""}
                onValueChange={(v) => setForm((p) => ({ ...p, businessId: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="İşletme seçin" /></SelectTrigger>
                <SelectContent>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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