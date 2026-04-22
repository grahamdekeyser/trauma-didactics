"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  deleteWebinar,
  upsertWebinar,
  type WebinarActionState,
} from "@/app/actions/webinars";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Webinar } from "@/lib/types";

type Props = {
  webinar?: Webinar;
  trigger?: "icon" | "add";
};

export function ManageWebinarDialog({ webinar, trigger = "icon" }: Props) {
  const [open, setOpen] = useState(false);
  const editing = !!webinar;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger === "add" ? (
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Plus className="h-3 w-3" /> Add webinar
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Edit webinar"
            className="h-7 w-7"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit webinar" : "Add webinar"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the webinar details."
              : "Add an upcoming webinar to the sidebar."}
          </DialogDescription>
        </DialogHeader>
        <WebinarForm
          webinar={webinar}
          onSaved={() => setOpen(false)}
        />
        {editing && (
          <DialogFooter className="justify-between sm:justify-between">
            <form
              action={async (formData) => {
                if (!confirm("Delete this webinar?")) return;
                await deleteWebinar(formData);
                toast.success("Webinar deleted.");
                setOpen(false);
              }}
            >
              <input type="hidden" name="id" value={webinar.id} />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
            </form>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function WebinarForm({
  webinar,
  onSaved,
}: {
  webinar?: Webinar;
  onSaved: () => void;
}) {
  const [state, action, pending] = useActionState<
    WebinarActionState,
    FormData
  >(upsertWebinar, null);
  const lastHandledRef = useRef<WebinarActionState>(null);

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
      {webinar && <input type="hidden" name="id" value={webinar.id} />}
      <div className="space-y-1">
        <Label htmlFor="webinar-title">Title</Label>
        <Input
          id="webinar-title"
          name="title"
          defaultValue={webinar?.title ?? ""}
          placeholder="e.g., AO Principles of Fracture Management"
          disabled={pending}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="webinar-date">Date</Label>
          <Input
            id="webinar-date"
            name="date"
            type="date"
            defaultValue={webinar?.date ?? ""}
            disabled={pending}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="webinar-source">Source (optional)</Label>
          <Input
            id="webinar-source"
            name="source"
            defaultValue={webinar?.source ?? ""}
            placeholder="e.g., AO, OTA"
            disabled={pending}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="webinar-url">URL</Label>
        <Input
          id="webinar-url"
          name="url"
          type="url"
          defaultValue={webinar?.url ?? ""}
          placeholder="https://…"
          disabled={pending}
          required
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : webinar ? "Save changes" : "Add webinar"}
      </Button>
    </form>
  );
}
