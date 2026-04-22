"use client";

import { Pencil } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  updateWishListItem,
  type WishListActionState,
} from "@/app/actions/wish-list";
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
import type { WishListWithVotes } from "@/lib/data";

export function EditWishListDialog({ item }: { item: WishListWithVotes }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Edit topic"
          className="h-8 w-8 p-0"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit topic</DialogTitle>
          <DialogDescription>
            Update the topic or submitter name.
          </DialogDescription>
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
  item: WishListWithVotes;
  onSaved: () => void;
}) {
  const [state, action, pending] = useActionState<WishListActionState, FormData>(
    updateWishListItem,
    null,
  );
  const lastHandledRef = useRef<WishListActionState>(null);

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
        <Label htmlFor="wl-edit-name">Submitter name</Label>
        <Input
          id="wl-edit-name"
          name="submitterName"
          defaultValue={item.submitterName}
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="wl-edit-topic">Topic</Label>
        <Input
          id="wl-edit-topic"
          name="topic"
          defaultValue={item.topic}
          required
          disabled={pending}
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
