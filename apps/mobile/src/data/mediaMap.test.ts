import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { EXERCISES } from "@/app/data/library";
import { hasVideo, mediaFor } from "./mediaMap";

describe("coach stills", () => {
  const files = new Set(readdirSync(resolve(process.cwd(), "public/coach")));

  it("gives every library exercise its own 16:9 still and no video", () => {
    expect(EXERCISES.length).toBe(56);
    const missing: string[] = [];
    for (const exercise of EXERCISES) {
      expect(hasVideo(exercise.id)).toBe(false);
      expect(mediaFor(exercise.id).videoUrl).toBeUndefined();
      expect(mediaFor(exercise.id).imageUrl).toMatch(new RegExp(`/coach/${exercise.id}\\.jpg$`));
      if (!files.has(`${exercise.id}.jpg`)) missing.push(exercise.id);
    }
    expect(missing).toEqual([]);
  });

  it("has no coach file without a matching exercise", () => {
    const ids = new Set(EXERCISES.map((exercise) => exercise.id));
    const extra = [...files].filter((name) => !ids.has(name.replace(/\.jpg$/, "")));
    expect(extra).toEqual([]);
  });
});
