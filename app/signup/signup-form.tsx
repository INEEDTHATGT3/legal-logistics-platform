"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signUp } from "@/app/auth/actions";
import { LEGAL_SPECIALTIES } from "@/lib/types";

type SignupRole = "client" | "lawyer";

export function SignupForm() {
  const [role, setRole] = useState<SignupRole>("client");
  const [specialty, setSpecialty] = useState<string>(LEGAL_SPECIALTIES[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await signUp(formData);
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <form action={handleSubmit} className="flex flex-col space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="name">
          Full name
        </label>
        <Input id="name" name="name" autoComplete="name" placeholder="Aarav Sharma" required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
        <p className="text-xs text-muted-foreground">At least 6 characters.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">I am a</label>
        <Select
          name="role"
          value={role}
          onValueChange={(value) => setRole((value as SignupRole | null) ?? "client")}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Client seeking legal help</SelectItem>
            <SelectItem value="lawyer">Practising advocate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lawyers seed their directory listing at sign-up. */}
      {role === "lawyer" && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Area of practice</label>
            <Select
              name="specialty"
              value={specialty}
              onValueChange={(value) =>
                setSpecialty((value as string | null) ?? LEGAL_SPECIALTIES[0])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEGAL_SPECIALTIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="hourly_rate">
              Hourly rate (₹)
            </label>
            <Input
              id="hourly_rate"
              name="hourly_rate"
              type="number"
              min={0}
              step={100}
              defaultValue={1500}
              required
            />
          </div>
        </>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-2 text-center text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button type="submit" className="mt-4 w-full" disabled={isPending}>
        {isPending ? "Creating account…" : "Create Account"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Admin access is granted directly in the database, not at sign-up.
      </p>
    </form>
  );
}
