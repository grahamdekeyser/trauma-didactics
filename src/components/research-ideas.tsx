"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  addResearchIdea,
  deleteResearchIdea,
  type ResearchIdeaActionState,
} from "@/app/actions/research-ideas";
import { EditResearchIdeaDialog } from "@/components/edit-research-idea-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ResearchIdea } from "@/lib/types";

type Props = {
  items: ResearchIdea[];
  isAdmin: boolean;
};

export function ResearchIdeas({ items, isAdmin }: Props) {
  const [state, action, pending] = useActionState<
    ResearchIdeaActionState,
    FormData
  >(addResearchIdea, null);
  const [role, setRole] = useState<"resident" | "faculty">("resident");
  const formRef = useRef<HTMLFormElement>(null);
  const lastHandledRef = useRef<ResearchIdeaActionState>(null);

  useEffect(() => {
    if (state && state !== lastHandledRef.current) {
      lastHandledRef.current = state;
      if (state.ok) {
        toast.success(state.message);
        formRef.current?.reset();
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research Ideas</CardTitle>
        <p className="text-sm text-muted-foreground">
          Teaching-case and research ideas that came up in didactic sessions.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form ref={formRef} action={action} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="ri-title">Title</Label>
            <Input
              id="ri-title"
              name="title"
              placeholder="e.g., DFF fixation outcomes"
              required
              disabled={pending}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ri-refs">References</Label>
            <Input
              id="ri-refs"
              name="references"
              placeholder="e.g., JBJS 2021; JOT 2019"
              disabled={pending}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ri-desc">Short description</Label>
            <Textarea
              id="ri-desc"
              name="description"
              placeholder="What's the question or teaching case?"
              rows={2}
              required
              disabled={pending}
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="ri-role">Submitted by</Label>
              <input type="hidden" name="submitterRole" value={role} />
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "resident" | "faculty")}
                disabled={pending}
              >
                <SelectTrigger id="ri-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resident">Resident</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" size="sm" disabled={pending}>
              <Plus className="h-4 w-4" /> {pending ? "Adding…" : "Add idea"}
            </Button>
          </div>
        </form>

        <ul className="space-y-2">
          {items.length === 0 && (
            <li className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              No research ideas yet.
            </li>
          )}
          {items.map((item) => (
            <li key={item.id} className="rounded-md border p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                <div className="flex items-center gap-1">
                  <Badge
                    variant={
                      item.submitterRole === "faculty" ? "default" : "secondary"
                    }
                    className="capitalize"
                  >
                    {item.submitterRole}
                  </Badge>
                  {isAdmin && (
                    <>
                      <EditResearchIdeaDialog item={item} />
                      <form action={deleteResearchIdea}>
                        <input type="hidden" name="id" value={item.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          aria-label="Delete idea"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
              {item.references && (
                <p className="mt-1 text-xs italic text-muted-foreground">
                  {item.references}
                </p>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
