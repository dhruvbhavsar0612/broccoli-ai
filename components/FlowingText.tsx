"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceChatStore } from "@/lib/store";

export default function FlowingText() {
  const { messages, currentStreamingText, appState } = useVoiceChatStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Show user transcription only while listening - using derived state
  const userTranscription = (() => {
    if (appState === "listening") {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage && latestMessage.role === "user") {
        return latestMessage.content;
      }
    }
    return "";
  })();

  // Auto-scroll effect - keep content centered
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // Center the content vertically
      const centerScroll = (scrollHeight - clientHeight) / 2;

      container.scrollTo({
        top: Math.max(0, centerScroll),
        behavior: "smooth",
      });
    }
  }, [messages, currentStreamingText]);

  // Filter to show only assistant messages
  const assistantMessages = messages.filter((msg) => msg.role === "assistant");

  // Split streaming text into words for animation
  const streamingWords = currentStreamingText
    ? currentStreamingText.split(" ").filter((word) => word.length > 0)
    : [];

  return (
    <div
      ref={containerRef}
      className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden px-8 flex items-center justify-center hide-scrollbar"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      <div className="max-w-6xl w-full space-y-20 my-auto">
        {/* User Transcription - Temporary display while speaking */}
        <AnimatePresence>
          {userTranscription && appState === "listening" && (
            <motion.div
              key="user-transcription"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-center relative"
            >
              {/* Glowing background effect */}
              <div className="absolute inset-0 blur-3xl bg-linear-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 rounded-full transform scale-150" />

              <div className="relative glass-dark rounded-3xl px-10 py-8 border border-white/10 backdrop-blur-xl">
                <motion.div
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <p className="text-xl md:text-xl lg:text-2xl xl:text-2xl font-light leading-relaxed tracking-normal text-gradient-colorful font-display">
                    {userTranscription}
                  </p>
                </motion.div>

                {/* Listening indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 flex items-center justify-center space-x-2"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-2 h-2 bg-indigo-400 rounded-full"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.2,
                    }}
                    className="w-2 h-2 bg-purple-400 rounded-full"
                  />
                  <motion.div
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.4,
                    }}
                    className="w-2 h-2 bg-cyan-400 rounded-full"
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assistant Messages - Permanent display */}
        <AnimatePresence mode="popLayout">
          {assistantMessages.map((message, msgIndex) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
              }}
              exit={{
                opacity: 0,
                y: -20,
                filter: "blur(10px)",
              }}
              transition={{
                duration: 1,
                ease: [0.22, 1, 0.36, 1],
                delay: msgIndex * 0.1,
              }}
              className="text-center space-y-4"
            >
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-px w-32 mx-auto bg-linear-to-r from-transparent via-white/20 to-transparent"
              />

              <p
                className="text-xl md:text-2xl lg:text-2xl xl:text-3xl font-light leading-relaxed tracking-normal font-display"
                style={{
                  background:
                    "linear-gradient(to bottom, #ffffff 0%, #888888 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  textShadow: "0 0 40px rgba(255, 255, 255, 0.1)",
                }}
              >
                {message.content}
              </p>
            </motion.div>
          ))}

          {/* Streaming text from assistant - Word by word animation */}
          {streamingWords.length > 0 && (
            <motion.div
              key="streaming-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-px w-32 mx-auto bg-linear-to-r from-transparent via-indigo-400/40 to-transparent"
              />

              <div className="text-xl md:text-2xl lg:text-2xl xl:text-3xl font-light leading-relaxed tracking-normal font-display">
                {streamingWords.map((word, index) => (
                  <motion.span
                    key={`word-${index}-${word}`}
                    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                    }}
                    transition={{
                      duration: 0.6,
                      ease: [0.22, 1, 0.36, 1],
                      delay: index * 0.04,
                    }}
                    style={{
                      background:
                        "linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      display: "inline-block",
                      marginRight: "0.35em",
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </div>

              {/* Streaming indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center space-x-1 pt-4"
              >
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-1.5 h-1.5 bg-linear-to-r from-indigo-400 to-purple-400 rounded-full"
                />
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2,
                  }}
                  className="w-1.5 h-1.5 bg-linear-to-r from-purple-400 to-pink-400 rounded-full"
                />
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.4,
                  }}
                  className="w-1.5 h-1.5 bg-linear-to-r from-pink-400 to-cyan-400 rounded-full"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thinking state indicator */}
        {appState === "thinking" && streamingWords.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              className="w-16 h-16 mx-auto mb-6 rounded-full border-2"
              style={{
                background: "#0a0a0f",
                borderImage:
                  "linear-gradient(to right, #6366f1, #8b5cf6, #06b6d4) 1",
              }}
            />
            <motion.p
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-white/60 text-sm font-medium tracking-wider uppercase"
            >
              Processing
            </motion.p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
