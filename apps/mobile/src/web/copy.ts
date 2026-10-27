export const PHASES = [
  {
    id: "familiar",
    range: "Days 1–20",
    title: "Get familiar",
    body: "Supported movements and time to learn a range that feels manageable. You also learn the stop rules: sharp pain, pain that builds, dizziness, chest discomfort, or feeling unsteady means you stop.",
  },
  {
    id: "practice",
    range: "Days 21–40",
    title: "Practice them",
    body: "The same kind of work, often enough to feel familiar. Nothing in this preview makes a session harder on its own.",
  },
  {
    id: "stay",
    range: "Days 41–60",
    title: "Stay with it",
    body: "You keep the routine you have been practicing. Around day 30, and again at day 60, the same check-in questions come back. You answer in your own words. There is still no score.",
  },
] as const;

export const SOURCES = [
  {
    id: "harlow",
    name: "Will Harlow",
    detail: "Over-Fifties Specialist Physio",
  },
  {
    id: "tone",
    name: "Tone and Tighten",
    detail: "Dr. Jared",
  },
  {
    id: "front-row",
    name: "Front Row with Ed and Elizabeth",
    detail: "Ed Deboo",
  },
] as const;

export const FAQ = [
  {
    id: "medical",
    question: "Is this medical advice?",
    answer:
      "No. Mobility is a general movement program. It does not diagnose, treat, or tell you the cause of pain. It does not replace a doctor or a physiotherapist, and it is not emergency care.",
  },
  {
    id: "score",
    question: "Will I get a score?",
    answer:
      "No. The check-in saves the answers you choose. It does not compare you with other people, give a percentile, or decide what is wrong.",
  },
  {
    id: "equipment",
    question: "What do I need at home?",
    answer:
      "Day 1 uses a sturdy chair without wheels and a fixed surface such as a kitchen counter. The check-in asks what you actually have. You do not need a gym.",
  },
  {
    id: "time",
    question: "How long is a session?",
    answer:
      "Day 1 is planned for about 8 minutes. Sessions are meant to stay short enough to do at home. Later sessions are still being prepared.",
  },
  {
    id: "coach",
    question: "Do I need a coach with me?",
    answer:
      "No. The videos are the guide. You practice on your own, and you can pause. That is not the same as having a clinician clear you to exercise.",
  },
  {
    id: "price",
    question: "When do I see a price?",
    answer:
      "After the free check-in, on the sign-up page. Pricing is not final in this preview, and nothing on that page is a live offer.",
  },
  {
    id: "stop",
    question: "What if I should not exercise right now?",
    answer:
      "The safety screen asks about recent surgery, a clinician’s advice to avoid exercise, chest pain or dizziness with activity, falls or unsteadiness, and symptoms that are new or getting worse. Yes, or I’m not sure, stops the check-in so you can talk with a doctor first.",
  },
] as const;
