import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const FOOTER_LINKS = [
  { label: "Gizlilik", href: "/privacy" },
  { label: "Kullanım Şartları", href: "/terms" },
  { label: "İletişim", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background pb-18">
      <div className="max-w-6xl mx-auto px-6 md:px-14 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Logo + telif */}
          <div className="flex items-center gap-2.5">
            <div className="size-6 border border-primary/40 flex items-center justify-center text-primary/60 text-xs">
              ◈
            </div>
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Rezervo. Tüm hakları saklıdır.
            </span>
          </div>

          {/* Linkler */}
          <nav className="flex items-center gap-1">
            {FOOTER_LINKS.map((link, i) => (
              <span key={link.href} className="flex items-center gap-1">
                {i > 0 && (
                  <Separator orientation="vertical" className="h-3 mx-1" />
                )}
                <Link
                  href={link.href}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
