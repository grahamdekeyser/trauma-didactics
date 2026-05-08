"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestOtp,
  verifyOtp,
  type RequestOtpState,
  type VerifyOtpState,
} from "./actions";

type Props = {
  next: string;
  initialError?: string;
};

export function LoginForm({ next, initialError }: Props) {
  const [requestState, requestAction, requesting] = useActionState<
    RequestOtpState,
    FormData
  >(requestOtp, null);
  const [verifyState, verifyAction, verifying] = useActionState<
    VerifyOtpState,
    FormData
  >(verifyOtp, null);

  const codeStep = requestState?.ok === true;

  if (!codeStep) {
    return (
      <form action={requestAction} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@ohsu.edu"
            required
            autoComplete="email"
            disabled={requesting}
          />
        </div>
        <Button type="submit" className="w-full" disabled={requesting}>
          {requesting ? "Sending code…" : "Send verification code"}
        </Button>
        {initialError && !requestState && (
          <p className="text-sm text-destructive">{initialError}</p>
        )}
        {requestState && !requestState.ok && (
          <p className="text-sm text-destructive">{requestState.message}</p>
        )}
      </form>
    );
  }

  const email = requestState.email;

  return (
    <form action={verifyAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="email" value={email} />
      <p className="text-sm text-muted-foreground">
        We sent a 6-digit code to <span className="font-medium">{email}</span>.
        Enter it below to sign in.
      </p>
      <div className="space-y-1">
        <Label htmlFor="token">Verification code</Label>
        <Input
          id="token"
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="123456"
          required
          disabled={verifying}
        />
      </div>
      <Button type="submit" className="w-full" disabled={verifying}>
        {verifying ? "Verifying…" : "Verify and sign in"}
      </Button>
      {verifyState && !verifyState.ok && (
        <p className="text-sm text-destructive">{verifyState.message}</p>
      )}
      <p className="text-center text-sm text-muted-foreground">
        Wrong email?{" "}
        <button
          type="button"
          className="underline underline-offset-2 hover:text-foreground"
          onClick={() => window.location.reload()}
        >
          Start over
        </button>
      </p>
    </form>
  );
}
