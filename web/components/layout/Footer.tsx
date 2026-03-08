import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const FOOTER_LINKS = [
  { label: "Gizlilik", href: "/privacy" },
  { label: "Kullanım Şartları", href: "/terms" },
  { label: "İletişim", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background pb-20">
      <div className="max-w-6xl mx-auto px-6 md:px-14 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Logo + telif */}
          <div className="flex items-center gap-3">
            <div className="size-5 border border-primary/50 flex items-center justify-center text-primary/70 text-[10px] rotate-45">
              ◈
            </div>
            <span className="text-[11px] tracking-widest uppercase text-muted-foreground/60 font-medium">
              © {new Date().getFullYear()} Rezervo
            </span>
          </div>

          {/* Linkler */}
          <nav className="flex items-center gap-1">
            {FOOTER_LINKS.map((link, i) => (
              <span key={link.href} className="flex items-center gap-1">
                {i > 0 && (
                  <span className="w-px h-3 bg-border/60 mx-2 inline-block" />
                )}
                <Link
                  href={link.href}
                  className="text-[11px] uppercase tracking-wider text-muted-foreground/50 hover:text-foreground transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
