"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "@/lib/api";
import { getCategories } from "@/lib/api"; // kategoriler için
import type {
  ServiceDto,
  ServiceResponseDto,
  CategoryResponseDto,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  LoadingDots,
  EmptyState,
  PageHeader,
  InfoRow,
} from "../DashboardShared";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  businessId: number;
}

const EMPTY_FORM: ServiceDto = {
  name: "",
  description: "",
  price: 0,
  durationMinutes: 30,
  categoryId: 0,
  businessId: 0,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function BusinessServices({ businessId }: Props) {
  const { data: session } = useSession();

  const [services, setServices] = useState<ServiceResponseDto[]>([]);
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] =
    useState<ServiceResponseDto | null>(null);
  const [form, setForm] = useState<ServiceDto>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof ServiceDto, string>>
  >({});

  // ─── Data fetching ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!session?.token) return;
    Promise.all([getServices({ businessId }, session.token), getCategories()])
      .then(([sRes, cRes]) => {
        setServices(sRes.data ?? []);
        // Sadece alt kategorileri göster (parentCategoryId olan)
        const all = cRes.data ?? [];
        setCategories(
          all.filter((c: CategoryResponseDto) => c.parentCategoryId != null),
        );
      })
      .finally(() => setLoading(false));
  }, [session?.token, businessId]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  function openCreate() {
    setEditingService(null);
    setForm({ ...EMPTY_FORM, businessId });
    setFormErrors({});
    setDialogOpen(true);
  }

  function openEdit(service: ServiceResponseDto) {
    setEditingService(service);
    setForm({
      name: service.name,
      description: service.description ?? "",
      price: service.price,
      durationMinutes: service.durationMinutes,
      categoryId: service.categoryId,
      businessId,
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "durationMinutes" ? Number(value) : value,
    }));
    if (formErrors[name as keyof ServiceDto]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof ServiceDto, string>> = {};
    if (!form.name.trim()) errs.name = "Hizmet adı zorunludur.";
    if (!form.price || form.price <= 0) errs.price = "Geçerli bir fiyat girin.";
    if (!form.durationMinutes || form.durationMinutes <= 0)
      errs.durationMinutes = "Süre zorunludur.";
    if (!form.categoryId) errs.categoryId = "Kategori seçiniz.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!session?.token || !validate()) return;
    setSaving(true);
    try {
      if (editingService) {
        const res = await updateService(editingService.id, form, session.token);
        setServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? res.data : s)),
        );
        toast.success("Hizmet güncellendi.");
      } else {
        const res = await createService(form, session.token);
        setServices((prev) => [...prev, res.data]);
        toast.success("Hizmet oluşturuldu.");
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!session?.token) return;
    setDeletingId(id);
    try {
      await deleteService(id, session.token);
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("Hizmet silindi.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Silinemedi.");
    } finally {
      setDeletingId(null);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading) return <LoadingDots />;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link href={`/dashboard/businesses/${businessId}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <PageHeader
          tag="İşletme Hizmetleri"
          title="Hizmetler"
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4 mr-1" />
              Hizmet Ekle
            </Button>
          }
        />
      </div>

      {/* Empty state */}
      {services.length === 0 ? (
        // ✅ Düzeltme — onAction yerine button'u manuel render et
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
          <span className="text-4xl text-primary/20 select-none">◈</span>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            — Hizmetler
          </p>
          <p className="text-sm text-muted-foreground font-light max-w-xs">
            Bu işletmeye ait henüz hizmet bulunmuyor.
          </p>
          <Button className="mt-2" onClick={openCreate}>
            <Plus className="size-4 mr-1" />
            Hizmet Ekle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <Card key={s.id} className="rounded-md flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{s.name}</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="flex flex-col gap-2 pt-3 pb-4 flex-1">
                <InfoRow icon="◷" text={`${s.durationMinutes} dakika`} muted />
                <InfoRow icon="₺" text={String(s.price)} highlight />
                {s.categoryName && (
                  <InfoRow icon="◎" text={s.categoryName} muted />
                )}
                {s.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {s.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-auto pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil className="size-3.5 mr-1" />
                    Düzenle
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={deletingId === s.id}
                      >
                        {deletingId === s.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hizmeti Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                          <strong>{s.name}</strong> kalıcı olarak silinecek. Bu
                          işlem geri alınamaz.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(s.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Hizmeti Düzenle" : "Yeni Hizmet"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Ad */}
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Ad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Örn. Klasik Saç Kesimi"
                value={form.name}
                onChange={handleFormChange}
                aria-invalid={!!formErrors.name}
              />
              {formErrors.name && (
                <p className="text-xs text-destructive">{formErrors.name}</p>
              )}
            </div>

            {/* Açıklama */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Hizmet hakkında kısa bilgi..."
                rows={3}
                value={form.description ?? ""}
                onChange={handleFormChange}
                className="resize-none"
              />
            </div>

            {/* Fiyat + Süre */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">
                  Fiyat (₺) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min={0}
                  placeholder="250"
                  value={form.price || ""}
                  onChange={handleFormChange}
                  aria-invalid={!!formErrors.price}
                />
                {formErrors.price && (
                  <p className="text-xs text-destructive">{formErrors.price}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="durationMinutes">
                  Süre (dk) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="durationMinutes"
                  name="durationMinutes"
                  type="number"
                  min={5}
                  step={5}
                  placeholder="30"
                  value={form.durationMinutes || ""}
                  onChange={handleFormChange}
                  aria-invalid={!!formErrors.durationMinutes}
                />
                {formErrors.durationMinutes && (
                  <p className="text-xs text-destructive">
                    {formErrors.durationMinutes}
                  </p>
                )}
              </div>
            </div>

            {/* Kategori */}
            <div className="space-y-1.5">
              <Label>
                Kategori <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.categoryId ? String(form.categoryId) : ""}
                onValueChange={(val) => {
                  setForm((prev) => ({ ...prev, categoryId: Number(val) }));
                  if (formErrors.categoryId)
                    setFormErrors((prev) => ({
                      ...prev,
                      categoryId: undefined,
                    }));
                }}
              >
                <SelectTrigger aria-invalid={!!formErrors.categoryId}>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.categoryId && (
                <p className="text-xs text-destructive">
                  {formErrors.categoryId}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {saving
                ? "Kaydediliyor..."
                : editingService
                  ? "Güncelle"
                  : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
