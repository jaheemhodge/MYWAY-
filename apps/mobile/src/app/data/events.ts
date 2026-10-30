/**
 * SAMPLE local events (src/data/events.sample.json). Not real listings: organizers and places are
 * generic on purpose. Dates are offsets from the current plan day so the page always looks current.
 * TODO(events): replace with real local events.
 */
import raw from "@/data/events.sample.json";
import { dateForDay } from "./plan";

export type EventCategory = "walking" | "gentle" | "social";

export interface LocalEvent {
  id: string;
  title: string;
  organizer: string;
  category: EventCategory;
  tileWord: string;
  dayOffset: number;
  time: string;
  price: string;
  place: string;
  whatToExpect: string;
  /** Optional photo, added once real listings arrive. */
  image?: string;
}

export const EVENTS: readonly LocalEvent[] = (raw as { events: LocalEvent[] }).events;

export function getEvent(id: string): LocalEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  walking: "Walking & running",
  gentle: "Pétanque, tai chi & more",
  social: "Social clubs",
};

export function eventDate(event: LocalEvent, currentDay: number): Date {
  const d = dateForDay(currentDay);
  const [h, m] = event.time.split(":").map(Number);
  d.setDate(d.getDate() + event.dayOffset);
  d.setHours(h, m, 0, 0);
  return d;
}

const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const weekdayLong = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });
const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

/** "Sat at 9:00 AM", "Tomorrow at 6:30 PM". */
export function whenShort(event: LocalEvent, currentDay: number): string {
  const d = eventDate(event, currentDay);
  const day = event.dayOffset === 0 ? "Today" : event.dayOffset === 1 ? "Tomorrow" : weekday.format(d);
  return `${day} at ${time.format(d)}`;
}

/** "Saturday, October 31 at 9:00 AM". */
export function whenLong(event: LocalEvent, currentDay: number): string {
  const d = eventDate(event, currentDay);
  return `${weekdayLong.format(d)} at ${time.format(d)}`;
}

export type DateFilter = "any" | "today" | "tomorrow" | "weekend" | "week";

export const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: "any", label: "Any day" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "weekend", label: "This weekend" },
  { id: "week", label: "Next 7 days" },
];

export function matchesDate(event: LocalEvent, filter: DateFilter, currentDay: number): boolean {
  if (filter === "any") return true;
  if (filter === "today") return event.dayOffset === 0;
  if (filter === "tomorrow") return event.dayOffset === 1;
  if (filter === "week") return event.dayOffset <= 7;
  const dow = eventDate(event, currentDay).getDay();
  return event.dayOffset <= 7 && (dow === 0 || dow === 6);
}

export function sortBySoonest(events: readonly LocalEvent[]): LocalEvent[] {
  return [...events].sort((a, b) => a.dayOffset - b.dayOffset || a.time.localeCompare(b.time));
}
