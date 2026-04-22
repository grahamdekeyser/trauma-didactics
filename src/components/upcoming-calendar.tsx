import { format, isBefore, isSameDay, startOfDay } from "date-fns";
import { ExternalLink, FileText } from "lucide-react";
import { ManageSessionDialog } from "@/components/manage-session-dialog";
import { PaperViewButton } from "@/components/paper-view-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShortCitation } from "@/lib/citations";
import {
  buildCalendarWeeks,
  defaultSessionTitle,
  defaultWebexUrl,
  isNoBreakfastClubWeek,
} from "@/lib/dates";
import type { Session, SessionType } from "@/lib/types";
import { SESSION_TYPE_LABEL } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  today?: Date;
  sessions: Session[];
  isAdmin?: boolean;
};

// 3-px left border per session type (replaces pill badges)
const TYPE_BORDER_CLASS: Record<SessionType, string> = {
  breakfast_club: "border-l-[3px] border-l-amber-400",
  fracture_conference: "border-l-[3px] border-l-sky-500",
  virtuohsu: "border-l-[3px] border-l-emerald-500",
};

const TYPE_LABEL_CLASS: Record<SessionType, string> = {
  breakfast_club: "text-amber-700",
  fracture_conference: "text-sky-700",
  virtuohsu: "text-emerald-700",
};

export function UpcomingCalendar({
  today = new Date(),
  sessions,
  isAdmin = false,
}: Props) {
  const todayStart = startOfDay(today);
  const weeks = buildCalendarWeeks(today, sessions, 6)
    .map((week) => ({
      ...week,
      sessions: week.sessions.filter((s) => !isBefore(s.date, todayStart)),
    }))
    .filter((week) => week.sessions.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Calendar</CardTitle>
        <p className="text-sm text-muted-foreground">
          Next 6 weeks — Wednesday / Thursday / Friday sessions
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {weeks.map((week) => (
          <div key={week.weekStart.toISOString()} className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Week of {format(week.weekStart, "MMM d, yyyy")}
            </div>
            <div>
              {week.sessions.map(({ type, date, session }) => {
                const isToday = isSameDay(date, today);
                const isCancelled = session?.isCancelled ?? false;
                const cancelledLabel = isCancelled
                  ? session?.cancellationNote
                    ? `${session.cancellationNote} — No ${SESSION_TYPE_LABEL[type]}`
                    : `No ${SESSION_TYPE_LABEL[type]}`
                  : null;
                const topic = cancelledLabel
                  ? cancelledLabel
                  : (session?.topic ?? defaultSessionTitle(type, date));
                const webexUrl = session?.webexUrl ?? defaultWebexUrl(type);
                const papers = session?.papers ?? [];
                const hideTypeBadge =
                  isCancelled ||
                  (type === "breakfast_club" &&
                    !session?.topic &&
                    isNoBreakfastClubWeek(date));

                return (
                  <div
                    key={`${type}-${date.toISOString()}`}
                    className={cn(
                      "flex flex-col gap-2 py-2.5 pl-3 -ml-3",
                      "border-b border-border/50 last:border-0",
                      isCancelled
                        ? "border-l-[3px] border-l-border"
                        : TYPE_BORDER_CLASS[type],
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex min-w-[72px] shrink-0 items-center gap-1.5 font-mono text-sm tabular-nums text-muted-foreground">
                        {format(date, "EEE M/d")}
                        {isToday && (
                          <Badge variant="outline" className="text-[10px]">
                            Today
                          </Badge>
                        )}
                      </div>
                      {!hideTypeBadge && (
                        <span
                          className={cn(
                            "w-28 shrink-0 text-[11px] font-semibold uppercase tracking-wider",
                            TYPE_LABEL_CLASS[type],
                          )}
                        >
                          {SESSION_TYPE_LABEL[type]}
                        </span>
                      )}
                      <div className="flex-1 text-sm">
                        <span
                          className={
                            isCancelled || !session?.topic
                              ? "text-muted-foreground"
                              : "font-medium"
                          }
                        >
                          {topic}
                        </span>
                        {!isCancelled && papers.length > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            · {papers.length} paper
                            {papers.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!isCancelled && webexUrl && (
                          <a
                            href={webexUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            Webex <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {isAdmin && (
                          <ManageSessionDialog
                            type={type}
                            isoDate={format(date, "yyyy-MM-dd")}
                            session={session}
                          />
                        )}
                      </div>
                    </div>
                    {!isCancelled && papers.length > 0 && (
                      <ul className="space-y-1 pl-28 text-xs text-muted-foreground">
                        {papers.map((paper) => (
                          <li
                            key={paper.id}
                            className="flex items-start gap-2"
                          >
                            <FileText className="mt-0.5 h-3 w-3 shrink-0" />
                            <span className="flex-1">
                              {paper.title}
                              {(() => {
                                const short = formatShortCitation(
                                  paper.citation,
                                  paper.title,
                                );
                                return short ? (
                                  <span className="ml-1 italic">
                                    · {short}
                                  </span>
                                ) : null;
                              })()}
                            </span>
                            <div className="flex shrink-0 gap-2">
                              {paper.pubmedUrl && (
                                <a
                                  href={paper.pubmedUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline"
                                >
                                  PubMed
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              {paper.pdfPath && (
                                <PaperViewButton
                                  pdfPath={paper.pdfPath}
                                  label="PDF"
                                />
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
