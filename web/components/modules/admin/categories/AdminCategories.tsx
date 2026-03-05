"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api";
import type { CategoryResponseDto, CategoryDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, DeleteButton, PageLoader, EmptyState, AdminTable, Th, Td } from "@/components/modules/admin/AdminShared";

type FormState = CategoryDto & { id?: number };

const EMPTY: FormState = { name: "", description: "", iconUrl: "", displayOrder: 0, parentCategoryId: undefined };

export default function AdminCategories() {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  const roots = categories.filter((c) => !c.parentCategoryId);
  const subs  = categories.filter((c) => !!c.parentCategoryId);

  async function load() {
    if (!session?.token) return;
    setLoading(true);
    try {
      const res = await getCategories(session.token);
      setCategories(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [session?.token]);

  function openCreate(parentId?: number) {
    setForm({ ...EMPTY, parentCategoryId: parentId });
    setDialogOpen(true);
  }

  function openEdit(c: CategoryResponseDto) {
    setForm({
      id: c.id, name: c.name, description: c.description,
      iconUrl: c.iconUrl, displayOrder: c.displayOrder,
      parentCategoryId: c.parentCategoryId,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!session?.token) return;
    setSaving(true);
    try {
      const dto: CategoryDto = {
        name: form.name, description: form.description,
        iconUrl: form.iconUrl, displayOrder: form.displayOrder,
        parentCategoryId: form.parentCategoryId,
      };
      if (form.id) {
        const res = await updateCategory(form.id, dto, session.token);
        setCategories((prev) => prev.map((c) => c.id === form.id! ? res.data : c));
        toast.success("Kategori güncellendi.");
      } else {
        const res = await createCategory(dto, session.token);
        setCategories((prev) => [...prev, res.data]);
        toast.success("Kategori oluşturuldu.");
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Hata.");
    } finally { setSaving(false); }
  }

  async function handleDelete(c: CategoryResponseDto) {
    if (!session?.token) return;
    try {
      await deleteCategory(c.id, session.token);
      setCategories((prev) => prev.filter((x) => x.id !== c.id));
      toast.success("Kategori silindi.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Silinemedi.");
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Kategoriler"
        description={`${roots.length} ana, ${subs.length} alt kategori`}
        action={
          <Button size="sm" onClick={() => openCreate()}>
            <Plus className="size-4 mr-1" /> Yeni Kategori
          </Button>
        }
      />

      {loading ? <PageLoader /> : categories.length === 0 ? <EmptyState /> : (
        <AdminTable>
          <thead>
            <tr>
              <Th>Ad</Th>
              <Th>Slug</Th>
              <Th>Üst Kategori</Th>
              <Th>Sıra</Th>
              <Th>Alt Kategoriler</Th>
              <Th> </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* Root categories */}
            {roots.map((c) => {
              const children = subs.filter((s) => s.parentCategoryId === c.id);
              return (
                <>
                  <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                    <Td className="font-medium">{c.name}</Td>
                    <Td className="text-muted-foreground text-xs">{c.slug}</Td>
                    <Td><Badge variant="outline" className="text-xs">Kök</Badge></Td>
                    <Td className="text-muted-foreground">{c.displayOrder}</Td>
                    <Td className="text-muted-foreground">{children.length}</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" title="Alt kategori ekle"
                          onClick={() => openCreate(c.id)}>
                          <Plus className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="size-4" />
                        </Button>
                        <DeleteButton
                          description={`"${c.name}" kategorisi silinecek.`}
                          onConfirm={() => handleDelete(c)}
                        />
                      </div>
                    </Td>
                  </tr>
                  {/* Children */}
                  {children.map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/40 transition-colors bg-muted/20">
                      <Td>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <ChevronRight className="size-3.5 shrink-0" />
                          {sub.name}
                        </span>
                      </Td>
                      <Td className="text-muted-foreground text-xs">{sub.slug}</Td>
                      <Td className="text-muted-foreground text-xs">{c.name}</Td>
                      <Td className="text-muted-foreground">{sub.displayOrder}</Td>
                      <Td>—</Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(sub)}>
                            <Pencil className="size-4" />
                          </Button>
                          <DeleteButton
                            description={`"${sub.name}" alt kategorisi silinecek.`}
                            onConfirm={() => handleDelete(sub)}
                          />
                        </div>
                      </Td>
                    </tr>
                  ))}
                </>
              );
            })}
          </tbody>
        </AdminTable>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Kategoriyi Düzenle" : "Yeni Kategori"}</DialogTitle>
          </DialogHeader>
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
                <Label>Görsel URL</Label>
                <Input value={form.iconUrl ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, iconUrl: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Sıra</Label>
                <Input type="number" value={form.displayOrder ?? 0}
                  onChange={(e) => setForm((p) => ({ ...p, displayOrder: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Üst Kategori</Label>
              <Select
                value={form.parentCategoryId ? String(form.parentCategoryId) : "none"}
                onValueChange={(v) => setForm((p) => ({ ...p, parentCategoryId: v === "none" ? undefined : Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Kök kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Kök Kategori —</SelectItem>
                  {roots.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>İptal</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {saving ? "Kaydediliyor..." : form.id ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}