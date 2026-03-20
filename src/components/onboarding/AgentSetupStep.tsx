"use client";

import { useState } from "react";
import { ChevronLeft, AlertCircle } from "lucide-react";
import { isAxiosError } from "axios";
import axiosClient from "@/lib/axiosClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SectionTag } from "@/components/shared/SectionTag";
import { DeployingState } from "@/components/onboarding/DeployingState";
import { DeploySuccessState } from "@/components/onboarding/DeploySuccessState";
import { cn } from "@/lib/utils";
import { useAgentStore } from "@/store/agentStore";
import { useCategories } from "@/hooks/useCategories";
import type { AgentPublic } from "@/types/index";

type SubStep = 1 | 2 | 3;
type ViewState = "form" | "deploying" | "success" | "error";

interface FormData {
  name: string;
  prompt: string;
  price: string;
  categories: string[];
}

interface AgentSetupStepProps {
  onBack: () => void;
  onProgressChange: (step: 2 | 3) => void;
  ownerId: string;
  walletAddress: string;
  isClientAlso: boolean;
  hideStepLabel?: boolean;
}

const SUB_LABELS: Record<SubStep, string> = {
  1: "Identity",
  2: "Pricing",
  3: "Review",
};

export function AgentSetupStep({
  onBack,
  onProgressChange,
  ownerId,
  walletAddress,
  isClientAlso,
  hideStepLabel = false,
}: AgentSetupStepProps) {
  const addAgent = useAgentStore((s) => s.addAgent);
  const { categories, isLoading: isCategoriesLoading } = useCategories();
  const [subStep, setSubStep] = useState<SubStep>(1);
  const [view, setView] = useState<ViewState>("form");
  const [deployedWallet, setDeployedWallet] = useState("");
  const [deployError, setDeployError] = useState("");
  const [form, setForm] = useState<FormData>({
    name: "",
    prompt: "",
    price: "5.00",
    categories: [],
  });

  function goToSS(n: SubStep) {
    setSubStep(n);
    onProgressChange(n === 3 ? 3 : 2);
  }

  function toggleCategory(cat: string) {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  }

  async function handleDeployAnimComplete() {
    if (!ownerId) {
      setDeployError("User account not ready. Please refresh and try again.");
      setView("error");
      return;
    }

    console.log("[deploy] ownerId (DB id):", ownerId, "walletAddress:", walletAddress);

    let agent: AgentPublic;
    try {
      const agentRes = await axiosClient.post<{ data: AgentPublic }>("/api/agents", {
        ownerId,
        name: form.name || "Unnamed Agent",
        systemPrompt: form.prompt,
        pricePerTask: parseFloat(form.price) || 5,
        categories: form.categories,
      });
      agent = agentRes.data.data;
      setDeployedWallet(agent.walletAddress);
      addAgent(agent);
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data?.error ?? "Failed to deploy agent")
        : "Failed to deploy agent";
      setDeployError(message);
      setView("error");
      return;
    }

    try {
      const role = isClientAlso ? "BOTH" : "OWNER";
      await axiosClient.patch(`/api/users/me?walletAddress=${walletAddress}`, { role });
    } catch {
      // non-critical, continue to success
    }

    setView("success");
  }

  const nameLen = form.name.length;
  const promptLen = form.prompt.length;
  const reviewPrompt =
    form.prompt.length > 72
      ? form.prompt.slice(0, 72) + "…"
      : form.prompt || "No prompt set";
  const reviewCats =
    form.categories.length > 0
      ? form.categories.map(
          (v) => categories.find((c) => c.slug === v)?.name ?? v,
        )
      : [];

  return (
    <div className="w-full max-w-145 mx-auto animate-fade-up">
      {!hideStepLabel && <SectionTag className="block text-center mb-2">Step 2 of 3</SectionTag>}
      <h2 className="font-head text-[26px] font-bold text-center leading-[1.2] tracking-[-0.2px] mb-2.5">
        Configure your agent
      </h2>
      <p className="text-[14px] text-muted-foreground text-center leading-[1.65] max-w-105 mx-auto mb-6 font-light">
        Define what your agent does, how it responds, and what it charges. You
        can edit this anytime.
      </p>

      {/* Form card */}
      <div className="bg-sidebar border border-(--border-med) rounded-[18px] px-7 py-8">
        {/* Sub-step header — hidden when deploying/success */}
        {view === "form" && (
          <div className="flex items-center gap-2.5 mb-6 pb-5 border-b border-border">
            <div className="flex gap-1.5">
              {([1, 2, 3] as SubStep[]).map((n) => (
                <div
                  key={n}
                  className={cn(
                    "w-6 h-1 rounded-sm transition-all duration-250",
                    n < subStep
                      ? "bg-[rgba(34,197,94,0.4)]"
                      : n === subStep
                        ? "bg-(--orange)"
                        : "bg-secondary",
                  )}
                />
              ))}
            </div>
            <span className="text-[12px] text-muted-foreground ml-auto">
              {SUB_LABELS[subStep]}
            </span>
          </div>
        )}

        {/* ── Sub-step 1: Identity ── */}
        {view === "form" && subStep === 1 && (
          <div>
            {/* Agent name */}
            <div className="mb-5">
              <div className="flex justify-between items-baseline mb-1.75">
                <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-[.05em]">
                  Agent name
                </label>
                <span
                  className={cn(
                    "font-mono text-[11px] transition-colors duration-150",
                    nameLen > 50 * 0.85 ? "text-(--orange)" : "text-(--hint)",
                  )}
                >
                  {nameLen} / 50
                </span>
              </div>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                maxLength={50}
                placeholder="e.g. ResearchBot-7"
              />
            </div>

            {/* System prompt */}
            <div className="mb-5">
              <div className="flex justify-between items-baseline mb-1.75">
                <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-[.05em]">
                  System prompt
                </label>
                <span
                  className={cn(
                    "font-mono text-[11px] transition-colors duration-150",
                    promptLen > 4000 * 0.85
                      ? "text-(--orange)"
                      : "text-(--hint)",
                  )}
                >
                  {promptLen} / 4000
                </span>
              </div>
              <Textarea
                value={form.prompt}
                onChange={(e) =>
                  setForm((p) => ({ ...p, prompt: e.target.value }))
                }
                rows={6}
                maxLength={4000}
                placeholder="You are a research specialist. When given a topic, you produce a structured report with: an executive summary, 3–5 key findings with sources, and a competitor landscape. You are concise, factual, and always cite your sources."
              />
            </div>

            <div className="flex gap-2.5 mt-5">
              <Button variant="secondary" size="md" onClick={onBack}>
                <ChevronLeft size={14} />
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => goToSS(2)}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* ── Sub-step 2: Pricing ── */}
        {view === "form" && subStep === 2 && (
          <div>
            {/* Price */}
            <div className="mb-5">
              <label className="block text-[12px] font-medium text-muted-foreground uppercase tracking-[.05em] mb-1.75">
                Price per task (USDT)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price: e.target.value }))
                  }
                  min={0.5}
                  max={999}
                  step={0.5}
                  className="pr-16"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[12px] text-muted-foreground bg-secondary border border-border rounded px-2 py-0.5">
                  USDT
                </span>
              </div>
            </div>

            {/* Categories */}
            <div className="mb-5">
              <label className="block text-[12px] font-medium text-muted-foreground uppercase tracking-[.05em] mb-1.75">
                Task categories
              </label>
              {isCategoriesLoading ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 rounded-full bg-secondary animate-pulse"
                      style={{ width: `${64 + (i % 3) * 20}px` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isSelected = form.categories.includes(cat.slug);
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => toggleCategory(cat.slug)}
                        className={cn(
                          "px-3.5 py-1.75 rounded-full border text-[12px] cursor-pointer transition-all duration-150 select-none",
                          isSelected
                            ? "bg-(--orange-dim) border-(--orange) text-(--orange) font-medium"
                            : "bg-card border-(--border-med) text-muted-foreground hover:border-(--orange-border) hover:text-foreground",
                        )}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2.5 mt-5">
              <Button variant="secondary" size="md" onClick={() => goToSS(1)}>
                <ChevronLeft size={14} />
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => goToSS(3)}
              >
                Review
              </Button>
            </div>
          </div>
        )}

        {/* ── Sub-step 3: Review + Deploy ── */}
        {view === "form" && subStep === 3 && (
          <div>
            {/* Review block */}
            <div className="bg-card border border-border rounded-xl px-4.5 py-3.5 mb-3">
              {[
                {
                  key: "Agent name",
                  val: form.name || "Unnamed Agent",
                  mono: false,
                },
                {
                  key: "Prompt preview",
                  val: reviewPrompt,
                  mono: false,
                  muted: true,
                  small: true,
                },
                {
                  key: "Price",
                  val: `${parseFloat(form.price || "5").toFixed(2)} USDT / task`,
                  mono: true,
                },
              ].map((row) => (
                <div
                  key={row.key}
                  className="flex items-start justify-between gap-4 py-1.75 border-b border-border last:border-b-0"
                >
                  <span className="text-[12px] text-muted-foreground shrink-0 w-25 pt-px">
                    {row.key}
                  </span>
                  <span
                    className={cn(
                      "text-right leading-normal",
                      row.mono ? "font-mono text-[12px]" : "text-[13px]",
                      row.muted
                        ? "text-muted-foreground text-[12px]"
                        : "text-foreground",
                    )}
                  >
                    {row.val}
                  </span>
                </div>
              ))}

              {/* Categories */}
              <div className="flex items-start justify-between gap-4 py-1.75 border-b border-border">
                <span className="text-[12px] text-muted-foreground shrink-0 w-25 pt-px">
                  Categories
                </span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {reviewCats.map((c) => (
                    <Badge key={c} variant="orange">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Wallet */}
              <div className="flex items-start justify-between gap-4 py-1.75">
                <span className="text-[12px] text-muted-foreground shrink-0 w-25 pt-px">
                  Wallet
                </span>
                <span className="font-mono text-[12px] text-muted-foreground">
                  Will be generated on deploy
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <Button variant="secondary" size="md" onClick={() => goToSS(2)}>
                <ChevronLeft size={14} />
                Edit
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                disabled={!ownerId}
                onClick={() => setView("deploying")}
              >
                {ownerId ? "Deploy agent" : "Loading account…"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Deploying state ── */}
        {view === "deploying" && (
          <DeployingState onComplete={handleDeployAnimComplete} />
        )}

        {/* ── Success state ── */}
        {view === "success" && (
          <DeploySuccessState walletAddress={deployedWallet} />
        )}

        {/* ── Error state ── */}
        {view === "error" && (
          <div className="flex flex-col items-center px-5 pt-7 pb-6 text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.22)] flex items-center justify-center">
              <AlertCircle
                size={22}
                className="text-red-500"
                strokeWidth={1.8}
              />
            </div>
            <div className="font-head text-[18px] font-bold">Deploy failed</div>
            <p className="text-[13px] text-muted-foreground font-light leading-[1.6] max-w-[320px]">
              {deployError}
            </p>
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              onClick={() => {
                setView("form");
                setSubStep(3);
              }}
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
