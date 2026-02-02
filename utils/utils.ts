import { Theme } from "@/types/types";

type RGB = {
  r: number;
  g: number;
  b: number;
};

export function isImgUrl(url: string) {
  return /\.(jpg|jpeg|png|webp|avif|gif)$/.test(url);
}

export function formatImgUrl(url: string) {
  const match = url.match(/\.(jpg|jpeg|png|webp|avif|gif)/i);

  if (match && match.index !== undefined) {
    return url.substring(0, match.index + match[0].length);
  }

  return url;
}

// complicated function that takes a theme and calculate optimizations to make it WCAG AA compliant (4.5:1 contrast)
// yes Gemini generated this.
export function optimizeThemeForReadability(originalTheme: Theme): Theme {
  // HELPER FUNCTIONS

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    ((r /= 255), (g /= 255), (b /= 255));
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return { h: h * 360, s, l }; // h in degrees, s/l in 0-1
  };

  const hslToHex = (h: number, s: number, l: number) => {
    l = Math.max(0, Math.min(1, l));
    s = Math.max(0, Math.min(1, s));
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0,
      g = 0,
      b = 0;

    if (0 <= h && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (60 <= h && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (120 <= h && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (180 <= h && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (240 <= h && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (300 <= h && h < 360) {
      r = c;
      g = 0;
      b = x;
    }

    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const getLuminance = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const getContrast = (hex1: string, hex2: string) => {
    const lum1 = getLuminance(hex1);
    const lum2 = getLuminance(hex2);
    return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  };

  // ADJUSTEMENTS LOGIC

  // softens color by capping saturation (ease on the eyes)
  const softenColor = (hex: string, maxSaturation = 0.75): string => {
    const { r, g, b } = hexToRgb(hex);
    let { h, s, l } = rgbToHsl(r, g, b);
    if (s > maxSaturation) s = maxSaturation;
    return hslToHex(h, s, l);
  };

  // iteratively adjusts foreground lightness until contrast >= 4.5
  const ensureContrast = (bgHex: string, fgHex: string, targetRatio = 4.5): string => {
    let currentContrast = getContrast(bgHex, fgHex);
    if (currentContrast >= targetRatio) return fgHex;

    const bgLum = getLuminance(bgHex);
    const { r, g, b } = hexToRgb(fgHex);
    let { h, s, l } = rgbToHsl(r, g, b);

    // if background is dark (Lum < 0.5), lighten text, else darken text
    const lighten = bgLum < 0.5;

    for (let i = 0; i < 20; i++) {
      l += lighten ? 0.05 : -0.05;
      const newHex = hslToHex(h, s, l);
      if (getContrast(bgHex, newHex) >= targetRatio) return newHex;
      // prevent going out of bounds
      if (l <= 0 || l >= 1) break;
    }

    // fallback to black or white if subtle adjustment failed
    return lighten ? "#FFFFFF" : "#000000";
  };

  // OPTIMIZATIONS

  // soften the base colors first
  let pDark = softenColor(originalTheme.primary_color_dark); // Main background
  let pLight = softenColor(originalTheme.primary_color); // Input background
  let accent = softenColor(originalTheme.accent_color);

  // ensure strict readability on the MAIN background (primary_color_dark)
  let text = ensureContrast(pDark, originalTheme.text_color);
  let accentText = ensureContrast(pDark, originalTheme.accent_text_color);

  // what ?
  // Step C: Edge Case - The Input Box
  // In your UI, 'text_color' is ALSO used inside 'primary_color' (the input box).
  // If fixing it for the main background broke it for the input box, we prioritize the main chat.
  // However, we can try to adjust 'primary_color' (the box bg) slightly to fit the text if needed,
  // OR usually the input box is lighter/darker enough to support the same text.
  // Let's check contrast of InputBox vs Text.
  if (getContrast(pLight, text) < 4.5) {
    // If the text is unreadable in the input box, darken/lighten the INPUT BOX
    // (since we can't change the text without breaking the main chat)
    pLight = ensureContrast(text, pLight);
  }

  return {
    primary_color: pLight,
    primary_color_dark: pDark,
    accent_color: accent,
    text_color: text,
    accent_text_color: accentText,
  };
}
