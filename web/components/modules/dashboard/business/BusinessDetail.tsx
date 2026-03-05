"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  getBusinessById,
  getServices,
  createService,
  updateService,
  deleteService,
  getCategories,
} from "@/lib/api";
import type {
  BusinessResponseDto,
  ServiceResponseDto,
  ServiceDto,
  CategoryResponseDto,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  MapPin,
  Phone,
  User,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Clock,
  Tag,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceFormData = {
  name: string;
  description: string;
  price: number | "";
  durationMinutes: number | "";
  categoryId: number | "";
};

const emptyForm: ServiceFormData = {
  name: "",
  description: "",
  price: "",
  durationMinutes: "",
  categoryId: "",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BusinessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const id = Number(params?.id);

  const [business, setBusiness] = useState<BusinessResponseDto | null>(null);
  const [services, setServices] = useState<ServiceResponseDto[]>([]);
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editService, setEditService] = useState<ServiceResponseDto | null>(
    null,
  );
  const [form, setForm] = useState<ServiceFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof ServiceFormData, string>>
  >({});

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id || !session?.token) return;
    Promise.all([
      getBusinessById(id, session.token),
      getServices({ businessId: id }, session.token),
      getCategories(),
    ])
      .then(([bRes, sRes, cRes]) => {
        setBusiness(bRes.data);
        setServices(sRes.data ?? []);
        const all: CategoryResponseDto[] = cRes.data ?? [];
        setCategories(all.filter((c) => c.parentCategoryId != null));
      })
      .catch((err) => console.error("Veri yükleme hatası:", err))
      .finally(() => setLoading(false));
  }, [id, session?.token]);

  // ─── Form helpers ──────────────────────────────────────────────────────────

  function openCreate() {
    setForm(emptyForm);
    setFormErrors({});
    setCreateOpen(true);
  }

  function openEdit(svc: ServiceResponseDto) {
    setForm({
      name: svc.name,
      description: svc.description ?? "",
      price: svc.price,
      durationMinutes: svc.durationMinutes,
      categoryId: svc.categoryId,
    });
    setFormErrors({});
    setEditService(svc);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "durationMinutes"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
    if (formErrors[name as keyof ServiceFormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof ServiceFormData, string>> = {};
    if (!form.name.trim()) errs.name = "Hizmet adı zorunludur.";
    if (!form.price || Number(form.price) <= 0)
      errs.price = "Geçerli bir fiyat girin.";
    if (!form.durationMinutes || Number(form.durationMinutes) <= 0)
      errs.durationMinutes = "Süre zorunludur.";
    if (!form.categoryId) errs.categoryId = "Kategori seçiniz.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function buildDto(): ServiceDto {
    return {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes),
      categoryId: Number(form.categoryId),
      businessId: id,
    };
  }

  // ─── CRUD Actions ──────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!session?.token || !validate()) return;
    setSaving(true);
    try {
      const res = await createService(buildDto(), session.token);
      setServices((prev) => [res.data, ...prev]);
      toast.success("Hizmet oluşturuldu.");
      setCreateOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!session?.token || !editService || !validate()) return;
    setSaving(true);
    try {
      const res = await updateService(
        editService.id,
        buildDto(),
        session.token,
      );
      setServices((prev) =>
        prev.map((s) => (s.id === editService.id ? res.data : s)),
      );
      toast.success("Hizmet güncellendi.");
      setEditService(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(svc: ServiceResponseDto) {
    if (!session?.token) return;
    try {
      await deleteService(svc.id, session.token);
      setServices((prev) => prev.filter((s) => s.id !== svc.id));
      toast.success("Hizmet silindi.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Silinemedi.");
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-2/5" />
        <Skeleton className="h-5 w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground text-sm">İşletme bulunamadı.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Geri Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <span className="text-xs text-muted-foreground">İşletmeler</span>
      </div>

      {/* Business Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-wider"
            >
              {business.isVerified ? "Onaylı" : "Beklemede"}
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {business.name}
          </h1>
          {business.description && (
            <p className="text-sm text-muted-foreground max-w-lg">
              {business.description}
            </p>
          )}
          <div className="flex flex-wrap gap-4 pt-1">
            {business.address && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5 text-primary" /> {business.address},{" "}
                {business.city}
              </span>
            )}
            {business.phone && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="size-3.5 text-primary" /> {business.phone}
              </span>
            )}
            {business.providerName && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="size-3.5 text-primary" />{" "}
                {business.providerName}
              </span>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Services Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Hizmetler</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {services.length} hizmet tanımlı
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-3.5 mr-1.5" />
          Yeni Hizmet
        </Button>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <div className="border border-dashed rounded-lg py-16 flex flex-col items-center gap-3 text-center">
          <div className="size-10 rounded-full bg-muted flex items-center justify-center">
            <Plus className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Henüz hizmet eklenmedi</p>
          <p className="text-xs text-muted-foreground">
            İlk hizmetinizi ekleyerek başlayın.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={openCreate}
            className="mt-2"
          >
            Hizmet Ekle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((svc) => (
            <ServiceCard
              key={svc.id}
              service={svc}
              onEdit={() => openEdit(svc)}
              onDelete={() => handleDelete(svc)}
            />
          ))}
        </div>
      )}

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Hizmet Ekle</DialogTitle>
          </DialogHeader>
          <ServiceForm
            form={form}
            errors={formErrors}
            categories={categories}
            onChange={handleChange}
            onCategoryChange={(val) => {
              setForm((p) => ({ ...p, categoryId: Number(val) }));
              setFormErrors((p) => ({ ...p, categoryId: undefined }));
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={saving}
            >
              İptal
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {saving ? "Kaydediliyor..." : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog
        open={!!editService}
        onOpenChange={(o) => {
          if (!o) setEditService(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hizmeti Düzenle</DialogTitle>
          </DialogHeader>
          <ServiceForm
            form={form}
            errors={formErrors}
            categories={categories}
            onChange={handleChange}
            onCategoryChange={(val) => {
              setForm((p) => ({ ...p, categoryId: Number(val) }));
              setFormErrors((p) => ({ ...p, categoryId: undefined }));
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditService(null)}
              disabled={saving}
            >
              İptal
            </Button>
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

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: ServiceResponseDto;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col rounded-md hover:border-primary/40 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium leading-snug">
            {service.name}
          </CardTitle>
          {service.categoryName && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {service.categoryName}
            </Badge>
          )}
        </div>
        {service.description && (
          <CardDescription className="text-xs line-clamp-2">
            {service.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <Clock className="size-3.5 text-primary" />{" "}
            {service.durationMinutes} dk
          </span>
          <span className="font-semibold">₺{service.price}</span>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={onEdit}
          >
            <Pencil className="size-3 mr-1" /> Düzenle
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            asChild
          >
            <Link href={`/dashboard/services/${service.id}`}>
              <ExternalLink className="size-3 mr-1" /> Detay
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hizmeti Sil</AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>{service.name}</strong> kalıcı olarak silinecek. Emin
                  misiniz?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
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
  );
}

// ─── Service Form (shared) ────────────────────────────────────────────────────

function ServiceForm({
  form,
  errors,
  categories,
  onChange,
  onCategoryChange,
}: {
  form: ServiceFormData;
  errors: Partial<Record<keyof ServiceFormData, string>>;
  categories: CategoryResponseDto[];
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onCategoryChange: (val: string) => void;
}) {
  return (
    <div className="space-y-4 py-1">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="svc-name">
          Ad <span className="text-destructive">*</span>
        </Label>
        <Input
          id="svc-name"
          name="name"
          placeholder="Örn. Klasik Saç Kesimi"
          value={form.name}
          onChange={onChange}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="svc-desc">Açıklama</Label>
        <Textarea
          id="svc-desc"
          name="description"
          placeholder="Hizmet hakkında kısa bilgi..."
          rows={3}
          value={form.description}
          onChange={onChange}
          className="resize-none"
        />
      </div>

      {/* Price & Duration */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="svc-price">
            Fiyat (₺) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="svc-price"
            name="price"
            type="number"
            min={0}
            placeholder="250"
            value={form.price}
            onChange={onChange}
            aria-invalid={!!errors.price}
          />
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="svc-dur">
            Süre (dk) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="svc-dur"
            name="durationMinutes"
            type="number"
            min={5}
            step={5}
            placeholder="30"
            value={form.durationMinutes}
            onChange={onChange}
            aria-invalid={!!errors.durationMinutes}
          />
          {errors.durationMinutes && (
            <p className="text-xs text-destructive">{errors.durationMinutes}</p>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label>
          Kategori <span className="text-destructive">*</span>
        </Label>
        <Select
          value={form.categoryId ? String(form.categoryId) : ""}
          onValueChange={onCategoryChange}
        >
          <SelectTrigger aria-invalid={!!errors.categoryId}>
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
        {errors.categoryId && (
          <p className="text-xs text-destructive">{errors.categoryId}</p>
        )}
      </div>
    </div>
  );
}
