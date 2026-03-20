import { useCallback, useEffect, useRef } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useUserStore } from "@/store/userStore";
import { useAgentStore } from "@/store/agentStore";
import { useJobStore } from "@/store/jobStore";
import { useTransactionStore } from "@/store/transactionStore";

// This exists outside the React render cycle. When 12 components mount at the exact
// same millisecond, the first one flips this to true, and the other 11 instantly abort.
let isGlobalAuthTriggered = false;

export function useUser() {
  const { address, isConnected, status } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const {
    user,
    isLoading,
    hydrated,
    hasAttemptedAuth,
    clearUser,
    syncUser,
    fetchUser,
    markOnboarded,
    setHasAttemptedAuth,
  } = useUserStore();
  const clearAgents = useAgentStore((s) => s.clearAgents);
  const clearJobs = useJobStore((s) => s.clearJobs);
  const clearTransactions = useTransactionStore((s) => s.clearTransactions);

  const isHydrated = status !== "connecting" && status !== "reconnecting";
  const previousAddress = useRef<string | undefined>(undefined);

  const signMessageRef = useRef(signMessageAsync);
  useEffect(() => {
    signMessageRef.current = signMessageAsync;
  }, [signMessageAsync]);

  const signIn = useCallback(
    async (walletAddress: string) => {
      try {
        await syncUser(walletAddress, signMessageRef.current);
      } catch (error) {
        // If the user rejects the signature in MetaMask, unlock it so they can try again later
        isGlobalAuthTriggered = false;
        setHasAttemptedAuth(false);
      }
    },
    [syncUser, setHasAttemptedAuth],
  );

  // Re-fetch existing user / Trigger Sign-In
  useEffect(() => {
    // If another component already triggered this, OR we've already tried, hit the brakes!
    if (isGlobalAuthTriggered || hasAttemptedAuth) return;

    if (isConnected && address && isHydrated && !user && !isLoading) {
      isGlobalAuthTriggered = true; // 🔒 Lock it instantly for all other components
      setHasAttemptedAuth(true); // Update Zustand for UI consistency

      const run = async () => {
        await fetchUser(address);

        // Use getState() to get the freshest data immediately after fetch
        const currentUser = useUserStore.getState().user;
        if (!currentUser) {
          await signIn(address);
        }
      };
      run();
    }
  }, [
    isConnected,
    address,
    isHydrated,
    user,
    isLoading,
    hasAttemptedAuth,
    fetchUser,
    signIn,
    setHasAttemptedAuth,
  ]);

  // Wallet disconnected — wipe all state AND reset the lock
  useEffect(() => {
    if (!address) {
      isGlobalAuthTriggered = false; // 🔓 Unlock
      clearUser();
      clearAgents();
      clearJobs();
      clearTransactions();
    }
  }, [address, clearUser, clearAgents, clearJobs, clearTransactions]);

  // Account switched — clear stale state and re-authenticate safely
  useEffect(() => {
    const prev = previousAddress.current;
    previousAddress.current = address;

    if (prev && address && prev !== address) {
      isGlobalAuthTriggered = true; // 🔒 Lock immediately for the new account
      setHasAttemptedAuth(true);

      clearUser();
      clearAgents();
      clearJobs();
      clearTransactions();

      const runSwitch = async () => {
        await fetchUser(address);
        const currentUser = useUserStore.getState().user;
        if (!currentUser) {
          await signIn(address);
        }
      };
      runSwitch();
    }
  }, [
    address,
    clearUser,
    clearAgents,
    clearJobs,
    clearTransactions,
    signIn,
    setHasAttemptedAuth,
    fetchUser,
  ]);

  return {
    user,
    isLoading,
    hydrated,
    isConnected,
    isHydrated,
    address,
    signIn,
    clearUser,
    markOnboarded,
  };
}
