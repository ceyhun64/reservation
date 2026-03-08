import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

const APPOINTMENTS = [
  { time: "09:00", name: "Ayşe Kaya", service: "Saç Kesimi", confirmed: true },
  {
    time: "11:30",
    name: "Mehmet Al.",
    service: "Cilt Bakımı",
    confirmed: false,
  },
  { time: "14:00", name: "Zeynep Çe.", service: "Manikür", confirmed: true },
];

export default function Hero() {
  return (
    <section className="relative min-h-svh flex flex-col justify-center overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 right-1/4 size-96 rounded-full bg-primary/4 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 size-72 rounded-full bg-primary/3 blur-[80px] pointer-events-none" />

      {/* Vertical rule */}
      <div className="absolute top-0 right-24 bottom-0 w-px bg-gradient-to-b from-transparent via-border/40 to-transparent hidden lg:block" />

      <div className="relative max-w-3xl">
        <div className="flex items-center gap-3 mb-10">
          <Badge
            variant="outline"
            className="uppercase tracking-[0.15em] text-[10px] font-medium border-border/60 text-muted-foreground/70 py-1.5 px-3"
          >
            Randevu &amp; Rezervasyon Platformu
          </Badge>
          <div className="h-px flex-1 max-w-16 bg-border/40" />
        </div>

        <h1 className="text-[56px] md:text-[76px] font-bold leading-[1.0] tracking-[-0.03em] mb-8">
          İşletmenizi
          <br />
          <span className="text-primary">Dijitalleştirin.</span>
          <br />
          <span className="text-muted-foreground/40">Randevuları</span>
          <br />
          <span className="text-muted-foreground/40">Yönetin.</span>
        </h1>

        <p className="text-[15px] text-muted-foreground leading-relaxed max-w-md mb-10 font-light tracking-wide">
          Müşterileriniz kolayca randevu alsın, siz de tüm süreçleri tek bir
          panelden zahmetsizce yönetin.
        </p>

        <div className="flex gap-3 flex-wrap items-center">
          <Button
            size="lg"
            asChild
            className="h-11 px-6 text-[12px] uppercase tracking-widest font-semibold"
          >
            <Link href="/auth/register">
              Hemen Başla
              <ArrowUpRight className="size-3.5 ml-2" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            asChild
            className="h-11 px-6 text-[12px] uppercase tracking-widest font-semibold text-muted-foreground hover:text-foreground"
          >
            <Link href="#features">Nasıl Çalışır?</Link>
          </Button>

          {/* Social proof */}
          <div className="flex items-center gap-2 ml-2">
            <div className="flex -space-x-2">
              {["A", "B", "C"].map((l, i) => (
                <div
                  key={i}
                  className="size-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] font-bold text-muted-foreground"
                >
                  {l}
                </div>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground/60 tracking-wide">
              10K+ işletme
            </span>
          </div>
        </div>
      </div>

      {/* Appointment preview card */}
      <div className="hidden lg:block absolute right-24 top-1/2 -translate-y-[45%] w-[260px]">
        {/* Card header */}
        <div className="border border-border/70 rounded-lg bg-card/95 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/5">
          <div className="border-b border-border/50 px-4 py-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
              Bugünkü Randevular
            </span>
            <div className="flex gap-1">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span className="text-[9px] text-muted-foreground/50">Canlı</span>
            </div>
          </div>

          <div className="px-4 py-1">
            {APPOINTMENTS.map((apt, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 py-3",
                  i < APPOINTMENTS.length - 1 && "border-b border-border/30",
                )}
              >
                <span className="text-[11px] font-mono font-semibold text-primary w-10 shrink-0 tabular-nums">
                  {apt.time}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold leading-none truncate">
                    {apt.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-light">
                    {apt.service}
                  </p>
                </div>
                <div
                  className={cn(
                    "size-1.5 rounded-full shrink-0",
                    apt.confirmed ? "bg-emerald-400" : "bg-amber-400",
                  )}
                />
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 px-4 py-2.5 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/50 font-light">
                Toplam randevu
              </span>
              <span className="text-[11px] font-bold text-primary">3</span>
            </div>
          </div>
        </div>

        {/* Floating stat */}
        <div className="absolute -bottom-10 -left-10 border border-border/60 rounded-lg bg-card/95 backdrop-blur-xl px-4 py-3 shadow-xl shadow-black/5">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium mb-0.5">
            Bu Ay
          </p>
          <p className="text-[22px] font-bold leading-none text-foreground">
            +248
          </p>
          <p className="text-[10px] text-emerald-500 font-medium mt-0.5">
            ↑ %12 artış
          </p>
        </div>
      </div>
    </section>
  );
}
