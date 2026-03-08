import { Badge } from "@/components/ui/badge";

const STEPS = [
  {
    num: "01",
    title: "Kayıt Olun",
    desc: "İşletmenizi sisteme ekleyin, hizmetlerinizi ve çalışma saatlerinizi tanımlayın.",
    api: "POST /api/Auth/register",
  },
  {
    num: "02",
    title: "Hizmet Ekleyin",
    desc: "Sunduğunuz hizmetleri, sürelerini ve fiyatlarını kataloglayın.",
    api: "POST /api/Service",
  },
  {
    num: "03",
    title: "Randevu Alın",
    desc: "Müşterileriniz online rezervasyon yapsın, siz onaylayın veya iptal edin.",
    api: "POST /api/Appointment",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how"
      className="py-28 px-6 md:px-14 border-y border-border/60 bg-muted/[0.02]"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-20 flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Badge
                variant="outline"
                className="uppercase tracking-[0.15em] text-[10px] border-border/60 text-muted-foreground/70 py-1.5 px-3"
              >
                Nasıl Çalışır
              </Badge>
              <div className="h-px w-12 bg-border/40" />
            </div>
            <h2 className="text-[42px] md:text-[52px] font-bold leading-[1.05] tracking-[-0.025em]">
              3 adımda
              <br />
              <span className="text-muted-foreground/35">başlayın.</span>
            </h2>
          </div>

          {/* Connector line */}
          <div className="hidden md:flex items-center gap-0">
            {STEPS.map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="size-2 rounded-full border border-border" />
                {i < STEPS.length - 1 && (
                  <div className="w-16 h-px bg-border/60" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border/60 rounded-xl overflow-hidden">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className={[
                "p-8 relative group hover:bg-muted/30 transition-colors duration-200",
                i < STEPS.length - 1 ? "border-r border-border/60" : "",
              ].join(" ")}
            >
              {/* Step number — large watermark */}
              <span className="absolute top-6 right-6 text-[64px] font-black text-primary/[0.04] leading-none select-none group-hover:text-primary/[0.07] transition-colors">
                {step.num}
              </span>

              <div className="mb-8">
                <span className="text-[10px] font-mono font-semibold text-primary/50 tracking-[0.2em]">
                  {step.num}
                </span>
              </div>

              <h3 className="text-[20px] font-semibold mb-3 tracking-tight">
                {step.title}
              </h3>

              <p className="text-[13px] text-muted-foreground/60 leading-relaxed font-light mb-8">
                {step.desc}
              </p>

              <code className="text-[10px] text-primary/70 bg-primary/[0.04] border border-primary/10 px-3 py-1.5 rounded font-mono tracking-wide">
                {step.api}
              </code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
