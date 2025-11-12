# Voice Chat - Realtime AI Conversation

An immersive, minimalist Next.js application that provides a seamless voice-to-text AI conversation experience with real-time streaming responses using OpenAI's Realtime API. Features a cosmic 3D visualizer and poetry-in-motion text display.

## ✨ Features

- 🎤 **Voice Input**: Speak naturally with real-time transcription
- 🌊 **Flowing Text Display**: Poetry-in-motion text animation with smooth fade-ins
- 🔮 **Cosmic 3D Visualizer**: Dynamic fluid sphere with 1500+ particles reacting to your voice
- ⚡ **Real-time Streaming**: Word-by-word AI responses with elegant animations
- 🎯 **Server VAD**: Built-in Voice Activity Detection for natural conversations
- 👁️ **Immersive UI**: Auto-hiding controls for distraction-free experience
- 🎨 **Modern Design**: Glassmorphism, gradients, and contemporary typography (Inter + Space Grotesk)
- 🔒 **Privacy First**: API key stored locally in your browser

## 🎨 User Experience

- **Idle State**: Calm, slowly rotating sphere with minimal distortion
- **Listening State**: Dramatic, chaotic sphere with high distortion and multiple pulse rings (shows your transcription temporarily)
- **Thinking State**: Medium rotation with pulsing effects and animated indicator
- **Speaking State**: Active movement with smooth word-by-word text streaming and fade-in effects (permanent display)

### 🎭 Key Interactions

- **User transcriptions appear only while speaking** - Your words show in a glowing glass container with gradient text, then disappear
- **AI responses are permanent** - Displayed with elegant typography and smooth animations
- **Auto-hiding controls** - UI fades away for immersive experience (press ESC or move mouse to show)
- **Keyboard shortcuts** - Spacebar to talk, ESC to toggle controls

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- An OpenAI API key with access to the Realtime API
- A modern web browser with microphone access

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd voice-chat-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### First Time Setup

1. When you first open the app, you'll be prompted to enter your OpenAI API key
2. Your API key is stored locally in your browser (localStorage)
3. Click "Connect" to establish a connection with OpenAI's Realtime API
4. Grant microphone permissions when prompted
5. Press the microphone button or hold the spacebar to start speaking

## 🎮 Controls

- **Click Microphone Button**: Start/stop listening
- **Hold Spacebar**: Toggle listening mode
- **Settings Icon**: Change API key

## 🏗️ Project Structure

```
voice-chat-app/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx             # Main page component
│   └── globals.css          # Global styles
├── components/
│   ├── VoiceChat.tsx        # Main chat interface
│   ├── AudioVisualizer.tsx  # 3D cosmic sphere visualizer
│   └── FlowingText.tsx      # Animated text display
├── lib/
│   ├── store.ts             # Zustand state management
│   └── realtimeService.ts   # OpenAI Realtime API client
└── public/                  # Static assets
```

## 🛠️ Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Three Fiber**: 3D graphics with Three.js
- **Framer Motion** for smooth, sophisticated animations
- **Zustand**: Lightweight state management
- **OpenAI Realtime API**: Real-time audio processing and LLM responses

## 🔧 Configuration

### Session Configuration

The app uses the following OpenAI Realtime API configuration (in `realtimeService.ts`):

```typescript
{
  modalities: ['text', 'audio'],
  voice: 'alloy',
  input_audio_format: 'pcm16',
  output_audio_format: 'pcm16',
  turn_detection: {
    type: 'server_vad',
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 500,
  },
  temperature: 0.8,
  max_response_output_tokens: 4096,
}
```

You can modify these settings to customize the behavior.

## 🎨 Design & Customization

This app uses a **minimalist, immersive design language** with:
- Modern fonts: Inter (UI) + Space Grotesk (Display)
- Glassmorphism effects with backdrop blur
- Smooth cubic-bezier animations (0.22, 1, 0.36, 1)
- Auto-hiding controls for distraction-free experience
- 3D cosmic visualizer with dynamic particle system

### Quick Customization

**Colors** - Edit `app/globals.css`:
```css
--accent-primary: #6366f1;    /* Change brand colors */
--accent-secondary: #8b5cf6;
--accent-tertiary: #06b6d4;
```

**Visualizer** - Edit `components/AudioVisualizer.tsx`:
```typescript
idle: new THREE.Color(0x2d3748),      // State colors
listening: new THREE.Color(0x6366f1),
const particlesCount = 1500;          // Particle density
```

**Text Size** - Edit `components/FlowingText.tsx`:
```typescript
className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
```

**Animation Speed** - Adjust durations:
```typescript
duration: 0.6,      // Fade-in speed (ms)
delay: index * 0.04 // Word stagger delay
```

📚 **See [CUSTOMIZATION.md](CUSTOMIZATION.md) for detailed customization guide**
📐 **See [DESIGN.md](DESIGN.md) for complete design system documentation**

## 🔒 Security Notes

- Your OpenAI API key is stored in browser localStorage
- The key is never sent to any server except OpenAI
- Clear your API key using the settings button when done
- Use environment variables for server-side implementations

## 📝 API Usage

This app uses the OpenAI Realtime API which is currently in beta. Usage is billed separately from standard API calls. Check [OpenAI's pricing page](https://openai.com/pricing) for current rates.

## 🐛 Troubleshooting

### Microphone Not Working
- Check browser permissions for microphone access
- Ensure you're using HTTPS (required for microphone access)
- Try a different browser (Chrome/Edge recommended)

### Connection Errors
- Verify your OpenAI API key is valid
- Check that you have access to the Realtime API
- Ensure stable internet connection
- Check browser console for detailed error messages

### Audio Quality Issues
- Check your microphone quality
- Reduce background noise
- Adjust VAD settings in `realtimeService.ts`

## 🚧 Known Limitations

- Currently focused on text output (audio output can be enabled)
- Requires modern browser with WebSocket support
- Microphone access required for voice input
- OpenAI Realtime API is in beta and may have rate limits

## 🔮 Future Enhancements

- [ ] Add landing page with product introduction
- [ ] Implement user authentication
- [ ] Save conversation history
- [ ] Multiple voice options
- [ ] Audio output playback
- [ ] Mobile optimization
- [ ] PWA support
- [ ] Multiple language support

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical deep-dive (485 lines)
- **[DESIGN.md](DESIGN.md)** - Complete design system guide
- **[CUSTOMIZATION.md](CUSTOMIZATION.md)** - Easy customization recipes

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- OpenAI for the Realtime API
- Next.js team for the amazing framework
- Three.js and React Three Fiber communities
- Modern design inspiration from Vercel, Linear, and Apple

---

Built with ❤️ using Next.js and OpenAI Realtime API

**Experience immersive AI conversations with a design that gets out of your way.**