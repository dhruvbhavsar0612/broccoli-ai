"use client";

import { useVoiceChatStore } from "./store";
import { getAudioCueManager } from "./audioCues";
import { updateRealtimeAudioData } from "@/components/AudioVisualizer";

export class SecureRealtimeService {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private isRecording = false;
  private conversationId: string | null = null;
  private sessionConfig: {
    model: string;
    voice: string;
    temperature: number;
    maxTokens: number;
  } | null = null;
  private authToken: string | null = null;
  private animationFrameId: number | null = null;

  // Audio analysis data
  private frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(
    0,
  ) as Uint8Array<ArrayBuffer>;
  private smoothedLevel: number = 0;
  private peakLevel: number = 0;
  private smoothedBands = {
    sub: 0,
    bass: 0,
    low: 0,
    mid: 0,
    high: 0,
    presence: 0,
  };

  constructor() {
    // Bind methods
    this.analyzeAudio = this.analyzeAudio.bind(this);
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  async connect() {
    try {
      const { setIsConnected, setError, setAppState } =
        useVoiceChatStore.getState();

      // Fetch ephemeral session token from our secure backend
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add auth token if available
      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const tokenResponse = await fetch("/api/realtime/token", {
        method: "POST",
        headers,
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(
          errorData.details || errorData.error || "Failed to get session token",
        );
      }

      const sessionData = await tokenResponse.json();

      if (!sessionData.client_secret) {
        throw new Error("No session token received from server");
      }

      // Store session configuration
      this.sessionConfig = {
        model: sessionData.model,
        voice: sessionData.voice || "sage",
        temperature: sessionData.temperature || 0.8,
        maxTokens: sessionData.maxTokens || 4096,
      };

      // Connect to OpenAI Realtime API using ephemeral token
      this.ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${sessionData.model}`,
        [
          "realtime",
          `openai-insecure-api-key.${sessionData.client_secret}`,
          "openai-beta.realtime-v1",
        ],
      );

      this.ws.addEventListener("open", () => {
        console.log("Connected to OpenAI Realtime API (secure)");
        setIsConnected(true);
        setAppState("idle");

        // Send session configuration
        this.sendSessionUpdate();
      });

      this.ws.addEventListener("message", (event) => {
        this.handleWebSocketMessage(event);
      });

      this.ws.addEventListener("error", (error) => {
        console.error("WebSocket error:", error);
        setError("Connection error. Please try again.");
        setIsConnected(false);
      });

      this.ws.addEventListener("close", () => {
        console.log("Disconnected from OpenAI Realtime API");
        setIsConnected(false);
        setAppState("idle");
      });
    } catch (error) {
      console.error("Failed to connect:", error);
      useVoiceChatStore
        .getState()
        .setError(
          error instanceof Error
            ? error.message
            : "Failed to connect to the service.",
        );
    }
  }

  private sendSessionUpdate() {
    if (!this.ws || !this.sessionConfig) return;

    const sessionConfig = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions:
          "You are a helpful, friendly, and concise assistant. Keep your responses clear and engaging.",
        voice: this.sessionConfig.voice,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1",
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        temperature: this.sessionConfig.temperature,
        max_response_output_tokens: this.sessionConfig.maxTokens,
      },
    };

    this.ws.send(JSON.stringify(sessionConfig));
  }

  private handleWebSocketMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data);
      const {
        setAppState,
        appendStreamingText,
        setCurrentStreamingText,
        addMessage,
      } = useVoiceChatStore.getState();

      console.log("Received message:", message.type);

      switch (message.type) {
        case "session.created":
          console.log("Session created:", message.session.id);
          this.conversationId = message.session.id;
          break;

        case "session.updated":
          console.log("Session updated");
          break;

        case "input_audio_buffer.speech_started":
          console.log("User started speaking");
          setAppState("listening");
          getAudioCueManager().playListeningCue();
          break;

        case "input_audio_buffer.speech_stopped":
          console.log("User stopped speaking");
          setAppState("thinking");
          getAudioCueManager().playThinkingCue();
          break;

        case "input_audio_buffer.committed":
          console.log("Audio committed");
          break;

        case "conversation.item.created":
          console.log("Conversation item created:", message.item);
          if (message.item.type === "message" && message.item.role === "user") {
            // User message created
          }
          break;

        case "conversation.item.input_audio_transcription.completed":
          console.log("Transcription completed:", message.transcript);
          if (message.transcript) {
            addMessage({
              id: message.item_id,
              role: "user",
              content: message.transcript,
              timestamp: Date.now(),
            });
          }
          break;

        case "response.created":
          console.log("Response created");
          setAppState("thinking");
          setCurrentStreamingText("");
          getAudioCueManager().playThinkingCue();
          break;

        case "response.output_item.added":
          console.log("Output item added");
          break;

        case "response.content_part.added":
          console.log("Content part added");
          break;

        case "response.text.delta":
          // Streaming text from assistant
          if (message.delta) {
            const currentState = useVoiceChatStore.getState().appState;
            appendStreamingText(message.delta);
            if (currentState !== "speaking") {
              setAppState("speaking");
              getAudioCueManager().playGeneratingCue();
            }
          }
          break;

        case "response.text.done":
          console.log("Text response complete:", message.text);
          if (message.text) {
            addMessage({
              id: message.item_id || `msg-${Date.now()}`,
              role: "assistant",
              content: message.text,
              timestamp: Date.now(),
            });
            setCurrentStreamingText("");
          }
          break;

        case "response.audio_transcript.delta":
          // If using audio output with transcription
          if (message.delta) {
            appendStreamingText(message.delta);
          }
          break;

        case "response.audio_transcript.done":
          console.log("Audio transcript complete:", message.transcript);
          break;

        case "response.audio.delta":
          // Audio chunk from assistant (we're focusing on text for now)
          console.log("Received audio delta");
          break;

        case "response.audio.done":
          console.log("Audio response complete");
          break;

        case "response.done":
          console.log("Response complete");
          setAppState("idle");
          getAudioCueManager().playCompletionCue();
          break;

        case "rate_limits.updated":
          console.log("Rate limits:", message.rate_limits);
          break;

        case "error":
          console.error("API Error:", message.error);
          useVoiceChatStore
            .getState()
            .setError(message.error.message || "An error occurred");
          setAppState("idle");
          break;

        default:
          console.log("Unhandled message type:", message.type);
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
    }
  }

  /**
   * Real-time audio analysis loop
   */
  private analyzeAudio(): void {
    if (!this.isRecording || !this.analyser) {
      this.animationFrameId = null;
      return;
    }

    // Get frequency data
    this.analyser.getByteFrequencyData(this.frequencyData);

    // Calculate overall level with weighted average
    let sum = 0;
    let weightSum = 0;
    for (let i = 0; i < this.frequencyData.length; i++) {
      const weight = 1 - (i / this.frequencyData.length) * 0.5;
      sum += this.frequencyData[i] * weight;
      weightSum += weight;
    }
    const rawLevel = Math.min(1, sum / weightSum / 180);

    // Smooth the level
    this.smoothedLevel = this.lerp(this.smoothedLevel, rawLevel, 0.35);

    // Update peak with decay
    if (rawLevel > this.peakLevel) {
      this.peakLevel = this.lerp(this.peakLevel, rawLevel, 0.9);
    } else {
      this.peakLevel *= 0.96;
    }

    // Calculate frequency bands
    const bands = this.calculateBands();

    // Smooth bands
    const bandKeys = ["sub", "bass", "low", "mid", "high", "presence"] as const;
    for (const key of bandKeys) {
      this.smoothedBands[key] = this.lerp(
        this.smoothedBands[key],
        bands[key],
        0.3,
      );
    }

    // Update store with enhanced data
    const { setAudioData } = useVoiceChatStore.getState();
    setAudioData({
      level: this.smoothedLevel,
      peak: this.peakLevel,
      bands: { ...this.smoothedBands },
      isActive: true,
    });

    // Also update the visualizer directly for maximum responsiveness
    updateRealtimeAudioData({
      level: this.smoothedLevel,
      peak: this.peakLevel,
      bands: { ...this.smoothedBands },
    });

    // Continue the loop
    this.animationFrameId = requestAnimationFrame(this.analyzeAudio);
  }

  /**
   * Calculate frequency bands from FFT data
   */
  private calculateBands() {
    const sampleRate = 24000;
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / this.frequencyData.length;

    const getBandAverage = (lowFreq: number, highFreq: number): number => {
      const lowBin = Math.floor(lowFreq / binWidth);
      const highBin = Math.min(
        Math.floor(highFreq / binWidth),
        this.frequencyData.length - 1,
      );

      if (lowBin >= highBin) return 0;

      let sum = 0;
      let count = 0;

      for (let i = lowBin; i <= highBin; i++) {
        sum += this.frequencyData[i];
        count++;
      }

      return count > 0 ? sum / count / 255 : 0;
    };

    return {
      sub: getBandAverage(20, 60),
      bass: getBandAverage(60, 250),
      low: getBandAverage(250, 500),
      mid: getBandAverage(500, 2000),
      high: getBandAverage(2000, 6000),
      presence: getBandAverage(6000, Math.min(20000, nyquist)),
    };
  }

  /**
   * Linear interpolation helper
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  async startListening() {
    try {
      if (this.isRecording) return;

      const { setError, setAppState } = useVoiceChatStore.getState();

      // Initialize audio context
      this.audioContext = new AudioContext({ sampleRate: 24000 });

      // Get user media
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create audio source
      const source = this.audioContext.createMediaStreamSource(
        this.mediaStream,
      );

      // Create analyzer for visualization with optimized settings
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.5;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;
      source.connect(this.analyser);

      // Initialize frequency data array
      this.frequencyData = new Uint8Array(
        this.analyser.frequencyBinCount,
      ) as Uint8Array<ArrayBuffer>;

      // Reset smoothed values
      this.smoothedLevel = 0;
      this.peakLevel = 0;
      this.smoothedBands = {
        sub: 0,
        bass: 0,
        low: 0,
        mid: 0,
        high: 0,
        presence: 0,
      };

      // Create script processor for audio data to send to OpenAI
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(this.audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Convert Float32Array to Int16Array (PCM16)
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Convert to base64
        const base64Audio = btoa(
          String.fromCharCode.apply(
            null,
            Array.from(new Uint8Array(pcm16.buffer)),
          ),
        );

        // Send audio data to OpenAI
        this.ws.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: base64Audio,
          }),
        );
      };

      this.isRecording = true;
      setAppState("listening");

      // Start the real-time audio analysis loop
      this.analyzeAudio();

      // Resume audio context for audio cues (needed after user interaction)
      getAudioCueManager().resume();
    } catch (error) {
      console.error("Error starting audio capture:", error);
      useVoiceChatStore
        .getState()
        .setError("Failed to access microphone. Please check permissions.");
    }
  }

  stopListening() {
    if (!this.isRecording) return;

    const { setAppState, resetAudioData } = useVoiceChatStore.getState();

    // Stop the animation frame loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Disconnect analyzer
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isRecording = false;

    // Reset audio visualization data
    resetAudioData();

    // Also reset the direct visualizer data
    updateRealtimeAudioData({
      level: 0,
      peak: 0,
      bands: {
        sub: 0,
        bass: 0,
        low: 0,
        mid: 0,
        high: 0,
        presence: 0,
      },
    });

    setAppState("idle");

    // Commit the audio buffer
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "input_audio_buffer.commit",
        }),
      );
    }
  }

  sendTextMessage(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }

    const { addMessage, setAppState } = useVoiceChatStore.getState();

    // Add user message
    addMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    });

    // Send message to OpenAI
    this.ws.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: text,
            },
          ],
        },
      }),
    );

    // Trigger response
    this.ws.send(
      JSON.stringify({
        type: "response.create",
        response: {
          modalities: ["text"],
          instructions: "Please respond to the user's message.",
        },
      }),
    );

    setAppState("thinking");
  }

  disconnect() {
    this.stopListening();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    useVoiceChatStore.getState().setIsConnected(false);
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let secureRealtimeServiceInstance: SecureRealtimeService | null = null;

export function getSecureRealtimeService(): SecureRealtimeService {
  if (!secureRealtimeServiceInstance) {
    secureRealtimeServiceInstance = new SecureRealtimeService();
  }

  return secureRealtimeServiceInstance;
}

export function resetSecureRealtimeService() {
  if (secureRealtimeServiceInstance) {
    secureRealtimeServiceInstance.disconnect();
    secureRealtimeServiceInstance = null;
  }
}
