import { format, parseISO } from "date-fns";
import { ExternalLink } from "lucide-react";
import { ManageWebinarDialog } from "@/components/manage-webinar-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Webinar } from "@/lib/types";

type Props = {
  webinars: Webinar[];
  isAdmin?: boolean;
};

export function UpcomingWebinars({ webinars, isAdmin = false }: Props) {
  const sorted = [...webinars].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Upcoming Webinars</CardTitle>
          {isAdmin && <ManageWebinarDialog trigger="add" />}
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No webinars scheduled.
          </p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((w) => (
              <li key={w.id} className="rounded-md border p-2.5 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={w.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-1 items-start justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium">{w.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(w.date), "MMM d, yyyy")}
                        {w.source && ` · ${w.source}`}
                      </p>
                    </div>
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </a>
                  {isAdmin && <ManageWebinarDialog webinar={w} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
