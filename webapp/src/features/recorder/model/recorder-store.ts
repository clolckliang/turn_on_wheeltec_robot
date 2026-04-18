import { create } from "zustand";

import type { PendingRecorderCommand, RecordedFile, RecorderCommand, RecorderStatus } from "@/shared/types/recorder";

interface RecorderState {
  status: RecorderStatus;
  pendingCommand?: PendingRecorderCommand;
  files: RecordedFile[];
  loadingFiles: boolean;
  error?: string;
  setStatus: (status: RecorderStatus) => void;
  setPendingCommand: (command: RecorderCommand) => void;
  markPendingCommandTimedOut: () => void;
  clearPendingCommand: () => void;
  setFiles: (files: RecordedFile[]) => void;
  setLoadingFiles: (loadingFiles: boolean) => void;
  setError: (error?: string) => void;
}

const initialStatus: RecorderStatus = {
  state: "idle",
  count: 0,
  duration: 0,
  rate: 0,
  file: "",
  outputDir: "",
};

export const useRecorderStore = create<RecorderState>((set) => ({
  status: initialStatus,
  pendingCommand: undefined,
  files: [],
  loadingFiles: false,
  error: undefined,
  setStatus: (status) => set({ status }),
  setPendingCommand: (command) =>
    set({
      pendingCommand: {
        command,
        sentAt: Date.now(),
        timedOut: false,
      },
    }),
  markPendingCommandTimedOut: () =>
    set((state) =>
      state.pendingCommand
        ? {
            pendingCommand: {
              ...state.pendingCommand,
              timedOut: true,
            },
          }
        : state,
    ),
  clearPendingCommand: () => set({ pendingCommand: undefined }),
  setFiles: (files) => set({ files }),
  setLoadingFiles: (loadingFiles) => set({ loadingFiles }),
  setError: (error) => set({ error }),
}));
