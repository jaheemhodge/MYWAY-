import { describe, expect, it } from "vitest";
import { DAY1_MOVEMENTS } from "./movements";
import {
  DAY1_MANIFEST,
  clipIsPlayable,
  day1IsInternalPreview,
  day1MovementOrder,
  day1PosterUrl,
  day1Steps,
  mediaUrl,
} from "./day01";

describe("day 1 manifest", () => {
  it("stays an unpublished internal preview with no playable clips", () => {
    expect(DAY1_MANIFEST.publish).toBe(false);
    expect(DAY1_MANIFEST.dayNumber).toBe(1);
    expect(day1IsInternalPreview()).toBe(true);
    expect(DAY1_MANIFEST.media.clips.every((clip) => clip.file === null)).toBe(true);
    expect(DAY1_MANIFEST.media.clips.every((clip) => !clipIsPlayable(clip))).toBe(true);
    expect(DAY1_MANIFEST.media.complete.file).toBeNull();
    expect(clipIsPlayable(DAY1_MANIFEST.media.complete)).toBe(false);
  });

  it("does not invent a video URL for a missing file", () => {
    expect(mediaUrl(null)).toBeNull();
    expect(mediaUrl("")).toBeNull();
    expect(mediaUrl("https://example.com/day01.mp4")).toBeNull();
    expect(day1PosterUrl()).toBe("/videos/day-01/day01-poster.jpg");
  });

  it("keeps the three draft exercises in the existing movement order", () => {
    expect(day1MovementOrder()).toEqual([...DAY1_MOVEMENTS]);
    const exercises = day1Steps().filter((step) => step.kind === "exercise");
    expect(exercises.map((step) => step.reps)).toEqual([5, 5, 5]);
    expect(exercises.map((step) => step.doseStatus)).toEqual([
      "draft - pending clinical review",
      "draft - pending clinical review",
      "draft - pending clinical review",
    ]);
  });

  it("does not include a day 2 scene", () => {
    expect(day1Steps().every((step) => !/day-?2/i.test(step.sceneId + step.title))).toBe(true);
  });
});
