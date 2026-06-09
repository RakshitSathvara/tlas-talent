"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/features/auth/actions";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/auth/credentials";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: LoginState = { error: null };

// SSO is deferred; this build authenticates email + password against the mock accounts.
export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-10 flex items-baseline gap-2">
        <span className="font-serif text-[28px] text-ink">Atlas</span>
        <span className="smallcaps text-[11px] text-accent">talent</span>
      </div>

      <div className="smallcaps mb-3 text-[11px] text-ink-soft">Sign in</div>
      <h1 className="mb-3 font-serif text-[32px] font-normal leading-tight text-ink">
        Welcome back to the hiring desk.
      </h1>
      <p className="mb-8 text-[14px] text-ink-soft">
        Sign in with your work email. The screens you see depend on your role.
      </p>

      <form action={formAction} className="space-y-3">
        <label className="block">
          <span className="smallcaps mb-2 block text-[10px] text-ink-softer">Email</span>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@tmsystems.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="smallcaps mb-2 block text-[10px] text-ink-softer">Password</span>
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {state.error && (
          <p className="text-[12.5px] text-accent" role="alert">
            {state.error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full py-3" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {/* Demo accounts — click to fill, then sign in. Password is shared for the prototype. */}
      <div className="mt-10 rounded-xl border border-line bg-surface p-4">
        <div className="smallcaps mb-3 text-[10px] text-ink-softer">
          Demo accounts · password {DEMO_PASSWORD}
        </div>
        <ul className="space-y-1">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <button
                type="button"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(DEMO_PASSWORD);
                }}
                className="flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-black/[0.03]"
              >
                <span className="text-[12.5px] text-ink">{a.label}</span>
                <span className="smallcaps text-[10px] text-accent">{a.role}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
