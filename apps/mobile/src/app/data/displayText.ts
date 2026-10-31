/**
 * Cleans exercise text for display. The source data keeps its research references (channel
 * prefixes, video IDs, timestamps, exercise codes); users never see them.
 *
 *   "TT _YO4VV6Jl6g: ... go back to the short arc quad (K12)."  ->  "... Go back to the short arc quad."
 *   "HT: not suitable for everyone; avoid if it gives you pain (rQgM 00:20)."  ->  "Not suitable for everyone; avoid if it gives you pain."
 *   "Source says these exercises are not suitable for everyone ..."  ->  "These exercises are not suitable for everyone ..."
 */

const CHANNELS = "(?:TT|HT|FR|ST)";

// "Reviewer flag (editorial):", then a channel, an optional "(note)", an optional video ID
// (only when followed by ":" or "says"), an optional "says", and the colon.
const LEADING = new RegExp(
  `^(?:Reviewer flag \\([^)]*\\):\\s*)?${CHANNELS}\\b(?:\\s*\\([^)]*\\))?(?:\\s+[A-Za-z0-9_-]{3,11}(?=:|\\s+says\\b))?(?:\\s+says\\b)?\\s*:?\\s*`,
);
const REVIEWER = /^Reviewer flag \([^)]*\):\s*/;
const SOURCE_SAYS = /^Source says\s+/i;
/** "(00:51)", "(rQgM 00:20)", "(7R-N 08:03)" */
const TIMESTAMP = /\s*\((?:[A-Za-z0-9_-]{2,11}\s+)?\d{1,2}:\d{2}\)/g;
/** "(K12)", "(B04)" */
const CODE = /\s*\([A-Z]\d{2}\)/g;
/** "(HT progression)" and other channel notes in brackets mid-sentence. */
const CHANNEL_NOTE = new RegExp(`\\s*\\(${CHANNELS}\\b[^)]*\\)`, "g");
/** A channel + ID inside a sentence: "TT 2v7bwMfeYRw says " */
const INLINE_SOURCE = new RegExp(`\\b${CHANNELS}\\s+[A-Za-z0-9_-]{3,11}\\s+says\\s+`, "g");

/** A second source's variant mid-text ("... HT's version: ...", "... FR: ...") reads as an alternative. */
const MID_VARIANT = new RegExp(`([.;!?])\\s+${CHANNELS}(?:'s version)?\\s*:\\s*`, "g");
const SAYS = new RegExp(`\\b${CHANNELS}\\s+says\\s+`, "g");
const ACCORDING = new RegExp(`,?\\s*according to ${CHANNELS}\\b`, "g");

export function cleanText(input: string): string {
  let s = input.trim();
  s = s.replace(REVIEWER, "");
  s = s.replace(LEADING, "");
  s = s.replace(SOURCE_SAYS, "");
  s = s.replace(INLINE_SOURCE, "");
  s = s.replace(MID_VARIANT, "$1 Another way: ");
  s = s.replace(SAYS, "");
  s = s.replace(ACCORDING, "");
  s = s.replace(TIMESTAMP, "");
  s = s.replace(CODE, "");
  s = s.replace(CHANNEL_NOTE, "");
  // Tidy what the removals leave behind.
  s = s
    .replace(/\s+([.,;:!?)])/g, "$1")
    .replace(/([;,])\s*([.!?])/g, "$2")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!s) return s;
  s = s[0].toUpperCase() + s.slice(1);
  // Capitalise the first word after a sentence break.
  s = s.replace(/([.!?]\s+)([a-z])/g, (_, p, c: string) => p + c.toUpperCase());
  return s;
}

/** True when text still carries a reference that should never reach the screen. */
export function hasSourceCode(text: string): boolean {
  return (
    /\b(?:TT|HT|FR|ST)\b/.test(text) ||
    /\d{1,2}:\d{2}/.test(text) ||
    /\([A-Z]\d{2}\)/.test(text) ||
    /Source says/i.test(text) ||
    /Reviewer flag/i.test(text)
  );
}
