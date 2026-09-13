"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ShieldCheck, Users } from "lucide-react";
import { DEMO_PERSONAS, DEMO_TRACTION } from "@/lib/demo-data";
import type { UserRole } from "@/lib/types";
import { DemoTour, DemoTourReopen } from "@/components/demo/demo-tour";

const personaCards: Array<{
  key: UserRole;
  icon: typeof Users;
  title: string;
}> = [
  { key: "client", icon: Users, title: "Client" },
  { key: "lawyer", icon: BriefcaseBusiness, title: "Lawyer" },
  { key: "admin", icon: ShieldCheck, title: "Admin" },
];

export function DemoLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="mb-10 max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
            NyaySetu — Interactive Prototype
          </p>

          <h1 className="font-heading text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Legal advice went digital. The paperwork never did.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            NyaySetu puts the consultation and the courier on one rail. A client
            books an advocate, then sends the affidavit through the same account
            — and watches it move. One relationship instead of two vendors.
          </p>
        </div>

        {/* The numbers, before the click-through. */}
        <div className="mb-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-800 bg-slate-800 lg:grid-cols-4">
          {DEMO_TRACTION.map((metric) => (
            <div key={metric.label} className="bg-slate-950 p-5">
              <p className="font-heading text-2xl font-bold tabular-nums text-white md:text-3xl">
                {metric.value}
              </p>
              <p className="mt-1 text-xs leading-snug text-slate-400">{metric.label}</p>
            </div>
          ))}
        </div>

        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
          Pick a seat
        </p>

        <div className="grid gap-5 md:grid-cols-3">
          {personaCards.map(({ key, icon: Icon, title }) => (
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
              <p className="text-sm leading-6 text-slate-300">
                {DEMO_PERSONAS[key].summary}
              </p>
              <p className="mt-4 text-sm font-medium text-emerald-300">
                {DEMO_PERSONAS[key].label}
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-slate-500">
          Interactive prototype. Every name, address, case note and figure on
          this site is synthetic and illustrative — no real clients, no real
          couriers, no real legal advice. Nothing you do here leaves your
          browser, and there is no sign-in.
        </p>
      </div>

      <DemoTour />
      <DemoTourReopen />
    </main>
  );
}
