import manifest from "../../public/videos/day-01/day01-manifest.json";
import { DAY1_MOVEMENTS } from "./movements";

export const DAY1_MANIFEST = manifest;

const MOVEMENT_BY_EXERCISE: Record<string, (typeof DAY1_MOVEMENTS)[number]> = {
  "ex-seated-knee-extension": "seated_knee_extension",
  "ex-supported-standing-hip-extension": "supported_hip_extension",
  "ex-supported-sit-to-stand": "assisted_sit_stand",
};

export interface Day1Clip {
  sceneId: string;
  title: string;
  file: string | null;
  targetFileName: string | null;
  narration: string;
  mediaGenerationStatus: string;
  plannedDurationSec: number;
}

export interface Day1Step extends Day1Clip {
  kind: "spoken" | "exercise";
  movementId?: (typeof DAY1_MOVEMENTS)[number];
  exerciseId?: string;
  reps?: number;
  perSide?: boolean;
  sides?: string[];
  tempo?: string;
  doseStatus?: string;
  doseCondition?: string;
  equipment?: string[];
  safetyNotes?: string[];
}

export function mediaUrl(file: string | null | undefined): string | null {
  if (!file) return null;
  if (file.startsWith("public/videos/")) return `/${file.slice("public/".length)}`;
  if (file.startsWith("/videos/")) return file;
  return null;
}

export function clipIsPlayable(clip: { file: string | null; mediaGenerationStatus: string }): boolean {
  return Boolean(mediaUrl(clip.file)) && clip.mediaGenerationStatus !== "not_generated" && clip.mediaGenerationStatus !== "not_produced";
}

export function day1PosterUrl(): string | null {
  return mediaUrl(DAY1_MANIFEST.media.poster.file);
}

export function day1IsInternalPreview(): boolean {
  if (!DAY1_MANIFEST.publish || DAY1_MANIFEST.contentStatus !== "approved") return true;
  const packageOpen = Object.values(DAY1_MANIFEST.approvals).some((item) => item.status !== "approved");
  const clipsOpen = DAY1_MANIFEST.media.clips.some(
    (clip) => clip.movementQualityApproval.status !== "approved" || !clipIsPlayable(clip),
  );
  const completeOpen = !clipIsPlayable({
    file: DAY1_MANIFEST.media.complete.file,
    mediaGenerationStatus: DAY1_MANIFEST.media.complete.mediaGenerationStatus,
  });
  return packageOpen || clipsOpen || completeOpen;
}

export function day1DurationLabel(): string {
  const minutes = Math.max(1, Math.round(DAY1_MANIFEST.plannedTotalDurationSec / 60));
  return `About ${minutes} min`;
}

export function day1EquipmentLabel(): string {
  return "Sturdy chair and counter";
}

export function day1ExerciseForMovement(movementId: string) {
  return DAY1_MANIFEST.exercises.find((item) => MOVEMENT_BY_EXERCISE[item.id] === movementId) ?? null;
}

export function day1Steps(): Day1Step[] {
  return DAY1_MANIFEST.media.clips.map((clip) => {
    const exercise = DAY1_MANIFEST.exercises.find((item) => item.sceneId === clip.sceneId);
    const movementId = exercise ? MOVEMENT_BY_EXERCISE[exercise.id] : undefined;
    return {
      sceneId: clip.sceneId,
      title: clip.title,
      file: clip.file,
      targetFileName: clip.targetFileName,
      narration: clip.narration,
      mediaGenerationStatus: clip.mediaGenerationStatus,
      plannedDurationSec: clip.plannedDurationSec,
      kind: exercise ? "exercise" : "spoken",
      movementId,
      exerciseId: exercise?.id,
      reps: exercise?.proposedDose.reps,
      perSide: exercise?.proposedDose.perSide,
      sides: exercise?.sides,
      tempo: exercise?.proposedDose.tempo,
      doseStatus: exercise?.proposedDose.status,
      doseCondition: exercise && "condition" in exercise.proposedDose ? exercise.proposedDose.condition : undefined,
      equipment: exercise?.equipment,
      safetyNotes: exercise?.safetyNotes,
    };
  });
}

export function day1MovementOrder(): string[] {
  return DAY1_MANIFEST.exercises.map((item) => MOVEMENT_BY_EXERCISE[item.id]);
}

export function clipStatusLabel(clip: { file: string | null; mediaGenerationStatus: string; targetFileName: string | null }): string {
  if (clipIsPlayable(clip)) return "Clip ready";
  if (!clip.targetFileName) return "No video file assigned";
  return `${clip.targetFileName} · not generated`;
}
