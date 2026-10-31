import { describe, expect, it } from "vitest";
import raw from "@/data/library-slim.json";
import { cleanText, hasSourceCode } from "./displayText";
import { EXERCISES } from "./library";

describe("cleanText", () => {
  it("strips channel prefixes, IDs, timestamps and codes", () => {
    expect(cleanText("TT _YO4VV6Jl6g: could aggravate it; if so, go back to the short arc quad (K12).")).toBe(
      "Could aggravate it; if so, go back to the short arc quad.",
    );
    expect(cleanText("HT: not suitable for everyone; avoid if it gives you pain (rQgM 00:20).")).toBe(
      "Not suitable for everyone; avoid if it gives you pain.",
    );
    expect(cleanText("Source says these exercises are not suitable for everyone; avoid them if they cause pain (00:51).")).toBe(
      "These exercises are not suitable for everyone; avoid them if they cause pain.",
    );
    expect(cleanText("HT rQgM: stop before hamstring cramp, rest, then repeat (04:14).")).toBe("Stop before hamstring cramp, rest, then repeat.");
    expect(cleanText("Bed or mat; resistance-band loop optional (HT progression)")).toBe("Bed or mat; resistance-band loop optional");
    expect(cleanText("HT (context, not a warning): chosen for people whose knees hurt (02:55).")).toBe("Chosen for people whose knees hurt.");
  });

  it("turns a second source's variant into 'Another way'", () => {
    expect(cleanText("Stand tall. TT: hold a dowel along your back. FR: stand next to a basket.")).toBe(
      "Stand tall. Another way: hold a dowel along your back. Another way: stand next to a basket.",
    );
    expect(cleanText("Lift it up - HT says only about 2 inches back.")).toBe("Lift it up - only about 2 inches back.");
    expect(cleanText("Feeling like the hip is about to cramp is normal, according to HT.")).toBe("Feeling like the hip is about to cramp is normal.");
  });

  it("leaves ordinary text alone", () => {
    expect(cleanText("Sturdy dining chair")).toBe("Sturdy dining chair");
    expect(cleanText("Straighten that leg as far as you can.")).toBe("Straighten that leg as far as you can.");
  });
});

describe("exercise data as displayed", () => {
  it("has no source codes, IDs or timestamps in any field", () => {
    const offenders: string[] = [];
    for (const e of EXERCISES) {
      const texts = [e.name, e.subtitle, e.equipment, e.setup, e.positionDetail ?? "", ...e.cues, ...e.safetyNotes];
      for (const t of texts) if (hasSourceCode(t)) offenders.push(`${e.id}: ${t}`);
    }
    expect(offenders).toEqual([]);
  });

  it("leaves the source data file untouched", () => {
    const k01 = (raw as { exercises: { id: string; safetyNotes: string[] }[] }).exercises.find((e) => e.id === "K01")!;
    expect(k01.safetyNotes.some((n) => n.startsWith("TT _YO4VV6Jl6g:"))).toBe(true);
  });
});
