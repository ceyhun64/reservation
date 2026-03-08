import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight } from "lucide-react";

export default function Banner() {
  return (
    <section className="relative py-36 px-6 md:px-14 overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="size-[600px] rounded-full bg-primary/4 blur-[120px]" />
      </div>

      {/* Border frame */}
      <div className="absolute inset-x-6 md:inset-x-14 inset-y-12 border border-border/40 rounded-2xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-12 bg-border/40" />
          <Badge
            variant="outline"
            className="uppercase tracking-[0.15em] text-[10px] border-border/60 text-muted-foreground/70 py-1.5 px-3"
          >
            Hemen Başlayın
          </Badge>
          <div className="h-px w-12 bg-border/40" />
        </div>

        <h2 className="text-[48px] md:text-[68px] font-bold leading-[1.0] tracking-[-0.03em] mb-6">
          İşletmeniz için
          <br />
          <span className="text-primary">en iyi randevu</span>
          <br />
          <span className="text-muted-foreground/35">sistemi.</span>
        </h2>

        <p className="text-[13px] text-muted-foreground/50 mb-10 tracking-wide uppercase font-medium">
          14 gün ücretsiz · Kredi kartı gerekmez · Hemen başlayın
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Button
            size="lg"
            asChild
            className="h-12 px-8 text-[11px] uppercase tracking-[0.12em] font-semibold"
          >
            <Link href="/auth/register">
              Ücretsiz Kaydol
              <ArrowUpRight className="size-3.5 ml-2" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-12 px-8 text-[11px] uppercase tracking-[0.12em] font-semibold border-border/60 text-muted-foreground hover:text-foreground"
          >
            <Link href="/auth/login">Giriş Yap</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
