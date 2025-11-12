"use client";

import { useEffect, useState } from "react";
import { useVoiceChatStore } from "@/lib/store";
import {
  getRealtimeService,
  resetRealtimeService,
} from "@/lib/realtimeService";
import AudioVisualizer from "./AudioVisualizer";
import FlowingText from "./FlowingText";
import { motion, AnimatePresence } from "framer-motion";

export default function VoiceChat() {
  const [apiKey, setApiKey] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const { isConnected, appState, error, setError, messages } =
    useVoiceChatStore();

  // Load API key from environment or localStorage on mount
  useEffect(() => {
    // Try to get from environment first (client-side accessible env vars)
    const envApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (envApiKey) {
      setApiKey(envApiKey);
      setIsInitialized(true);
    } else {
      // Fall back to localStorage
      const savedApiKey = localStorage.getItem("openai_api_key");
      if (savedApiKey) {
        setApiKey(savedApiKey);
        setIsInitialized(true);
      } else {
        setShowApiKeyInput(true);
      }
    }
  }, []);

  const handleConnect = async () => {
    try {
      setError(null);
      const service = getRealtimeService(apiKey);
      await service.connect();
    } catch (err) {
      setError("Failed to connect. Please check your API key.");
      console.error(err);
    }
  };

  // Auto-connect when API key is available
  useEffect(() => {
    if (apiKey && !isConnected && isInitialized) {
      handleConnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, isInitialized]);

  const handleDisconnect = () => {
    resetRealtimeService();
  };

  const toggleListening = async () => {
    try {
      const service = getRealtimeService();

      if (appState === "listening") {
        service.stopListening();
      } else {
        await service.startListening();
      }
    } catch (err) {
      setError("Failed to access microphone. Please check permissions.");
      console.error(err);
    }
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem("openai_api_key", apiKey.trim());
      setShowApiKeyInput(false);
      setIsInitialized(true);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem("openai_api_key");
    setApiKey("");
    setShowApiKeyInput(true);
    handleDisconnect();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Space bar to toggle listening
      if (e.code === "Space" && !showApiKeyInput && isConnected) {
        e.preventDefault();
        toggleListening();
      }
      // Escape to show/hide controls
      if (e.code === "Escape" && !showApiKeyInput) {
        setShowControls((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState, showApiKeyInput, isConnected]);

  // Auto-hide controls after inactivity
  useEffect(() => {
    if (!showControls) return;
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [showControls]);

  // Show controls on mouse move
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-[#0f0f1e] via-[#1a1a2e] to-[#16213e] overflow-hidden">
      {/* Audio Visualizer Background - Always visible */}
      <AudioVisualizer />

      {/* Flowing Text Display - Center focus */}
      <FlowingText />

      {/* API Key Input Modal - Glassmorphism */}
      <AnimatePresence>
        {showApiKeyInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="glass-dark rounded-3xl p-10 max-w-lg w-full mx-6 shadow-2xl border border-white/10"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow"
                >
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </motion.div>
                <h1 className="text-3xl font-bold text-white mb-3 font-display">
                  Welcome to Voice
                </h1>
                <p className="text-gray-400 text-base leading-relaxed">
                  Enter your OpenAI API key to begin your immersive
                  <br />
                  conversation experience
                </p>
              </div>
              <form onSubmit={handleApiKeySubmit} className="space-y-5">
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all text-sm"
                    autoFocus
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-cyan-500/0 hover:from-indigo-500/5 hover:via-purple-500/5 hover:to-cyan-500/5 pointer-events-none transition-all duration-500" />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-glow-lg text-sm"
                >
                  Start Conversation
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-6 text-center leading-relaxed">
                Your API key is securely stored locally and only sent to OpenAI
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display - Minimalist toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="glass-dark text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border border-red-500/20">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal Controls - Bottom center, auto-hide */}
      {!showApiKeyInput && (
        <AnimatePresence>
          {(showControls || appState !== "idle" || messages.length === 0) && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-40"
            >
              <div className="flex flex-col items-center space-y-6">
                {/* Main Action Button - Larger, more prominent */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleListening}
                  disabled={!isConnected}
                  className={`
                    relative group
                    ${
                      appState === "listening"
                        ? "w-24 h-24 bg-gradient-to-br from-red-500 to-pink-600"
                        : "w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600"
                    }
                    ${!isConnected ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    rounded-full shadow-2xl backdrop-blur-xl
                    flex items-center justify-center
                    transition-all duration-500
                    ${appState === "listening" ? "shadow-glow-lg" : "hover:shadow-glow"}
                  `}
                >
                  {/* Animated border gradient */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />

                  {/* Inner content */}
                  <div className="relative z-10">
                    {!isConnected ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-8 h-8 border-3 border-white border-t-transparent rounded-full"
                      />
                    ) : appState === "listening" ? (
                      <motion.svg
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="w-10 h-10 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <rect x="6" y="4" width="4" height="16" rx="2" />
                        <rect x="14" y="4" width="4" height="16" rx="2" />
                      </motion.svg>
                    ) : (
                      <motion.svg
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="w-10 h-10 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </motion.svg>
                    )}
                  </div>

                  {/* Pulse effect when listening */}
                  {appState === "listening" && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full bg-red-500/50"
                        animate={{
                          scale: [1, 1.4, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full bg-pink-500/30"
                        animate={{
                          scale: [1, 1.6, 1],
                          opacity: [0.3, 0, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.5,
                        }}
                      />
                    </>
                  )}

                  {/* Thinking pulse */}
                  {appState === "thinking" && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-purple-500/30"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </motion.button>

                {/* Status Text - Modern typography */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-dark px-6 py-3 rounded-full backdrop-blur-xl border border-white/10"
                >
                  <p className="text-white/90 text-sm font-medium tracking-wide">
                    {!isConnected
                      ? "Connecting..."
                      : appState === "idle"
                        ? "Press to speak"
                        : appState === "listening"
                          ? "Listening..."
                          : appState === "thinking"
                            ? "Processing..."
                            : "Speaking..."}
                  </p>
                </motion.div>

                {/* Hint text */}
                {messages.length === 0 && appState === "idle" && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-gray-500 text-xs tracking-wide"
                  >
                    or hold{" "}
                    <kbd className="px-2 py-1 bg-white/5 rounded text-white/70">
                      Space
                    </kbd>
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Connection Status - Top right, subtle */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 right-6 z-30"
      >
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-dark rounded-full px-4 py-2 flex items-center space-x-2 border border-white/5"
            >
              <motion.div
                animate={{
                  scale: isConnected ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: isConnected ? Infinity : 0,
                }}
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-red-500"}`}
              />
              <span className="text-xs text-white/70 font-medium">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Settings Button - Top left, minimal */}
      {!showApiKeyInput && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-6 left-6 z-30"
        >
          <AnimatePresence>
            {showControls && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleClearApiKey}
                className="glass-dark hover:bg-white/10 p-3 rounded-full transition-all duration-300 border border-white/5 group"
              >
                <svg
                  className="w-5 h-5 text-white/70 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
