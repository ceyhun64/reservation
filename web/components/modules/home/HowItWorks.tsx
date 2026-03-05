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
      className="py-28 px-6 md:px-14 bg-muted/30 border-y border-border"
    >
      <div className="max-w-5xl mx-auto">
        <Badge
          variant="outline"
          className="mb-6 uppercase tracking-widest text-xs"
        >
          Nasıl Çalışır
        </Badge>
        <h2 className="text-4xl md:text-5xl font-bold mb-20">
          3 adımda başlayın
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {STEPS.map((step, i) => (
            <div key={i} className="relative">
              {/* Büyük numara — dekoratif */}
              <span className="text-7xl font-bold text-primary/10 leading-none block mb-5 select-none">
                {step.num}
              </span>

              <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-light mb-6">
                {step.desc}
              </p>

              <code className="text-xs text-primary bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-sm tracking-wide">
                {step.api}
              </code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
