"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  deleteResource,
  upsertResource,
  type ResourceActionState,
} from "@/app/actions/resources";
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
import type { ResourceLink } from "@/lib/types";

type Props = {
  resource?: ResourceLink;
  nextOrder?: number;
  trigger?: "icon" | "add";
};

export function ManageResourceDialog({
  resource,
  nextOrder = 0,
  trigger = "icon",
}: Props) {
  const [open, setOpen] = useState(false);
  const editing = !!resource;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger === "add" ? (
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Plus className="h-3 w-3" /> Add link
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Edit resource"
            className="h-7 w-7"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit resource link" : "Add resource link"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the resource details."
              : "Add a link to the sidebar."}
          </DialogDescription>
        </DialogHeader>
        <ResourceForm
          resource={resource}
          nextOrder={nextOrder}
          onSaved={() => setOpen(false)}
        />
        {editing && (
          <DialogFooter className="justify-between sm:justify-between">
            <form
              action={async (formData) => {
                if (!confirm("Delete this link?")) return;
                await deleteResource(formData);
                toast.success("Resource deleted.");
                setOpen(false);
              }}
            >
              <input type="hidden" name="id" value={resource.id} />
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

function ResourceForm({
  resource,
  nextOrder,
  onSaved,
}: {
  resource?: ResourceLink;
  nextOrder: number;
  onSaved: () => void;
}) {
  const [state, action, pending] = useActionState<
    ResourceActionState,
    FormData
  >(upsertResource, null);
  const lastHandledRef = useRef<ResourceActionState>(null);

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
      {resource && <input type="hidden" name="id" value={resource.id} />}
      <div className="space-y-1">
        <Label htmlFor="resource-label">Label</Label>
        <Input
          id="resource-label"
          name="label"
          defaultValue={resource?.label ?? ""}
          placeholder="e.g., OTA Online"
          disabled={pending}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="resource-url">URL</Label>
        <Input
          id="resource-url"
          name="url"
          type="url"
          defaultValue={resource?.url ?? ""}
          placeholder="https://…"
          disabled={pending}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="resource-order">Sort order</Label>
        <Input
          id="resource-order"
          name="sortOrder"
          type="number"
          defaultValue={resource?.order ?? nextOrder}
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">
          Lower numbers sort first.
        </p>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : resource ? "Save changes" : "Add link"}
      </Button>
    </form>
  );
}
