import { usePageTitle } from "../WebLayout";
import { AloneVsMobility } from "./AloneVsMobility";
import { Close } from "./Close";
import { EverydayMoments } from "./EverydayMoments";
import { Faq } from "./Faq";
import { FirstQuestion } from "./FirstQuestion";
import { Hero } from "./Hero";
import { RepRhythm } from "./RepRhythm";
import { SafetyPromise } from "./SafetyPromise";
import { Setup } from "./Setup";
import { SixtyDayLine } from "./SixtyDayLine";
import { Sources } from "./Sources";
import styles from "./Landing.module.css";

/**
 * Forest Hour. Light/dark rhythm: forest hero and first question, cream "how it works",
 * forest 60-day line, warm everyday moments, deep forest session, cream setup, paper references,
 * cream safety and FAQ, forest close.
 */
export function Landing() {
  usePageTitle("Mobility — Feel like yourself again");
  return (
    <div className={styles.page}>
      <Hero />
      <FirstQuestion />
      <AloneVsMobility />
      <SixtyDayLine />
      <EverydayMoments />
      <RepRhythm />
      <Setup />
      <Sources />
      <SafetyPromise />
      <Faq />
      <Close />
    </div>
  );
}
