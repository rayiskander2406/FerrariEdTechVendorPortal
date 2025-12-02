/**
 * TTS Text Preprocessor
 *
 * Transforms text for natural TTS pronunciation.
 * Learned from LAUSD video production:
 * - "K-12" sounds robotic → "K through twelve"
 * - "LAUSD" slurs together → "L.A.U.S.D."
 */

// Pronunciation dictionary - add entries as we discover issues
export const PRONUNCIATIONS: Record<string, string> = {
  // Education acronyms
  'K-12': 'K through twelve',
  'K-8': 'K through eight',
  'K-5': 'K through five',
  'K-3': 'K through three',

  // District acronyms (spell out for clarity)
  'LAUSD': 'L.A.U.S.D.',
  'SFUSD': 'S.F.U.S.D.',
  'NYCDOE': 'N.Y.C. D.O.E.',

  // Tech acronyms
  'SSO': 'S.S.O.',
  'API': 'A.P.I.',
  'LTI': 'L.T.I.',
  'SIS': 'S.I.S.',
  'LMS': 'L.M.S.',
  'SAML': 'S.A.M.L.',
  'OAuth': 'O Auth',
  'OneRoster': 'One Roster',
  'Ed-Fi': 'Ed Fi',

  // Privacy/compliance
  'FERPA': 'F.E.R.P.A.',
  'COPPA': 'C.O.P.P.A.',
  'SOPIPA': 'S.O.P.I.P.A.',
  'PII': 'P.I.I.',
  'PoDS': 'P.O.D.S.',

  // Numbers that sound better spelled out
  '62M': 'sixty two million',
  '500K': 'five hundred thousand',
  '670K': 'six hundred seventy thousand',
  '1,000': 'one thousand',
  '100s': 'hundreds',

  // Common issues
  'vs': 'versus',
  'w/': 'with',
  '&': 'and',
};

/**
 * Preprocess text for TTS - replaces problematic patterns with phonetic alternatives
 */
export function preprocessForTTS(text: string): string {
  let result = text;

  // Sort by length (longest first) to avoid partial replacements
  const sortedPatterns = Object.keys(PRONUNCIATIONS).sort((a, b) => b.length - a.length);

  for (const pattern of sortedPatterns) {
    // Use word boundary-aware replacement
    const regex = new RegExp(`\\b${escapeRegex(pattern)}\\b`, 'gi');
    result = result.replace(regex, PRONUNCIATIONS[pattern]);
  }

  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Add a new pronunciation to the dictionary
 */
export function addPronunciation(pattern: string, replacement: string): void {
  PRONUNCIATIONS[pattern] = replacement;
}

/**
 * Preview what TTS will say (for debugging)
 */
export function previewTTS(text: string): { original: string; processed: string; changes: string[] } {
  const processed = preprocessForTTS(text);
  const changes: string[] = [];

  for (const [pattern, replacement] of Object.entries(PRONUNCIATIONS)) {
    if (text.includes(pattern)) {
      changes.push(`"${pattern}" → "${replacement}"`);
    }
  }

  return { original: text, processed, changes };
}

// CLI usage
if (require.main === module) {
  const text = process.argv.slice(2).join(' ') || 'For LAUSD, that means protecting K-12 students with FERPA-compliant SSO.';
  const result = previewTTS(text);

  console.log('Original:', result.original);
  console.log('Processed:', result.processed);
  if (result.changes.length > 0) {
    console.log('Changes:', result.changes.join(', '));
  }
}
