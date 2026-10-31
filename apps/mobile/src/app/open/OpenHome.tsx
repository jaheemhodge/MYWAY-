import { useSearchParams } from "react-router-dom";
import { getSession, phaseForDay } from "../data/plan";
import { useDay } from "../DayState";
import { usePageTitle } from "../hooks";
import { AREA_SLUGS, collection, COLLECTION_LINE, COLLECTION_SHAPE, COLLECTION_TITLE } from "./data";
import { ORow } from "./parts";

/**
 * /app/home, laid out like Open's library (o-p-e-n.com/all): Today first, then one row per focus
 * area. ?area=knees (set by the category pills) narrows the page to that one section.
 */
export function OpenHome() {
  const { currentDay } = useDay();
  const [params] = useSearchParams();
  const areaParam = params.get("area");
  const only = AREA_SLUGS.find((a) => a === areaParam);
  usePageTitle(only ? COLLECTION_TITLE[only] : "Today");

  const phase = phaseForDay(currentDay);

  return (
    <div className="o-page o-rows">
      {only ? null : (
        <ORow
          title="Today"
          line={`Day ${currentDay} · ${phase.name}`}
          seeAll="/app/library/today"
          items={getSession(currentDay)}
          currentDay={currentDay}
          shape={COLLECTION_SHAPE.today}
        />
      )}
      {(only ? [only] : AREA_SLUGS).map((slug) => (
        <ORow
          key={slug}
          title={COLLECTION_TITLE[slug]}
          line={COLLECTION_LINE[slug]}
          seeAll={`/app/library/${slug}`}
          items={collection(slug, currentDay)}
          currentDay={currentDay}
          shape={COLLECTION_SHAPE[slug]}
          area={slug}
        />
      ))}
    </div>
  );
}
