import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useUserStore } from "@/store/userStore";

export function useUser() {
  const { address, isConnected, status } = useAccount();
  const { user, isLoading, hydrated, clearUser, syncUser, fetchUser, markOnboarded } = useUserStore();

  // True once wagmi has finished reconnecting — safe to act on isConnected
  const isHydrated = status !== "connecting" && status !== "reconnecting";

  useEffect(() => {
    if (isConnected && address && !user) {
      fetchUser(address);
    }
  }, [isConnected, address, user, fetchUser]);

  return { user, isLoading, hydrated, isConnected, isHydrated, address, syncUser, clearUser, markOnboarded };
}
