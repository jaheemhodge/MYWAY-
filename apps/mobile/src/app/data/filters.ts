import { EXERCISES, type Area, type Exercise, type PhaseNumber, type Position, AREAS, POSITIONS, PHASES } from "./library";

export interface Filters {
  area: Area[];
  position: Position[];
  phase: PhaseNumber[];
}

export type FilterGroup = keyof Filters;

export const EMPTY_FILTERS: Filters = { area: [], position: [], phase: [] };

/** Curated "Balance practice" row: the standing balance drills in the library. */
export const BALANCE_IDS = ["H14", "H15", "H13", "H16", "H12", "H17"] as const;
export type Collection = "balance";

function uniqueInOrder<T>(values: T[], allowed: readonly T[]): T[] {
  return allowed.filter((value) => values.includes(value));
}

function splitParam(params: URLSearchParams, key: string): string[] {
  return params
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function filtersFromParams(params: URLSearchParams): Filters {
  return {
    area: uniqueInOrder(splitParam(params, "area") as Area[], AREAS),
    position: uniqueInOrder(splitParam(params, "position") as Position[], POSITIONS),
    phase: uniqueInOrder(
      splitParam(params, "phase").map((value) => Number(value)) as PhaseNumber[],
      PHASES,
    ),
  };
}

/** Writes filters into params (comma-separated, empty groups omitted), keeping q and collection. */
export function paramsFromFilters(filters: Filters, base?: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams();
  const q = base?.get("q");
  const collection = base?.get("collection");
  if (filters.area.length) next.set("area", filters.area.join(","));
  if (filters.position.length) next.set("position", filters.position.join(","));
  if (filters.phase.length) next.set("phase", filters.phase.join(","));
  if (q) next.set("q", q);
  if (collection) next.set("collection", collection);
  return next;
}

export function activeCount(filters: Filters): number {
  return filters.area.length + filters.position.length + filters.phase.length;
}

/** OR within a group, AND between groups. */
export function matches(exercise: Exercise, filters: Filters, query = ""): boolean {
  if (filters.area.length && !filters.area.some((area) => exercise.areas.includes(area))) return false;
  if (filters.position.length && !filters.position.includes(exercise.position)) return false;
  if (filters.phase.length && !filters.phase.includes(exercise.phase)) return false;
  const q = query.trim().toLowerCase();
  if (q) {
    const haystack = `${exercise.name} ${exercise.subtitle} ${exercise.equipment}`.toLowerCase();
    if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false;
  }
  return true;
}

export function applyFilters(
  filters: Filters,
  query = "",
  source: readonly Exercise[] = EXERCISES,
): Exercise[] {
  return source.filter((exercise) => matches(exercise, filters, query));
}

/**
 * Faceted count for one chip: how many exercises would match if this value were selected,
 * holding the other groups as they are (values in the same group OR together).
 */
export function optionCount<G extends FilterGroup>(
  filters: Filters,
  group: G,
  value: Filters[G][number],
  query = "",
  source: readonly Exercise[] = EXERCISES,
): number {
  const without = { ...filters, [group]: [] } as Filters;
  const only = { ...without, [group]: [value] } as Filters;
  return applyFilters(only, query, source).length;
}

export function toggleValue<G extends FilterGroup>(filters: Filters, group: G, value: Filters[G][number]): Filters {
  const current = filters[group] as Filters[G][number][];
  const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
  const ordered =
    group === "area"
      ? uniqueInOrder(next as Area[], AREAS)
      : group === "position"
        ? uniqueInOrder(next as Position[], POSITIONS)
        : uniqueInOrder(next as PhaseNumber[], PHASES);
  return { ...filters, [group]: ordered };
}
