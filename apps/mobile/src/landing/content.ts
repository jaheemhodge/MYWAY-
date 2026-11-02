import type { PolaroidSlide } from "@/components/ui/PolaroidCarousel";

/** Account links. These are the real account routes in CoreFlowApp (/signup, /login). */
export const SIGN_UP_HREF = "/signup";
export const SIGN_IN_HREF = "/login";

export type SignupFocus = "knees" | "lower_back" | "hips_balance";

/** Sign-up, optionally remembering which focus area the person picked on the landing page. */
export function signUpHref(focus?: SignupFocus): string {
  return focus ? `${SIGN_UP_HREF}?focus=${focus}` : SIGN_UP_HREF;
}

/**
 * Support address shown in the footer's contact column.
 * TODO(jah): fill in our real support address. While it is empty the contact column stays hidden.
 */
export const SUPPORT_EMAIL = "";

/**
 * Where each navbar item scrolls to. There is no #how section yet, so "How it works" points at the
 * programs section for now. TODO: switch to "#how" when that section lands.
 */
export const SECTION_HREF = {
  top: "#top",
  how: "#programs",
  programs: "#programs",
  coach: "#coach",
} as const;

export type ProgramCard = { focus: SignupFocus; title: string; subtitle: string; image: string; alt: string; cta: string; href: string };

export const PROGRAM_CARDS: ProgramCard[] = [
  {
    focus: "knees",
    title: "Knees",
    subtitle: "Gentle moves for standing up, sitting down and stairs",
    image: "/coach/K06.jpg",
    alt: "Coach doing a small squat, holding the back of a chair",
    cta: "Start with knees",
    href: signUpHref("knees"),
  },
  {
    focus: "lower_back",
    title: "Lower back",
    subtitle: "Slow, simple moves to keep your back moving",
    image: "/coach/B12.jpg",
    alt: "Coach on hands and knees on a mat, reaching one arm and the opposite leg out",
    cta: "Start with lower back",
    href: signUpHref("lower_back"),
  },
  {
    focus: "hips_balance",
    title: "Hips & balance",
    subtitle: "Balance practice with a chair for support",
    image: "/coach/H15.jpg",
    alt: "Coach standing heel to toe beside a chair",
    cta: "Start with hips",
    href: signUpHref("hips_balance"),
  },
];

export const COACH_SLIDES: PolaroidSlide[] = [
  { image: "/coach/K01.jpg", title: "Seated knee extension", caption: "Knees", alt: "Coach seated on a chair, straightening one knee" },
  { image: "/coach/K04.jpg", title: "Sit to stand from a chair", caption: "Knees", alt: "Coach rising from a chair to standing" },
  { image: "/coach/B01.jpg", title: "Knee rolls", caption: "Lower back", alt: "Coach lying on a mat, rolling bent knees to one side" },
  { image: "/coach/B05.jpg", title: "Cat-cow", caption: "Lower back", alt: "Coach on hands and knees on a mat, rounding his back" },
  { image: "/coach/H01.jpg", title: "Seated hip rotation", caption: "Hips & balance", alt: "Coach seated on a chair, rotating one hip" },
  { image: "/coach/H15.jpg", title: "Tandem stance hold", caption: "Hips & balance", alt: "Coach standing heel to toe beside a chair" },
];

/** Same stack as /app/home (src/app/open/open.css). */
export const FONT_SANS = '"Inter Tight", "Helvetica Neue", Arial, sans-serif';
