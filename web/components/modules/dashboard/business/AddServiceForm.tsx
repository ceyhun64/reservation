import { useState } from "react";
import { useSession } from "next-auth/react";
import { createService } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddServiceFormProps {
  businessId: number;
  onSuccess: (service: any) => void;
}

export default function AddServiceForm({ businessId, onSuccess }: AddServiceFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session?.token) return;

    const formData = new FormData(e.currentTarget);
    
    const payload = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: Number(formData.get("price")),
      durationMinutes: Number(formData.get("durationMinutes")),
      businessId: businessId,
      categoryId: 1, // Şimdilik default, kategori seçici eklenebilir
    };

    setLoading(true);
    try {
      const res = await createService(payload, session.token);
      if (res.success) {
        onSuccess(res.data);
      }
    } catch (error) {
      console.error("Hizmet ekleme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Hizmet Adı</Label>
        <Input id="name" name="name" placeholder="Örn: Saç Kesimi" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea id="description" name="description" placeholder="Hizmet detayları..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Fiyat (₺)</Label>
          <Input id="price" name="price" type="number" step="0.01" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMinutes">Süre (Dakika)</Label>
          <Input id="durationMinutes" name="durationMinutes" type="number" required />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Kaydediliyor..." : "Hizmeti Oluştur"}
      </Button>
    </form>
  );
}