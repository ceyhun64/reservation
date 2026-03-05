"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATS = [
  { value: "10K+", label: "Aktif İşletme" },
  { value: "500K+", label: "Rezervasyon" },
  { value: "98%", label: "Memnuniyet" },
  { value: "24/7", label: "Destek" },
];

const FEATURES = [
  {
    icon: "◈",
    title: "Anlık Rezervasyon",
    desc: "Müşterileriniz 7/24 online randevu alabilir, sistem otomatik onay gönderir.",
  },
  {
    icon: "◉",
    title: "İşletme Yönetimi",
    desc: "Birden fazla işletmenizi tek panelden yönetin, hizmetlerinizi kolayca düzenleyin.",
  },
  {
    icon: "◍",
    title: "Hizmet Kataloğu",
    desc: "Tüm hizmetlerinizi listeleyin, süre ve fiyat bilgilerini müşterilerinizle paylaşın.",
  },
  {
    icon: "◎",
    title: "Randevu Takibi",
    desc: "Bekleyen, onaylanan ve iptal edilen randevularınızı gerçek zamanlı takip edin.",
  },
];

export default function Properties() {
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Stats Bar */}
      <section className="border-y border-border">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center justify-center py-10 px-6 gap-1",
                i < STATS.length - 1 && "border-r border-border",
              )}
            >
              <span className="text-4xl font-bold text-primary leading-none">
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground tracking-widest uppercase">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-28 px-6 md:px-14">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <Badge
              variant="outline"
              className="mb-6 uppercase tracking-widest text-xs"
            >
              Özellikler
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Her şey tek bir
              <em className="text-primary not-italic"> platformda</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border border-border rounded-lg overflow-hidden">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={cn(
                  "p-8 transition-colors duration-200 cursor-default border-border",
                  i % 2 === 0 && "md:border-r",
                  i < 2 && "border-b",
                  activeFeature === i
                    ? "bg-accent"
                    : "bg-card hover:bg-muted/50",
                )}
                onMouseEnter={() => setActiveFeature(i)}
              >
                <span className="text-2xl text-primary block mb-5">
                  {f.icon}
                </span>
                <div className="w-8 h-px bg-border mb-5" />
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-light">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
