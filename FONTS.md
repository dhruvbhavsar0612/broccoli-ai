# Font Guide

This app now includes **Merriweather** and several other beautiful font options. You can easily switch between them.

## Current Font

**Merriweather** - A classic serif font with excellent readability, perfect for long-form reading and elegant displays.

## Available Fonts

### 1. Merriweather (Default) ✓
- **Type**: Serif
- **Style**: Classic, readable
- **Best for**: Long-form content, elegant displays
- **Weights**: Light (300), Regular (400), Bold (700)
- **Character**: Traditional, professional, warm

### 2. Lora
- **Type**: Serif
- **Style**: Contemporary with calligraphic touches
- **Best for**: Poetry, artistic content
- **Character**: Elegant, flowing, literary

### 3. Crimson Text
- **Type**: Serif
- **Style**: Inspired by classic book typography
- **Best for**: Academic, literary content
- **Character**: Traditional, scholarly, refined

### 4. Playfair Display
- **Type**: Serif
- **Style**: High-contrast display serif
- **Best for**: Headlines, dramatic displays
- **Character**: Luxurious, dramatic, fashion-forward

### 5. Space Grotesk (Original)
- **Type**: Sans-serif
- **Style**: Modern geometric
- **Best for**: Tech, minimal designs
- **Character**: Clean, futuristic, modern

## How to Switch Fonts

### Quick Switch (Recommended)

Edit `lib/fontConfig.ts`:

```typescript
// Change this line to your preferred font:
export const ACTIVE_FONT: FontOption = 'merriweather';  // Current

// Options:
// 'merriweather'  - Classic serif (current)
// 'lora'          - Contemporary serif
// 'crimson'       - Book-inspired serif
// 'playfair'      - Dramatic display serif
// 'space-grotesk' - Modern sans-serif
```

Then restart the dev server:
```bash
npm run dev
```

### Manual Method

If you want to customize further, edit `app/globals.css`:

```css
--font-display: var(--font-display);        /* Merriweather */
--font-display: var(--font-display-alt);    /* Lora */
--font-display: var(--font-display-alt2);   /* Crimson Text */
--font-display: var(--font-display-alt3);   /* Playfair Display */
--font-display: var(--font-space-grotesk);  /* Space Grotesk */
```

## Font Pairings

### For Different Moods

**Professional & Traditional**
```
Display: Merriweather
UI: Inter
```

**Artistic & Literary**
```
Display: Lora
UI: Inter
```

**Luxurious & Dramatic**
```
Display: Playfair Display
UI: Inter
```

**Modern & Clean**
```
Display: Space Grotesk
UI: Inter
```

## Customization Tips

### Adjust Font Weight

Edit `components/FlowingText.tsx`:

```typescript
className="font-light"    // Current (300)
className="font-normal"   // Regular (400)
className="font-semibold" // Semi-bold (600)
```

### Adjust Letter Spacing

Serif fonts generally work better with normal letter spacing:

```typescript
className="tracking-normal"  // Current (better for serifs)
className="tracking-wide"    // More spaced out
className="tracking-tight"   // Tighter spacing
```

### Adjust Line Height

For better readability with different fonts:

```typescript
className="leading-relaxed"  // Current (1.625)
className="leading-loose"    // More spacious (2)
className="leading-normal"   // Standard (1.5)
```

## Adding More Fonts

Want to add another font? Here's how:

1. **Find a Google Font** at [fonts.google.com](https://fonts.google.com)

2. **Add to `app/layout.tsx`**:
```typescript
import { Your_Font_Name } from "next/font/google";

const yourFont = Your_Font_Name({
  variable: "--font-your-font",
  subsets: ["latin"],
  display: "swap",
});
```

3. **Update the className**:
```typescript
className={`${inter.variable} ${merriweather.variable} ${yourFont.variable} antialiased`}
```

4. **Use in CSS** (`app/globals.css`):
```css
--font-display: var(--font-your-font);
```

## Font Performance

All fonts are optimized with:
- **Font Display**: Swap (prevents invisible text)
- **Subsetting**: Latin characters only
- **Preloading**: Next.js automatic optimization
- **Variable Fonts**: Where available for better performance

## Recommendations by Use Case

- **Conversational AI**: Merriweather (warm, readable)
- **Poetry/Creative**: Lora (flowing, artistic)
- **Professional/Business**: Crimson Text (refined)
- **Luxury/Premium**: Playfair Display (dramatic)
- **Tech/Modern**: Space Grotesk (clean)

## Current Configuration

```typescript
Display Font: Merriweather (serif)
UI Font: Inter (sans-serif)
Weights: 300 (light), 400 (regular)
Tracking: Normal
Line Height: Relaxed (1.625)
```

## Testing

After changing fonts:
1. Restart dev server: `npm run dev`
2. Check readability at different screen sizes
3. Test with long and short text
4. Verify gradient effects still look good
5. Check animation smoothness

## Troubleshooting

**Font not loading?**
- Clear `.next` cache: `rm -rf .next`
- Rebuild: `npm run build`
- Hard refresh browser: Ctrl+Shift+R

**Font looks too bold/light?**
- Adjust weight in `FlowingText.tsx`
- Check if weight is available for that font

**Font looks cramped?**
- Increase line height: `leading-loose`
- Increase letter spacing: `tracking-wide`

---

**Current Font**: Merriweather  
**Recommended for**: Elegant, readable AI conversations  
**Type**: Serif  
**Optimized for**: All screen sizes

Enjoy your beautiful typography! ✨