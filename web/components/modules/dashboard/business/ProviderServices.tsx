"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  getMyProvider,
  getProviderServices,
  createService,
  updateService,
  deleteService,
  getServiceById,
  getCategories,
} from "@/lib/api";
import type {
  ServiceDto,
  ServiceResponseDto,
  CategoryResponseDto,
  ProviderResponseDto,
  BusinessSummaryDto,
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Loader2,
  Plus,
  Clock,
  Pencil,
  Trash2,
  Eye,
  Tag,
  Building2,
  User,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingDots, PageHeader, InfoRow } from "../DashboardShared";

// ─── Types ────────────────────────────────────────────────────────────────────

type FormErrors = Partial<Record<keyof ServiceDto, string>>;

const EMPTY_FORM: ServiceDto = {
  name: "",
  description: "",
  price: 0,
  durationMinutes: 30,
  categoryId: 0,
  businessId: 0,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProviderServices() {
  const { data: session } = useSession();

  const [provider, setProvider] = useState<ProviderResponseDto | null>(null);
  const [myServices, setMyServices] = useState<ServiceResponseDto[]>([]);
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Create dialog
  const [createOpen, setCreateOpen] = useState(false);

  // ── Edit dialog
  const [editTarget, setEditTarget] = useState<ServiceResponseDto | null>(null);

  // ── Detail sheet
  const [detailTarget, setDetailTarget] = useState<ServiceResponseDto | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Shared form state
  const [form, setForm] = useState<ServiceDto>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // ─── Fetch ───────────────────────────────────────────────────────────────

  async function fetchAll(token: string) {
    const provRes = await getMyProvider(token);
    const found = provRes.data;
    setProvider(found);

    if (!found) {
      setLoading(false);
      return;
    }

    const [psRes, catRes] = await Promise.all([
      getProviderServices(found.id, token),
      getCategories(),
    ]);

    setMyServices(psRes.data ?? []);
    const all: CategoryResponseDto[] = catRes.data ?? [];
    setCategories(all.filter((c) => c.parentCategoryId != null));
    setLoading(false);
  }

  useEffect(() => {
    if (!session?.token) return;
    fetchAll(session.token);
  }, [session?.token]);

  // ─── Form helpers ────────────────────────────────────────────────────────

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
    if (!form.businessId) errs.businessId = "İşletme seçiniz.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ─── Open Create ─────────────────────────────────────────────────────────

  function openCreate() {
    const defaultBiz = provider?.businesses?.[0]?.id ?? 0;
    setForm({ ...EMPTY_FORM, businessId: defaultBiz });
    setFormErrors({});
    setCreateOpen(true);
  }

  // ─── Open Edit ───────────────────────────────────────────────────────────

  function openEdit(svc: ServiceResponseDto) {
    setForm({
      name: svc.name,
      description: svc.description ?? "",
      price: svc.price,
      durationMinutes: svc.durationMinutes,
      categoryId: svc.categoryId,
      businessId: svc.businessId,
    });
    setFormErrors({});
    setEditTarget(svc);
  }

  // ─── Open Detail ─────────────────────────────────────────────────────────

  async function openDetail(svc: ServiceResponseDto) {
    setDetailTarget(svc); // optimistic — already have basic data
    if (!session?.token) return;
    setDetailLoading(true);
    try {
      const res = await getServiceById(svc.id, session.token);
      setDetailTarget(res.data);
    } catch {
      // keep the basic data we already have
    } finally {
      setDetailLoading(false);
    }
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!session?.token || !provider || !validate()) return;
    setSaving(true);
    try {
      const res = await createService(form, session.token);
      setMyServices((prev) => [res.data, ...prev]);
      toast.success("Hizmet oluşturuldu.");
      setCreateOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate() {
    if (!session?.token || !editTarget || !validate()) return;
    setSaving(true);
    try {
      const res = await updateService(editTarget.id, form, session.token);
      setMyServices((prev) =>
        prev.map((s) => (s.id === editTarget.id ? res.data : s)),
      );
      // If detail sheet is open for this service, refresh it too
      if (detailTarget?.id === editTarget.id) setDetailTarget(res.data);
      toast.success("Hizmet güncellendi.");
      setEditTarget(null);
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
      setMyServices((prev) => prev.filter((s) => s.id !== svc.id));
      if (detailTarget?.id === svc.id) setDetailTarget(null);
      toast.success("Hizmet silindi.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Silinemedi.");
    }
  }

  // ─── Guard renders ────────────────────────────────────────────────────────

  if (loading) return <LoadingDots />;

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
        <span className="text-4xl text-primary/20 select-none">◈</span>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          — Provider Profili Yok
        </p>
        <p className="text-sm text-muted-foreground font-light max-w-xs">
          Hizmet yönetimi için önce bir provider profili oluşturmanız gerekiyor.
        </p>
      </div>
    );
  }

  if (provider.businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
        <span className="text-4xl text-primary/20 select-none">◈</span>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          — İşletme Yok
        </p>
        <p className="text-sm text-muted-foreground font-light max-w-xs">
          Hizmet ekleyebilmek için önce en az bir işletme oluşturmanız
          gerekiyor.
        </p>
        <Button asChild className="mt-2">
          <a href="/dashboard/businesses/new">İşletme Oluştur</a>
        </Button>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        tag="Hizmet Yönetimi"
        title="Hizmetlerim"
        description="Tüm işletmelerinizde sunduğunuz hizmetler."
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-1" />
            Yeni Hizmet
          </Button>
        }
      />

      {/* İşletme özeti */}
      <div className="flex flex-wrap gap-2">
        {provider.businesses.map((b: BusinessSummaryDto) => (
          <Badge
            key={b.id}
            variant="outline"
            className="text-xs gap-1.5 py-1 px-3"
          >
            <span className="text-primary">◈</span>
            {b.name}
            {b.city && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{b.city}</span>
              </>
            )}
          </Badge>
        ))}
      </div>

      {/* İstatistik */}
      {myServices.length > 0 && (
        <div className="grid grid-cols-3 border border-border divide-x divide-border">
          {[
            { label: "Toplam Hizmet", value: myServices.length },
            {
              label: "Ort. Fiyat",
              value: `₺${Math.round(myServices.reduce((a, s) => a + s.price, 0) / myServices.length)}`,
            },
            {
              label: "Ort. Süre",
              value: `${Math.round(myServices.reduce((a, s) => a + s.durationMinutes, 0) / myServices.length)} dk`,
            },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center py-5 gap-1">
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Boş durum */}
      {myServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
          <span className="text-4xl text-primary/20 select-none">◈</span>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            — Hizmet Yok
          </p>
          <p className="text-sm text-muted-foreground font-light max-w-xs">
            Henüz hizmet eklenmemiş.
          </p>
          <Button className="mt-2" onClick={openCreate}>
            <Plus className="size-4 mr-1" />
            İlk Hizmeti Ekle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myServices.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              onEdit={() => openEdit(s)}
              onDetail={() => openDetail(s)}
              onDelete={() => handleDelete(s)}
            />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════
          Create Dialog
      ══════════════════════════════════════════ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Hizmet Oluştur</DialogTitle>
          </DialogHeader>
          <ServiceForm
            form={form}
            errors={formErrors}
            categories={categories}
            businesses={provider.businesses}
            showBusinessSelect={provider.businesses.length > 1}
            onChange={handleFormChange}
            onCategoryChange={(val) => {
              setForm((p) => ({ ...p, categoryId: Number(val) }));
              setFormErrors((p) => ({ ...p, categoryId: undefined }));
            }}
            onBusinessChange={(val) => {
              setForm((p) => ({ ...p, businessId: Number(val) }));
              setFormErrors((p) => ({ ...p, businessId: undefined }));
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
              {saving ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════
          Edit Dialog
      ══════════════════════════════════════════ */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => {
          if (!o) setEditTarget(null);
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
            businesses={provider.businesses}
            showBusinessSelect={provider.businesses.length > 1}
            onChange={handleFormChange}
            onCategoryChange={(val) => {
              setForm((p) => ({ ...p, categoryId: Number(val) }));
              setFormErrors((p) => ({ ...p, categoryId: undefined }));
            }}
            onBusinessChange={(val) => {
              setForm((p) => ({ ...p, businessId: Number(val) }));
              setFormErrors((p) => ({ ...p, businessId: undefined }));
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
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

      {/* ══════════════════════════════════════════
          Detail Sheet (side panel)
      ══════════════════════════════════════════ */}
      <Sheet
        open={!!detailTarget}
        onOpenChange={(o) => {
          if (!o) setDetailTarget(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {detailTarget && (
            <DetailPanel
              service={detailTarget}
              loading={detailLoading}
              onEdit={() => {
                openEdit(detailTarget);
                setDetailTarget(null);
              }}
              onDelete={() => handleDelete(detailTarget)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  onEdit,
  onDetail,
  onDelete,
}: {
  service: ServiceResponseDto;
  onEdit: () => void;
  onDetail: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="rounded-md flex flex-col hover:border-primary/40 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm leading-snug">{service.name}</CardTitle>
          {service.categoryName && (
            <Badge variant="outline" className="text-[10px] shrink-0">
              {service.categoryName}
            </Badge>
          )}
        </div>
        {service.businessName && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {service.businessName}
          </p>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-col gap-3 pt-3 pb-4 flex-1">
        {service.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 font-light">
            {service.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5 text-primary" />
            {service.durationMinutes} dk
          </div>
          <span className="text-lg font-bold">₺{service.price}</span>
        </div>

        <Separator />

        {/* Action row */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={onDetail}
          >
            <Eye className="size-3 mr-1" /> Detay
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={onEdit}
          >
            <Pencil className="size-3 mr-1" /> Düzenle
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

// ─── Detail Panel (inside Sheet) ─────────────────────────────────────────────

function DetailPanel({
  service,
  loading,
  onEdit,
  onDelete,
}: {
  service: ServiceResponseDto;
  loading: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-6 pt-2">
      <SheetHeader>
        <div className="flex items-start justify-between gap-3">
          <SheetTitle className="text-lg leading-snug">
            {service.name}
          </SheetTitle>
          <Badge variant="secondary" className="text-xs shrink-0">
            Aktif
          </Badge>
        </div>
        {service.description && (
          <p className="text-xs text-muted-foreground font-light">
            {service.description}
          </p>
        )}
      </SheetHeader>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Yükleniyor...
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-2">
        <InfoRow icon="₺" text={`${service.price} TL`} highlight />
        <InfoRow icon="◷" text={`${service.durationMinutes} dakika`} muted />
        {service.categoryName && (
          <InfoRow icon="◎" text={service.categoryName} muted />
        )}
        {service.businessName && (
          <InfoRow icon="◈" text={service.businessName} muted />
        )}
        {service.providerName && (
          <InfoRow icon="◉" text={service.providerName} muted />
        )}
      </div>

      <Separator />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            icon: <Tag className="size-4 text-primary" />,
            label: "Kategori",
            value: service.categoryName ?? "—",
          },
          {
            icon: <Clock className="size-4 text-primary" />,
            label: "Süre",
            value: `${service.durationMinutes} dk`,
          },
          {
            icon: <Building2 className="size-4 text-primary" />,
            label: "İşletme",
            value: service.businessName ?? "—",
          },
          {
            icon: <User className="size-4 text-primary" />,
            label: "Provider",
            value: service.providerName ?? "—",
          },
        ].map((item, i) => (
          <Card key={i} className="rounded-md">
            <CardContent className="pt-3 pb-3 flex flex-col gap-1.5">
              {item.icon}
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
              <p className="text-sm font-semibold truncate">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        {service.businessId && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/businesses/${service.businessId}`}>
              <Building2 className="size-3.5 mr-1" /> İşletmeye Git
            </Link>
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/appointments?serviceId=${service.id}`}>
            <CalendarDays className="size-3.5 mr-1" /> Randevular
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-2">
        <Button className="flex-1" size="sm" onClick={onEdit}>
          <Pencil className="size-3.5 mr-1" /> Düzenle
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="flex-1">
              <Trash2 className="size-3.5 mr-1" /> Sil
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
    </div>
  );
}

// ─── Service Form (shared create/edit) ───────────────────────────────────────

function ServiceForm({
  form,
  errors,
  categories,
  businesses,
  showBusinessSelect,
  onChange,
  onCategoryChange,
  onBusinessChange,
}: {
  form: ServiceDto;
  errors: FormErrors;
  categories: CategoryResponseDto[];
  businesses: BusinessSummaryDto[];
  showBusinessSelect: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onCategoryChange: (val: string) => void;
  onBusinessChange: (val: string) => void;
}) {
  return (
    <div className="space-y-4 py-2">
      {/* Ad */}
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

      {/* Açıklama */}
      <div className="space-y-1.5">
        <Label htmlFor="svc-desc">Açıklama</Label>
        <Textarea
          id="svc-desc"
          name="description"
          placeholder="Hizmet hakkında kısa bilgi..."
          rows={3}
          value={form.description ?? ""}
          onChange={onChange}
          className="resize-none"
        />
      </div>

      {/* Fiyat + Süre */}
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
            value={form.price || ""}
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
            value={form.durationMinutes || ""}
            onChange={onChange}
            aria-invalid={!!errors.durationMinutes}
          />
          {errors.durationMinutes && (
            <p className="text-xs text-destructive">{errors.durationMinutes}</p>
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

      {/* İşletme — sadece birden fazla işletme varsa göster */}
      {showBusinessSelect && (
        <div className="space-y-1.5">
          <Label>
            İşletme <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.businessId ? String(form.businessId) : ""}
            onValueChange={onBusinessChange}
          >
            <SelectTrigger aria-invalid={!!errors.businessId}>
              <SelectValue placeholder="İşletme seçin" />
            </SelectTrigger>
            <SelectContent>
              {businesses.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name} — {b.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.businessId && (
            <p className="text-xs text-destructive">{errors.businessId}</p>
          )}
        </div>
      )}
    </div>
  );
}
