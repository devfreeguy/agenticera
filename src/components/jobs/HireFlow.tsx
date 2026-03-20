"use client";

import {
  AGENT_ESCROW_ABI,
  AGENT_ESCROW_ADDRESS,
  USDT_CONTRACT_ADDRESS,
  USDT_DECIMALS,
} from "@/constants/contracts";
import { USDT_ABI } from "@/constants/usdtAbi";
import { AgentStatus } from "@/generated/prisma/enums";
import axiosClient from "@/lib/axiosClient";
import {
  clearJobCallbacks,
  setJobCallbacks,
  startJobPoll,
  stopJobPoll,
} from "@/lib/backgroundPolls";
import { useJobStore } from "@/store/jobStore";
import type { AgentPublic, JobWithRelations, WalletUser } from "@/types/index";
import { getAvatarColor } from "@/utils/avatarColor";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import { HireStep1Detail } from "./hire/HireStep1Detail";
import { HireStep2Task } from "./hire/HireStep2Task";
import { HireStep3Pay } from "./hire/HireStep3Pay";
import { HireStep5Running } from "./hire/HireStep5Running";
import { HireStep6Delivered } from "./hire/HireStep6Delivered";

export type HireStep =
  | "detail"
  | "describe"
  | "review"
  | "waiting"
  | "running"
  | "delivered";

interface HireFlowProps {
  agent: AgentPublic;
  user: WalletUser | null;
  step: HireStep;
  onStepChange: (step: HireStep) => void;
  onClose: () => void;
  onJobAdded: (job: JobWithRelations) => void;
  showToast: (msg: string) => void;
  initialJobId?: string;
  initialTaskDescription?: string;
}

export function HireFlow({
  agent,
  user,
  step,
  onStepChange,
  onClose,
  onJobAdded,
  showToast,
  initialJobId,
  initialTaskDescription,
}: HireFlowProps) {
  const router = useRouter();
  const isActive = agent.status === AgentStatus.ACTIVE;
  const avatarBg = getAvatarColor(agent.id);
  const initial = agent.name.charAt(0).toUpperCase();

  const [taskDescription, setTaskDescription] = useState(initialTaskDescription || "");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<JobWithRelations | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const { addJob, setActiveJobId: setGlobalActiveJobId } =
    useJobStore.getState();

  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const isBase = chainId === base.id;

  const amountInWei = BigInt(
    Math.round(parseFloat(agent.pricePerTask) * 10 ** USDT_DECIMALS),
  );

  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: USDT_CONTRACT_ADDRESS as `0x${string}`,
    abi: USDT_ABI,
    functionName: "allowance",
    args: [
      (user?.walletAddress as `0x${string}`) ||
        "0x0000000000000000000000000000000000000000",
      AGENT_ESCROW_ADDRESS,
    ],
    chainId: base.id,
    query: {
      enabled: !!user?.walletAddress,
    },
  });

  const hasAllowance = allowanceData
    ? (allowanceData as bigint) >= amountInWei
    : false;

  const {
    writeContract,
    writeContractAsync,
    data: writeTxHash,
    isPending: isWalletPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isReceiptLoading,
    isSuccess: isReceiptSuccess,
    isError: isReceiptError,
  } = useWaitForTransactionReceipt({ hash: writeTxHash, chainId: base.id });

 const hasRunRef = useRef(false);
  const prevJobIdRef = useRef<string | null>(initialJobId || null);
  const [isQuoting, setIsQuoting] = useState(false); // New state for Quote Loading

  // Reset local state when returning to detail
  useEffect(() => {
    if (step === "detail") {
      if (prevJobIdRef.current) {
        stopJobPoll(prevJobIdRef.current);
        prevJobIdRef.current = null;
      }
      setTaskDescription(initialTaskDescription || "");
      if (!initialJobId) {
        setActiveJobId(null);
        setActiveJob(null);
      }
      setError(null);
      setIsSubmitting(false);
      setIsQuoting(false);
      resetWrite();
      hasRunRef.current = false;
    }
  }, [step]);

  // Handle successful transaction receipts (Approve ONLY)
  useEffect(() => {
    if (!isReceiptSuccess || !writeTxHash || !user || isSubmitting) return;

    if (isApproving) {
      // Finished approving, now trigger the actual payment
      setIsApproving(false);
      refetchAllowance().then(() => {
        resetWrite();
        // The job is already secured in Vault 1. Go straight to Vault 2.
        handleExecutePayment(prevJobIdRef.current!); 
      });
    }
    // We completely deleted the old createAndConfirm block here. Vault 1 handles it now!
  }, [isReceiptSuccess, writeTxHash]);

  // Start background polling when entering "running" step
  useEffect(() => {
    if (step !== "running" || !activeJobId) return;

    if (!hasRunRef.current) {
      hasRunRef.current = true;
      axiosClient
        .post(`/api/jobs/${activeJobId}/run`)
        .catch((err) => console.error("[HireFlow] /run failed:", err));
    }

    startJobPoll(activeJobId);
    setJobCallbacks(activeJobId, {
      onDelivered: (job) => {
        setActiveJob(job);
        onStepChange("delivered");
      },
      onFailed: (job) => {
        setActiveJob(job);
        // 🔥 FIX: Move to delivered page so they can see the rejection/fail reason!
        onStepChange("delivered");
      },
    });

    return () => {
      if (activeJobId) clearJobCallbacks(activeJobId);
    };
  }, [step, activeJobId]);

  // =========================================================
  // VAULT 1: THE QUOTE (Ask the AI before touching the wallet)
  // =========================================================
  async function handlePayWithWallet() {
    if (!user) {
      router.push("/connect");
      return;
    }
    resetWrite();
    setError(null);
    setIsQuoting(true); // Show loading spinner on the button

    let pendingJobId;
    try {
      const dbResponse = await fetch("/api/hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: user.id,
          agentId: agent.id,
          taskDescription: taskDescription,
          priceUsdt: agent.pricePerTask, 
        }),
      });

      const data = await dbResponse.json();

      if (!dbResponse.ok) {
        // AI Rejected it! Throw the AI's reason.
        throw new Error(data.reason || data.error || "Agent declined the task.");
      }
      
      pendingJobId = data.jobId;
      prevJobIdRef.current = pendingJobId; // Save it for later

    } catch (err: any) {
      setError(err.message); // Displays "Agent Rejected: Not profitable" on the UI
      setIsQuoting(false);
      return; // STOP FLOW. Wallet never opens.
    }

    setIsQuoting(false);

    // AI Accepted. Now we secure the funds.
    // 🛠️ DEV MODE: skip wallet approval entirely — go straight to fake payment
    if (process.env.NODE_ENV === "development") {
      setIsApproving(false);
      handleExecutePayment(pendingJobId);
      return;
    }

    if (!hasAllowance) {
      setIsApproving(true);
      writeContract({
        address: USDT_CONTRACT_ADDRESS as `0x${string}`,
        abi: USDT_ABI,
        functionName: "approve",
        args: [AGENT_ESCROW_ADDRESS, amountInWei],
        chainId: base.id,
      });
    } else {
      setIsApproving(false);
      handleExecutePayment(pendingJobId);
    }
  }

  // =========================================================
  // VAULT 2 & 3: ESCROW HANDSHAKE & AI WAKE UP
  // =========================================================
  async function handleExecutePayment(jobId: string) {
    resetWrite();
    setError(null);
    setIsSubmitting(true);

    // 1. ADD THIS DEV MODE BYPASS
    if (process.env.NODE_ENV === "development") {
      console.log("🛠️ DEV MODE: Skipping MetaMask...");
      const fakeTxHash =
        "0x" + Math.random().toString(16).slice(2, 66).padEnd(64, "0");

      try {
        // Setup UI for running state before triggering the backend
        setActiveJobId(jobId);
        setGlobalActiveJobId(jobId);
        onStepChange("running");

        const execResponse = await fetch("/api/jobs/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: jobId, txHash: fakeTxHash }),
        });

        if (!execResponse.ok) throw new Error("Execution trigger failed");
      } catch (err) {
        setError(
          "Dev Mode: Execution trigger failed. Check backend logs.",
        );
        setIsSubmitting(false);
      }
      return; // Stop execution here!
    }

    let txHash;
    try {
      txHash = await writeContractAsync({
        address: AGENT_ESCROW_ADDRESS,
        abi: AGENT_ESCROW_ABI,
        functionName: "createJob",
        args: [
          agent.walletAddress as `0x${string}`,
          USDT_CONTRACT_ADDRESS as `0x${string}`,
          amountInWei,
        ],
        chainId: base.id,
      });
    } catch (err) {
      setError("Payment cancelled. You can retry from your dashboard.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Setup UI for running state before triggering the backend
      setActiveJobId(jobId);
      setGlobalActiveJobId(jobId);
      onStepChange("running");

      const execResponse = await fetch("/api/jobs/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: jobId, txHash }),
      });

      if (!execResponse.ok) throw new Error("Execution trigger failed");

    } catch (err) {
      setError("Payment secured, but agent is taking long to respond. Check dashboard.");
      setIsSubmitting(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("Copied to clipboard"));
  }

  const isMining = !!writeTxHash && isReceiptLoading;
  const isConfirming = isReceiptSuccess && (isSubmitting || isApproving);
  const isBusy = isWalletPending || isMining || isConfirming;
  const isApprovingState = isApproving || (!hasAllowance && isBusy);

  const payError = writeError
    ? writeError.message.includes("User rejected") ||
      writeError.message.includes("user rejected")
      ? "Transaction rejected. Please try again."
      : writeError.message
    : isReceiptError
      ? "Transaction failed on-chain. Please try again."
      : error;

  const shortTxHash = writeTxHash
    ? writeTxHash.slice(0, 10) + "…" + writeTxHash.slice(-8)
    : "";

  if (step === "detail") {
    return (
      <HireStep1Detail
        agent={agent}
        isActive={isActive}
        avatarBg={avatarBg}
        initial={initial}
        onHire={() => onStepChange("describe")}
        copyText={copyText}
      />
    );
  }

  if (step === "describe") {
    return (
      <HireStep2Task
        agent={agent}
        taskDescription={taskDescription}
        onTaskChange={setTaskDescription}
        onBack={() => onStepChange("detail")}
        onContinue={() => onStepChange("review")}
      />
    );
  }

  if (step === "review") {
    return (
      <HireStep3Pay
        agent={agent}
        taskDescription={taskDescription}
        isWalletPending={isWalletPending}
        isMining={isMining}
        isConfirming={isConfirming}
        isBusy={isBusy}
        isApprovingState={isApprovingState}
        isBase={isBase}
        isSwitching={isSwitching}
        writeTxHash={writeTxHash}
        payError={payError}
        shortTxHash={shortTxHash}
        onBack={() => {
          resetWrite();
          setError(null);
          setIsApproving(false);
          onStepChange("describe");
        }}
        onPay={handlePayWithWallet}
        onSwitchChain={() => switchChain({ chainId: base.id })}
        isQuoting={isQuoting}
      />
    );
  }

  if (step === "running") {
    return <HireStep5Running agent={agent} />;
  }

  if (step === "delivered" && activeJob) {
    return (
      <HireStep6Delivered
        agent={agent}
        avatarBg={avatarBg}
        initial={initial}
        activeJob={activeJob}
        copyText={copyText}
        onHireAgain={() => {
          setTaskDescription("");
          onStepChange("describe");
        }}
        onDashboard={() => router.push("/dashboard")}
      />
    );
  }

  if (step === "delivered") {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-[13px]">
        Loading result…
      </div>
    );
  }

  return null;
}
