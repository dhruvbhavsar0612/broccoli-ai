# Architecture Documentation

## Overview

This Voice Chat application is built using Next.js 15 with the App Router, providing a real-time voice-to-text AI conversation experience powered by OpenAI's Realtime API. The architecture emphasizes performance, real-time responsiveness, and a beautiful user experience.

## Technology Stack

### Frontend Framework
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript** for type safety

### Styling & Animation
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations
- **React Three Fiber** for 3D visualizations
- **@react-three/drei** for Three.js helpers

### State Management
- **Zustand** - Lightweight state management
- Centralized store for app state, messages, and audio levels

### Real-time Communication
- **WebSocket** - Direct connection to OpenAI Realtime API
- **Web Audio API** - Audio input processing
- **PCM16 Audio Format** - Audio encoding

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                     Presentation Layer                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  VoiceChat   │  │   Flowing    │  │    Audio     │  │
│  │  Component   │  │    Text      │  │  Visualizer  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                    State Management                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Zustand Store (useVoiceChatStore)      │  │
│  │  • Connection State   • Messages   • Audio Level │  │
│  │  • App State         • Errors     • Streaming    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         RealtimeService (Singleton)              │  │
│  │  • WebSocket Management                          │  │
│  │  • Audio Capture & Processing                    │  │
│  │  • OpenAI API Communication                      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│                    External APIs                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         OpenAI Realtime API (WebSocket)          │  │
│  │  • Speech Recognition (Server VAD)               │  │
│  │  • LLM Processing (GPT-4)                        │  │
│  │  • Text Streaming                                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. VoiceChat Component (`components/VoiceChat.tsx`)
**Responsibility:** Main orchestrator and UI container

**Key Features:**
- API key management (localStorage)
- Connection lifecycle management
- User controls (microphone button, settings)
- Error handling and display
- Keyboard shortcuts (spacebar for PTT)

**State:**
- Local state for API key and initialization
- Consumes global store for connection and app state

### 2. AudioVisualizer Component (`components/AudioVisualizer.tsx`)
**Responsibility:** 3D visualization of audio and app state

**Key Features:**
- Cosmic sphere with dynamic distortion
- Particle field background
- State-based color transitions
- Audio level reactive animations

**Technical Details:**
- Uses React Three Fiber for 3D rendering
- MeshDistortMaterial for fluid sphere effect
- Custom particle system with 1000 particles
- Optimized render loop with useFrame

**States:**
- **Idle:** Calm rotation, gray color
- **Listening:** Chaotic movement, blue color, high distortion
- **Thinking:** Smooth rotation, purple color, pulsing
- **Speaking:** Active movement, cyan color, moderate distortion

### 3. FlowingText Component (`components/FlowingText.tsx`)
**Responsibility:** Display messages with smooth streaming animation

**Key Features:**
- Word-by-word fade-in animation
- Gradient text effects
- Auto-scroll behavior
- Poetry-in-motion feel

**Animation Details:**
- Fade-in duration: 0.5s per word
- Blur transition: 8px to 0px
- Stagger delay: 30ms between words
- Smooth easing: cubic-bezier(0.22, 1, 0.36, 1)

## State Management

### Zustand Store (`lib/store.ts`)

```typescript
interface VoiceChatStore {
  // Connection
  isConnected: boolean
  
  // App State: 'idle' | 'listening' | 'thinking' | 'speaking'
  appState: AppState
  
  // Messages
  messages: ChatMessage[]
  currentStreamingText: string
  
  // Audio
  audioLevel: number (0-1)
  
  // Error
  error: string | null
}
```

**Why Zustand?**
- Minimal boilerplate
- No providers needed
- TypeScript-first
- Small bundle size (~1kb)
- Perfect for our simple state needs

## Service Layer

### RealtimeService (`lib/realtimeService.ts`)

**Pattern:** Singleton
- Single instance shared across the app
- Manages WebSocket lifecycle
- Handles audio processing

**Key Methods:**

1. **connect()** - Establishes WebSocket connection to OpenAI
2. **startListening()** - Captures microphone audio
3. **stopListening()** - Stops audio capture
4. **sendTextMessage()** - Sends text input (for future use)
5. **disconnect()** - Cleanup and close connection

**Audio Processing Pipeline:**

```
User Microphone
      ↓
MediaStream API
      ↓
AudioContext (24kHz, mono)
      ↓
ScriptProcessor Node
      ↓
Float32 → Int16 (PCM16)
      ↓
Base64 Encoding
      ↓
WebSocket → OpenAI
```

**Audio Visualization Pipeline:**

```
MediaStream
      ↓
AnalyserNode
      ↓
Frequency Data (FFT)
      ↓
Average Calculation
      ↓
Normalized (0-1)
      ↓
Zustand Store (audioLevel)
      ↓
AudioVisualizer Component
```

## Data Flow

### Voice Input Flow

```
User Speaks
    ↓
Microphone Capture
    ↓
Audio Processing (PCM16)
    ↓
WebSocket Send
    ↓
OpenAI Server VAD Detection
    ↓
Speech-to-Text Transcription
    ↓
User Message Created
    ↓
LLM Processing
    ↓
Text Streaming Begins
    ↓
Token-by-Token Receive
    ↓
State Update (currentStreamingText)
    ↓
FlowingText Animation
    ↓
Complete Message Saved
```

### State Transitions

```
IDLE
  ↓ (User clicks mic / presses space)
LISTENING (blue, chaotic sphere)
  ↓ (Server VAD detects speech end)
THINKING (purple, calm sphere)
  ↓ (First response token arrives)
SPEAKING (cyan, active sphere)
  ↓ (Response complete)
IDLE
```

## WebSocket Protocol

### Connection

```
wss://api.openai.com/v1/realtime
  ?model=gpt-4o-realtime-preview-2024-12-17
```

**Headers:**
- Protocol: 'realtime', 'openai-insecure-api-key.{KEY}', 'openai-beta.realtime-v1'

### Session Configuration

```json
{
  "type": "session.update",
  "session": {
    "modalities": ["text", "audio"],
    "voice": "alloy",
    "input_audio_format": "pcm16",
    "output_audio_format": "pcm16",
    "turn_detection": {
      "type": "server_vad",
      "threshold": 0.5,
      "prefix_padding_ms": 300,
      "silence_duration_ms": 500
    },
    "temperature": 0.8,
    "max_response_output_tokens": 4096
  }
}
```

### Key Events

**Inbound (OpenAI → Client):**
- `session.created` - Connection established
- `input_audio_buffer.speech_started` - User started speaking
- `input_audio_buffer.speech_stopped` - User stopped speaking
- `conversation.item.input_audio_transcription.completed` - Transcription done
- `response.text.delta` - Streaming text token
- `response.text.done` - Complete response
- `error` - Error occurred

**Outbound (Client → OpenAI):**
- `input_audio_buffer.append` - Send audio chunk
- `input_audio_buffer.commit` - Finalize audio buffer
- `conversation.item.create` - Send text message
- `response.create` - Request response generation

## Performance Optimizations

### 1. Component Level
- **useMemo** for expensive calculations (particle positions, colors)
- **useCallback** would be used for event handlers if needed
- Minimal re-renders through selective store subscriptions

### 2. 3D Rendering
- **High-performance WebGL context**
- **Efficient particle system** (1000 particles, static positions)
- **Optimized materials** (MeshDistortMaterial with reasonable settings)
- **requestAnimationFrame** for smooth 60fps updates

### 3. Audio Processing
- **Efficient buffer sizes** (4096 samples)
- **Direct binary conversion** (Float32 → Int16)
- **Chunked sending** (not storing entire audio)

### 4. WebSocket
- **Single persistent connection**
- **Binary data where possible** (base64 audio)
- **Event-driven architecture**
- **Automatic reconnection** (can be added)

## Security Considerations

### API Key Storage
- Stored in browser localStorage (client-side only)
- Never sent to any server except OpenAI
- User can clear at any time
- Not exposed in client-side code

### Best Practices for Production
1. Use environment variables for sensitive data
2. Implement server-side proxy for API calls
3. Add rate limiting
4. Implement user authentication
5. Use HTTPS only (required for microphone access)

## Scalability Considerations

### Current Implementation
- Single user, single session
- Client-side only (no server persistence)
- One WebSocket connection per user

### Future Enhancements
1. **Multi-user Support**
   - Add authentication layer
   - User-specific API keys
   - Conversation history storage

2. **Backend Integration**
   - Next.js API routes as proxy
   - Database for conversation persistence
   - Session management

3. **Advanced Features**
   - Audio output playback
   - Multiple voices
   - Language selection
   - Conversation branching

## Error Handling

### Levels of Error Handling

1. **Connection Errors**
   - WebSocket failures
   - API key validation
   - Network issues

2. **Audio Errors**
   - Microphone access denied
   - Audio processing failures
   - Browser compatibility

3. **API Errors**
   - Rate limiting
   - Invalid requests
   - Service unavailable

### Error Display
- Toast notifications (top of screen)
- User-friendly messages
- Technical details in console

## Browser Compatibility

### Required Features
- WebSocket support ✓
- Web Audio API ✓
- MediaDevices.getUserMedia ✓
- WebGL (for 3D visualization) ✓
- ES6+ JavaScript ✓

### Supported Browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

### Not Supported
- Internet Explorer
- Older mobile browsers
- Browsers without microphone access

## Testing Considerations

### Unit Tests (Recommended)
- Store actions and state updates
- Audio processing functions
- Message formatting utilities

### Integration Tests (Recommended)
- WebSocket connection flow
- Audio capture and processing
- State management flow

### E2E Tests (Recommended)
- Full user flow
- Microphone permissions
- Text streaming visualization

## Development Workflow

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
npm run lint
```

## Future Architecture Improvements

1. **Server-Side Rendering**
   - Move API key handling to server
   - Implement API proxy routes

2. **State Persistence**
   - IndexedDB for conversation history
   - Export/Import conversations

3. **Audio Enhancements**
   - Add audio output playback
   - Support multiple audio formats
   - Echo cancellation improvements

4. **Monitoring & Analytics**
   - Error tracking (Sentry)
   - Performance monitoring
   - Usage analytics

5. **Progressive Web App**
   - Service worker for offline support
   - Install prompt
   - Push notifications

## Conclusion

This architecture provides a solid foundation for a real-time voice-to-text AI conversation application. It's designed to be:

- **Performant:** Optimized rendering and audio processing
- **Maintainable:** Clear separation of concerns
- **Extensible:** Easy to add new features
- **User-Friendly:** Smooth animations and clear feedback
- **Type-Safe:** Full TypeScript coverage

The modular design allows for easy testing, debugging, and future enhancements while maintaining a clean and understandable codebase.