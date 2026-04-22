import { ExternalLink } from "lucide-react";
import { ManageResourceDialog } from "@/components/manage-resource-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResourceLink } from "@/lib/types";

type Props = {
  resources: ResourceLink[];
  isAdmin?: boolean;
};

export function ResourceLinks({ resources, isAdmin = false }: Props) {
  const sorted = [...resources].sort((a, b) => a.order - b.order);
  const nextOrder = sorted.length
    ? Math.max(...sorted.map((r) => r.order)) + 1
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Resource Links</CardTitle>
          {isAdmin && (
            <ManageResourceDialog trigger="add" nextOrder={nextOrder} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No resources yet.</p>
        ) : (
          <ul className="space-y-1">
            {sorted.map((r) => (
              <li key={r.id} className="flex items-center gap-1">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-1 items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <span>{r.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </a>
                {isAdmin && <ManageResourceDialog resource={r} />}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
