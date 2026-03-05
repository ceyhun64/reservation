"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getBusinesses, deleteBusiness, updateBusiness } from "@/lib/api";
import type { BusinessResponseDto, BusinessDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import {
  AdminPageHeader, VerifiedBadge, DeleteButton,
  AdminTable, Th, Td, Pagination, PageLoader, EmptyState,
} from "@/components/modules/admin/AdminShared";

const PAGE_SIZE = 15;

export default function AdminBusinesses() {
  const { data: session } = useSession();
  const [items, setItems] = useState<BusinessResponseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [editTarget, setEditTarget] = useState<BusinessResponseDto | null>(null);
  const [form, setForm] = useState<BusinessDto>({ name: "" });
  const [saving, setSaving] = useState(false);

  async function load(p = 1) {
    if (!session?.token) return;
    setLoading(true);
    try {
      const res = await getBusinesses(
        { keyword: search || undefined, page: p, pageSize: PAGE_SIZE },
        session.token,
      );
      setItems(res.data.items);
      setTotal(res.data.totalPages);
      setPage(p);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(1); }, [session?.token]);

  function openEdit(b: BusinessResponseDto) {
    setForm({
      name: b.name, description: b.description,
      address: b.address, city: b.city,
      phone: b.phone, email: b.email, website: b.website,
    });
    setEditTarget(b);
  }

  async function handleUpdate() {
    if (!session?.token || !editTarget) return;
    setSaving(true);
    try {
      const res = await updateBusiness(editTarget.id, form, session.token);
      setItems((prev) => prev.map((b) => b.id === editTarget.id ? res.data : b));
      toast.success("İşletme güncellendi.");
      setEditTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Hata.");
    } finally { setSaving(false); }
  }

  async function handleDelete(b: BusinessResponseDto) {
    if (!session?.token) return;
    try {
      await deleteBusiness(b.id, session.token);
      setItems((prev) => prev.filter((x) => x.id !== b.id));
      toast.success("İşletme silindi.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Silinemedi.");
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="İşletmeler"
        description={`${total > 0 ? `Toplam sayfa: ${total}` : ""}`}
      />

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9" placeholder="İşletme ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(1)}
          />
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
                <Th>Şehir</Th>
                <Th>Provider</Th>
                <Th>Durum</Th>
                <Th>Telefon</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((b) => (
                <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                  <Td className="text-muted-foreground">#{b.id}</Td>
                  <Td className="font-medium">{b.name}</Td>
                  <Td className="text-muted-foreground">{b.city ?? "—"}</Td>
                  <Td className="text-muted-foreground">{b.providerName ?? "—"}</Td>
                  <Td><VerifiedBadge verified={b.isVerified} /></Td>
                  <Td className="text-muted-foreground">{b.phone ?? "—"}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                        <Pencil className="size-4" />
                      </Button>
                      <DeleteButton
                        description={`"${b.name}" işletmesi silinecek. Emin misiniz?`}
                        onConfirm={() => handleDelete(b)}
                      />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
          <Pagination page={page} totalPages={total} onPage={load} />
        </>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>İşletmeyi Düzenle</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {([
              ["name", "Ad", false],
              ["description", "Açıklama", true],
              ["address", "Adres", false],
              ["city", "Şehir", false],
              ["phone", "Telefon", false],
              ["email", "E-posta", false],
              ["website", "Web Sitesi", false],
            ] as [keyof BusinessDto, string, boolean][]).map(([key, label, isTextarea]) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                {isTextarea ? (
                  <Textarea rows={3} className="resize-none"
                    value={(form[key] as string) ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} />
                ) : (
                  <Input value={(form[key] as string) ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} />
                )}
              </div>
            ))}
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