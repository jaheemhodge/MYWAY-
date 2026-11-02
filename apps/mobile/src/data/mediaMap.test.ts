import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { EXERCISES } from "@/app/data/library";
import { hasVideo, mediaFor } from "./mediaMap";

const WITH_VIDEO = ["K01", "K02", "K03", "K04", "K06"];

describe("coach stills", () => {
  const files = new Set(readdirSync(resolve(process.cwd(), "public/coach")));
  const videos = new Set(readdirSync(resolve(process.cwd(), "public/coach/video")));

  it("gives every library exercise its own 16:9 still, and a clip only where one exists", () => {
    expect(EXERCISES.length).toBe(56);
    const missing: string[] = [];
    for (const exercise of EXERCISES) {
      expect(mediaFor(exercise.id).imageUrl).toMatch(new RegExp(`/coach/${exercise.id}\\.jpg$`));
      if (!files.has(`${exercise.id}.jpg`)) missing.push(exercise.id);
      if (WITH_VIDEO.includes(exercise.id)) {
        expect(hasVideo(exercise.id)).toBe(true);
        expect(mediaFor(exercise.id).videoUrl).toMatch(new RegExp(`/coach/video/${exercise.id}\\.mp4$`));
        expect(videos.has(`${exercise.id}.mp4`)).toBe(true);
      } else {
        expect(hasVideo(exercise.id)).toBe(false);
        expect(mediaFor(exercise.id).videoUrl).toBeUndefined();
      }
    }
    expect(missing).toEqual([]);
    expect([...videos].sort()).toEqual(WITH_VIDEO.map((id) => `${id}.mp4`));
  });

  it("has no coach file without a matching exercise", () => {
    const ids = new Set(EXERCISES.map((exercise) => exercise.id));
    const extra = [...files].filter((name) => name !== "video" && !ids.has(name.replace(/\.jpg$/, "")));
    expect(extra).toEqual([]);
  });
});
