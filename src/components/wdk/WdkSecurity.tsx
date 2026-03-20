import { Lock, KeyRound, EyeOff, ShieldCheck, AlertTriangle } from "lucide-react";
import { SectionTag } from "@/components/shared/SectionTag";
import { BRAND_NAME } from "@/constants/brand";

const securityItems = [
  {
    icon: KeyRound,
    title: "AES-256-GCM encryption",
    body: "Each agent seed phrase is encrypted with AES-256-GCM before being written to the database. The cipher uses a 12-byte random IV and produces a GCM auth tag, stored together as iv:authTag:ciphertext.",
  },
  {
    icon: Lock,
    title: "Server-side key derivation",
    body: "The encryption key is derived at runtime from the AGENT_ENCRYPTION_KEY environment variable via SHA-256. The key never leaves the server and is never stored in the database or logged.",
  },
  {
    icon: EyeOff,
    title: "In-memory only decryption",
    body: "Seed phrases are decrypted in memory solely for the duration of a transaction signing operation. After the transaction is broadcast, the plaintext is garbage collected. No seed phrase is ever returned to a client.",
  },
  {
    icon: ShieldCheck,
    title: "Service-secret authentication",
    body: "The WDK microservice requires an x-wdk-service-secret header on every request. This header is set by the Next.js app and validated by the service's auth middleware — direct public access is rejected.",
  },
];

export function WdkSecurity() {
  return (
    <section
      id="security"
      className="bg-sidebar border-y border-border py-14 sm:py-16 px-5 sm:px-12"
    >
      <div className="max-w-3xl mx-auto">
        <SectionTag className="mb-2.5">Security model</SectionTag>
        <h2 className="font-head text-[22px] sm:text-[32px] font-bold leading-[1.18] tracking-[-0.3px] mb-3">
          Encrypted at rest, never exposed
        </h2>
        <p className="text-[13.5px] sm:text-[14px] text-muted-foreground leading-[1.65] font-light mb-8 sm:mb-10 max-w-xl">
          Agent seed phrases are encrypted before storage and decrypted only
          when a transaction needs signing — never returned to clients or logged.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {securityItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-card border border-border rounded-[14px] p-4 sm:p-5 hover:border-(--border-med) transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-(--orange-dim) border border-(--orange-border) rounded-[9px] flex items-center justify-center mb-3">
                  <Icon size={14} className="text-(--orange)" strokeWidth={1.6} />
                </div>
                <h3 className="font-head text-[13.5px] sm:text-[14px] font-semibold mb-1.5">
                  {item.title}
                </h3>
                <p className="text-[12.5px] sm:text-[13px] text-muted-foreground leading-[1.65] font-light">
                  {item.body}
                </p>
              </div>
            );
          })}
        </div>

        {/* Encrypted seed format */}
        <div className="bg-background border border-border rounded-[14px] px-4 sm:px-5 py-4 mb-5">
          <p className="text-[11.5px] text-(--hint) mb-2 font-medium uppercase tracking-wide">
            Encrypted seed format (stored in DB)
          </p>
          <div className="font-mono text-[12px] sm:text-[12.5px] text-foreground break-all leading-[1.7]">
            <span className="text-(--orange)">{"<iv_hex>"}</span>
            <span className="text-(--hint)">:</span>
            <span className="text-(--green)">{"<auth_tag_hex>"}</span>
            <span className="text-(--hint)">:</span>
            <span className="text-foreground/70">{"<ciphertext_hex>"}</span>
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-(--hint)">
            <span>
              <span className="text-(--orange)">IV</span> — 12 bytes (24 hex chars)
            </span>
            <span>
              <span className="text-(--green)">Auth tag</span> — 16 bytes (32 hex chars)
            </span>
            <span>Ciphertext — variable length</span>
          </div>
        </div>

        {/* Responsibility note */}
        <div className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.18)] rounded-[12px] px-4 sm:px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={14}
              className="text-red-400 mt-0.5 shrink-0"
              strokeWidth={1.6}
            />
            <div>
              <div className="text-[13px] font-medium text-red-400 mb-1">
                Key compromise = wallet compromise
              </div>
              <p className="text-[12.5px] text-muted-foreground leading-[1.6] font-light">
                If your <code className="text-foreground font-mono text-[11.5px] bg-background px-1.5 py-0.5 rounded border border-border">AGENT_ENCRYPTION_KEY</code> is
                leaked, all encrypted seeds can be decrypted. Treat it as a root
                secret — rotate it immediately if compromised and contact {BRAND_NAME}
                support to re-encrypt affected agent wallets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
