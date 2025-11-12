# Design Guide - Voice Chat Immersive Experience

## Design Philosophy

This application embodies a **minimalist, immersive, and premium** design language that focuses on:

1. **Zero UI Distraction** - The interface disappears, leaving only the conversation
2. **Fluid Motion** - Every element moves with purpose and grace
3. **Cosmic Aesthetic** - Space-age, futuristic visual language
4. **Sensory Feedback** - Visual, motion, and spatial cues guide the experience

---

## Typography

### Font Stack

**Primary Font: Inter**
- Used for body text, UI elements, captions
- Weight: 400 (Regular), 500 (Medium), 600 (Semi-bold)
- Modern, highly legible, perfect for UI

**Display Font: Space Grotesk**
- Used for headings, large text, conversation display
- Weight: 600 (Semi-bold)
- Distinctive character, excellent for impact

### Text Sizes

```
Conversation Text:
- Desktop: 3xl-6xl (48px-96px)
- Tablet: 2xl-4xl (36px-64px)
- Mobile: xl-3xl (24px-48px)

UI Elements:
- Labels: sm (14px)
- Body: base (16px)
- Titles: 2xl-3xl (24px-32px)
```

### Text Effects

**Gradient Text:**
```css
background: linear-gradient(to bottom, #ffffff 0%, #888888 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

**Colorful Gradient (User Input):**
```css
background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

---

## Color Palette

### Base Colors

```
Background:     #0a0a0f (Near Black)
Foreground:     #ffffff (Pure White)
Surface:        rgba(255, 255, 255, 0.05) (Glass effect)
Border:         rgba(255, 255, 255, 0.1) (Subtle separation)
```

### Brand Colors

```
Primary (Indigo):   #6366f1
Secondary (Purple): #8b5cf6
Tertiary (Cyan):    #06b6d4
Accent (Pink):      #ec4899

Gradients:
- Primary:   linear-gradient(to right, #6366f1, #8b5cf6)
- Full:      linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)
- Warm:      linear-gradient(to right, #f43f5e, #ec4899)
```

### State Colors

```
Idle:       #2d3748 (Dark Gray)
Listening:  #6366f1 (Indigo) + #ec4899 (Pink pulse)
Thinking:   #8b5cf6 (Purple)
Speaking:   #06b6d4 (Cyan)
Success:    #10b981 (Emerald)
Error:      #ef4444 (Red)
```

---

## Glassmorphism

### Glass Effect (Light)
```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.1);
```

### Glass Effect (Dark)
```css
background: rgba(0, 0, 0, 0.3);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.05);
```

**Usage:**
- Modal backgrounds
- Control panels
- Status indicators
- Toast notifications

---

## Animations & Transitions

### Duration Scale
```
Fast:     200ms  (Button hover, quick feedback)
Default:  300ms  (Standard transitions)
Smooth:   500ms  (Smooth state changes)
Slow:     800ms  (Dramatic reveals)
Epic:     1000ms (Major transitions)
```

### Easing Functions
```
Standard:     cubic-bezier(0.4, 0.0, 0.2, 1)
Smooth:       cubic-bezier(0.22, 1, 0.36, 1)
Bounce:       cubic-bezier(0.68, -0.55, 0.265, 1.55)
Ease-Out:     cubic-bezier(0.0, 0.0, 0.2, 1)
```

### Key Animations

**Fade In:**
```
initial: { opacity: 0 }
animate: { opacity: 1 }
duration: 500ms, ease: smooth
```

**Slide Up:**
```
initial: { opacity: 0, y: 30, scale: 0.95 }
animate: { opacity: 1, y: 0, scale: 1 }
duration: 400ms, ease: standard
```

**Word Fade In:**
```
initial: { opacity: 0, y: 20, filter: blur(10px) }
animate: { opacity: 1, y: 0, filter: blur(0px) }
duration: 600ms, ease: smooth, stagger: 40ms
```

**Pulse (Listening):**
```
animate: {
  scale: [1, 1.4, 1],
  opacity: [0.5, 0, 0.5]
}
duration: 2000ms, repeat: infinite
```

---

## 3D Visualizer

### Cosmic Sphere

**Materials:**
- Type: MeshDistortMaterial
- Metalness: 0.9 (Highly reflective)
- Roughness: 0.2 (Smooth surface)
- Emissive: State-dependent colors
- Distortion: Dynamic (0.2 - 1.2)
- Speed: Dynamic (1.2 - 8)

**State Behaviors:**

**Idle:**
- Slow rotation (0.1 rad/s)
- Minimal distortion (0.2)
- Calm, steady presence
- Gray color (#2d3748)

**Listening:**
- Chaotic rotation (audio-reactive)
- High distortion (0.4 + audio * 0.8)
- Dramatic scale pulse (1 + audio * 0.35)
- Indigo color (#6366f1)
- Multiple pulse rings

**Thinking:**
- Medium rotation (0.3 rad/s)
- Pulsing distortion (0.3 + sin * 0.15)
- Rhythmic scale (1 + sin * 0.08)
- Purple color (#8b5cf6)

**Speaking:**
- Active rotation (0.2 rad/s)
- Moderate distortion (0.35 + sin * 0.2)
- Gentle pulse
- Cyan color (#06b6d4)

### Particle Field

**Configuration:**
- Count: 1500 particles
- Distribution: Spherical (radius 2.5-6.5)
- Size: 0.025 - 0.08 (state-dependent)
- Opacity: 0.35 - 1.0 (state-dependent)
- Color: Purple (#8b5cf6)
- Blending: Additive
- Rotation: Continuous, slow

---

## UI Components

### Main Action Button

**Size:** 96px × 96px (w-24 h-24)

**States:**
- Idle: Indigo to Purple gradient
- Listening: Red to Pink gradient
- Disabled: 50% opacity

**Effects:**
- Hover: Scale 1.05, glow effect
- Tap: Scale 0.95
- Listening: Multiple pulsing rings
- Thinking: Single pulsing ring

**Shadow:**
```css
box-shadow: 0 0 40px rgba(99, 102, 241, 0.3); /* idle/thinking */
box-shadow: 0 0 60px rgba(99, 102, 241, 0.4); /* hover */
box-shadow: 0 0 60px rgba(239, 68, 68, 0.5); /* listening */
```

### Status Indicators

**Connection Status:**
- Position: Top right
- Style: Glass capsule
- Indicator: Pulsing dot (2px)
- Auto-hide: 3s after mouse stops

**State Label:**
- Position: Below main button
- Style: Glass capsule
- Typography: sm, medium weight
- States: "Connecting", "Press to speak", "Listening", "Processing", "Speaking"

### Modal (API Key Input)

**Style:**
- Glass dark background
- Rounded: 24px (3xl)
- Padding: 40px
- Max-width: 512px
- Border: 1px white/10

**Animations:**
- Entry: Scale 0.95 → 1, opacity 0 → 1, y: 20 → 0
- Exit: Reverse
- Duration: 300ms

**Input Field:**
- Background: white/5
- Border: white/10
- Rounded: 12px
- Focus: 2px ring indigo/50
- Padding: 16px 20px

**Submit Button:**
- Gradient: Indigo to Purple
- Hover: Lighter gradient
- Glow on hover
- Full width
- Rounded: 12px

---

## Text Display

### User Transcription (Temporary)

**Display:** Only while listening state
**Style:**
- Glass dark container
- Rounded: 24px
- Padding: 32px 40px
- Glow effect background (blur-3xl)
- Colorful gradient text
- Pulsing scale animation
- 3 pulsing dots below

**Animation:**
- Entry: opacity 0 → 1, y: 30 → 0, scale: 0.95 → 1 (600ms)
- Exit: opacity 1 → 0, y: 0 → -30, scale: 1 → 0.95 (600ms)

### AI Response Text

**Display:** Permanent, scrollable
**Style:**
- Large display font (3xl-6xl)
- Light weight (300)
- White to gray gradient
- Letter spacing: wide
- Line height: relaxed

**Separator:**
- Height: 1px
- Width: 128px (8rem)
- Gradient: transparent → white/20 → transparent
- Scale X animation

**Word Animation:**
- Initial: opacity 0, y: 20, blur: 10px
- Animate: opacity 1, y: 0, blur: 0
- Duration: 600ms per word
- Stagger: 40ms between words

**Streaming Indicator:**
- 3 dots bouncing vertically
- Colors: Gradient (indigo → purple → cyan)
- Size: 1.5px × 1.5px
- Bounce height: 8px
- Duration: 1000ms
- Stagger: 200ms

---

## Spatial Layout

### Z-Index Layers

```
Layer 0:  3D Canvas (visualizer)          z-0
Layer 10: Text display                     z-10
Layer 30: Connection status                z-30
Layer 40: Controls (button, status)        z-40
Layer 50: Modals, errors                   z-50
```

### Positioning

**Controls:**
- Bottom center
- Transform: translateX(-50%)
- Margin: 48px from bottom

**Connection Status:**
- Top right
- Margin: 24px

**Settings Button:**
- Top left
- Margin: 24px

**Error Toast:**
- Top center
- Transform: translateX(-50%)
- Margin: 32px from top

---

## Responsive Breakpoints

```
Mobile:     < 640px
Tablet:     640px - 1024px
Desktop:    > 1024px
```

### Adaptations

**Mobile:**
- Smaller button (80px)
- Smaller text (xl-3xl)
- Reduced padding
- Hide auto-hide controls longer

**Tablet:**
- Medium button (88px)
- Medium text (2xl-4xl)
- Standard padding

**Desktop:**
- Full button (96px)
- Large text (3xl-6xl)
- Generous padding
- Quick auto-hide (3s)

---

## Interaction Patterns

### Controls Auto-Hide

**Trigger:** Mouse movement
**Behavior:**
- Show controls immediately
- Start 3s timer
- Hide with fade out
- Reset timer on movement

**Exception:** Always show when:
- No messages yet
- State is not idle
- Modal is open

### Keyboard Shortcuts

```
Space:      Toggle listening
Escape:     Toggle controls visibility
```

### Focus States

**Buttons:**
- Ring: 2px indigo/60
- Offset: 3px
- Rounded: 8px

**Inputs:**
- Ring: 2px indigo/50
- Border: transparent
- Transition: 200ms

---

## Micro-interactions

### Button Hover
- Scale: 1 → 1.05
- Glow: fade in
- Duration: 300ms

### Button Press
- Scale: 1 → 0.95
- Duration: 100ms
- Spring back

### Modal Entry
- Background: opacity 0 → 1
- Content: scale 0.95 → 1, opacity 0 → 1
- Sequential: background first, then content
- Duration: 300ms total

### Text Appearance
- Individual words fade in
- Blur effect (10px → 0px)
- Slight upward motion (20px)
- Staggered timing (40ms apart)

---

## Performance Considerations

### 3D Rendering
- Use high-performance WebGL context
- Limit particle count (1500 max)
- Optimize material updates
- Use requestAnimationFrame for smooth 60fps

### Animations
- Use transform and opacity (GPU-accelerated)
- Avoid animating width/height
- Use will-change sparingly
- Debounce rapid state changes

### Text Rendering
- Limit DOM nodes (virtualization not needed for voice)
- Use CSS containment
- Minimize reflows
- Batch DOM updates

---

## Accessibility Notes

### Visual
- High contrast (white on near-black)
- Large, legible text
- Clear state indicators
- No reliance on color alone

### Interaction
- Keyboard accessible
- Focus states visible
- Screen reader friendly labels
- Alternative text for icons

### Motion
- Consider adding reduced motion preferences
- Provide alternative to 3D visualizer
- Allow disabling auto-hide

---

## Brand Voice

**Visual Language:**
- Minimalist
- Futuristic
- Premium
- Calm yet powerful

**Interaction Feel:**
- Effortless
- Intelligent
- Responsive
- Human-centric

**Copy Tone:**
- Concise
- Friendly
- Confident
- Clear

---

## Design Principles

1. **Less is More** - Remove everything that's not essential
2. **Motion with Purpose** - Every animation serves a function
3. **Instant Feedback** - User actions have immediate visual response
4. **Natural Hierarchy** - Important elements are obvious
5. **Consistent Spacing** - Use 4px/8px grid system
6. **Smooth Transitions** - Nothing snaps or jumps
7. **State Clarity** - Always clear what's happening
8. **Delight in Details** - Small touches make it feel premium

---

## Future Enhancements

- [ ] Audio output visualization
- [ ] Theme customization
- [ ] Multiple visualizer options
- [ ] Custom color schemes
- [ ] Reduced motion mode
- [ ] Dark/light mode toggle
- [ ] Mobile-optimized controls
- [ ] Haptic feedback (mobile)
- [ ] Gesture controls
- [ ] Voice commands for UI

---

Built with attention to detail and a focus on creating an immersive, distraction-free conversation experience.