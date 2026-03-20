import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import axiosClient from "@/lib/axiosClient";
import type { WalletUser } from "@/types/index";

interface UserState {
  user: WalletUser | null;
  isLoading: boolean;
  hydrated: boolean;
  hasAttemptedAuth: boolean;
}

type SignMessageAsync = (args: { message: string }) => Promise<`0x${string}`>;

interface UserActions {
  setUser: (user: WalletUser) => void;
  clearUser: () => void;
  syncUser: (
    walletAddress: string,
    signMessageAsync: SignMessageAsync,
  ) => Promise<void>;
  fetchUser: (walletAddress: string) => Promise<void>;
  markOnboarded: (walletAddress: string) => Promise<void>;
  updateRole: (walletAddress: string, role: string) => Promise<void>;
  setHasAttemptedAuth: (value: boolean) => void;
}

export const useUserStore = create<UserState & UserActions>()(
  immer((set, get) => ({
    user: null,
    isLoading: false,
    hydrated: false,
    hasAttemptedAuth: false,

    setUser: (user) =>
      set((state) => {
        state.user = user;
      }),

    clearUser: () =>
      set((state) => {
        state.user = null;
        state.hydrated = false;
        state.hasAttemptedAuth = false;
      }),

    syncUser: async (
      walletAddress: string,
      signMessageAsync: SignMessageAsync,
    ) => {
      set((state) => {
        state.isLoading = true;
      });
      try {
        // Step 1: Get a fresh nonce from the server
        const nonceRes = await axiosClient.get<{ nonce: string }>(
          "/api/auth/nonce",
        );
        const nonce = nonceRes.data?.nonce;
        if (!nonce) throw new Error("Failed to get auth nonce");

        // Step 2: Build the SIWE message and sign it with the user's wallet
        const message = `AgentEra wants you to sign in with your Ethereum account:\n${walletAddress}\n\nNonce: ${nonce}`;
        const signature = await signMessageAsync({ message });

        // Step 3: POST the signature to the server for verification
        const res = await axiosClient.post<{ data: WalletUser }>(
          "/api/auth/connect",
          {
            walletAddress,
            signature,
          },
        );
        if (res.data?.data) {
          set((state) => {
            state.user = res.data.data;
          });
        }
      } catch (err) {
        console.error("[userStore] syncUser failed:", err);
        throw err; // re-throw so the UI can show an error
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    fetchUser: async (walletAddress) => {
      const { user } = get();
      if (user && user.walletAddress === walletAddress) return;

      set((state) => {
        state.isLoading = true;
      });
      try {
        const res = await axiosClient.get<{ data: WalletUser }>(
          `/api/users/me?walletAddress=${walletAddress}`,
        );

        if (res.status === 401) {
          set((state) => {
            state.user = null;
            state.hydrated = true;
          });
          return;
        }

        if (res.data?.data) {
          set((state) => {
            state.user = res.data.data;
            state.hydrated = true;
          });
        }
      } catch (err) {
        console.error("[userStore] fetchUser failed:", err);
        set((state) => {
          state.hydrated = true;
        });
      } finally {
        set((state) => {
          state.isLoading = false;
        });
      }
    },

    markOnboarded: async (walletAddress) => {
      try {
        const res = await axiosClient.post<{ data: WalletUser }>(
          "/api/users/onboarded",
          {
            walletAddress,
          },
        );
        if (res.data?.data) {
          set((state) => {
            state.user = res.data.data;
          });
        }
      } catch (err) {
        console.error("[userStore] markOnboarded failed:", err);
      }
    },

    updateRole: async (walletAddress, role) => {
      try {
        const res = await axiosClient.patch<{ data: WalletUser }>(
          `/api/users/me?walletAddress=${walletAddress}`,
          { role },
        );
        if (res.data?.data) {
          set((state) => {
            state.user = res.data.data;
          });
        }
      } catch (err) {
        console.error("[userStore] updateRole failed:", err);
      }
    },

    setHasAttemptedAuth: (value: boolean) =>
      set((state) => {
        state.hasAttemptedAuth = value;
      }),
  })),
);
