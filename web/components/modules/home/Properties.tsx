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
    num: "01",
    icon: "◈",
    title: "Anlık Rezervasyon",
    desc: "Müşterileriniz 7/24 online randevu alabilir, sistem otomatik onay gönderir.",
    tag: "Otomasyon",
  },
  {
    num: "02",
    icon: "◉",
    title: "İşletme Yönetimi",
    desc: "Birden fazla işletmenizi tek panelden yönetin, hizmetlerinizi kolayca düzenleyin.",
    tag: "Yönetim",
  },
  {
    num: "03",
    icon: "◍",
    title: "Hizmet Kataloğu",
    desc: "Tüm hizmetlerinizi listeleyin, süre ve fiyat bilgilerini müşterilerinizle paylaşın.",
    tag: "Katalog",
  },
  {
    num: "04",
    icon: "◎",
    title: "Randevu Takibi",
    desc: "Bekleyen, onaylanan ve iptal edilen randevularınızı gerçek zamanlı takip edin.",
    tag: "Takip",
  },
];

export default function Properties() {
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Stats Bar */}
      <section className="border-y border-border/60">
        <div className="max-w-6xl mx-auto px-6 md:px-14">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/60">
            {STATS.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center py-10 px-6 gap-1.5"
              >
                <span className="text-[42px] font-bold text-foreground leading-none tracking-tighter">
                  {stat.value}
                </span>
                <span className="text-[10px] text-muted-foreground/50 tracking-[0.15em] uppercase font-medium">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-28 px-6 md:px-14">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-16 flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Badge
                  variant="outline"
                  className="uppercase tracking-[0.15em] text-[10px] border-border/60 text-muted-foreground/70 py-1.5 px-3"
                >
                  Özellikler
                </Badge>
                <div className="h-px w-12 bg-border/40" />
              </div>
              <h2 className="text-[42px] md:text-[52px] font-bold leading-[1.05] tracking-[-0.025em]">
                Her şey tek bir
                <br />
                <span className="text-muted-foreground/35">platformda.</span>
              </h2>
            </div>

            {/* Progress indicators */}
            <div className="flex gap-2">
              {FEATURES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFeature(i)}
                  className={cn(
                    "h-0.5 rounded-full transition-all duration-500",
                    activeFeature === i
                      ? "w-8 bg-primary"
                      : "w-3 bg-border hover:bg-muted-foreground/30",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 border border-border/60 rounded-xl overflow-hidden">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={cn(
                  "p-8 transition-all duration-300 cursor-default",
                  "border-border/40",
                  i % 2 === 0 && "md:border-r",
                  i < 2 && "border-b",
                  activeFeature === i
                    ? "bg-primary/[0.03]"
                    : "bg-card hover:bg-muted/30",
                )}
                onMouseEnter={() => setActiveFeature(i)}
              >
                <div className="flex items-start justify-between mb-6">
                  <span className="text-[10px] font-mono text-muted-foreground/40 tracking-widest">
                    {f.num}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium uppercase tracking-widest px-2 py-1 rounded border transition-colors duration-300",
                      activeFeature === i
                        ? "border-primary/30 text-primary bg-primary/5"
                        : "border-border/40 text-muted-foreground/40",
                    )}
                  >
                    {f.tag}
                  </span>
                </div>

                <span
                  className={cn(
                    "text-3xl block mb-5 transition-colors duration-300",
                    activeFeature === i
                      ? "text-primary"
                      : "text-muted-foreground/20",
                  )}
                >
                  {f.icon}
                </span>

                <div className="w-6 h-px bg-border/40 mb-5" />

                <h3 className="text-[18px] font-semibold mb-3 tracking-tight">
                  {f.title}
                </h3>
                <p className="text-[13px] text-muted-foreground/60 leading-relaxed font-light">
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
