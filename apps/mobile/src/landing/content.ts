import type { PolaroidSlide } from "@/components/ui/PolaroidCarousel";

/** Account links. These are the real account routes in CoreFlowApp (/signup, /login). */
export const SIGN_UP_HREF = "/signup";
export const SIGN_IN_HREF = "/login";

/**
 * Support address shown in the footer's contact column.
 * TODO(jah): fill in our real support address. While it is empty the contact column stays hidden.
 */
export const SUPPORT_EMAIL = "";

/**
 * Where each navbar item scrolls to. #how and #programs are not built yet, so they point at the
 * carousel for now. TODO: switch to "#how" / "#programs" when those sections land.
 */
export const SECTION_HREF = {
  top: "#top",
  how: "#coach",
  programs: "#coach",
  coach: "#coach",
} as const;

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
