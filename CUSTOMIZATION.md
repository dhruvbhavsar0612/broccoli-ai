# Customization Guide

Easy ways to customize your Voice Chat experience to match your brand and preferences.

---

## 🎨 Colors & Themes

### Change Brand Colors

Edit `app/globals.css` (lines 3-8):

```css
:root {
    --background: #0a0a0f;        /* Main background */
    --foreground: #ffffff;         /* Text color */
    --accent-primary: #6366f1;     /* Primary brand color */
    --accent-secondary: #8b5cf6;   /* Secondary brand color */
    --accent-tertiary: #06b6d4;    /* Tertiary brand color */
}
```

### Visualizer State Colors

Edit `components/AudioVisualizer.tsx` (lines 17-23):

```typescript
const colors = useMemo(
  () => ({
    idle: new THREE.Color(0x2d3748),      // Your hex color
    listening: new THREE.Color(0x6366f1),  // Your hex color
    thinking: new THREE.Color(0x8b5cf6),   // Your hex color
    speaking: new THREE.Color(0x06b6d4),   // Your hex color
  }),
  [],
);
```

### Button Gradients

Edit `components/VoiceChat.tsx` (line 222):

```typescript
// Idle state
className="bg-gradient-to-br from-indigo-600 to-purple-600"

// Listening state  
className="bg-gradient-to-br from-red-500 to-pink-600"
```

---

## 🔤 Typography

### Change Fonts

1. Install your preferred fonts:

```bash
npm install @fontsource/your-font-name
```

2. Update `app/layout.tsx`:

```typescript
import { Your_Font } from "next/font/google";

const yourFont = Your_Font({
  variable: "--font-your-font",
  subsets: ["latin"],
  display: "swap",
});
```

3. Update CSS variables in `app/globals.css`:

```css
--font-sans: var(--font-your-font);
--font-display: var(--font-your-font);
```

### Text Sizes

Edit `components/FlowingText.tsx` (line 170):

```typescript
// Conversation text size
className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl"

// Change to smaller:
className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl"

// Or larger:
className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
```

---

## 🎭 Animations

### Animation Speed

Edit `components/FlowingText.tsx`:

**Word fade-in speed** (line 205):
```typescript
transition={{
  duration: 0.6,        // Change to 0.4 for faster, 0.8 for slower
  ease: [0.22, 1, 0.36, 1],
  delay: index * 0.04,  // Change to 0.02 for faster, 0.06 for slower
}}
```

**Button animations** in `components/VoiceChat.tsx` (line 220):
```typescript
whileHover={{ scale: 1.05 }}  // Change to 1.1 for more dramatic
whileTap={{ scale: 0.95 }}    // Change to 0.9 for more dramatic
```

### Disable Animations

For reduced motion, add to `app/globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🌐 3D Visualizer

### Sphere Size

Edit `components/AudioVisualizer.tsx` (line 77):

```typescript
<Sphere ref={meshRef} args={[1, 128, 128]}>
// Change first arg: 0.8 (smaller), 1.5 (larger)
```

### Distortion Amount

Edit `components/AudioVisualizer.tsx` (lines 73-85):

```typescript
if (appState === "listening") {
  materialRef.current.distort = 0.4 + audioLevel * 0.8;
  // Lower numbers = less distortion
  // Higher numbers = more distortion
}
```

### Particle Count

Edit `components/AudioVisualizer.tsx` (line 128):

```typescript
const particlesCount = 1500;  // Change to 500-3000
// Lower = better performance, less visual
// Higher = more dramatic, more GPU usage
```

### Camera Position

Edit `components/AudioVisualizer.tsx` (line 212):

```typescript
camera={{ position: [0, 0, 4.5], fov: 55 }}
// [x, y, z]: Move camera closer (lower z) or further (higher z)
// fov: 45 (zoomed in), 65 (zoomed out)
```

### Disable 3D Visualizer

Replace `components/AudioVisualizer.tsx` content with:

```typescript
export default function AudioVisualizer() {
  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
  );
}
```

---

## 💬 Text Display

### Text Alignment

Edit `components/FlowingText.tsx`:

```typescript
// Center aligned (default)
className="text-center"

// Left aligned
className="text-left"

// Right aligned  
className="text-right"
```

### Hide User Transcriptions

Edit `components/FlowingText.tsx` (lines 54-132):

Remove or comment out the entire "User Transcription" section.

### Message Spacing

Edit `components/FlowingText.tsx` (line 51):

```typescript
<div className="max-w-5xl w-full space-y-16">
// Change space-y-16 to space-y-8 (less) or space-y-24 (more)
```

### Gradient Text Colors

Edit `components/FlowingText.tsx` (line 173):

```typescript
style={{
  background: "linear-gradient(to bottom, #ffffff 0%, #888888 100%)",
  // Change colors to your preference
}}
```

---

## 🎛️ Controls

### Button Size

Edit `components/VoiceChat.tsx` (line 223):

```typescript
className="w-24 h-24"  // Default: 96px
// Change to: w-20 h-20 (80px) or w-28 h-28 (112px)
```

### Auto-Hide Delay

Edit `components/VoiceChat.tsx` (line 106):

```typescript
const timeout = setTimeout(() => {
  setShowControls(false);
}, 3000);  // Change to 5000 (5s) or 1000 (1s)
```

### Disable Auto-Hide

Edit `components/VoiceChat.tsx`:

Remove lines 104-111 (the auto-hide effect).

### Button Position

Edit `components/VoiceChat.tsx` (line 214):

```typescript
className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
// Change bottom-12 to bottom-8 (closer) or bottom-20 (further)
```

---

## 🔊 Audio Settings

### Voice Activity Detection

Edit `lib/realtimeService.ts` (lines 72-77):

```typescript
turn_detection: {
  type: 'server_vad',
  threshold: 0.5,           // 0.0-1.0: Lower = more sensitive
  prefix_padding_ms: 300,   // Audio before speech (ms)
  silence_duration_ms: 500, // Silence before turn ends (ms)
}
```

### AI Voice Selection

Edit `lib/realtimeService.ts` (line 67):

```typescript
voice: 'alloy',
// Options: 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
```

### Response Length

Edit `lib/realtimeService.ts` (line 79):

```typescript
max_response_output_tokens: 4096,
// Lower for shorter responses, higher for longer
```

### AI Temperature

Edit `lib/realtimeService.ts` (line 78):

```typescript
temperature: 0.8,
// 0.0 = More focused, deterministic
// 1.0 = More creative, varied
```

---

## 🖼️ Background

### Simple Gradient Background

Replace visualizer with solid gradient. Edit `components/VoiceChat.tsx` (line 124):

```typescript
<div className="relative w-full h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black overflow-hidden">
```

Then comment out the `<AudioVisualizer />` line.

### Custom Background Image

```typescript
<div className="relative w-full h-screen overflow-hidden"
     style={{ backgroundImage: 'url(/your-image.jpg)', backgroundSize: 'cover' }}>
```

### Animated Gradient

Add to `app/globals.css`:

```css
@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.animated-bg {
  background: linear-gradient(-45deg, #6366f1, #8b5cf6, #06b6d4, #ec4899);
  background-size: 400% 400%;
  animation: gradient-shift 15s ease infinite;
}
```

Use: `className="animated-bg"`

---

## 📱 Mobile Optimization

### Touch-Friendly Button

Edit `components/VoiceChat.tsx` (line 223):

```typescript
// Make button larger on mobile
className="w-28 h-28 md:w-24 md:h-24"
```

### Text Size on Mobile

Edit `components/FlowingText.tsx` (line 170):

```typescript
// Smaller text on mobile
className="text-xl md:text-3xl lg:text-5xl"
```

---

## 🎨 Glassmorphism Effects

### Adjust Glass Opacity

Edit `app/globals.css` (lines 151-156):

```css
.glass {
  background: rgba(255, 255, 255, 0.05);  /* Increase for more visible */
  backdrop-filter: blur(20px);            /* Increase for more blur */
}
```

### Disable Glass Effects

Edit `app/globals.css`:

```css
.glass, .glass-dark {
  background: rgba(0, 0, 0, 0.8);  /* Solid background */
  backdrop-filter: none;            /* No blur */
}
```

---

## 🌟 Special Effects

### Glow Intensity

Edit `app/globals.css` (lines 207-213):

```css
.shadow-glow {
  box-shadow: 0 0 40px rgba(99, 102, 241, 0.3);
  /* Increase 40px and 0.3 for stronger glow */
}
```

### Pulse Effect Speed

Edit `components/VoiceChat.tsx` (line 283):

```typescript
transition={{
  duration: 2,  // Change to 1 (faster) or 3 (slower)
  repeat: Infinity,
}}
```

---

## 🎯 Quick Presets

### Minimal Mode
```typescript
// Hide all UI except button and text
// Remove connection status, settings button
// Disable auto-hide
// Simple black background
```

### Dramatic Mode
```typescript
// Larger text (7xl)
// More particles (3000)
// Higher distortion (1.5x)
// Stronger glows
// Faster animations (0.5x duration)
```

### Performance Mode
```typescript
// Fewer particles (500)
// Lower distortion
// Disable blur effects
// Simpler animations
// Static background
```

### Accessibility Mode
```typescript
// High contrast colors
// Larger buttons (w-32 h-32)
// Slower animations (1.5x duration)
// No blur effects
// Clearer state indicators
```

---

## 🔧 Advanced

### Custom State Machine

Add new states in `lib/store.ts`:

```typescript
export type AppState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'your-state';
```

Then add handling in:
- `components/AudioVisualizer.tsx`
- `components/FlowingText.tsx`
- `components/VoiceChat.tsx`

### Custom Instructions

Edit `lib/realtimeService.ts` (line 66):

```typescript
instructions: 'Your custom AI instructions here',
```

### Multiple Voices

Add voice selector UI, store choice in state, and use in session config.

---

## 📦 Export Customizations

Save your customizations:

```bash
# Create a custom theme file
mkdir themes
cp app/globals.css themes/my-theme.css
```

Share your theme:
1. Document your changes
2. Create a preset file
3. Share with the community!

---

## 🐛 Troubleshooting

**Colors not changing?**
- Hard refresh (Ctrl+Shift+R)
- Clear build cache: `rm -rf .next`
- Rebuild: `npm run build`

**Animations too fast/slow?**
- Check `prefers-reduced-motion` setting
- Ensure durations are in milliseconds
- Test on different devices

**3D visualizer not working?**
- Check WebGL support
- Update GPU drivers
- Try disabling hardware acceleration
- Use fallback gradient background

---

## 💡 Tips

1. **Test on multiple devices** - Colors and animations look different on each screen
2. **Keep it accessible** - Maintain contrast ratios and provide alternatives
3. **Performance first** - Reduce particles/effects if frame rate drops
4. **Save originals** - Keep backup of original files before customizing
5. **Iterate** - Small changes often have big impact

---

## 🎓 Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Three.js Docs](https://threejs.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)

---

**Happy Customizing!** 🚀

Create something amazing and share it with the community.