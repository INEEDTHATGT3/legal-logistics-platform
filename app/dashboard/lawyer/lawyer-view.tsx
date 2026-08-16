"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  IndianRupee,
  RotateCcw,
  Save,
} from "lucide-react";
import {
  LEGAL_SPECIALTIES,
  type ConsultationStatus,
  type ConsultationWithClient,
  type LawyerProfile,
} from "@/lib/types";
import {
  saveCaseNotes,
  updateConsultationStatus,
  updateHourlyRate,
  updateSpecialty,
} from "@/app/actions";
import { formatDateTime, formatINR } from "@/lib/format";

interface LawyerDashboardViewProps {
  profile: LawyerProfile | null;
  consultations: ConsultationWithClient[];
  loadError: string | null;
}

export function LawyerDashboardView({
  profile,
  consultations,
  loadError,
}: LawyerDashboardViewProps) {
  const scheduledCount = useMemo(
    () => consultations.filter((c) => c.status === "scheduled").length,
    [consultations]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Your Practice</h1>
        <p className="text-sm text-muted-foreground">
          {scheduledCount} scheduled · {consultations.length - scheduledCount} completed
        </p>
      </div>

      {loadError && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Some data could not be loaded: {loadError}
        </p>
      )}

      {!profile && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Your lawyer profile row is missing, so you will not appear in the client
          directory. Run <code>supabase/schema.sql</code> in the Supabase SQL Editor —
          it backfills a default profile for every lawyer.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Booked consultations ────────────────────────────────── */}
        <section id="schedule" className="scroll-mt-6 lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booked Consultations
              </CardTitle>
              <CardDescription>
                Close a consultation once the session is done.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consultations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                        No consultations booked yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    consultations.map((consultation) => (
                      <ConsultationRow
                        key={consultation.consultation_id}
                        consultation={consultation}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* ── Rate + specialty ────────────────────────────────────── */}
        <section id="rate" className="scroll-mt-6">
          <PracticeSettingsCard profile={profile} />
        </section>
      </div>

      {/* ── Case notes ────────────────────────────────────────────── */}
      <section id="notes" className="scroll-mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Client Case Notes
            </CardTitle>
            <CardDescription>
              Private to you — clients never see these notes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {consultations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Notes appear here once a client books you.
              </p>
            ) : (
              <Tabs defaultValue={consultations[0].consultation_id}>
                <TabsList className="mb-4 flex-wrap">
                  {consultations.map((consultation) => (
                    <TabsTrigger
                      key={consultation.consultation_id}
                      value={consultation.consultation_id}
                    >
                      {consultation.client?.name ?? "Unknown"}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {consultations.map((consultation) => (
                  <TabsContent
                    key={consultation.consultation_id}
                    value={consultation.consultation_id}
                  >
                    <CaseNotesEditor consultation={consultation} />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ── Consultation row: status toggle ───────────────────────────────────

function ConsultationRow({ consultation }: { consultation: ConsultationWithClient }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isCompleted = consultation.status === "completed";
  const nextStatus: ConsultationStatus = isCompleted ? "scheduled" : "completed";

  const handleToggle = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateConsultationStatus(
        consultation.consultation_id,
        nextStatus
      );
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {consultation.client?.name ?? "Unknown"}
        {error && (
          <span role="alert" className="mt-1 block text-xs text-destructive">
            {error}
          </span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDateTime(consultation.scheduled_at)}
      </TableCell>
      <TableCell>
        <Badge
          variant={isCompleted ? "outline" : "secondary"}
          className="flex w-fit items-center gap-1"
        >
          {isCompleted ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          {isCompleted ? "Completed" : "Scheduled"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={handleToggle} disabled={isPending}>
          {isCompleted ? (
            <>
              <RotateCcw className="h-3.5 w-3.5" />
              Reopen
            </>
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              Mark Complete
            </>
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ── Case notes editor ─────────────────────────────────────────────────

function CaseNotesEditor({ consultation }: { consultation: ConsultationWithClient }) {
  const [notes, setNotes] = useState(consultation.case_notes ?? "");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDirty = notes !== (consultation.case_notes ?? "");

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await saveCaseNotes(consultation.consultation_id, notes);
      setMessage(
        result.ok
          ? { ok: true, text: "Notes saved." }
          : { ok: false, text: result.error }
      );
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {consultation.client?.email ?? "no email"} ·{" "}
          {formatDateTime(consultation.scheduled_at)}
        </span>
        <span>{notes.trim().length} characters</span>
      </div>

      <Textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Facts, advice given, next steps, filing dates…"
        aria-label={`Case notes for ${consultation.client?.name ?? "client"}`}
      />

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={isPending || !isDirty}>
          <Save className="h-3.5 w-3.5" />
          {isPending ? "Saving…" : "Save Notes"}
        </Button>

        {message && (
          <span
            role="alert"
            className={`text-sm ${message.ok ? "text-muted-foreground" : "text-destructive"}`}
          >
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Rate + specialty settings ─────────────────────────────────────────

function PracticeSettingsCard({ profile }: { profile: LawyerProfile | null }) {
  const [rate, setRate] = useState<string>(String(profile?.hourly_rate ?? 0));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpdateRate = (formData: FormData) => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateHourlyRate(formData);
      setMessage(
        result.ok
          ? { ok: true, text: "Rate updated." }
          : { ok: false, text: result.error }
      );
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5" />
          Rate Settings
        </CardTitle>
        <CardDescription>What clients see in the directory.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="font-heading text-3xl font-bold">
          {formatINR(Number(rate) || 0)}
          <span className="ml-1 text-sm font-normal text-muted-foreground">/hr</span>
        </div>

        <form id="rate-form" action={handleUpdateRate} className="space-y-2">
          <label className="text-sm font-medium" htmlFor="rate">
            Hourly rate (₹)
          </label>
          <Input
            id="rate"
            type="number"
            name="rate"
            min={0}
            step={100}
            value={rate}
            onChange={(event) => setRate(event.target.value)}
            required
          />
        </form>

        <SpecialtyPicker profile={profile} />

        {message && (
          <p
            role="alert"
            className={`text-sm ${message.ok ? "text-muted-foreground" : "text-destructive"}`}
          >
            {message.text}
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button
          type="submit"
          form="rate-form"
          className="w-full"
          disabled={isPending || !profile}
        >
          <Save className="h-4 w-4" />
          {isPending ? "Updating…" : "Update Rate"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function SpecialtyPicker({ profile }: { profile: LawyerProfile | null }) {
  const [specialty, setSpecialty] = useState<string>(
    profile?.specialty ?? LEGAL_SPECIALTIES[LEGAL_SPECIALTIES.length - 1]
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Saved on change rather than behind a button — it is a single field
  // and the rate button below already owns the form submit.
  const handleChange = (value: string) => {
    setSpecialty(value);
    setError(null);

    const formData = new FormData();
    formData.set("specialty", value);

    startTransition(async () => {
      const result = await updateSpecialty(formData);
      if (!result.ok) setError(result.error);
    });
  };

  // A specialty the directory does not offer (seeded by hand) still needs
  // to show up in the list, or the select would look empty.
  const options = Array.from(
    new Set<string>([...LEGAL_SPECIALTIES, ...(profile ? [profile.specialty] : [])])
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Area of practice</label>
      <Select
        value={specialty}
        disabled={isPending || !profile}
        onValueChange={(value) => handleChange((value as string | null) ?? specialty)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
