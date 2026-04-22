"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  addWishListItem,
  deleteWishListItem,
  toggleWishListVote,
  type WishListActionState,
} from "@/app/actions/wish-list";
import { EditWishListDialog } from "@/components/edit-wish-list-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WishListWithVotes } from "@/lib/data";
import { cn } from "@/lib/utils";

type Props = {
  items: WishListWithVotes[];
  isAdmin: boolean;
};

export function TopicWishList({ items, isAdmin }: Props) {
  const [state, action, pending] = useActionState<WishListActionState, FormData>(
    addWishListItem,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const lastHandledRef = useRef<WishListActionState>(null);

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

  const sorted = [...items].sort((a, b) => b.votes - a.votes);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Topic Wish List</CardTitle>
        <p className="text-sm text-muted-foreground">
          Suggest a future Breakfast Club topic. Upvote others you want to see.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form ref={formRef} action={action} className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="wl-name">Your name</Label>
              <Input
                id="wl-name"
                name="submitterName"
                placeholder="e.g., J. Doe, PGY-3"
                required
                disabled={pending}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="wl-topic">Topic</Label>
              <Input
                id="wl-topic"
                name="topic"
                placeholder="e.g., Bicondylar tibial plateau"
                required
                disabled={pending}
              />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            <Plus className="h-4 w-4" /> {pending ? "Adding…" : "Add topic"}
          </Button>
        </form>

        <ul className="space-y-2">
          {sorted.length === 0 && (
            <li className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              No topics yet — be the first to suggest one.
            </li>
          )}
          {sorted.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              <form action={toggleWishListVote}>
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  aria-label={item.voted ? "Remove vote" : "Upvote"}
                  className={cn(
                    "inline-flex items-center gap-1 border-b border-transparent pb-px text-sm font-semibold tabular-nums transition-colors",
                    item.voted
                      ? "text-primary border-primary"
                      : "text-muted-foreground hover:text-primary hover:border-primary",
                  )}
                >
                  ↑ {item.votes}
                </button>
              </form>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.topic}</p>
                <p className="text-xs text-muted-foreground">
                  {item.submitterName}
                </p>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-0.5">
                  <EditWishListDialog item={item} />
                  <form action={deleteWishListItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      aria-label="Delete topic"
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
