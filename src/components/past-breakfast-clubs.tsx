"use client";

import { format, parseISO } from "date-fns";
import { ChevronRight, ExternalLink, FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ManageSessionDialog } from "@/components/manage-session-dialog";
import { PaperViewButton } from "@/components/paper-view-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatShortCitation } from "@/lib/citations";
import type { Session } from "@/lib/types";

type Props = {
  sessions: Session[];
  isAdmin?: boolean;
};

function SessionRow({
  session,
  isAdmin,
}: {
  session: Session;
  isAdmin: boolean;
}) {
  return (
    <details className="group rounded-md border [&[open]]:bg-accent/30">
      <summary className="flex cursor-pointer list-none items-baseline gap-2 p-2 text-sm hover:bg-accent/40 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-4 w-4 self-center text-muted-foreground transition-transform group-open:rotate-90" />
        <span className="flex-1 font-medium">{session.topic ?? "—"}</span>
        <span className="text-xs text-muted-foreground">
          {session.papers.length > 0 && (
            <span className="mr-2">
              {session.papers.length} paper
              {session.papers.length === 1 ? "" : "s"}
            </span>
          )}
          {format(parseISO(session.date), "MMM d, yyyy")}
        </span>
      </summary>
      <div className="space-y-2 border-t p-3 text-sm">
        {session.papers.length === 0 ? (
          <p className="text-xs text-muted-foreground">No papers on file.</p>
        ) : (
          <ul className="space-y-1">
            {session.papers.map((paper) => (
              <li
                key={paper.id}
                className="flex items-start gap-2 text-xs text-muted-foreground"
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
                      <span className="ml-1 italic">· {short}</span>
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
                      PubMed <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {paper.pdfPath && (
                    <PaperViewButton pdfPath={paper.pdfPath} label="PDF" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {isAdmin && (
          <div className="flex justify-end">
            <ManageSessionDialog
              type={session.type}
              isoDate={session.date}
              session={session}
            />
          </div>
        )}
      </div>
    </details>
  );
}

export function PastBreakfastClubs({ sessions, isAdmin = false }: Props) {
  const [query, setQuery] = useState("");

  const sortedDesc = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date)),
    [sessions],
  );

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return sortedDesc;
    return sortedDesc.filter((s) => {
      if (s.topic?.toLowerCase().includes(q)) return true;
      return s.papers.some(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.citation?.toLowerCase().includes(q) ?? false),
      );
    });
  }, [q, sortedDesc]);

  const grouped = useMemo(() => {
    const byYear = new Map<string, Session[]>();
    for (const s of filtered) {
      const year = s.date.slice(0, 4);
      const arr = byYear.get(year);
      if (arr) arr.push(s);
      else byYear.set(year, [s]);
    }
    return Array.from(byYear.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Past Breakfast Clubs</CardTitle>
          <Badge variant="outline">{sessions.length}</Badge>
        </div>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search topics or papers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 overflow-y-auto">
        {grouped.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No sessions match that search.
          </p>
        ) : (
          grouped.map(([year, yearSessions]) => (
            <details
              key={year}
              className="group rounded-md border"
              open={!!q}
            >
              <summary className="flex cursor-pointer list-none items-center gap-2 p-2 text-sm font-semibold hover:bg-accent/40 [&::-webkit-details-marker]:hidden">
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                <span className="flex-1">{year}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {yearSessions.length} session
                  {yearSessions.length === 1 ? "" : "s"}
                </span>
              </summary>
              <div className="space-y-1 border-t p-2">
                {yearSessions.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            </details>
          ))
        )}
      </CardContent>
    </Card>
  );
}
