/**
 * Font Configuration
 *
 * To change the display font, update the ACTIVE_FONT constant below.
 * Available options: 'merriweather' | 'lora' | 'crimson' | 'playfair' | 'space-grotesk'
 */

export type FontOption = 'merriweather' | 'lora' | 'crimson' | 'playfair' | 'space-grotesk';

// 🎨 CHANGE THIS TO SWITCH FONTS
export const ACTIVE_FONT: FontOption = 'merriweather';

export const FONT_CONFIG = {
  merriweather: {
    name: 'Merriweather',
    className: 'font-display',
    description: 'Classic serif with excellent readability',
    type: 'serif',
    weights: [300, 400, 700],
  },
  lora: {
    name: 'Lora',
    className: 'font-display-alt',
    description: 'Contemporary serif with calligraphic touches',
    type: 'serif',
    weights: [400, 500, 600, 700],
  },
  crimson: {
    name: 'Crimson Text',
    className: 'font-display-alt2',
    description: 'Inspired by classic book typography',
    type: 'serif',
    weights: [400, 600, 700],
  },
  playfair: {
    name: 'Playfair Display',
    className: 'font-display-alt3',
    description: 'Elegant high-contrast serif for display',
    type: 'serif',
    weights: [400, 500, 600, 700, 800, 900],
  },
  'space-grotesk': {
    name: 'Space Grotesk',
    className: 'font-space-grotesk',
    description: 'Modern geometric sans-serif',
    type: 'sans-serif',
    weights: [300, 400, 500, 600, 700],
  },
};

/**
 * Get the current active font configuration
 */
export function getActiveFont() {
  return FONT_CONFIG[ACTIVE_FONT];
}

/**
 * Get the font family CSS class for the active font
 */
export function getFontClass() {
  return FONT_CONFIG[ACTIVE_FONT].className;
}
