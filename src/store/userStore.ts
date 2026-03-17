import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import axiosClient from "@/lib/axiosClient";
import type { WalletUser } from "@/types/index";

interface UserState {
  user: WalletUser | null;
  isLoading: boolean;
  hydrated: boolean;
}

interface UserActions {
  setUser: (user: WalletUser) => void;
  clearUser: () => void;
  syncUser: (walletAddress: string) => Promise<void>;
  fetchUser: (walletAddress: string) => Promise<void>;
  markOnboarded: (walletAddress: string) => Promise<void>;
  updateRole: (walletAddress: string, role: string) => Promise<void>;
}

export const useUserStore = create<UserState & UserActions>()(
  immer((set, get) => ({
    user: null,
    isLoading: false,
    hydrated: false,

    setUser: (user) =>
      set((state) => {
        state.user = user;
      }),

    clearUser: () =>
      set((state) => {
        state.user = null;
        state.hydrated = false;
      }),

    syncUser: async (walletAddress) => {
      set((state) => {
        state.isLoading = true;
      });
      try {
        const res = await axiosClient.post<{ data: WalletUser }>("/api/auth/connect", {
          walletAddress,
        });
        if (res.data?.data) {
          set((state) => {
            state.user = res.data.data;
          });
        }
      } catch (err) {
        console.error("[userStore] syncUser failed:", err);
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
          `/api/users/me?walletAddress=${walletAddress}`
        );
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
        const res = await axiosClient.post<{ data: WalletUser }>("/api/users/onboarded", {
          walletAddress,
        });
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
          { role }
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
  }))
);
