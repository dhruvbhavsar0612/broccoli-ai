import { create } from "zustand";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export type AppState = "idle" | "listening" | "thinking" | "speaking";

export interface FrequencyBands {
  sub: number; // 20-60 Hz (sub-bass)
  bass: number; // 60-250 Hz (bass)
  low: number; // 250-500 Hz (low-mids)
  mid: number; // 500-2000 Hz (mids)
  high: number; // 2000-6000 Hz (high-mids)
  presence: number; // 6000-20000 Hz (presence/brilliance)
}

export interface AudioVisualizationData {
  level: number; // Overall audio level (0-1)
  peak: number; // Peak level with decay (0-1)
  bands: FrequencyBands; // Frequency bands (0-1 each)
  isActive: boolean; // Whether audio is currently being analyzed
}

const defaultBands: FrequencyBands = {
  sub: 0,
  bass: 0,
  low: 0,
  mid: 0,
  high: 0,
  presence: 0,
};

const defaultAudioData: AudioVisualizationData = {
  level: 0,
  peak: 0,
  bands: defaultBands,
  isActive: false,
};

interface VoiceChatStore {
  // Connection state
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;

  // App state
  appState: AppState;
  setAppState: (state: AppState) => void;

  // Messages
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;

  // Current streaming text
  currentStreamingText: string;
  setCurrentStreamingText: (text: string) => void;
  appendStreamingText: (text: string) => void;

  // Audio visualization (legacy - for compatibility)
  audioLevel: number;
  setAudioLevel: (level: number) => void;

  // Enhanced audio visualization data
  audioData: AudioVisualizationData;
  setAudioData: (data: Partial<AudioVisualizationData>) => void;
  updateFrequencyBands: (bands: FrequencyBands) => void;
  resetAudioData: () => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
}

export const useVoiceChatStore = create<VoiceChatStore>((set) => ({
  // Connection state
  isConnected: false,
  setIsConnected: (connected) => set({ isConnected: connected }),

  // App state
  appState: "idle",
  setAppState: (state) => set({ appState: state }),

  // Messages
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),

  // Current streaming text
  currentStreamingText: "",
  setCurrentStreamingText: (text) => set({ currentStreamingText: text }),
  appendStreamingText: (text) =>
    set((state) => ({
      currentStreamingText: state.currentStreamingText + text,
    })),

  // Audio visualization (legacy - kept for compatibility)
  audioLevel: 0,
  setAudioLevel: (level) =>
    set((state) => ({
      audioLevel: level,
      // Also update the new audioData.level for consistency
      audioData: {
        ...state.audioData,
        level,
      },
    })),

  // Enhanced audio visualization data
  audioData: defaultAudioData,
  setAudioData: (data) =>
    set((state) => ({
      audioData: { ...state.audioData, ...data },
      // Keep legacy audioLevel in sync
      audioLevel: data.level !== undefined ? data.level : state.audioLevel,
    })),
  updateFrequencyBands: (bands) =>
    set((state) => ({
      audioData: {
        ...state.audioData,
        bands,
      },
    })),
  resetAudioData: () =>
    set({
      audioData: defaultAudioData,
      audioLevel: 0,
    }),

  // Error handling
  error: null,
  setError: (error) => set({ error }),
}));
