# Quick Start Guide

Get your Voice Chat app running in 5 minutes! 🚀

## Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- A modern browser (Chrome, Edge, or Firefox recommended)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

**Option A: Use .env.local (Recommended)**

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Get your OpenAI API key:
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Sign in or create an account
   - Navigate to API Keys section
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)

3. Edit `.env.local` and add your API key:
```bash
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-actual-key-here
```

**Option B: Enter API Key in Browser**

If you skip the `.env.local` setup, the app will prompt you to enter your API key when you first open it. The key will be stored in your browser's localStorage.

> **Note:** You need access to the OpenAI Realtime API. This is currently in beta.

### 3. Run the Development Server

```bash
npm run dev
```

The app will start at [http://localhost:3000](http://localhost:3000)

### 4. Open the App

Open [http://localhost:3000](http://localhost:3000) in your browser.

If you configured `.env.local`, the app will connect automatically. Otherwise, you'll see a modal to enter your API key.

### 5. Grant Microphone Access

When prompted, allow the app to access your microphone.

### 6. Start Chatting!

- **Click the microphone button** or **press the spacebar** to start speaking
- Speak naturally - the app will detect when you finish speaking
- Watch the cosmic sphere react to your voice
- Your transcription appears temporarily while you speak (with gradient text)
- AI responses stream smoothly on screen (permanent display)
- Listen for subtle audio cues when state changes (thinking, generating)

## Controls

| Action | Method |
|--------|--------|
| Start/Stop Listening | Click microphone button |
| Toggle Listening | Hold Spacebar |
| Show/Hide Controls | Press ESC or move mouse |
| Change API Key | Click settings icon (top left) |
| Scroll Text | Mouse wheel / Trackpad |

## Visual Indicators

- **Gray Sphere** - Idle, waiting for input
- **Blue/Chaotic Sphere** - Listening to you speak
- **Purple/Calm Sphere** - Processing your request
- **Cyan/Active Sphere** - AI responding

## Troubleshooting

### "Failed to connect"
- Check that your API key is correct
- Verify you have internet connection
- Ensure you have access to OpenAI Realtime API beta

### Microphone not working
- Check browser permissions (click the lock icon in address bar)
- Try a different browser
- Ensure your microphone is connected and working
- Use HTTPS (required for microphone access in production)

### No audio visualization
- Speak louder or closer to the microphone
- Check that your microphone volume is turned up
- Adjust the VAD (Voice Activity Detection) threshold in `lib/realtimeService.ts`

### Text not streaming
- Check browser console for errors (F12)
- Verify WebSocket connection is established
- Check your OpenAI API rate limits

## Configuration

### Adjust Voice Activity Detection

Edit `.env.local` or `lib/realtimeService.ts` around line 88:

```typescript
turn_detection: {
  type: 'server_vad',
  threshold: 0.5,        // Lower = more sensitive (0.0 - 1.0)
  prefix_padding_ms: 300, // Audio before speech starts
  silence_duration_ms: 500, // Silence before turn ends
}
```

### Change AI Voice

Edit `.env.local`:

```bash
NEXT_PUBLIC_VOICE=nova
# Options: alloy, echo, fable, onyx, nova, shimmer
```

Or edit `lib/realtimeService.ts` around line 75 for hardcoded value.

### Change Model or Temperature

Edit `.env.local`:

```bash
NEXT_PUBLIC_MODEL_NAME=gpt-4o-realtime-preview-2024-12-17
NEXT_PUBLIC_TEMPERATURE=0.8  # 0.0 (focused) to 1.0 (creative)
NEXT_PUBLIC_MAX_TOKENS=4096
```

### Customize Visualizer Colors

Edit `components/AudioVisualizer.tsx` around line 16:

```typescript
const colors = useMemo(
  () => ({
    idle: new THREE.Color(0x4a5568),    // Your color here
    listening: new THREE.Color(0x6366f1), // Your color here
    thinking: new THREE.Color(0x8b5cf6),  // Your color here
    speaking: new THREE.Color(0x06b6d4),  // Your color here
  }),
  [],
);
```

## Audio Cues

The app plays subtle audio feedback for state changes:
- **Listening**: Gentle ascending tone (when you start speaking)
- **Thinking**: Low calming tone (when processing your request)
- **Generating**: Pleasant two-tone chime (when AI starts responding)
- **Completion**: Gentle descending tone (when response is complete)

Audio cues are implemented in `lib/audioCues.ts` using the Web Audio API.

## Next Steps

- Explore the code in `components/` to understand the UI
- Check `lib/realtimeService.ts` for WebSocket integration
- Customize the styling in `app/globals.css`
- Read the full README.md for deployment instructions
- See DESIGN.md for design system details
- See CUSTOMIZATION.md for easy customization recipes

## Need Help?

- Check the browser console (F12) for detailed error messages
- Review the [OpenAI Realtime API docs](https://platform.openai.com/docs/guides/realtime)
- Open an issue in the repository

---

**Enjoy your AI voice conversations!** 🎤✨