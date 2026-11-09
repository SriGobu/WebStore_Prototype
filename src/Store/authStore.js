import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    //STATE
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      //SET AUTH
      setAuth: (accessToken, user) =>
        set({
          accessToken,
          user:
            user && typeof user === "object"
              ? {
                  id: user.userId || "",
                  name: user.name || "",
                  email: user.email || "",
                  role: user.role || "",
                }
              : null,
          isAuthenticated: !!(accessToken && user),
        }),
      // UPDATE USER
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
      // CLEAR USER
      clearAuth: () =>
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
        }),
      //GETTERS
      getAccessToken: () => get().accessToken,
      getUser: () => get().user,
      isLoggedIn: () => get().isAuthenticated,
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
