"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  loginAction,
  signupAction,
  type AuthFormState,
} from "@/lib/auth/actions";

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "signup";
  next?: string;
}) {
  const isSignup = mode === "signup";
  const action = isSignup ? signupAction : loginAction;
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {isSignup ? (
        <Field label="Full name" htmlFor="name" required>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Alex Morgan"
            required
          />
        </Field>
      ) : null}

      <Field label="Email" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
        />
      </Field>

      <Field label="Password" htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder="••••••••"
          required
        />
      </Field>

      {state?.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight aria-hidden className="h-4 w-4" />
        )}
        {pending
          ? "Please wait…"
          : isSignup
            ? "Create account"
            : "Sign in"}
      </Button>
    </form>
  );
}
