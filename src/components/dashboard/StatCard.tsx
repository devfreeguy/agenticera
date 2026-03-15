import { cn } from "@/lib/utils";

type StatCardVariant = "green" | "orange" | "neutral" | "blue";

interface StatCardProps {
  label: string;
  value: string;
  unit: string;
  sub?: React.ReactNode;
  variant?: StatCardVariant;
}

const topBorder: Record<StatCardVariant, string> = {
  green: "before:bg-[var(--green)]",
  orange: "before:bg-[var(--orange)]",
  neutral: "before:bg-[rgba(255,255,255,0.17)]",
  blue: "before:bg-[#3b82f6]",
};

const valueColor: Record<StatCardVariant, string> = {
  green: "text-[var(--green)]",
  orange: "text-[var(--orange)]",
  neutral: "text-foreground",
  blue: "text-[#3b82f6]",
};

export function StatCard({ label, value, unit, sub, variant = "neutral" }: StatCardProps) {
  return (
    <div
      className={cn(
        "relative bg-sidebar border border-[var(--border-med)] rounded-[14px] px-4 pt-4 pb-3.5 overflow-hidden",
        "before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px]",
        topBorder[variant]
      )}
    >
      <div className="text-[10px] text-muted-foreground uppercase tracking-[.06em] mb-[9px]">{label}</div>
      <div className={cn("font-mono text-[20px] font-medium leading-none mb-1", valueColor[variant])}>{value}</div>
      <div className="font-mono text-[10px] text-[var(--hint)] mb-[5px]">{unit}</div>
      {sub && <div className="text-[11px] text-[var(--hint)]">{sub}</div>}
    </div>
  );
}
