import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Banner() {
  return (
    <section className="relative py-40 px-6 md:px-14 text-center overflow-hidden">
      {/* Arka plan halesi */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="size-[500px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto">
        <Badge
          variant="outline"
          className="mb-8 uppercase tracking-widest text-xs"
        >
          Hemen Başlayın
        </Badge>

        <h2 className="text-5xl md:text-7xl font-bold leading-[1.05] mb-6">
          İşletmeniz için
          <br />
          <em className="text-primary not-italic">en iyi randevu</em>
          <br />
          sistemi.
        </h2>

        <p className="text-muted-foreground text-base font-light mb-12">
          14 gün ücretsiz, kredi kartı gerekmez.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Button size="lg" asChild>
            <Link href="/auth/register">Ücretsiz Kaydol</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">Giriş Yap</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
