"use client";

import { useMemo, useState, useTransition } from "react";
import { useRole } from "@/components/dashboard/role-context";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle, Clock, IndianRupee, MapPin, Package, Search } from "lucide-react";
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_STEPS,
  DOCUMENT_TYPES,
  type ConsultationWithLawyer,
  type Delivery,
  type LawyerWithUser,
} from "@/lib/types";
import { bookConsultation, requestDelivery } from "@/lib/demo-store";
import { formatDateTime, formatINR, getInitials } from "@/lib/format";

interface ClientDashboardViewProps {
  lawyers: LawyerWithUser[];
  consultations: ConsultationWithLawyer[];
  deliveries: Delivery[];
  loadError: string | null;
}

const ALL_SPECIALTIES = "all";

export function ClientDashboardView({
  lawyers,
  consultations,
  deliveries,
  loadError,
}: ClientDashboardViewProps) {
  const { currentUser } = useRole();
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState<string>(ALL_SPECIALTIES);

  const firstName = currentUser.name.split(" ")[0];

  const specialties = useMemo(
    () => Array.from(new Set(lawyers.map((l) => l.specialty))).sort(),
    [lawyers]
  );

  const visibleLawyers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return lawyers.filter((lawyer) => {
      const matchesSpecialty =
        specialty === ALL_SPECIALTIES || lawyer.specialty === specialty;
      const matchesQuery =
        !needle ||
        (lawyer.user?.name ?? "").toLowerCase().includes(needle) ||
        lawyer.specialty.toLowerCase().includes(needle);
      return matchesSpecialty && matchesQuery;
    });
  }, [lawyers, query, specialty]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Book counsel and track your document logistics in one place.
        </p>
      </div>

      {loadError && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          Some data could not be loaded: {loadError}
        </p>
      )}

      {/* ── Lawyer directory ───────────────────────────────────────── */}
      <section id="directory" className="scroll-mt-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold">Lawyer Directory</h2>
            <p className="text-sm text-muted-foreground">
              {visibleLawyers.length} of {lawyers.length} advocates
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name or specialty"
                className="h-9 w-56"
                aria-label="Search lawyers"
              />
            </div>

            <Select
              value={specialty}
              onValueChange={(value) => setSpecialty((value as string | null) ?? ALL_SPECIALTIES)}
            >
              <SelectTrigger size="sm" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SPECIALTIES}>All specialties</SelectItem>
                {specialties.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {visibleLawyers.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {lawyers.length === 0
                ? "No advocates have registered yet."
                : "No advocates match that search."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleLawyers.map((lawyer) => (
              <LawyerCard key={lawyer.lawyer_id} lawyer={lawyer} />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── My consultations ────────────────────────────────────── */}
        <section id="consultations" className="scroll-mt-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>My Consultations</CardTitle>
              <CardDescription>
                {consultations.filter((c) => c.status === "scheduled").length} upcoming
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consultations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No consultations booked yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lawyer</TableHead>
                      <TableHead>Slot</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultations.map((consultation) => (
                      <TableRow key={consultation.consultation_id}>
                        <TableCell className="font-medium">
                          {consultation.lawyer?.name ?? "Unknown"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(consultation.scheduled_at)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              consultation.status === "completed" ? "outline" : "secondary"
                            }
                            className="flex w-fit items-center gap-1"
                          >
                            {consultation.status === "completed" ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {consultation.status === "completed" ? "Completed" : "Scheduled"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ── Delivery request ────────────────────────────────────── */}
        <section id="delivery-request" className="scroll-mt-6">
          <DeliveryRequestCard />
        </section>
      </div>

      {/* ── Live tracking ─────────────────────────────────────────── */}
      <section id="tracking" className="scroll-mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Live Delivery Tracking</CardTitle>
            <CardDescription>
              {deliveries.filter((d) => d.tracking_status !== "delivered").length} in
              progress · {deliveries.length} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deliveries requested yet.</p>
            ) : (
              <div className="space-y-4">
                {deliveries.map((delivery) => (
                  <DeliveryTracker key={delivery.delivery_id} delivery={delivery} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ── Lawyer card + booking dialog ──────────────────────────────────────

function LawyerCard({ lawyer }: { lawyer: LawyerWithUser }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const name = lawyer.user?.name ?? "Unknown Lawyer";

  const handleBook = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await bookConsultation(formData);
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{name}</CardTitle>
            <CardDescription>
              <Badge variant="secondary" className="mt-1">
                {lawyer.specialty}
              </Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <IndianRupee className="h-4 w-4" />
          <span>{formatINR(lawyer.hourly_rate)} / hour</span>
        </div>
      </CardContent>

      <CardFooter>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="w-full" />}>
            Book Consultation
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book {name}</DialogTitle>
              <DialogDescription>
                {lawyer.specialty} · {formatINR(lawyer.hourly_rate)} per hour. Pick a
                slot and we will hold it as scheduled.
              </DialogDescription>
            </DialogHeader>

            <form action={handleBook} className="space-y-4">
              <input type="hidden" name="lawyerId" value={lawyer.lawyer_id} />

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor={`slot-${lawyer.lawyer_id}`}>
                  Date and time
                </label>
                <Input
                  id={`slot-${lawyer.lawyer_id}`}
                  name="scheduledAt"
                  type="datetime-local"
                  required
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <DialogFooter showCloseButton>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Booking…" : "Confirm Booking"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

// ── Delivery request form ─────────────────────────────────────────────

function DeliveryRequestCard() {
  // `null`, not "", so Base UI treats the field as unselected and shows
  // the placeholder.
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setMessage(null);
    startTransition(async () => {
      const result = await requestDelivery(formData);
      if (result.ok) {
        setMessage({ ok: true, text: "Delivery requested. Track it below." });
        setDocumentType(null);
      } else {
        setMessage({ ok: false, text: result.error });
      }
    });
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Request Delivery</CardTitle>
        <CardDescription>Schedule a physical document pickup and drop.</CardDescription>
      </CardHeader>

      <CardContent>
        <form id="delivery-form" action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Document type</label>
            <Select
              name="documentType"
              value={documentType}
              onValueChange={(value) => setDocumentType(value as string | null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="address">
              Delivery address
            </label>
            <Input
              id="address"
              name="address"
              placeholder="Flat, street, city, PIN"
              required
            />
          </div>

          {message && (
            <p
              role="alert"
              className={
                message.ok
                  ? "text-sm text-muted-foreground"
                  : "text-sm text-destructive"
              }
            >
              {message.text}
            </p>
          )}
        </form>
      </CardContent>

      <CardFooter>
        <Button
          type="submit"
          form="delivery-form"
          className="w-full"
          disabled={isPending || !documentType}
        >
          {isPending ? "Submitting…" : "Submit Request"}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ── Tracking stepper ──────────────────────────────────────────────────

function DeliveryTracker({ delivery }: { delivery: Delivery }) {
  const currentIndex = DELIVERY_STEPS.indexOf(delivery.tracking_status);
  const lastIndex = DELIVERY_STEPS.length - 1;

  // Dots sit at the centre of equal-width columns, i.e. at 12.5%, 37.5%,
  // 62.5% and 87.5%. The rail is inset to match so the fill lines up.
  const railInset = `${100 / (DELIVERY_STEPS.length * 2)}%`;
  const progress = `${(currentIndex / lastIndex) * 100}%`;

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <span className="flex items-center gap-2 font-medium">
            <Package className="h-4 w-4" />
            {delivery.document_type}
          </span>
          {delivery.delivery_address && (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {delivery.delivery_address}
            </span>
          )}
        </div>
        <Badge variant="outline" className="font-mono text-xs">
          {delivery.delivery_id.slice(0, 8)}
        </Badge>
      </div>

      <div className="relative mt-6 flex items-center justify-between">
        <div
          className="absolute top-3 h-1 -translate-y-1/2 rounded-full bg-muted"
          style={{ left: railInset, right: railInset }}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: progress }}
          />
        </div>

        {DELIVERY_STEPS.map((step, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={step}
              className="relative z-10 flex w-1/4 flex-col items-center gap-2"
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted bg-background text-muted-foreground"
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <CheckCircle className="h-4 w-4" />
                ) : isCurrent && step !== "delivered" ? (
                  <Clock className="h-3 w-3 animate-pulse" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-current" />
                )}
              </div>
              <span
                className={`text-center text-xs font-medium ${
                  isCompleted ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {DELIVERY_STATUS_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
