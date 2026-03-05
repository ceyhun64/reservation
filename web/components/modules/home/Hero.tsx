import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <section className="relative min-h-svh flex flex-col justify-center  overflow-hidden">
      {/* Dekoratif dikey çizgi */}
      <div className="absolute top-0 right-20 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent hidden lg:block" />

      {/* Arka plan parlaması */}
      <div className="absolute inset-0 flex items-start justify-end pointer-events-none">
        <div className=" rounded-full bg-primary/5 blur-3xl -translate-y-1/4 translate-x-1/4" />
      </div>

      {/* İçerik */}
      <div className="relative max-w-3xl">
        <Badge
          variant="outline"
          className="mb-8 uppercase tracking-widest text-xs"
        >
          Randevu &amp; Rezervasyon Platformu
        </Badge>

        <h1 className="text-5xl md:text-7xl font-bold leading-[1.0] tracking-tight mb-8">
          İşletmenizi
          <br />
          <em className="text-primary not-italic">Dijitalleştirin.</em>
          <br />
          Randevuları
          <br />
          Yönetin.
        </h1>

        <p className="text-muted-foreground text-lg leading-relaxed max-w-md mb-10 font-light">
          Müşterileriniz kolayca randevu alsın, siz de tüm süreçleri tek bir
          panelden zahmetsizce yönetin.
        </p>

        <div className="flex gap-3 flex-wrap">
          <Button size="lg" asChild>
            <Link href="/auth/register">Hemen Başla — Ücretsiz</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#features">Nasıl Çalışır?</Link>
          </Button>
        </div>
      </div>

      {/* Randevu önizleme kartı */}
      <div className="hidden lg:block absolute right-24 top-1/2 -translate-y-[40%] w-72 rounded-lg border bg-card/90 backdrop-blur-xl p-6 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Yaklaşan Randevular
        </p>
        <div className="flex flex-col">
          {APPOINTMENTS.map((apt, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 py-3",
                i < APPOINTMENTS.length - 1 && "border-b border-border",
              )}
            >
              <span className="text-xs font-medium text-primary w-10 shrink-0">
                {apt.time}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">
                  {apt.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {apt.service}
                </p>
              </div>
              <div
                className={cn(
                  "size-2 rounded-full shrink-0",
                  apt.confirmed ? "bg-success" : "bg-warning",
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
