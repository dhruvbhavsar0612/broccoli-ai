"use client";

import { useVoiceChatStore } from "./store";
import { getAudioCueManager } from "./audioCues";

export class RealtimeService {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorklet: AudioWorkletNode | null = null;
  private isRecording = false;
  private conversationId: string | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async connect() {
    try {
      const { setIsConnected, setError, setAppState } =
        useVoiceChatStore.getState();

      // Get model from environment or use default
      const model =
        process.env.NEXT_PUBLIC_MODEL_NAME ||
        "gpt-4o-realtime-preview-2024-12-17";

      // Connect to OpenAI Realtime API
      this.ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${model}`,
        [
          "realtime",
          `openai-insecure-api-key.${this.apiKey}`,
          "openai-beta.realtime-v1",
        ],
      );

      this.ws.addEventListener("open", () => {
        console.log("Connected to OpenAI Realtime API");
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
        setError("Connection error. Please check your API key and try again.");
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
        .setError("Failed to connect to the service.");
    }
  }

  private sendSessionUpdate() {
    if (!this.ws) return;

    // Get configuration from environment or use defaults
    const voice = process.env.NEXT_PUBLIC_VOICE || "alloy";
    const temperature = parseFloat(
      process.env.NEXT_PUBLIC_TEMPERATURE || "0.8",
    );
    const maxTokens = parseInt(process.env.NEXT_PUBLIC_MAX_TOKENS || "4096");

    const sessionConfig = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions:
          "You are a helpful, friendly, and concise assistant. Keep your responses clear and engaging.",
        voice,
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
        temperature,
        max_response_output_tokens: maxTokens,
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
        setAudioLevel,
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

      // Create analyzer for visualization
      const analyzer = this.audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);

      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Update audio level for visualization
      const updateAudioLevel = () => {
        if (!this.isRecording) return;

        analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const normalized = average / 255;
        useVoiceChatStore.getState().setAudioLevel(normalized);

        requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();

      // Create script processor for audio data
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

    const { setAppState, setAudioLevel } = useVoiceChatStore.getState();

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isRecording = false;
    setAudioLevel(0);
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
let realtimeServiceInstance: RealtimeService | null = null;

export function getRealtimeService(apiKey?: string): RealtimeService {
  if (!realtimeServiceInstance && apiKey) {
    realtimeServiceInstance = new RealtimeService(apiKey);
  }

  if (!realtimeServiceInstance) {
    throw new Error(
      "RealtimeService not initialized. Please provide an API key.",
    );
  }

  return realtimeServiceInstance;
}

export function resetRealtimeService() {
  if (realtimeServiceInstance) {
    realtimeServiceInstance.disconnect();
    realtimeServiceInstance = null;
  }
}
