"use client";

import { useEffect, useState } from "react";
import { useVoiceChatStore } from "@/lib/store";
import {
  getSecureRealtimeService,
  resetSecureRealtimeService,
} from "@/lib/secureRealtimeService";
import AudioVisualizer from "./AudioVisualizer";
import FlowingText from "./FlowingText";
import { motion, AnimatePresence } from "framer-motion";

export default function VoiceChat() {
  const [showControls, setShowControls] = useState(false);

  const { isConnected, appState, error, setError, messages } =
    useVoiceChatStore();

  const handleConnect = async () => {
    try {
      setError(null);
      const service = getSecureRealtimeService();
      await service.connect();
    } catch (err) {
      setError("Failed to connect. Please try again.");
      console.error(err);
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    if (!isConnected) {
      handleConnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDisconnect = () => {
    resetSecureRealtimeService();
  };

  const toggleListening = async () => {
    try {
      const service = getSecureRealtimeService();
      if (appState === "listening") {
        service.stopListening();
      } else if (appState === "idle") {
        await service.startListening();
      }
    } catch (err) {
      setError("Failed to access microphone. Please check permissions.");
      console.error(err);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Space bar to toggle listening
      if (e.code === "Space" && isConnected) {
        e.preventDefault();
        toggleListening();
      }
      // Escape to show/hide controls
      if (e.code === "Escape") {
        setShowControls((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState, isConnected]);

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
    </div>
  );
}
