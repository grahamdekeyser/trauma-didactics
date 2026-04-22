import { addDays, format, startOfWeek } from "date-fns";
import type { Session, SessionType } from "./types";

export type CalendarWeek = {
  weekStart: Date;
  sessions: Array<{
    type: SessionType;
    date: Date;
    session: Session | null;
  }>;
};

const SESSION_WEEKDAYS: Array<{ type: SessionType; offset: number }> = [
  { type: "breakfast_club", offset: 2 },
  { type: "fracture_conference", offset: 3 },
  { type: "virtuohsu", offset: 4 },
];

export function buildCalendarWeeks(
  today: Date,
  sessions: Session[],
  weeks = 6,
): CalendarWeek[] {
  const sessionMap = new Map<string, Session>();
  for (const s of sessions) {
    sessionMap.set(`${s.type}|${s.date}`, s);
  }

  const monday = startOfWeek(today, { weekStartsOn: 1 });

  return Array.from({ length: weeks }, (_, weekIdx) => {
    const weekStart = addDays(monday, weekIdx * 7);
    return {
      weekStart,
      sessions: SESSION_WEEKDAYS.map(({ type, offset }) => {
        const date = addDays(weekStart, offset);
        const key = `${type}|${format(date, "yyyy-MM-dd")}`;
        return { type, date, session: sessionMap.get(key) ?? null };
      }),
    };
  });
}

export function isNoBreakfastClubWeek(date: Date): boolean {
  const weekOfMonth = Math.ceil(date.getDate() / 7);
  return weekOfMonth === 1 || weekOfMonth === 3;
}

export function defaultSessionTitle(type: SessionType, date?: Date): string {
  if (type === "fracture_conference") return "Fracture Conference";
  if (type === "virtuohsu") return "VirtuOHSU";
  if (date) {
    const weekOfMonth = Math.ceil(date.getDate() / 7);
    if (weekOfMonth === 1) {
      return "Ortho Trauma Research Meeting — No Breakfast Club";
    }
    if (weekOfMonth === 3) {
      return "Faculty Meeting — No Breakfast Club";
    }
  }
  return "Breakfast Club";
}

export function defaultWebexUrl(type: SessionType): string | null {
  const shared = process.env.NEXT_PUBLIC_WEBEX_URL;
  if (!shared) return null;
  if (type === "breakfast_club" || type === "fracture_conference") {
    return shared;
  }
  return null;
}
