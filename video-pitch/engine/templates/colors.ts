/**
 * Color Utilities with Contrast Validation
 *
 * Ensures text is readable against backgrounds.
 * WCAG AA standard: minimum 4.5:1 contrast ratio for normal text.
 */

// LAUSD Color Palette
export const LAUSD_COLORS = {
  lausdGold: '#FFB81C',
  lausdNavy: '#003087',
  white: '#FFFFFF',
  successGreen: '#22C55E',
  riskRed: '#EF4444',
  gray: '#64748B',
  coral: '#FF8A80', // Added for contrast against navy
};

// Generic contrast-safe colors
export const CONTRAST_COLORS = {
  // Light colors (for dark backgrounds)
  lightYellow: '#FFD93D',
  lightCoral: '#FF8A80',
  lightCyan: '#67E8F9',
  lightGreen: '#86EFAC',
  white: '#FFFFFF',

  // Dark colors (for light backgrounds)
  darkNavy: '#003087',
  darkGray: '#374151',
  darkRed: '#B91C1C',
  black: '#000000',
};

/**
 * Parse hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Calculate relative luminance (WCAG formula)
 */
function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);

  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(foreground: string, background: string): number {
  const lum1 = getLuminance(foreground);
  const lum2 = getLuminance(background);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA standard (4.5:1 for normal text)
 */
export function meetsContrastStandard(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const threshold = level === 'AAA' ? 7 : 4.5;
  return ratio >= threshold;
}

/**
 * Validate a color scheme and report issues
 */
export function validateColorScheme(
  scheme: Array<{ name: string; foreground: string; background: string }>
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  for (const { name, foreground, background } of scheme) {
    const ratio = getContrastRatio(foreground, background);
    if (ratio < 4.5) {
      issues.push(`${name}: ratio ${ratio.toFixed(2)} (need 4.5+) - ${foreground} on ${background}`);
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Suggest a contrasting color for a given background
 */
export function suggestContrastColor(background: string): string {
  const bgLuminance = getLuminance(background);

  // If background is dark, suggest light colors
  if (bgLuminance < 0.5) {
    const options = [
      CONTRAST_COLORS.white,
      CONTRAST_COLORS.lightYellow,
      CONTRAST_COLORS.lightCoral,
      CONTRAST_COLORS.lightCyan,
      CONTRAST_COLORS.lightGreen,
    ];

    for (const color of options) {
      if (getContrastRatio(color, background) >= 4.5) {
        return color;
      }
    }
  }

  // If background is light, suggest dark colors
  const options = [
    CONTRAST_COLORS.black,
    CONTRAST_COLORS.darkNavy,
    CONTRAST_COLORS.darkGray,
    CONTRAST_COLORS.darkRed,
  ];

  for (const color of options) {
    if (getContrastRatio(color, background) >= 4.5) {
      return color;
    }
  }

  // Fallback
  return bgLuminance < 0.5 ? '#FFFFFF' : '#000000';
}

// CLI usage
if (require.main === module) {
  console.log('Color Contrast Validator\n');

  // Test LAUSD colors from v1.2.5
  const benefitsScheme = [
    { name: '80% Fewer (green on navy)', foreground: LAUSD_COLORS.successGreen, background: LAUSD_COLORS.lausdNavy },
    { name: 'Full Audit (gold on navy)', foreground: LAUSD_COLORS.lausdGold, background: LAUSD_COLORS.lausdNavy },
    { name: 'Your Platform (coral on navy)', foreground: LAUSD_COLORS.coral, background: LAUSD_COLORS.lausdNavy },
    { name: 'Your Platform OLD (white on navy)', foreground: LAUSD_COLORS.white, background: LAUSD_COLORS.lausdNavy },
    { name: 'Your Platform BAD (navy on navy)', foreground: LAUSD_COLORS.lausdNavy, background: LAUSD_COLORS.lausdNavy },
  ];

  console.log('Benefits Scene Color Check:');
  console.log('-'.repeat(60));

  for (const { name, foreground, background } of benefitsScheme) {
    const ratio = getContrastRatio(foreground, background);
    const pass = ratio >= 4.5 ? '✓' : '✗';
    console.log(`${pass} ${name}: ${ratio.toFixed(2)}`);
  }

  console.log('\n' + '-'.repeat(60));
  console.log('Suggested color for navy background:', suggestContrastColor(LAUSD_COLORS.lausdNavy));
}
