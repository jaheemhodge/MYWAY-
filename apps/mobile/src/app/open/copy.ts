import { cleanText } from "../data/displayText";

/**
 * Display-only clean-up for exercise copy (session player and exercise panel). The library data
 * stays as written; this only changes what is shown. On top of cleanText (channel prefixes, IDs,
 * timestamps, exercise codes) it removes wording that points back at where a tip came from:
 *   "(source's explanation)", "(Ed's words)", "(his view)", "(Ed points to his own video on this)",
 *   "- not stated by source", "in this source", "; this physio starts with …",
 *   and notes that are only about the source ("Not stated in this transcript").
 */

// Words that mean "the source": the material, the person in it, or the recording.
const SOURCE = String.raw`(?:sources?|transcripts?|videos?|clips?|channels?|youtube|recording|presenter|instructor|narrator|\bEd\b|Ed's)`;

/** A bracketed aside that mentions the source, a timestamp, or "his/her view/words". */
const ASIDE = new RegExp(
  String.raw`\s*\((?=[^()]*(?:${SOURCE}|\b\d{1,2}:\d{2}\b|\b(?:his|her|their)\s+(?:view|words|opinion|explanation)\b))[^()]*\)`,
  "gi",
);

/** "- not stated by source", "— not in the transcript" at the end of a phrase. */
const DASH_NOTE = new RegExp(String.raw`\s*[-–—]\s*(?:not\s+)?(?:stated|mentioned|shown|given)\s+(?:by|in)\s+(?:the\s+|this\s+)?${SOURCE}`, "gi");

/** "in this source", "according to the video", "per the transcript" inside a sentence. */
const IN_SOURCE = new RegExp(String.raw`\s*,?\s+(?:in|per|from|according\s+to|says)\s+(?:the|this)\s+${SOURCE}(?=[\s,.;:!?)]|$)`, "gi");

/** "; this physio starts with …" — a clause about what the person in the source does. */
const PERSON_CLAUSE = /\s*[;,]\s*(?:this|the)\s+(?:physio(?:therapist)?|coach|trainer|presenter|instructor|narrator)\b[^.;]*/gi;

/** Anything still pointing at the source after the cuts above drops the whole sentence. */
const SENTENCE_HAS_SOURCE = new RegExp(String.raw`${SOURCE}|\b\d{1,2}:\d{2}\b`, "i");

function tidy(s: string): string {
  return s
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?)])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/([,;:])(?=[.!?]|$)/g, "")
    .replace(/^[\s,;:.\-–—]+/, "")
    .trim();
}

/** One field of exercise copy, ready to show. Returns "" when nothing but source talk remains. */
export function cleanCopy(text: string | null | undefined): string {
  if (!text) return "";
  let s = cleanText(text);
  s = s.replace(DASH_NOTE, "").replace(ASIDE, "").replace(IN_SOURCE, "").replace(PERSON_CLAUSE, "");
  s = tidy(s);
  // Only when something still talks about the source: drop those sentences whole.
  if (SENTENCE_HAS_SOURCE.test(s)) {
    const sentences = s.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [s];
    s = tidy(sentences.filter((x) => !SENTENCE_HAS_SOURCE.test(x)).join(" "));
  }
  // A note that was only about what the source left out ("Not stated in this transcript").
  if (/^(?:not\s+)?(?:stated|mentioned|given|specified|shown)\.?$/i.test(s)) return "";
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

/** A list of cues or safety notes: each item cleaned, empty ones left out. */
export function cleanCopyList(items: readonly string[]): string[] {
  return items.map(cleanCopy).filter(Boolean);
}

/** True if a piece of text still refers to a source (used to check every exercise). */
export function mentionsSource(text: string): boolean {
  return SENTENCE_HAS_SOURCE.test(text) || /\b(?:his|her|their)\s+(?:view|words)\b|this\s+physio/i.test(text);
}
