import { create } from "zustand";

// Ephemeral client-only UI state (frontend-architecture.md §7). Never server data.
interface UiState {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
}));
