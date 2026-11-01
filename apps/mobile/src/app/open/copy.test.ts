import { describe, expect, it } from "vitest";
import { EXERCISES } from "../data/library";
import { cleanCopy, cleanCopyList, mentionsSource } from "./copy";

describe("cleanCopy (display only)", () => {
  it("removes asides and phrases that point at the source", () => {
    expect(cleanCopy("Tight hamstrings can stop an arthritic knee from straightening (source's explanation).")).toBe(
      "Tight hamstrings can stop an arthritic knee from straightening.",
    );
    expect(cleanCopy("Avoid rounding the spine; avoid certain spinal flexion movements (Ed points to his own video on this).")).toBe(
      "Avoid rounding the spine; avoid certain spinal flexion movements.",
    );
    expect(cleanCopy("OK only if not painful (Ed's words).")).toBe("OK only if not painful.");
    expect(cleanCopy("Hips will be stiffer tomorrow (his view); pinching is common.")).toBe("Hips will be stiffer tomorrow; pinching is common.");
    expect(cleanCopy("A slight pinch is OK in this source, but not pain.")).toBe("A slight pinch is OK, but not pain.");
    expect(cleanCopy("None (a counter nearby is sensible - not stated by source)")).toBe("None (a counter nearby is sensible)");
    expect(cleanCopy("Strengthening can irritate the joint; this physio starts with stretching first.")).toBe("Strengthening can irritate the joint.");
    expect(cleanCopy("Hold for a moment (rQgM 00:20).")).toBe("Hold for a moment.");
  });

  it("drops notes that are only about the source", () => {
    expect(cleanCopy("Not stated in this transcript")).toBe("");
    expect(cleanCopyList(["Keep it slow.", "Not stated in this transcript"])).toEqual(["Keep it slow."]);
  });

  it("leaves ordinary copy alone", () => {
    for (const t of ["Keep everything still except the top knee.", "'we're not going to be doing the splits.'", "Resistance band anchored low (e.g. Door/furniture)"]) {
      expect(cleanCopy(t)).toBe(t);
    }
  });

  it("no exercise shows source wording in the panel or the player", () => {
    for (const e of EXERCISES) {
      for (const t of [e.equipment, e.setup, ...e.cues, ...e.safetyNotes]) {
        expect(mentionsSource(cleanCopy(t)), `${e.id}: ${t}`).toBe(false);
      }
    }
  });
});
