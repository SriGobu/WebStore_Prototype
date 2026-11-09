import { create } from "zustand";
import { renderAllWebsites } from "../Services/User/websiteService";

const useWebsiteStore = create((set, get) => ({
  websites: [],
  isLoading: false,
  fetchWebsites: async () => {
    if (get().length > 0) return; // Avoid refetching if data already exists
    set({ isLoading: true });
    const data = await renderAllWebsites();
    set({ websites: data.data.websites, isLoading: false });
  },
}));

export default useWebsiteStore;
