/**
 * In-memory stand-in for the Supabase client, covering exactly the calls src/lib makes and
 * re-implementing the complete_day() / get_progress() rules from the SQL migration. Used by the
 * core-flow integration test; never shipped.
 */
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import type { Supabase } from "../supabaseClient";

type Row = Record<string, unknown>;
type Err = { message: string; code?: string } | null;

interface FakeUser {
  id: string;
  email: string;
  password: string;
  first_name: string;
}

export interface FakeDb {
  users: FakeUser[];
  profiles: Row[];
  questionnaire_responses: Row[];
  day_completions: Row[];
  favorites: Row[];
  app_events: Row[];
}

function uuid(n: number): string {
  return `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
}

function sessionFor(user: FakeUser): Session {
  const u = {
    id: user.id,
    email: user.email,
    user_metadata: { first_name: user.first_name },
    app_metadata: { provider: "email" },
    last_sign_in_at: "2026-01-01T00:00:00.000Z",
    aud: "authenticated",
    created_at: "",
  } as unknown as User;
  return { access_token: "t", refresh_token: "r", expires_in: 3600, token_type: "bearer", user: u } as Session;
}

const FULL_ACCESS = new Set(["active", "trialing", "comped"]);

function logAppEvent(db: FakeDb, userId: string, eventName: string, properties: Row): void {
  db.app_events.push({
    id: uuid(db.app_events.length + 1),
    user_id: userId,
    event_name: eventName,
    properties,
    created_at: new Date().toISOString(),
  });
}

/** Columns a signed-in user may UPDATE on profiles. Insert may also set id. */
const PROFILE_UPDATE_COLUMNS = new Set(["first_name", "age_range", "focus_area", "plan_start_date", "onboarded_at"]);
const PROFILE_INSERT_COLUMNS = new Set(["id", ...PROFILE_UPDATE_COLUMNS]);

export type ProfileWrite = { op: "insert" | "update" | "upsert"; keys: string[] };

/**
 * Mirrors the column grants. An upsert/update that SETs id, or any column the
 * client cannot write (email, signup_method, subscription_status, stripe_*), is denied.
 */
function profileColumnDenied(op: "insert" | "update" | "upsert", item: Row): Err {
  const keys = Object.keys(item);
  const allowed = op === "insert" ? PROFILE_INSERT_COLUMNS : PROFILE_UPDATE_COLUMNS;
  if (keys.some((key) => !allowed.has(key))) {
    return { message: "permission denied for table profiles", code: "42501" };
  }
  return null;
}

class Builder implements PromiseLike<{ data: unknown; error: Err }> {
  private op: "select" | "upsert" | "insert" | "update" | "delete" = "select";
  private payload: Row | Row[] | null = null;
  private filters: Array<[string, unknown]> = [];
  private orderBy: string | null = null;
  private mode: "single" | "maybeSingle" | null = null;
  private wantRows = false;

  constructor(
    private readonly table: keyof Omit<FakeDb, "users">,
    private readonly db: FakeDb,
    private readonly uid: () => string | null,
    private readonly profileWrites: ProfileWrite[],
  ) {}

  select(_cols?: string) {
    this.wantRows = true;
    return this;
  }
  upsert(payload: Row | Row[], _opts?: unknown) {
    this.op = "upsert";
    this.payload = payload;
    return this;
  }
  insert(payload: Row | Row[]) {
    this.op = "insert";
    this.payload = payload;
    return this;
  }
  update(payload: Row) {
    this.op = "update";
    this.payload = payload;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  eq(col: string, value: unknown) {
    this.filters.push([col, value]);
    return this;
  }
  order(col: string) {
    this.orderBy = col;
    return this;
  }
  maybeSingle() {
    this.mode = "maybeSingle";
    return this;
  }
  single() {
    this.mode = "single";
    return this;
  }
  then<R1 = unknown, R2 = never>(onfulfilled?: ((v: { data: unknown; error: Err }) => R1 | PromiseLike<R1>) | null, onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null): PromiseLike<R1 | R2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected);
  }

  private ownerCol(): string {
    return this.table === "profiles" ? "id" : "user_id";
  }

  /** RLS: a user only ever sees their own rows. */
  private visible(): Row[] {
    const uid = this.uid();
    const rows = this.db[this.table];
    return rows.filter((r) => uid && r[this.ownerCol()] === uid && this.filters.every(([c, v]) => r[c] === v));
  }

  private run(): { data: unknown; error: Err } {
    const uid = this.uid();
    if (!uid) return { data: null, error: { message: "JWT expired", code: "PGRST301" } };
    const rows = this.db[this.table];
    let result: Row[] = [];

    if (this.table === "profiles" && (this.op === "insert" || this.op === "upsert" || this.op === "update")) {
      const items = this.op === "update" ? [this.payload as Row] : Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      for (const item of items) {
        const denied = profileColumnDenied(this.op, item);
        if (denied) return { data: null, error: denied };
      }
      this.profileWrites.push({ op: this.op, keys: Object.keys(items[0] ?? {}) });
    }

    if (this.op === "select") {
      result = this.visible();
    } else if (this.op === "insert" || this.op === "upsert") {
      if (this.table === "day_completions") return { data: null, error: { message: "new row violates row-level security policy", code: "42501" } };
      const items = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      for (const item of items) {
        if (item[this.ownerCol()] !== uid) return { data: null, error: { message: "new row violates row-level security policy", code: "42501" } };
        if (this.table === "app_events" && item.event_name !== "login" && item.event_name !== "day_started") {
          return { data: null, error: { message: "new row violates row-level security policy", code: "42501" } };
        }
        const key = this.table === "profiles" ? ["id"] : this.table === "favorites" ? ["user_id", "exercise_id"] : this.table === "app_events" ? ["id"] : ["user_id", "kind"];
        const existing = this.op === "upsert" ? rows.find((r) => key.every((k) => r[k] === item[k])) : undefined;
        if (existing) {
          const wasOnboarded = existing.onboarded_at;
          if (this.table !== "favorites") Object.assign(existing, item);
          if (this.table === "profiles" && !wasOnboarded && existing.onboarded_at) {
            logAppEvent(this.db, String(existing.id), "onboarding_complete", { focus_area: existing.focus_area ?? null });
          }
          result.push(existing);
        } else {
          const row: Row = { id: uuid(rows.length + 1), created_at: new Date().toISOString(), ...item };
          rows.push(row);
          if (this.table === "profiles" && row.onboarded_at) {
            logAppEvent(this.db, String(row.id), "onboarding_complete", { focus_area: row.focus_area ?? null });
          }
          result.push(row);
        }
      }
    } else if (this.op === "update") {
      for (const row of this.visible()) {
        const wasOnboarded = row.onboarded_at;
        Object.assign(row, this.payload);
        if (this.table === "profiles" && !wasOnboarded && row.onboarded_at) {
          logAppEvent(this.db, String(row.id), "onboarding_complete", { focus_area: row.focus_area ?? null });
        }
        result.push(row);
      }
    } else if (this.op === "delete") {
      const doomed = new Set(this.visible());
      this.db[this.table] = rows.filter((r) => !doomed.has(r)) as Row[];
      result = [];
    }

    if (this.orderBy) {
      const col = this.orderBy;
      result = [...result].sort((a, b) => ((a[col] as number) > (b[col] as number) ? 1 : -1));
    }
    if (this.mode === "maybeSingle") return { data: result[0] ?? null, error: null };
    if (this.mode === "single") return result.length === 1 ? { data: result[0], error: null } : { data: null, error: { message: "JSON object requested, multiple (or no) rows returned" } };
    if (!this.wantRows && this.op !== "select") return { data: null, error: null };
    return { data: result, error: null };
  }
}

export function createFakeSupabase(seed?: Partial<FakeDb>) {
  const db: FakeDb = { users: [], profiles: [], questionnaire_responses: [], day_completions: [], favorites: [], app_events: [], ...seed };
  let session: Session | null = null;
  let requireEmailConfirm = false;
  const oauthCalls: unknown[] = [];
  const authCalls: { op: string; args: unknown }[] = [];
  const profileWrites: ProfileWrite[] = [];
  const listeners = new Set<(e: AuthChangeEvent, s: Session | null) => void>();
  const uid = () => session?.user.id ?? null;
  const emit = (e: AuthChangeEvent) => listeners.forEach((l) => l(e, session));

  const auth = {
    getSession: async () => ({ data: { session }, error: null }),
    getUser: async () => ({ data: { user: session?.user ?? null }, error: session ? null : { message: "Auth session missing!" } }),
    onAuthStateChange: (cb: (e: AuthChangeEvent, s: Session | null) => void) => {
      listeners.add(cb);
      return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
    },
    signUp: async ({ email, password, options }: { email: string; password: string; options?: { data?: { first_name?: string }; emailRedirectTo?: string } }) => {
      authCalls.push({ op: "signUp", args: { email, options } });
      if (db.users.some((u) => u.email === email)) return { data: { user: null, session: null }, error: { message: "User already registered", code: "user_already_exists" } };
      if (password.length < 8) return { data: { user: null, session: null }, error: { message: "Password should be at least 8 characters.", code: "weak_password" } };
      const user: FakeUser = { id: uuid(db.users.length + 1), email, password, first_name: options?.data?.first_name ?? "" };
      db.users.push(user);
      // on_auth_user_created trigger
      db.profiles.push({
        id: user.id,
        first_name: user.first_name || null,
        email: user.email,
        signup_method: "email",
        subscription_status: "none",
        age_range: null,
        focus_area: null,
        plan_start_date: null,
        onboarded_at: null,
        created_at: new Date().toISOString(),
      });
      logAppEvent(db, user.id, "signup", { method: "email" });
      const signed = sessionFor(user);
      if (requireEmailConfirm) {
        return { data: { user: signed.user, session: null }, error: null };
      }
      session = signed;
      emit("SIGNED_IN");
      return { data: { user: session.user, session }, error: null };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const user = db.users.find((u) => u.email === email && u.password === password);
      if (!user) return { data: { user: null, session: null }, error: { message: "Invalid login credentials", code: "invalid_credentials" } };
      session = sessionFor(user);
      emit("SIGNED_IN");
      return { data: { user: session.user, session }, error: null };
    },
    signInWithOtp: async (args: unknown) => {
      authCalls.push({ op: "otp", args });
      return { data: {}, error: null };
    },
    signInWithOAuth: async (args: unknown) => {
      oauthCalls.push(args);
      return { data: { provider: "google", url: null }, error: null };
    },
    resetPasswordForEmail: async (email: string, options?: unknown) => {
      authCalls.push({ op: "reset", args: { email, options } });
      return { data: {}, error: null };
    },
    updateUser: async () => ({ data: { user: session?.user ?? null }, error: null }),
    signOut: async () => {
      session = null;
      emit("SIGNED_OUT");
      return { error: null };
    },
  };

  function rpc(name: string, args?: Row) {
    const me = uid();
    const mine = (t: keyof Omit<FakeDb, "users">) => db[t].filter((r) => r.user_id === me);
    const done = () => mine("day_completions").map((r) => r.day_number as number);
    const hasRecheck = (kind: string) => mine("questionnaire_responses").some((r) => r.kind === kind);
    const fail = (message: string) => Promise.resolve({ data: null, error: { message, code: "P0001" } });

    if (!me) return fail("NOT_AUTHENTICATED");
    if (name === "get_progress") {
      const max = Math.max(0, ...done());
      const current = Math.min(max + 1, 60);
      const phase = current <= 20 ? 1 : current <= 40 ? 2 : 3;
      const recheck = current === 30 && !hasRecheck("day30") ? "day30" : current === 60 && max < 60 && !hasRecheck("day60") ? "day60" : null;
      const profile = db.profiles.find((p) => p.id === me);
      const hasFullAccess = FULL_ACCESS.has(String(profile?.subscription_status ?? "none"));
      return Promise.resolve({
        data: {
          current_day: current,
          completed_days: done().sort((a, b) => a - b),
          phase,
          recheck_due: recheck,
          all_done: max >= 60,
          free_days_limit: 3,
          has_full_access: hasFullAccess,
        },
        error: null,
      });
    }
    if (name === "complete_day") {
      const day = args?.p_day as number;
      const feeling = (args?.p_feeling as number | null) ?? null;
      if (!Number.isInteger(day) || day < 1 || day > 60) return fail("INVALID_DAY");
      if (feeling !== null && (feeling < 1 || feeling > 5)) return fail("INVALID_FEELING");
      const profile = db.profiles.find((p) => p.id === me);
      if (!profile?.onboarded_at) return fail("NOT_ONBOARDED");
      if (day > 1 && !done().includes(day - 1)) return fail("DAY_LOCKED");
      if (day > 3 && !FULL_ACCESS.has(String(profile.subscription_status ?? "none"))) return fail("PAYWALL");
      const kind = day === 30 ? "day30" : day === 60 ? "day60" : null;
      if (kind && !hasRecheck(kind)) return fail("RECHECK_REQUIRED");
      let row = db.day_completions.find((r) => r.user_id === me && r.day_number === day);
      const replay = Boolean(row);
      if (row) Object.assign(row, { completed_at: new Date().toISOString(), exercises_done: args?.p_exercises, feeling: feeling ?? row.feeling });
      else {
        row = { id: uuid(db.day_completions.length + 1), user_id: me, day_number: day, completed_at: new Date().toISOString(), exercises_done: args?.p_exercises, feeling };
        db.day_completions.push(row);
      }
      logAppEvent(db, me, "day_completed", { day, replay });
      return Promise.resolve({ data: row, error: null });
    }
    return fail(`unknown rpc ${name}`);
  }

  const client = {
    auth,
    rpc,
    from: (table: keyof Omit<FakeDb, "users">) => new Builder(table, db, uid, profileWrites),
  };

  return {
    client: client as unknown as Supabase,
    db,
    oauthCalls,
    authCalls,
    profileWrites,
    get session() {
      return session;
    },
    setSubscriptionStatus(userId: string, status: string) {
      const profile = db.profiles.find((p) => p.id === userId);
      if (profile) profile.subscription_status = status;
    },
    setRequireEmailConfirm(on: boolean) {
      requireEmailConfirm = on;
    },
    emitAuth(event: AuthChangeEvent) {
      emit(event);
    },
  };
}
