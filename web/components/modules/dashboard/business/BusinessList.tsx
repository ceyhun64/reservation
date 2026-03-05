"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
// getMyBusinesses: GET /api/businesses/my → ApiResponse<BusinessResponseDto[]>
// getBusinesses: GET /api/businesses → ApiResponse<PagedResponse<BusinessResponseDto>>
// Dashboard'da sadece kendi işletmelerini göstereceğimiz için getMyBusinesses kullanıyoruz
import { getMyBusinesses, deleteBusiness } from "@/lib/api";
import type { BusinessResponseDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
import {
  LoadingDots,
  EmptyState,
  PageHeader,
  InfoRow,
} from "../DashboardShared";

export default function BusinessList() {
  const { data: session } = useSession();
  const [businesses, setBusinesses] = useState<BusinessResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.token) return;
    // getMyBusinesses → dizi döner (PagedResponse değil)
    getMyBusinesses(session.token)
      .then((res) => setBusinesses(res.data ?? []))
      .finally(() => setLoading(false));
  }, [session]);

  async function handleDelete(id: number) {
    if (!session?.token) return;
    setDeletingId(id);
    try {
      await deleteBusiness(id, session.token);
      setBusinesses((prev) => prev.filter((b) => b.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <LoadingDots />;

  if (businesses.length === 0) {
    return (
      <EmptyState
        title="İşletmelerim"
        description="Henüz bir işletme eklemediniz. İlk işletmenizi ekleyin."
        actionLabel="İşletme Ekle"
        actionHref="/dashboard/businesses/new"
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        tag="İşletmelerim"
        title="İşletmelerim"
        action={
          <Button asChild size="sm">
            <Link href="/dashboard/businesses/new">
              <Plus className="size-4 mr-1" />
              Yeni İşletme
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {businesses.map((b) => (
          <Card key={b.id} className="rounded-md flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
              <CardTitle className="text-sm font-semibold leading-snug">
                {b.name}
              </CardTitle>
              {b.isVerified && <Badge variant="default">Onaylı</Badge>}
            </CardHeader>

            <Separator />

            <CardContent className="flex flex-col gap-2 pt-4 pb-4 flex-1">
              {b.city && <InfoRow icon="◎" text={b.city} muted />}
              {b.phone && <InfoRow icon="◉" text={b.phone} muted />}
              {b.email && <InfoRow icon="◈" text={b.email} muted />}
              {b.website && <InfoRow icon="↗" text={b.website} muted />}
              {b.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {b.description}
                </p>
              )}

              <div className="flex items-center gap-2 mt-auto pt-4">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/dashboard/businesses/${b.id}`}>
                    Detay <ArrowRight className="size-3 ml-1" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="size-8" asChild>
                  <Link href={`/dashboard/businesses/${b.id}/edit`}>
                    <Pencil className="size-3.5" />
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={deletingId === b.id}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>İşletmeyi Sil</AlertDialogTitle>
                      <AlertDialogDescription>
                        <strong>{b.name}</strong> işletmesi kalıcı olarak
                        silinecek. Emin misiniz?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(b.id)}>
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
    </div>
  );
}
