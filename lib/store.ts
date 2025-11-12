import { create } from 'zustand';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type AppState = 'idle' | 'listening' | 'thinking' | 'speaking';

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

  // Audio visualization
  audioLevel: number;
  setAudioLevel: (level: number) => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
}

export const useVoiceChatStore = create<VoiceChatStore>((set) => ({
  // Connection state
  isConnected: false,
  setIsConnected: (connected) => set({ isConnected: connected }),

  // App state
  appState: 'idle',
  setAppState: (state) => set({ appState: state }),

  // Messages
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),

  // Current streaming text
  currentStreamingText: '',
  setCurrentStreamingText: (text) => set({ currentStreamingText: text }),
  appendStreamingText: (text) =>
    set((state) => ({
      currentStreamingText: state.currentStreamingText + text,
    })),

  // Audio visualization
  audioLevel: 0,
  setAudioLevel: (level) => set({ audioLevel: level }),

  // Error handling
  error: null,
  setError: (error) => set({ error }),
}));
