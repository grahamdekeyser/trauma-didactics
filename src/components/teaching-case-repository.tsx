import { ExternalLink, FileSpreadsheet } from "lucide-react";
import { ManageTeachingCaseDialog } from "@/components/manage-teaching-case-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TeachingCaseRepository() {
  const repoUrl = process.env.NEXT_PUBLIC_TEACHING_CASE_REPO_URL;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teaching Case Repository</CardTitle>
        <p className="text-sm text-muted-foreground">
          Saved fracture cases for teaching. Full repository (with PHI) lives
          in OneDrive.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {repoUrl ? (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-accent/40 px-3 py-2 text-sm font-medium text-primary transition hover:bg-accent"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Open Teaching_Case_Repository.xlsx
            <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
          </a>
        ) : null}
        <div className="flex justify-end">
          <ManageTeachingCaseDialog />
        </div>
      </CardContent>
    </Card>
  );
}
