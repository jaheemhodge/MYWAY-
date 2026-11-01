/**
 * useSession(day) against the in-memory Supabase stand-in: gating, persistence, timers across a
 * hidden tab, skip/back, finishDay success + failure, and replaying a finished day.
 */
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PROGRESS_MESSAGES } from "@/lib/progress";
import { SESSION_DEFAULTS, SESSION_STORAGE_KEY } from "@/lib/session";
import { setSupabaseClientForTests } from "@/lib/supabaseClient";
import { createFakeSupabase } from "@/lib/testing/fakeSupabase";
import { CoreProviders } from "./index";
import { CUES_SETTING_KEY, useSession, type UseSessionOptions, type UseSessionResult } from "./useSession";

const T0 = 1_700_000_000_000;
const WORK = 8 * SESSION_DEFAULTS.secondsPerRep; // 48 s per set with the defaults

let pathname = "";
function Probe() {
  const location = useLocation();
  useEffect(() => {
    pathname = location.pathname;
  });
  return null;
}

type Fake = ReturnType<typeof createFakeSupabase>;

async function seed(fake: Fake, { completed = [] as number[], questionnaires = ["baseline"] as string[] } = {}) {
  await fake.client.auth.signUp({ email: "s@t.test", password: "long enough pw", options: { data: { first_name: "S" } } });
  const uid = fake.session!.user.id;
  Object.assign(fake.db.profiles[0], { focus_area: "knees", plan_start_date: "2026-01-01", onboarded_at: new Date().toISOString() });
  for (const kind of questionnaires) fake.db.questionnaire_responses.push({ id: `q-${kind}`, user_id: uid, kind: kind as "baseline", answers: {}, created_at: "" });
  for (const d of completed) fake.db.day_completions.push({ id: `c${d}`, user_id: uid, day_number: d, completed_at: "2026-01-01T00:00:00Z", exercises_done: [], feeling: null });
  return uid;
}

function mount(day: number, options: UseSessionOptions) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[`/app/session/${day}`]}>
      <Probe />
      <CoreProviders>{children}</CoreProviders>
    </MemoryRouter>
  );
  return renderHook(() => useSession(day, options), { wrapper });
}

/** Mounts and waits until the hook has left 'loading'. */
async function mountReady(day: number, options: UseSessionOptions) {
  const hook = mount(day, options);
  await waitFor(() => expect(hook.result.current.status).not.toBe("loading"));
  return hook;
}

const run = (result: { current: UseSessionResult }, action: keyof Omit<UseSessionResult["actions"], "finishDay">) => act(() => result.current.actions[action]());

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
});

afterEach(() => {
  cleanup();
  setSupabaseClientForTests(null);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useSession gating", () => {
  it("rejects a locked day and points at the current day", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake, { completed: [1, 2] });
    const { result } = await mountReady(5, { now: () => T0 });
    expect(result.current.status).toBe("locked");
    expect(result.current.currentDay).toBe(3);
    expect(result.current.isReplay).toBe(false);
    // Actions are inert while locked
    run(result, "start");
    expect(result.current.status).toBe("locked");
  });

  it("treats out-of-range days as locked", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake);
    const { result } = await mountReady(0, { now: () => T0 });
    expect(result.current.status).toBe("locked");
    expect(result.current.currentDay).toBe(1);
  });

  it("requires the re-check on Day 30 and Day 60 until it is saved", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake, { completed: Array.from({ length: 29 }, (_, i) => i + 1) });
    const day30 = await mountReady(30, { now: () => T0 });
    expect(day30.result.current.status).toBe("recheck-required");
    expect(day30.result.current.recheckRoute).toBe("/app/recheck/day30");
    day30.unmount();

    for (let d = 30; d <= 59; d += 1) fake.db.day_completions.push({ id: `c${d}`, user_id: fake.session!.user.id, day_number: d, completed_at: "", exercises_done: [], feeling: null });
    fake.db.questionnaire_responses.push({ id: "q30", user_id: fake.session!.user.id, kind: "day30", answers: {}, created_at: "" });
    const day60 = await mountReady(60, { now: () => T0 });
    expect(day60.result.current.status).toBe("recheck-required");
    expect(day60.result.current.recheckRoute).toBe("/app/recheck/day60");
    day60.unmount();

    fake.db.questionnaire_responses.push({ id: "q60", user_id: fake.session!.user.id, kind: "day60", answers: {}, created_at: "" });
    const ready = await mountReady(60, { now: () => T0 });
    expect(ready.result.current.status).toBe("ready");
    expect(ready.result.current.recheckRoute).toBeNull();
  });
});

describe("useSession player", () => {
  it("starts with flagged defaults and exposes the plan's exercises in order", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake);
    const { result } = await mountReady(1, { now: () => T0 });
    const r = result.current;
    expect(r.status).toBe("ready");
    expect(r.plan?.day).toBe(1);
    expect(r.total).toBe(5);
    expect(r.index).toBe(0);
    expect(r.isFirst).toBe(true);
    expect(r.exercise?.id).toBe(r.plan?.exercises[0].id);
    expect(r.currentSet).toBe(1);
    expect(r.totalSets).toBe(2);
    expect(r.repsTarget).toBe(8);
    expect(r.holdSeconds).toBeNull();
    expect(r.usedDefaults).toBe(true);
    expect(r.rhythm).toEqual({ liftSeconds: 2, holdSeconds: 1, lowerSeconds: 3 });
    expect(r.timer).toEqual({ mode: "reps", segment: "work", secondsLeft: WORK, totalSeconds: WORK, running: false });
    expect(r.media).toEqual(expect.any(Object));
    expect(r.keyBindings.map((b) => b.key)).toEqual([" ", "ArrowRight", "ArrowLeft"]);
    expect(r.cues.enabled).toBe(false);
    expect(r.reducedMotion).toBe(false);
  });

  it("resumes the same exercise, set and remaining time from localStorage after a reload", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake);
    let t = T0;
    const first = await mountReady(1, { now: () => t });
    run(first.result, "start");
    run(first.result, "next"); // exercise 2
    run(first.result, "markSetDone"); // rest between sets
    run(first.result, "skipRest"); // set 2
    t += 10_000;
    run(first.result, "pause");
    expect(first.result.current.status).toBe("paused");
    expect(first.result.current.timer.secondsLeft).toBe(WORK - 10);
    expect(JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY)!)).toMatchObject({ day: 1, index: 1, set: 2 });
    first.unmount();

    t += 3_600_000; // an hour later, new tab
    const second = await mountReady(1, { now: () => t });
    const r = second.result.current;
    expect(r.status).toBe("paused");
    expect(r.index).toBe(1);
    expect(r.currentSet).toBe(2);
    expect(r.timer.secondsLeft).toBe(WORK - 10);
    expect(r.exercisesDone[0]).toMatchObject({ id: r.plan!.exercises[0].id, status: "completed" });
    run(second.result, "resume");
    expect(second.result.current.status).toBe("in-progress");
  });

  it("ignores a saved session that belongs to another day", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake, { completed: [1] });
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ v: 1, day: 1, ids: [], index: 0, set: 1, segment: "work", segmentSeconds: 48, elapsedMs: 0, started: true, exercisesDone: [], readyToFinish: false, savedAt: T0 }));
    const { result } = await mountReady(2, { now: () => T0 });
    expect(result.current.status).toBe("ready");
    expect(result.current.index).toBe(0);
  });

  it("auto-pauses when the tab is hidden and keeps the correct time until resumed", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake);
    let t = T0;
    const { result } = await mountReady(1, { now: () => t });
    run(result, "start");
    expect(result.current.status).toBe("in-progress");

    t += 10_000;
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current.status).toBe("paused");
    expect(result.current.timer.secondsLeft).toBe(WORK - 10);
    expect(JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY)!)).toMatchObject({ elapsedMs: 10_000, index: 0, set: 1 });

    // Time passes in the background; nothing moves.
    t += 600_000;
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current.status).toBe("paused");
    expect(result.current.timer.secondsLeft).toBe(WORK - 10);

    run(result, "resume");
    expect(result.current.timer.secondsLeft).toBe(WORK - 10);
    t += 5_000;
    await waitFor(() => expect(result.current.timer.secondsLeft).toBe(WORK - 15));
  });

  it("settles elapsed segments from timestamps after a long gap while running", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake);
    let t = T0;
    const { result } = await mountReady(1, { now: () => t });
    run(result, "start");
    // work + rest + 5 s into set 2
    t += (WORK + SESSION_DEFAULTS.restBetweenSetsSeconds + 5) * 1000;
    await waitFor(() => expect(result.current.currentSet).toBe(2));
    expect(result.current.index).toBe(0);
    expect(result.current.timer).toMatchObject({ mode: "reps", secondsLeft: WORK - 5 });
  });

  it("skip records the exercise as skipped; back reopens the previous exercise", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake);
    const { result } = await mountReady(1, { now: () => T0 });
    const ids = result.current.plan!.exercises.map((e) => e.id);
    run(result, "start");
    run(result, "markSetDone");
    run(result, "skipExercise");
    expect(result.current.index).toBe(1);
    expect(result.current.exercisesDone[0]).toEqual({ id: ids[0], status: "skipped", setsDone: 1 });

    run(result, "next");
    expect(result.current.index).toBe(2);
    expect(result.current.exercisesDone[1]).toEqual({ id: ids[1], status: "completed", setsDone: 0 });

    run(result, "back");
    expect(result.current.index).toBe(1);
    expect(result.current.currentSet).toBe(1);
    expect(result.current.exercisesDone[1]).toBeNull();
    expect(result.current.exercisesDone[2]).toBeNull();
    expect(result.current.exercisesDone[0]).not.toBeNull();
    expect(result.current.timer.secondsLeft).toBe(WORK);

    run(result, "back");
    run(result, "back"); // first exercise: restarts it and clears its record
    expect(result.current.index).toBe(0);
    expect(result.current.isFirst).toBe(true);
    expect(result.current.exercisesDone[0]).toBeNull();
  });

  it("keyboard: Space toggles pause, Right goes next, Left goes back; typing in inputs is ignored", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake);
    const { result } = await mountReady(1, { now: () => T0 });
    const key = (k: string, target?: EventTarget) => act(() => result.current.handleKeyDown({ key: k, preventDefault() {}, target: target ?? document.body }));
    key(" ");
    expect(result.current.status).toBe("in-progress");
    key(" ");
    expect(result.current.status).toBe("paused");
    key("ArrowRight");
    expect(result.current.index).toBe(1);
    key("ArrowLeft");
    expect(result.current.index).toBe(0);
    key("ArrowRight", document.createElement("input"));
    expect(result.current.index).toBe(0);
  });

  it("Right arrow before Start begins the session, advances, and saves", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake);
    const { result } = await mountReady(1, { now: () => T0 });
    act(() => result.current.handleKeyDown({ key: "ArrowRight", preventDefault() {}, target: document.body }));
    expect(result.current.status).toBe("in-progress");
    expect(result.current.index).toBe(1);
    expect(JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY)!)).toMatchObject({ day: 1, index: 1, started: true });
  });

  it("finishing one day leaves a saved session for a different day in place", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake);
    const other = JSON.stringify({ v: 1, day: 99 });
    const bag = new Map<string, string>([[SESSION_STORAGE_KEY, other]]);
    const storage = {
      getItem: (k: string) => bag.get(k) ?? null,
      setItem: (k: string, v: string) => bag.set(k, v),
      removeItem: (k: string) => bag.delete(k),
    };
    const { result } = await mountReady(1, { now: () => T0, storage });
    run(result, "start");
    bag.set(SESSION_STORAGE_KEY, other);
    for (let i = 0; i < 5; i += 1) run(result, "next");
    bag.set(SESSION_STORAGE_KEY, other);
    await act(async () => {
      expect(await result.current.actions.finishDay()).toBe(true);
    });
    expect(bag.get(SESSION_STORAGE_KEY)).toBe(other);
    expect(fake.db.day_completions).toHaveLength(1);
  });

  it("finishDay calls completeDay with every exercise's record and the feeling, then clears the save", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake);
    const rpc = vi.spyOn(fake.client, "rpc");
    const { result } = await mountReady(1, { now: () => T0 });
    const ids = result.current.plan!.exercises.map((e) => e.id);
    run(result, "start");
    run(result, "skipExercise");
    run(result, "markSetDone");
    run(result, "next");
    run(result, "next");
    run(result, "next");
    expect(result.current.readyToFinish).toBe(false);
    expect(result.current.isLast).toBe(true);
    run(result, "next");
    expect(result.current.readyToFinish).toBe(true);
    expect(result.current.status).toBe("in-progress");
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull();

    let ok = false;
    await act(async () => {
      ok = await result.current.actions.finishDay(4);
    });
    expect(ok).toBe(true);
    expect(result.current.status).toBe("done");
    expect(pathname).toBe("/app/session/1/done");
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();

    const call = rpc.mock.calls.find((c) => c[0] === "complete_day")!;
    expect(call[1]).toEqual({
      p_day: 1,
      p_feeling: 4,
      p_exercises: [
        { id: ids[0], status: "skipped", setsDone: 0 },
        { id: ids[1], status: "completed", setsDone: 1 },
        { id: ids[2], status: "completed", setsDone: 0 },
        { id: ids[3], status: "completed", setsDone: 0 },
        { id: ids[4], status: "completed", setsDone: 0 },
      ],
    });
    expect(fake.db.day_completions).toHaveLength(1);
    expect(fake.db.day_completions[0]).toMatchObject({ day_number: 1, feeling: 4 });
  });

  it("refuses to finish before every exercise is done and rejects a feeling outside 1–5", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake);
    const { result } = await mountReady(1, { now: () => T0 });
    run(result, "start");
    await act(async () => {
      expect(await result.current.actions.finishDay()).toBe(false);
    });
    expect(result.current.error).toMatch(/remaining exercises/i);
    for (let i = 0; i < 5; i += 1) run(result, "skipExercise");
    await act(async () => {
      expect(await result.current.actions.finishDay(9)).toBe(false);
    });
    expect(result.current.error).toBe(PROGRESS_MESSAGES.INVALID_FEELING);
    expect(fake.db.day_completions).toHaveLength(0);
  });

  it("a failed save keeps the session state and the local save, and can be retried", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake);
    const original = fake.client.rpc.bind(fake.client);
    let failNext = true;
    vi.spyOn(fake.client, "rpc").mockImplementation(((name: string, args?: object) => {
      if (name === "complete_day" && failNext) {
        failNext = false;
        return Promise.resolve({ data: null, error: { message: "TypeError: Failed to fetch" } });
      }
      return original(name as never, args as never);
    }) as never);
    const { result } = await mountReady(1, { now: () => T0 });
    run(result, "start");
    for (let i = 0; i < 5; i += 1) run(result, "next");

    await act(async () => {
      expect(await result.current.actions.finishDay(2)).toBe(false);
    });
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe(PROGRESS_MESSAGES.NETWORK);
    expect(result.current.readyToFinish).toBe(true);
    expect(result.current.exercisesDone.every((r) => r?.status === "completed")).toBe(true);
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull();
    expect(pathname).toBe("/app/session/1");
    expect(fake.db.day_completions).toHaveLength(0);

    await act(async () => {
      expect(await result.current.actions.finishDay(2)).toBe(true);
    });
    expect(result.current.status).toBe("done");
    expect(pathname).toBe("/app/session/1/done");
    expect(fake.db.day_completions).toHaveLength(1);
  });

  it("replaying a finished day updates the existing completion instead of adding one", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake, { completed: [1, 2] });
    const before = fake.db.day_completions.find((c) => c.day_number === 1)!;
    const { result } = await mountReady(1, { now: () => T0 });
    expect(result.current.status).toBe("ready");
    expect(result.current.isReplay).toBe(true);
    run(result, "start");
    for (let i = 0; i < 5; i += 1) run(result, "next");
    await act(async () => {
      expect(await result.current.actions.finishDay()).toBe(true);
    });
    expect(fake.db.day_completions).toHaveLength(2);
    const after = fake.db.day_completions.find((c) => c.day_number === 1)!;
    expect(after.id).toBe(before.id);
    expect(after.completed_at).not.toBe("2026-01-01T00:00:00Z");
    expect(after.exercises_done).toHaveLength(5);
    expect(pathname).toBe("/app/session/1/done");
  });

  it("cue setting persists and listeners only fire when enabled", async () => {
    const fake = createFakeSupabase();
    setSupabaseClientForTests(fake.client);
    await seed(fake);
    const { result } = await mountReady(1, { now: () => T0 });
    const heard: string[] = [];
    result.current.cues.subscribe((cue) => heard.push(cue.type));
    run(result, "start");
    expect(result.current.cues.last?.type).toBe("start");
    expect(heard).toEqual([]);

    act(() => result.current.cues.setEnabled(true));
    expect(window.localStorage.getItem(CUES_SETTING_KEY)).toBe("true");
    run(result, "markSetDone");
    expect(heard).toEqual(["set-done", "start"]);
    expect(result.current.cues.last).toEqual({ type: "start", segment: "rest-set", index: 0, set: 1 });
  });
});
