"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
// getBusinesses: herkese açık işletme listesi (token gerektirmez)
import { getBusinesses, getCategories } from "@/lib/api";
import type {
  BusinessResponseDto,
  CategoryResponseDto,
  BusinessQueryParams,
} from "@/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, ArrowRight } from "lucide-react";

export default function Businesses() {
  const [businesses, setBusinesses] = useState<BusinessResponseDto[]>([]);
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    // BusinessQueryParams: { city?, keyword?, page?, pageSize? }
    // NOT: categoryId BusinessQueryParams'da yok — services endpoint'inde var
    const params: BusinessQueryParams = {
      keyword: keyword || undefined,
      city: city || undefined,
      page,
      pageSize: 12,
    };
    getBusinesses(params)
      .then((res) => {
        setBusinesses(res.data.items);
        setTotalPages(res.data.totalPages);
      })
      .finally(() => setLoading(false));
  }, [keyword, city, page]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Header */}
      <div className="relative border-b px-6 py-16 md:px-16 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none">
          <div className="size-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <Badge
            variant="outline"
            className="mb-4 uppercase tracking-widest text-xs"
          >
            İşletmeler
          </Badge>
          <h1 className="mb-3">Tüm İşletmeleri Keşfedin</h1>
          <p className="text-muted-foreground text-sm">
            {businesses.length > 0
              ? `${businesses.length}+ işletme randevunuzu bekliyor`
              : "Randevu almak için bir işletme seçin"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-6 py-4 md:px-16">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          <Input
            placeholder="İşletme ara..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
          <Input
            placeholder="Şehir..."
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setPage(1);
            }}
            className="max-w-[160px]"
          />
          {/* Kategori filtresi — şimdilik sadece bilgi amaçlı göster,
              backend /businesses endpoint'i categoryId desteklemez.
              Kategori bazlı arama için /services?categoryId kullanılmalı */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {categories
                .filter((c) => !c.parentCategoryId)
                .map((c) => (
                  <Badge
                    key={c.id}
                    variant="outline"
                    className="text-xs cursor-default"
                  >
                    {c.name}
                  </Badge>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12 md:px-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-3 w-2/5 mb-4" />
                  <Skeleton className="h-6 w-4/5 mb-2" />
                  <Skeleton className="h-4 w-3/5" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <span className="text-5xl text-muted-foreground/20 select-none">
              ◈
            </span>
            <h3>İşletme bulunamadı</h3>
            <p className="text-muted-foreground text-sm">
              Farklı arama kriterleri deneyin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={page === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessCard({ business }: { business: BusinessResponseDto }) {
  return (
    <Link href={`/businesses/${business.id}`} className="no-underline group">
      <Card className="h-full flex flex-col transition-colors hover:bg-accent/50">
        <CardHeader className="flex-1">
          {business.isVerified && (
            <Badge variant="secondary" className="w-fit mb-2 text-xs">
              Onaylı İşletme
            </Badge>
          )}
          <CardTitle className="text-xl leading-snug">
            {business.name}
          </CardTitle>
          {business.description && (
            <CardDescription className="line-clamp-2 leading-relaxed">
              {business.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <Separator className="mb-4" />
          <div className="flex flex-col gap-1.5">
            {business.address && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="size-3 shrink-0 text-primary" />
                <span className="truncate">{business.address}</span>
              </div>
            )}
            {business.city && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-primary text-[10px]">◎</span>
                <span>{business.city}</span>
              </div>
            )}
            {/* providerName — BusinessResponseDto.providerName (ownerId→providerId) */}
            {business.providerName && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-primary text-[10px]">◉</span>
                <span>{business.providerName}</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0 justify-end">
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </CardFooter>
      </Card>
    </Link>
  );
}
