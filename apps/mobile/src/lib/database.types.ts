/**
 * Hand-written types for the Supabase schema in /supabase/migrations.
 * Keep in step with the SQL; regenerate with `supabase gen types typescript --local` if preferred.
 * Type aliases (not interfaces) on purpose: supabase-js needs implicit index signatures.
 */

export type FocusArea = "knees" | "lower_back" | "hips_balance";
export type QuestionnaireKind = "baseline" | "day30" | "day60";
export type SubscriptionStatus = "none" | "trialing" | "active" | "past_due" | "canceled" | "comped";
export type AppEventName =
  | "signup"
  | "login"
  | "onboarding_complete"
  | "day_started"
  | "day_completed"
  | "checkout_started"
  | "checkout_paid"
  | "subscription_canceled";

/** Free-form answers. The questionnaire screens decide the shape; the database only stores JSON. */
export type Answers = Record<string, unknown>;

export type ProfileRow = {
  id: string;
  first_name: string | null;
  age_range: string | null;
  focus_area: FocusArea | null;
  plan_start_date: string | null;
  onboarded_at: string | null;
  created_at: string;
  email: string | null;
  signup_method: string | null;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_current_period_end: string | null;
}

export type QuestionnaireResponseRow = {
  id: string;
  user_id: string;
  kind: QuestionnaireKind;
  answers: Answers;
  created_at: string;
}

/** Per-exercise outcome recorded by the session player. */
export type ExerciseDoneRecord = {
  id: string;
  status: "completed" | "skipped";
  setsDone: number;
};

/** Older completions stored bare exercise ids; newer ones store records. */
export type ExerciseDoneEntry = string | ExerciseDoneRecord;

export type DayCompletionRow = {
  id: string;
  user_id: string;
  day_number: number;
  completed_at: string;
  exercises_done: ExerciseDoneEntry[];
  feeling: number | null;
}

export type FavoriteRow = {
  user_id: string;
  exercise_id: string;
  created_at: string;
}

export type AppEventRow = {
  id: string;
  user_id: string | null;
  event_name: AppEventName;
  properties: Answers;
  created_at: string;
}

/** Shape returned by the get_progress() SQL function. */
export type ProgressRpcResult = {
  current_day: number;
  completed_days: number[];
  phase: 1 | 2 | 3;
  recheck_due: "day30" | "day60" | null;
  all_done: boolean;
  /** Absent on databases that have not applied 20261102000000_access_events.sql yet. */
  free_days_limit?: number;
  has_full_access?: boolean;
}

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      questionnaire_responses: {
        Row: QuestionnaireResponseRow;
        Insert: { user_id: string; kind: QuestionnaireKind; answers: Answers; id?: string; created_at?: string };
        Update: Partial<QuestionnaireResponseRow>;
        Relationships: [];
      };
      day_completions: {
        Row: DayCompletionRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      favorites: {
        Row: FavoriteRow;
        Insert: { user_id: string; exercise_id: string; created_at?: string };
        Update: Partial<FavoriteRow>;
        Relationships: [];
      };
      app_events: {
        Row: AppEventRow;
        Insert: { user_id: string; event_name: AppEventName; properties?: Answers; id?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      complete_day: {
        Args: { p_day: number; p_exercises: Json; p_feeling: number | null };
        Returns: DayCompletionRow;
      };
      get_progress: {
        Args: Record<string, never>;
        Returns: ProgressRpcResult;
      };
      has_full_access: {
        Args: { p_uid?: string };
        Returns: boolean;
      };
      free_days_limit: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
