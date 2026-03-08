"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { createService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddServiceFormProps {
  businessId: number;
  onSuccess: (service: any) => void;
}

export default function AddServiceForm({
  businessId,
  onSuccess,
}: AddServiceFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session?.token) return;

    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: Number(formData.get("price")),
      durationMinutes: Number(formData.get("durationMinutes")),
      businessId,
      categoryId: 1,
    };

    setLoading(true);
    try {
      const res = await createService(payload, session.token);
      if (res.success) {
        setSuccess(true);
        onSuccess(res.data);
        (e.target as HTMLFormElement).reset();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("Hizmet oluşturulamadı. Lütfen tekrar deneyin.");
      }
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* Name */}
      <div className="space-y-1.5">
        <Label
          htmlFor="name"
          className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-medium"
        >
          Hizmet Adı
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Örn: Saç Kesimi"
          required
          className="h-9 text-[13px] border-border/50 focus:border-primary/50 bg-background"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label
          htmlFor="description"
          className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-medium"
        >
          Açıklama{" "}
          <span className="text-muted-foreground/30 normal-case tracking-normal">
            (İsteğe bağlı)
          </span>
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Hizmet detaylarını kısaca açıklayın..."
          rows={2}
          className="text-[13px] border-border/50 focus:border-primary/50 bg-background resize-none"
        />
      </div>

      {/* Price + Duration */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="price"
            className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-medium"
          >
            Fiyat (₺)
          </Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            required
            className="h-9 text-[13px] border-border/50 focus:border-primary/50 bg-background"
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="durationMinutes"
            className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-medium"
          >
            Süre (Dk)
          </Label>
          <Input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min="1"
            placeholder="30"
            required
            className="h-9 text-[13px] border-border/50 focus:border-primary/50 bg-background"
          />
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
          <AlertCircle className="size-3.5 text-destructive shrink-0" />
          <p className="text-[11px] text-destructive font-light">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
          <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
          <p className="text-[11px] text-emerald-600 font-medium">
            Hizmet başarıyla oluşturuldu.
          </p>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-9 text-[11px] uppercase tracking-[0.12em] font-semibold"
      >
        {loading ? (
          <>
            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
            Kaydediliyor...
          </>
        ) : (
          "Hizmeti Oluştur"
        )}
      </Button>
    </form>
  );
}
