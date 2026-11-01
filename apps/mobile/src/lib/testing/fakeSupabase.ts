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
}

function uuid(n: number): string {
  return `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
}

function sessionFor(user: FakeUser): Session {
  const u = { id: user.id, email: user.email, user_metadata: { first_name: user.first_name }, app_metadata: {}, aud: "authenticated", created_at: "" } as unknown as User;
  return { access_token: "t", refresh_token: "r", expires_in: 3600, token_type: "bearer", user: u } as Session;
}

class Builder implements PromiseLike<{ data: unknown; error: Err }> {
  private op: "select" | "upsert" | "update" | "delete" = "select";
  private payload: Row | Row[] | null = null;
  private filters: Array<[string, unknown]> = [];
  private orderBy: string | null = null;
  private mode: "single" | "maybeSingle" | null = null;
  private wantRows = false;

  constructor(
    private readonly table: keyof Omit<FakeDb, "users">,
    private readonly db: FakeDb,
    private readonly uid: () => string | null,
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

    if (this.op === "select") {
      result = this.visible();
    } else if (this.op === "upsert") {
      if (this.table === "day_completions") return { data: null, error: { message: "new row violates row-level security policy", code: "42501" } };
      const items = Array.isArray(this.payload) ? this.payload : [this.payload as Row];
      for (const item of items) {
        if (item[this.ownerCol()] !== uid) return { data: null, error: { message: "new row violates row-level security policy", code: "42501" } };
        const key = this.table === "profiles" ? ["id"] : this.table === "favorites" ? ["user_id", "exercise_id"] : ["user_id", "kind"];
        const existing = rows.find((r) => key.every((k) => r[k] === item[k]));
        if (existing) {
          if (this.table !== "favorites") Object.assign(existing, item);
          result.push(existing);
        } else {
          const row: Row = { id: uuid(rows.length + 1), created_at: new Date().toISOString(), ...item };
          rows.push(row);
          result.push(row);
        }
      }
    } else if (this.op === "update") {
      for (const row of this.visible()) {
        Object.assign(row, this.payload);
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
  const db: FakeDb = { users: [], profiles: [], questionnaire_responses: [], day_completions: [], favorites: [], ...seed };
  let session: Session | null = null;
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
    signUp: async ({ email, password, options }: { email: string; password: string; options?: { data?: { first_name?: string } } }) => {
      if (db.users.some((u) => u.email === email)) return { data: { user: null, session: null }, error: { message: "User already registered", code: "user_already_exists" } };
      if (password.length < 8) return { data: { user: null, session: null }, error: { message: "Password should be at least 8 characters.", code: "weak_password" } };
      const user: FakeUser = { id: uuid(db.users.length + 1), email, password, first_name: options?.data?.first_name ?? "" };
      db.users.push(user);
      // on_auth_user_created trigger
      db.profiles.push({ id: user.id, first_name: user.first_name || null, age_range: null, focus_area: null, plan_start_date: null, onboarded_at: null, created_at: new Date().toISOString() });
      session = sessionFor(user);
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
    signInWithOtp: async () => ({ data: {}, error: null }),
    signInWithOAuth: async () => ({ data: { provider: "google", url: null }, error: null }),
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
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
      return Promise.resolve({ data: { current_day: current, completed_days: done().sort((a, b) => a - b), phase, recheck_due: recheck, all_done: max >= 60 }, error: null });
    }
    if (name === "complete_day") {
      const day = args?.p_day as number;
      const feeling = (args?.p_feeling as number | null) ?? null;
      if (!Number.isInteger(day) || day < 1 || day > 60) return fail("INVALID_DAY");
      if (feeling !== null && (feeling < 1 || feeling > 5)) return fail("INVALID_FEELING");
      const profile = db.profiles.find((p) => p.id === me);
      if (!profile?.onboarded_at) return fail("NOT_ONBOARDED");
      if (day > 1 && !done().includes(day - 1)) return fail("DAY_LOCKED");
      const kind = day === 30 ? "day30" : day === 60 ? "day60" : null;
      if (kind && !hasRecheck(kind)) return fail("RECHECK_REQUIRED");
      let row = db.day_completions.find((r) => r.user_id === me && r.day_number === day);
      if (row) Object.assign(row, { completed_at: new Date().toISOString(), exercises_done: args?.p_exercises, feeling: feeling ?? row.feeling });
      else {
        row = { id: uuid(db.day_completions.length + 1), user_id: me, day_number: day, completed_at: new Date().toISOString(), exercises_done: args?.p_exercises, feeling };
        db.day_completions.push(row);
      }
      return Promise.resolve({ data: row, error: null });
    }
    return fail(`unknown rpc ${name}`);
  }

  const client = {
    auth,
    rpc,
    from: (table: keyof Omit<FakeDb, "users">) => new Builder(table, db, uid),
  };

  return { client: client as unknown as Supabase, db, get session() { return session; } };
}
