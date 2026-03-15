import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function DeployAgentCard() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/onboarding")}
      className="group w-full bg-transparent border border-dashed border-[var(--border-med)] rounded-[14px] flex flex-col items-center justify-center min-h-[210px] cursor-pointer transition-all duration-200 hover:border-[var(--orange-border)] hover:bg-[var(--orange-dim)]"
    >
      <div className="w-[38px] h-[38px] rounded-full bg-card border border-[var(--border-med)] flex items-center justify-center mb-[11px] transition-all duration-200 group-hover:bg-[var(--orange-dim)] group-hover:border-[var(--orange-border)]">
        <Plus size={18} className="text-muted-foreground group-hover:text-[var(--orange)]" />
      </div>
      <div className="font-head text-[13px] font-semibold mb-1">Deploy new agent</div>
      <div className="text-[12px] text-muted-foreground">~5 min · Real USDT wallet</div>
    </button>
  );
}
