"use client";

import { Pencil } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  updateResearchIdea,
  type ResearchIdeaActionState,
} from "@/app/actions/research-ideas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

export function EditResearchIdeaDialog({ item }: { item: ResearchIdea }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Edit research idea"
          className="h-8 w-8 p-0"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit research idea</DialogTitle>
          <DialogDescription>Update the idea details.</DialogDescription>
        </DialogHeader>
        <EditForm item={item} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  item,
  onSaved,
}: {
  item: ResearchIdea;
  onSaved: () => void;
}) {
  const [state, action, pending] = useActionState<
    ResearchIdeaActionState,
    FormData
  >(updateResearchIdea, null);
  const [role, setRole] = useState<"resident" | "faculty">(item.submitterRole);
  const lastHandledRef = useRef<ResearchIdeaActionState>(null);

  useEffect(() => {
    if (state && state !== lastHandledRef.current) {
      lastHandledRef.current = state;
      if (state.ok) {
        toast.success(state.message);
        onSaved();
      } else {
        toast.error(state.message);
      }
    }
  }, [state, onSaved]);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={item.id} />
      <div className="space-y-1">
        <Label htmlFor="ri-edit-title">Title</Label>
        <Input
          id="ri-edit-title"
          name="title"
          defaultValue={item.title}
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ri-edit-refs">References</Label>
        <Input
          id="ri-edit-refs"
          name="references"
          defaultValue={item.references}
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ri-edit-desc">Short description</Label>
        <Textarea
          id="ri-edit-desc"
          name="description"
          defaultValue={item.description}
          rows={2}
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ri-edit-role">Submitted by</Label>
        <input type="hidden" name="submitterRole" value={role} />
        <Select
          value={role}
          onValueChange={(v) => setRole(v as "resident" | "faculty")}
          disabled={pending}
        >
          <SelectTrigger id="ri-edit-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="resident">Resident</SelectItem>
            <SelectItem value="faculty">Faculty</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
