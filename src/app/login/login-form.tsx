"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type LoginState } from "./actions";

type Props = {
  next: string;
  initialError?: string;
};

export function LoginForm({ next, initialError }: Props) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    signIn,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@ohsu.edu"
          required
          autoComplete="email"
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Site password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          disabled={pending}
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      {initialError && !state && (
        <p className="text-sm text-destructive">{initialError}</p>
      )}
      {state && !state.ok && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
    </form>
  );
}
