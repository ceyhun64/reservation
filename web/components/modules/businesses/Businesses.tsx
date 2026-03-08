"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBusinesses, getCategories } from "@/lib/api";
import type {
  BusinessResponseDto,
  CategoryResponseDto,
  BusinessQueryParams,
} from "@/types";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Businesses() {
  const [businesses, setBusinesses] = useState<BusinessResponseDto[]>([]);
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: BusinessQueryParams = {
      keyword: keyword || undefined,
      city: city || undefined,
      page,
      pageSize: 12,
    };
    getBusinesses(params)
      .then((res) => {
        setBusinesses(res.data.items ?? []);
        setTotalPages(res.data.totalPages ?? 1);
        setTotalCount(res.data.totalCount ?? 0);
      })
      .catch(() => {
        setBusinesses([]);
        setTotalPages(1);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [keyword, city, page]);

  const rootCategories = categories
    .filter((c) => !c.parentCategoryId)
    .slice(0, 6);
  const hasFilters = keyword || city || activeCategory !== null;

  function clearFilters() {
    setKeyword("");
    setCity("");
    setActiveCategory(null);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Hero ── */}
      <div className="relative border-b border-border/50 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute right-0 top-0 bottom-0 w-[500px] bg-gradient-to-l from-primary/[0.055] to-transparent pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 md:px-16 py-16">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/40 font-semibold mb-3">
            — Rezervo Platform
          </p>
          <h1 className="text-[40px] md:text-[54px] font-bold tracking-tight leading-[1.06] mb-4">
            Tüm İşletmeleri <span className="text-primary">Keşfedin</span>
          </h1>
          <p className="text-[13px] text-muted-foreground/50 font-light max-w-md">
            {loading
              ? "İşletmeler yükleniyor..."
              : totalCount > 0
                ? `${totalCount} işletme randevunuzu bekliyor`
                : "Randevu almak için bir işletme seçin"}
          </p>
        </div>
      </div>

      {/* ── Sticky Filters ── */}
      <div className="sticky top-14 z-10 bg-background/95 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 md:px-16">
          {/* Search row */}
          <div className="flex flex-wrap items-center gap-2 py-3 border-b border-border/25">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/35" />
              <Input
                placeholder="İşletme ara..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                className="pl-8 w-[200px] h-8 text-[12px] border-border/50 bg-transparent"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/35" />
              <Input
                placeholder="Şehir..."
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setPage(1);
                }}
                className="pl-8 w-[140px] h-8 text-[12px] border-border/50 bg-transparent"
              />
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[11px] uppercase tracking-wider text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="size-3" />
                Temizle
              </button>
            )}

            <span className="ml-auto text-[10px] text-muted-foreground/30 uppercase tracking-wider hidden sm:block">
              {loading ? "..." : `${businesses.length} sonuç`}
            </span>
          </div>

          {/* Category chips */}
          {rootCategories.length > 0 && (
            <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => {
                  setActiveCategory(null);
                  setPage(1);
                }}
                className={cn(
                  "shrink-0 h-7 px-3 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all",
                  activeCategory === null
                    ? "bg-foreground text-background"
                    : "border border-border/40 text-muted-foreground/50 hover:border-border/70 hover:text-foreground",
                )}
              >
                Tümü
              </button>
              {rootCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCategory(c.id);
                    setPage(1);
                  }}
                  className={cn(
                    "shrink-0 h-7 px-3 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all",
                    activeCategory === c.id
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/40 text-muted-foreground/50 hover:border-border/70 hover:text-foreground",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-6xl mx-auto px-6 md:px-16 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/40 p-5 space-y-3"
              >
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
                <Skeleton className="h-3 w-2/5 mt-4" />
              </div>
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-4 text-center border border-dashed border-border/35 rounded-2xl">
            <Building2 className="size-10 text-muted-foreground/10" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/35 font-semibold mb-1">
                İşletme Bulunamadı
              </p>
              <p className="text-[12px] text-muted-foreground/40 font-light">
                Farklı arama kriterleri deneyin.
              </p>
            </div>
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] uppercase tracking-wider border-border/50 mt-1"
                onClick={clearFilters}
              >
                Filtreleri Temizle
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="size-8 flex items-center justify-center rounded-md border border-border/50 text-muted-foreground/50 hover:text-foreground hover:border-border/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="size-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "size-8 flex items-center justify-center rounded-md text-[12px] font-semibold transition-all",
                  page === p
                    ? "bg-foreground text-background"
                    : "border border-border/40 text-muted-foreground/50 hover:border-border/70 hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="size-8 flex items-center justify-center rounded-md border border-border/50 text-muted-foreground/50 hover:text-foreground hover:border-border/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessCard({ business }: { business: BusinessResponseDto }) {
  return (
    <Link
      href={`/businesses/${business.id}`}
      className="group block h-full no-underline"
    >
      <div className="h-full flex flex-col rounded-xl border border-border/45 bg-card overflow-hidden hover:border-border/80 hover:shadow-lg hover:shadow-black/5 transition-all duration-200">
        {/* Top accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-primary/35 via-primary/12 to-transparent" />

        <div className="flex flex-col flex-1 p-5">
          {/* Verified + name */}
          <div className="flex-1 mb-4">
            {business.isVerified && (
              <div className="inline-flex items-center gap-1.5 mb-2.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-emerald-600 bg-emerald-500/8 border border-emerald-500/18 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="size-2.5" />
                Onaylı
              </div>
            )}
            <h3 className="text-[15px] font-bold tracking-tight leading-snug mb-1.5">
              {business.name}
            </h3>
            {business.description && (
              <p className="text-[11px] text-muted-foreground/55 font-light leading-relaxed line-clamp-2">
                {business.description}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1 pt-3.5 border-t border-border/30 mb-4">
            {business.address && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50">
                <MapPin className="size-3 shrink-0 text-primary/40" />
                <span className="truncate">{business.address}</span>
              </div>
            )}
            {business.city && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50">
                <span className="size-3 flex items-center justify-center text-[8px] text-primary/40">
                  ◎
                </span>
                <span>{business.city}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/25 font-medium">
              #{business.id.toString().padStart(4, "0")}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/35 group-hover:text-primary/70 transition-colors font-semibold uppercase tracking-wider">
              İncele
              <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
