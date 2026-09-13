"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ShieldCheck, Users } from "lucide-react";
import { DEMO_PERSONAS } from "@/lib/demo-data";
import type { UserRole } from "@/lib/types";

const personaCards: Array<{
  key: UserRole;
  icon: typeof Users;
  title: string;
  description: string;
}> = [
  {
    key: "client",
    icon: Users,
    title: "Client",
    description: "Book counsel and monitor document deliveries.",
  },
  {
    key: "lawyer",
    icon: BriefcaseBusiness,
    title: "Lawyer",
    description: "Track consultations, case notes, and delivery follow-ups.",
  },
  {
    key: "admin",
    icon: ShieldCheck,
    title: "Admin",
    description: "Supervise operations and keep the workflow running smoothly.",
  },
];

export function DemoLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="mb-12 max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
            NyaySetu Demo
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Legal consultation and document logistics, presented as a static demo.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            This presentation build uses seeded, browser-only data so you can switch between client,
            lawyer, and admin workflows without a backend or authentication service.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {personaCards.map(({ key, icon: Icon, title, description }) => (
            <Link
              key={key}
              href={`/dashboard/${key}`}
              className="group rounded-2xl border border-slate-700 bg-slate-900/80 p-6 transition hover:-translate-y-1 hover:border-emerald-400/60 hover:bg-slate-900"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <Icon className="h-6 w-6" />
              </div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">{title}</h2>
                <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-emerald-300" />
              </div>
              <p className="text-sm leading-6 text-slate-300">{description}</p>
              <div className="mt-6 text-sm font-medium text-emerald-300">
                {DEMO_PERSONAS[key].summary}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
