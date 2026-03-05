"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const QUICK_LINKS = [
  { label: "Hizmetler", href: "/services" },
  { label: "Giriş Yap", href: "/auth/login" },
  { label: "Kayıt Ol", href: "/auth/register" },
];

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-svh bg-background flex flex-col items-center justify-center overflow-hidden text-center px-6 py-10">
      {/* Dekoratif yatay çizgiler */}
      <div className="absolute top-1/2 -translate-y-[120px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute top-1/2 translate-y-[120px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* İçerik */}
      <div
        className="relative flex flex-col items-center transition-all duration-700 ease-out"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
        }}
      >
        {/* Etiket */}
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-8">
          — Sayfa Bulunamadı
        </p>

        {/* 404 — outline tipografi */}
        <p
          className="font-serif font-black leading-none tracking-tighter select-none mb-0"
          style={{
            fontSize: "clamp(100px, 20vw, 180px)",
            color: "transparent",
            WebkitTextStroke:
              "1px color-mix(in oklch, var(--border) 80%, transparent)",
          }}
        >
          404
        </p>

        {/* Dikey ayraç */}
        <div className="w-px h-14 bg-gradient-to-b from-border to-transparent my-2" />

        {/* Başlık */}
        <h1
          className="font-serif font-bold leading-snug mb-4 mt-2"
          style={{ fontSize: "clamp(28px, 5vw, 48px)" }}
        >
          Bu sayfa <em className="text-primary not-italic">mevcut değil.</em>
        </h1>

        {/* Açıklama */}
        <p className="text-sm text-muted-foreground leading-relaxed font-light max-w-sm mb-10">
          Aradığınız sayfa kaldırılmış, taşınmış ya da hiç var olmamış olabilir.
          Ana sayfaya dönerek devam edebilirsiniz.
        </p>

        {/* CTA butonlar */}
        <div className="flex gap-3 flex-wrap justify-center mb-14">
          <Button asChild>
            <Link href="/">Ana Sayfaya Dön</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/businesses">İşletmelere Gözat</Link>
          </Button>
        </div>

        {/* Hızlı linkler */}
        <div className="flex gap-8 flex-wrap justify-center">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors border-b border-border pb-1"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Alt logo */}
      <div className="absolute bottom-8 flex items-center gap-2 opacity-40">
        <div className="size-5 border border-primary flex items-center justify-center text-primary text-[11px]">
          ◈
        </div>
        <span className="font-serif font-bold text-sm text-foreground">
          Rezervo
        </span>
      </div>
    </div>
  );
}
