"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getServiceById,
  updateService,
  deleteService,
  getCategories,
} from "@/lib/api";
import type {
  ServiceResponseDto,
  ServiceDto,
  CategoryResponseDto,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Clock,
  Tag,
  Building2,
  User,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingDots, PageHeader, InfoRow } from "../DashboardShared";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  serviceId: number;
}

type FormErrors = Partial<Record<keyof ServiceDto, string>>;

// ─── Component ───────────────────────────────────────────────────────────────

export default function ServiceDetail({ serviceId }: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  const [service, setService] = useState<ServiceResponseDto | null>(null);
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<ServiceDto>({
    name: "",
    description: "",
    price: 0,
    durationMinutes: 30,
    categoryId: 0,
    businessId: 0,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // ─── Fetch ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!session?.token) return;
    Promise.all([
      // GET /api/services/{id}
      getServiceById(serviceId, session.token),
      getCategories(),
    ])
      .then(([svcRes, catRes]) => {
        setService(svcRes.data);
        const all: CategoryResponseDto[] = catRes.data ?? [];
        setCategories(all.filter((c) => c.parentCategoryId != null));
      })
      .finally(() => setLoading(false));
  }, [session?.token, serviceId]);

  // ─── Edit ─────────────────────────────────────────────────────────────────

  function openEdit() {
    if (!service) return;
    setForm({
      name: service.name,
      description: service.description ?? "",
      price: service.price,
      durationMinutes: service.durationMinutes,
      categoryId: service.categoryId,
      businessId: service.businessId,
    });
    setFormErrors({});
    setEditOpen(true);
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
    if (formErrors[name as keyof ServiceDto])
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Hizmet adı zorunludur.";
    if (!form.price || form.price <= 0) errs.price = "Geçerli bir fiyat girin.";
    if (!form.durationMinutes || form.durationMinutes <= 0)
      errs.durationMinutes = "Süre zorunludur.";
    if (!form.categoryId) errs.categoryId = "Kategori seçiniz.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!session?.token || !service || !validate()) return;
    setSaving(true);
    try {
      // PUT /api/services/{id}
      const res = await updateService(service.id, form, session.token);
      setService(res.data);
      toast.success("Hizmet güncellendi.");
      setEditOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!session?.token || !service) return;
    try {
      // DELETE /api/services/{id}
      await deleteService(service.id, session.token);
      toast.success("Hizmet silindi.");
      router.push(
        service.businessId
          ? `/dashboard/businesses/${service.businessId}/services`
          : "/dashboard/services",
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Silinemedi.");
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading) return <LoadingDots />;

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
        <span className="text-4xl text-primary/20 select-none">◈</span>
        <p className="text-sm text-muted-foreground">Hizmet bulunamadı.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Geri Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Üst bar */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <PageHeader
          tag="Hizmet Detayı"
          title={service.name}
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openEdit}>
                <Pencil className="size-3.5 mr-1" />
                Düzenle
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="size-3.5 mr-1" />
                    Sil
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hizmeti Sil</AlertDialogTitle>
                    <AlertDialogDescription>
                      <strong>{service.name}</strong> hizmeti kalıcı olarak
                      silinecek. Emin misiniz?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sil
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          }
        />
      </div>

      {/* Detay Kartı */}
      <Card className="rounded-md">
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div>
            <CardTitle className="text-base">{service.name}</CardTitle>
            {service.description && (
              <p className="text-xs text-muted-foreground mt-1 font-light max-w-md">
                {service.description}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            Aktif
          </Badge>
        </CardHeader>
        <Separator />
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 pb-4">
          {/* pricePaid/price — ServiceResponseDto.price */}
          <InfoRow icon="₺" text={`${service.price} TL`} highlight />
          <InfoRow icon="◷" text={`${service.durationMinutes} dakika`} muted />
          {service.categoryName && (
            <InfoRow icon="◎" text={service.categoryName} muted />
          )}
          {/* businessName — ServiceResponseDto.businessName */}
          {service.businessName && (
            <InfoRow icon="◈" text={service.businessName} muted />
          )}
          {/* providerName — ServiceResponseDto.providerName (yeni alan) */}
          {service.providerName && (
            <InfoRow icon="◉" text={service.providerName} muted />
          )}
        </CardContent>
      </Card>

      {/* Özet istatistikler */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon: <Tag className="h-5 w-5 text-primary" />,
            label: "Kategori",
            value: service.categoryName ?? "—",
          },
          {
            icon: <Clock className="h-5 w-5 text-primary" />,
            label: "Süre",
            value: `${service.durationMinutes} dk`,
          },
          {
            icon: <Building2 className="h-5 w-5 text-primary" />,
            label: "İşletme",
            value: service.businessName ?? "—",
          },
          {
            icon: <User className="h-5 w-5 text-primary" />,
            // providerName — ServiceResponseDto.providerName
            label: "Provider",
            value: service.providerName ?? "—",
          },
        ].map((item, i) => (
          <Card key={i} className="rounded-md">
            <CardContent className="pt-4 pb-4 flex flex-col gap-2">
              {item.icon}
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-semibold truncate">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hızlı bağlantılar */}
      <div className="flex flex-wrap gap-3">
        {service.businessId && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/businesses/${service.businessId}`}>
              <Building2 className="size-3.5 mr-1" />
              İşletmeye Git
            </Link>
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/appointments?serviceId=${service.id}`}>
            <CalendarDays className="size-3.5 mr-1" />
            Bu Hizmetin Randevuları
          </Link>
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hizmeti Düzenle</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">
                Ad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
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

            <div className="space-y-1.5">
              <Label htmlFor="edit-desc">Açıklama</Label>
              <Textarea
                id="edit-desc"
                name="description"
                placeholder="Hizmet hakkında kısa bilgi..."
                rows={3}
                value={form.description ?? ""}
                onChange={handleFormChange}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-price">
                  Fiyat (₺) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-price"
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
                <Label htmlFor="edit-dur">
                  Süre (dk) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-dur"
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
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              İptal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {saving ? "Kaydediliyor..." : "Güncelle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
