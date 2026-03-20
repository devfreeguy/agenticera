import { BRAND_NAME } from "@/constants/brand";

const footLinks = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Docs", href: "/docs" },
  { label: "WDK", href: "/wdk" },
];

export function PublicFooter() {
  return (
    <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 sm:px-12 py-5.5 border-t border-border text-[12px] text-(--hint)">
      <span>© {new Date().getFullYear()} {BRAND_NAME}</span>
      <div className="flex gap-6">
        {footLinks.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="hover:text-muted-foreground transition-colors duration-150"
          >
            {l.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
