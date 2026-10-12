import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Chip,
  ChoiceRow,
  Field,
  Notice,
  StepHeader,
  TextInput,
} from "../components/ui/Primitives";
import { finishOnboarding, useApp } from "../store/AppState";

const GOALS = [
  { id: "walks", label: "Enjoy longer walks", icon: "◎" },
  { id: "chair", label: "Get up from chairs more easily", icon: "⊓" },
  { id: "morning", label: "Feel less stiff in the morning", icon: "☀" },
  { id: "workdays", label: "Get through workdays more comfortably", icon: "◷" },
  { id: "stronger", label: "Feel stronger in everyday life", icon: "⌂" },
  { id: "confidence", label: "Improve movement confidence", icon: "✓" },
];

const DIFFICULTIES = [
  { id: "knee", label: "Knee discomfort" },
  { id: "hip", label: "Hip stiffness" },
  { id: "lower_back", label: "Lower-back discomfort" },
  { id: "shoulder", label: "Shoulder stiffness" },
  { id: "standing", label: "Difficulty standing up" },
  { id: "strength", label: "Reduced strength" },
  { id: "limited_walking", label: "Limited walking endurance" },
  { id: "stiffness", label: "General stiffness" },
  { id: "other", label: "Something else" },
];

const ACTIVITY = [
  { id: "none", title: "I don't exercise regularly.", body: "That's a perfectly good place to start." },
  { id: "walks_sometimes", title: "I take occasional walks.", body: "Now and then, when I feel up to it." },
  { id: "most_days", title: "I move or walk most days.", body: "Gentle activity is part of my routine." },
  { id: "active", title: "I'm already quite active.", body: "I exercise several times a week." },
];

const MOTIVATIONS = [
  { id: "independence", label: "Stay independent" },
  { id: "younger", label: "Feel more like my younger self" },
  { id: "family", label: "Keep up with my family" },
  { id: "activities", label: "Continue doing activities I love" },
  { id: "confidence", label: "Feel confident moving" },
  { id: "everyday", label: "Make everyday life easier" },
];

const YES_NO = [
  { id: "no", label: "No" },
  { id: "yes", label: "Yes" },
  { id: "unsure", label: "I'm not sure" },
];

const SAFETY_PAGES = [
  {
    id: "provider_restrictions",
    title: "Has a doctor ever advised you to limit or avoid exercise?",
    body: "For example, because of a heart, lung or bone condition.",
  },
  {
    id: "recent_surgery",
    title: "Have you had surgery or a procedure affecting movement in the past 6 months?",
    body: "If you're not sure, choose I'm not sure. We will not guess.",
  },
  {
    id: "recent_injury",
    title: "Have you had a recent fracture, significant injury or immobilization?",
    body: "This includes injuries you are still recovering from.",
  },
  {
    id: "bone_health",
    title: "Have you been told you have osteoporosis, a fragility fracture, or a high fracture risk?",
    body: "An unsure answer pauses automatic planning.",
  },
  {
    id: "falls_last_year",
    title: "Have you fallen in the last 12 months?",
    body: "A fall or near-fall means we will not assign a self-directed plan.",
  },
  {
    id: "unsteady",
    title: "Do you feel unsteady when standing or walking?",
    body: "There is no unsupported balance training in this preview.",
  },
  {
    id: "fear_falling",
    title: "Are you worried about falling?",
    body: "Your honesty helps us keep the next step conservative.",
  },
  {
    id: "dizziness",
    title: "Do you experience unexplained dizziness, fainting or sudden loss of balance?",
    body: "If yes or you're unsure, we hold the program.",
  },
  {
    id: "chest_symptoms",
    title: "Have you had chest pressure or unusual breathlessness with activity?",
    body: "This is a safety question, not a diagnosis.",
  },
  {
    id: "new_weakness",
    title: "Have you developed new or rapidly worsening weakness, or sudden trouble walking?",
    body: "New neurologic changes need medical care, not an app plan.",
  },
  {
    id: "saddle_numbness",
    title: "Have you developed new numbness around the groin, inner thighs or buttocks?",
    body: "If yes, seek urgent medical care. We will not assign exercise.",
  },
  {
    id: "acute_neurologic",
    title: "Have you had sudden face drooping, difficulty speaking, or sudden one-sided weakness?",
    body: "These can be emergency symptoms. Call 911 if they are happening now.",
  },
  {
    id: "infection_trauma",
    title: "Do you currently have a fever with severe new back or joint pain, or severe pain after injury?",
    body: "Severe unexplained pain is a reason to pause.",
  },
  {
    id: "unexplained_pain",
    title: "Do you have severe, unexplained, or rapidly worsening pain, especially at rest or at night?",
    body: "Choose I'm not sure if you cannot answer clearly.",
  },
];

export function Onboarding() {
  const { step = "1" } = useParams();
  const stepNum = Number(step);
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const answers = state.answers;

  const safetyIndex = Math.max(0, stepNum - 5);
  const showBackBladder = Array.isArray(answers.symptom_areas) && answers.symptom_areas.includes("lower_back");
  const extraSafety = showBackBladder ? 1 : 0;
  const safetyTotal = SAFETY_PAGES.length + 2 + extraSafety;
  const lastSafetyStep = 4 + safetyTotal;
  const totalChrome = 6;

  const chromeStep = stepNum <= 4 ? stepNum : stepNum < lastSafetyStep ? 5 : 6;

  const set = (value: Record<string, unknown>) => dispatch({ type: "PATCH_ANSWERS", value });

  const toggleMulti = (key: string, id: string) => {
    const current = Array.isArray(answers[key]) ? [...(answers[key] as string[])] : [];
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    set({ [key]: next });
  };

  const canContinue = useMemo(() => {
    if (stepNum === 1) return Boolean(answers.first_name);
    if (stepNum === 2) return Boolean(answers.primary_goal);
    if (stepNum === 3) return Array.isArray(answers.symptom_areas) && (answers.symptom_areas as string[]).length > 0;
    if (stepNum === 4) return Boolean(answers.usual_activity);
    if (stepNum === lastSafetyStep) return answers.consent_limits === "yes" && answers.privacy_consent === "yes";
    return true;
  }, [answers, lastSafetyStep, stepNum]);

  const go = (next: number) => navigate(`/onboarding/${next}`);

  const back = () => {
    if (stepNum <= 1) navigate("/");
    else go(stepNum - 1);
  };

  const continueMain = () => {
    if (stepNum === 1 && !answers.age) set({ age: 60 });
    if (stepNum === 4) return go(5);
    if (stepNum < lastSafetyStep) return go(stepNum + 1);
    finishOnboarding(dispatch, answers);
    navigate("/personalizing");
  };

  return (
    <section className="screen">
      <StepHeader step={chromeStep} total={totalChrome} onBack={back} />
      {stepNum === 1 && <Identity answers={answers} set={set} />}
      {stepNum === 2 && (
        <>
          <h1 className="display">What would you love to do more comfortably?</h1>
          <p className="lede">Choose the one that matters most right now.</p>
          <div className="stack">
            {GOALS.map((goal) => (
              <ChoiceRow
                key={goal.id}
                icon={goal.icon}
                selected={answers.primary_goal === goal.id}
                onClick={() => set({ primary_goal: goal.id })}
              >
                {goal.label}
              </ChoiceRow>
            ))}
          </div>
        </>
      )}
      {stepNum === 3 && (
        <>
          <h1 className="display">What's making movement difficult today?</h1>
          <p className="lede">Choose everything that applies.</p>
          <div className="chip-grid">
            {DIFFICULTIES.map((item) => (
              <Chip
                key={item.id}
                selected={Array.isArray(answers.symptom_areas) && (answers.symptom_areas as string[]).includes(item.id)}
                onClick={() => toggleMulti("symptom_areas", item.id)}
              >
                {item.label}
              </Chip>
            ))}
          </div>
          <Notice icon="info">
            These answers help us tailor your experience. They aren't used to diagnose any medical
            condition.
          </Notice>
        </>
      )}
      {stepNum === 4 && (
        <>
          <h1 className="display">How active are you right now?</h1>
          <p className="lede">There's no wrong answer. This sets a comfortable starting point.</p>
          <div className="stack">
            {ACTIVITY.map((item) => (
              <ChoiceRow
                key={item.id}
                selected={answers.usual_activity === item.id}
                onClick={() => set({ usual_activity: item.id })}
              >
                <strong>{item.title}</strong>
                <div className="muted">{item.body}</div>
              </ChoiceRow>
            ))}
          </div>
          <Field label="How long can you usually walk comfortably?">
            <select
              className="text-input"
              value={String(answers.walk_tolerance ?? "")}
              onChange={(event) => set({ walk_tolerance: event.target.value })}
            >
              <option value="">Choose one</option>
              <option value="under_10">Under 10 minutes</option>
              <option value="10_20">10 to 20 minutes</option>
              <option value="20_40">20 to 40 minutes</option>
              <option value="over_40">More than 40 minutes</option>
            </select>
          </Field>
          <Field label="What stable support do you have?">
            <div className="chip-grid">
              {["chair", "counter", "wall", "none"].map((item) => (
                <Chip
                  key={item}
                  selected={Array.isArray(answers.equipment) && (answers.equipment as string[]).includes(item)}
                  onClick={() => toggleMulti("equipment", item)}
                >
                  {item}
                </Chip>
              ))}
            </div>
          </Field>
        </>
      )}
      {stepNum >= 5 && stepNum < lastSafetyStep && (
        <SafetyStep
          stepNum={stepNum}
          safetyIndex={safetyIndex}
          safetyTotal={safetyTotal}
          answers={answers}
          set={set}
          showBackBladder={showBackBladder}
        />
      )}
      {stepNum === lastSafetyStep && (
        <>
          <h1 className="display">Why is this important to you?</h1>
          <p className="lede">Choose any that feel true. We'll keep them in view along the way.</p>
          <div className="chip-grid">
            {MOTIVATIONS.map((item) => (
              <Chip
                key={item.id}
                selected={Array.isArray(answers.motivations) && (answers.motivations as string[]).includes(item.id)}
                onClick={() => toggleMulti("motivations", item.id)}
              >
                {item.label}
              </Chip>
            ))}
          </div>
          <Field label="In your own words (optional)">
            <textarea
              className="text-input"
              value={String(answers.motivation_note ?? "")}
              onChange={(event) => set({ motivation_note: event.target.value })}
            />
          </Field>
          <ChoiceRow
            selected={answers.consent_limits === "yes"}
            onClick={() => set({ consent_limits: answers.consent_limits === "yes" ? "" : "yes" })}
            multi
          >
            I understand this app offers general wellness guidance, not diagnosis or emergency monitoring.
          </ChoiceRow>
          <ChoiceRow
            selected={answers.privacy_consent === "yes"}
            onClick={() => set({ privacy_consent: answers.privacy_consent === "yes" ? "" : "yes" })}
            multi
          >
            I consent to storing these demo answers on this device to shape a preview plan.
          </ChoiceRow>
        </>
      )}
      <div className="grow" />
      <Button
        onClick={continueMain}
        disabled={stepNum >= 5 && stepNum < lastSafetyStep ? !currentSafetyAnswered(stepNum, answers, showBackBladder) : !canContinue}
      >
        {stepNum === lastSafetyStep ? "Build my plan" : stepNum >= 5 && stepNum < lastSafetyStep ? "Continue" : "Continue"}
      </Button>
    </section>
  );
}

function Identity({
  answers,
  set,
}: {
  answers: Record<string, unknown>;
  set: (value: Record<string, unknown>) => void;
}) {
  const age = Number(answers.age ?? 60);
  return (
    <>
      <h1 className="display">Let's get to know you.</h1>
      <p className="lede">Your journey starts with understanding where you are today and where you'd like to be.</p>
      <Field label="What's your first name?">
        <TextInput
          value={String(answers.first_name ?? "")}
          onChange={(event) => set({ first_name: event.target.value })}
          autoComplete="given-name"
        />
      </Field>
      <Field label="And your age?">
        <div className="age-stepper">
          <button type="button" aria-label="Decrease age" onClick={() => set({ age: Math.max(18, age - 1) })}>
            −
          </button>
          <div>{Number.isFinite(age) ? age : 60}</div>
          <button
            type="button"
            aria-label="Increase age"
            onClick={() => set({ age: Math.min(100, (Number.isFinite(age) ? age : 60) + 1) })}
          >
            +
          </button>
        </div>
      </Field>
      <Notice>Your answers stay private and are only used to shape your plan. This demo stores them on this device.</Notice>
    </>
  );
}

function SafetyStep({
  stepNum,
  safetyIndex,
  safetyTotal,
  answers,
  set,
  showBackBladder,
}: {
  stepNum: number;
  safetyIndex: number;
  safetyTotal: number;
  answers: Record<string, unknown>;
  set: (value: Record<string, unknown>) => void;
  showBackBladder: boolean;
}) {
  const local = safetyIndex;
  if (local < SAFETY_PAGES.length) {
    const page = SAFETY_PAGES[local];
    return (
      <>
        <p className="safety-kicker">Keeping you safe · question {local + 1} of {safetyTotal}</p>
        <h1 className="display">{page.title}</h1>
        <p className="lede">{page.body}</p>
        <div className="yes-no">
          {YES_NO.slice(0, 2).map((item) => (
            <ChoiceRow key={item.id} selected={answers[page.id] === item.id} onClick={() => set({ [page.id]: item.id })}>
              {item.label}
            </ChoiceRow>
          ))}
        </div>
        <ChoiceRow selected={answers[page.id] === "unsure"} onClick={() => set({ [page.id]: "unsure" })}>
          I'm not sure
        </ChoiceRow>
        {page.id === "falls_last_year" && answers.falls_last_year === "yes" && (
          <Field label="If you fell, were you hurt or did you need assistance?">
            <div className="stack">
              {YES_NO.map((item) => (
                <ChoiceRow
                  key={item.id}
                  selected={answers.falls_injury === item.id}
                  onClick={() => set({ falls_injury: item.id })}
                >
                  {item.label}
                </ChoiceRow>
              ))}
            </div>
          </Field>
        )}
        <Notice icon="heart">
          Most people can begin gently. If something here applies to you, we'll point you to the
          right next step rather than guess.
        </Notice>
      </>
    );
  }
  const after = local - SAFETY_PAGES.length;
  if (after === 0) {
    return (
      <>
        <p className="safety-kicker">Keeping you safe · question {local + 1} of {safetyTotal}</p>
        <h1 className="display">Have you been diagnosed with a condition that affects exercise safety?</h1>
        <p className="lede">Choose all that apply, or None / I'm not sure. We do not treat this as a diagnosis tool.</p>
        <div className="stack">
          {["none", "heart", "lung", "joint", "nerve", "balance", "unsure"].map((id) => (
            <ChoiceRow
              key={id}
              multi
              selected={Array.isArray(answers.diagnosed_conditions) && (answers.diagnosed_conditions as string[]).includes(id)}
              onClick={() => {
                const current = Array.isArray(answers.diagnosed_conditions) ? [...(answers.diagnosed_conditions as string[])] : [];
                const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
                set({ diagnosed_conditions: next });
              }}
            >
              {id === "none" ? "None that I know of" : id === "unsure" ? "I'm not sure" : id}
            </ChoiceRow>
          ))}
        </div>
      </>
    );
  }
  if (after === 1) {
    return (
      <>
        <p className="safety-kicker">Keeping you safe · question {local + 1} of {safetyTotal}</p>
        <h1 className="display">Do you use a cane, walker, wheelchair or similar mobility aid?</h1>
        <div className="stack">
          {[
            ["none", "I don't use one"],
            ["cane", "Cane"],
            ["walker", "Walker"],
            ["wheelchair", "Wheelchair or similar"],
          ].map(([id, label]) => (
            <ChoiceRow key={id} selected={answers.assistive_device === id} onClick={() => set({ assistive_device: id })}>
              {label}
            </ChoiceRow>
          ))}
        </div>
      </>
    );
  }
  if (showBackBladder && after === 2) {
    return (
      <>
        <p className="safety-kicker">Keeping you safe · question {local + 1} of {safetyTotal}</p>
        <h1 className="display">With back symptoms, have you developed new trouble controlling your bladder or bowels?</h1>
        <p className="lede">If yes, seek urgent medical care. We will not assign a program.</p>
        <div className="stack">
          {YES_NO.map((item) => (
            <ChoiceRow key={item.id} selected={answers.back_bladder === item.id} onClick={() => set({ back_bladder: item.id })}>
              {item.label}
            </ChoiceRow>
          ))}
        </div>
      </>
    );
  }
  void stepNum;
  return null;
}

function currentSafetyAnswered(stepNum: number, answers: Record<string, unknown>, showBackBladder: boolean) {
  const index = stepNum - 5;
  if (index < SAFETY_PAGES.length) {
    const id = SAFETY_PAGES[index].id;
    if (!answers[id]) return false;
    if (id === "falls_last_year" && answers.falls_last_year === "yes" && !answers.falls_injury) return false;
    return true;
  }
  const after = index - SAFETY_PAGES.length;
  if (after === 0) return Array.isArray(answers.diagnosed_conditions) && (answers.diagnosed_conditions as string[]).length > 0;
  if (after === 1) return Boolean(answers.assistive_device);
  if (showBackBladder && after === 2) return Boolean(answers.back_bladder);
  return true;
}
