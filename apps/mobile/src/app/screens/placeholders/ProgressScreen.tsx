import { Link } from "react-router-dom";
import type { QuestionnaireResponseRow } from "@/lib/database.types";
import { PHASE_INFO, TOTAL_DAYS } from "@/lib/plan";
import { usePageTitle } from "../../hooks";
import { useProfile } from "../../state/ProfileProvider";
import { useProgress } from "../../state/ProgressProvider";
import { COMPARED, DAY_TO_DAY, EASIER, labelFor, labelsFor } from "./questions";
import { PageHead, PageState } from "./ui";

/**
 * /app/progress — days completed, the current phase, and the Day 1 answers next to the Day 30 /
 * Day 60 re-checks once they exist. Calm, no streaks or scores.
 * Hook API: useProgress() → { progress: { currentDay, completedDays, phase, phaseName, recheckDue, allDone },
 *   questionnaires, status, error }, useProfile().profile.planStartDate.
 */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function ProgressScreen() {
  usePageTitle("Progress");
  const { profile } = useProfile();
  const { progress, questionnaires, status, error, refresh } = useProgress();

  if (status === "error") {
    return (
      <PageState
        kind="error"
        title="We couldn't load your progress"
        action={
          <button type="button" className="o-pill o-pill--solid" onClick={() => void refresh()}>
            Try again
          </button>
        }
      >
        {error ?? "Please check your connection and try again."}
      </PageState>
    );
  }
  if (status === "loading" || status === "idle") return <PageState kind="loading" title="Loading your progress…" />;

  const done = new Set(progress.completedDays);
  const started = formatDate(profile?.planStartDate);
  const baseline = questionnaires.find((q) => q.kind === "baseline");
  const day30 = questionnaires.find((q) => q.kind === "day30");
  const day60 = questionnaires.find((q) => q.kind === "day60");
  const recheckDay = progress.recheckDue === "day60" ? 60 : 30;

  return (
    <div className="o-wrap c-page">
      <PageHead title="Progress" line={`Day ${progress.currentDay} of ${TOTAL_DAYS} · Phase ${progress.phase} · ${progress.phaseName}`} />

      {progress.recheckDue ? (
        <div className="c-callout c-glass">
          <div className="c-callout__text">
            <h2 className="c-callout__title">Your Day {recheckDay} re-check is ready</h2>
            <p className="c-small">Three short questions, then Day {recheckDay}'s session.</p>
          </div>
          <Link to={`/app/recheck/${progress.recheckDue}`} className="o-pill o-pill--solid">
            Start the re-check
          </Link>
        </div>
      ) : progress.allDone ? (
        <div className="c-callout c-glass">
          <div className="c-callout__text">
            <h2 className="c-callout__title">You've finished all 60 days.</h2>
            <p className="c-small">Every exercise stays open in the library whenever you want it.</p>
          </div>
        </div>
      ) : progress.completedDays.length === 0 ? (
        <div className="c-callout c-glass">
          <div className="c-callout__text">
            <h2 className="c-callout__title">Your first session is waiting</h2>
            <p className="c-small">Once you finish Day 1 it will show here.</p>
          </div>
          <Link to="/app/session/1" className="o-pill o-pill--solid">
            Start Day 1
          </Link>
        </div>
      ) : null}

      <div className="c-stats">
        <div className="c-stat c-glass">
          <p className="c-small">Days done</p>
          <p className="c-stat__value">{progress.completedDays.length}</p>
          <p className="c-small">
            {progress.completedDays.length} of {TOTAL_DAYS} days done
          </p>
        </div>
        <div className="c-stat c-glass">
          <p className="c-small">Phase {progress.phase} of 3</p>
          <p className="c-stat__value">{progress.phaseName}</p>
          <p className="c-small">
            Days {PHASE_INFO[progress.phase].startDay}–{PHASE_INFO[progress.phase].endDay}
          </p>
        </div>
        <div className="c-stat c-glass">
          <p className="c-small">Plan started</p>
          <p className="c-stat__value">{started ?? "Not yet"}</p>
          <p className="c-small">Go at your own pace. There's no deadline.</p>
        </div>
      </div>

      <section className="c-section" aria-labelledby="days-title">
        <h2 id="days-title" className="c-section__title">
          Your 60 days
        </h2>
        <div className="c-ticks">
          {([1, 2, 3] as const).map((phase) => {
            const info = PHASE_INFO[phase];
            const count = progress.completedDays.filter((d) => d >= info.startDay && d <= info.endDay).length;
            return (
              <div key={phase} className="c-ticks__phase">
                <p className="c-small">
                  <span style={{ color: "var(--ink)" }}>{info.name}</span> · {count} of 20
                </p>
                <div className="c-ticks__row" aria-hidden="true">
                  {Array.from({ length: 20 }, (_, i) => info.startDay + i).map((day) => (
                    <span
                      key={day}
                      className={`c-tick${done.has(day) ? " is-done" : ""}${day === progress.currentDay && !done.has(day) ? " is-today" : ""}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="c-small">
          <Link to="/app/plan" className="c-link">
            See every day in My plan
          </Link>
        </p>
      </section>

      <section className="c-section" aria-labelledby="feel-title">
        <h2 id="feel-title" className="c-section__title">
          How you've been feeling
        </h2>
        <p className="c-line c-narrow">Your answers from the start, side by side with the Day 30 and Day 60 re-checks.</p>
        <div className="c-compare">
          <CheckCard title="Day 1" row={baseline} emptyText="You'll see your first answers here once your plan is set up." />
          <CheckCard title="Day 30" row={day30} emptyText="Opens on Day 30, with three short questions." />
          <CheckCard title="Day 60" row={day60} emptyText="Opens on Day 60, the last day of the plan." />
        </div>
      </section>
    </div>
  );
}

function CheckCard({ title, row, emptyText }: { title: string; row?: QuestionnaireResponseRow; emptyText: string }) {
  if (!row) {
    return (
      <article className="c-check c-check--empty">
        <div className="c-check__head">
          <h3 className="c-check__title">{title}</h3>
          <span className="c-small">Not yet</span>
        </div>
        <p className="c-small">{emptyText}</p>
      </article>
    );
  }
  const a = row.answers ?? {};
  const feel = labelFor(DAY_TO_DAY, a.day_to_day);
  const compared = labelFor(COMPARED, a.compared);
  const easier = labelsFor(EASIER, a.easier);
  const legacyGoal = typeof a.goal === "string" && a.goal.trim() ? a.goal.trim() : null;
  return (
    <article className="c-check c-glass">
      <div className="c-check__head">
        <h3 className="c-check__title">{title}</h3>
        <span className="c-small">{formatDate(row.created_at) ?? ""}</span>
      </div>
      <dl>
        <div>
          <dt>Day to day</dt>
          <dd>{feel ?? "No answer"}</dd>
        </div>
        {row.kind !== "baseline" ? (
          <div>
            <dt>Compared with the start</dt>
            <dd>{compared ?? "No answer"}</dd>
          </div>
        ) : null}
        <div>
          <dt>{row.kind === "baseline" ? "Wanted to do more easily" : "Still want to do more easily"}</dt>
          <dd>{easier.length ? easier.join(", ") : legacyGoal ?? "Nothing chosen"}</dd>
        </div>
      </dl>
    </article>
  );
}
