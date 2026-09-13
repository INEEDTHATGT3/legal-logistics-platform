"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Clock, Package, Search, Truck } from "lucide-react";
import {
  DELIVERY_STATUS_LABELS,
  DELIVERY_STEPS,
  type DeliveryTrackingStatus,
  type DeliveryWithClient,
} from "@/lib/types";
import { updateDeliveryStatus } from "@/lib/demo-store";
import { formatDateTime } from "@/lib/format";
import { ActivityTicker } from "@/components/demo/activity-ticker";
import { TractionStrip } from "@/components/demo/traction-strip";

interface AdminDashboardViewProps {
  deliveries: DeliveryWithClient[];
  loadError: string | null;
}

const ALL_STATUSES = "all";

const STAT_ICONS: Record<DeliveryTrackingStatus, typeof Clock> = {
  ordered: Clock,
  picked_up: Package,
  in_transit: Truck,
  delivered: CheckCircle,
};

export function AdminDashboardView({ deliveries, loadError }: AdminDashboardViewProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);

  const counts = useMemo(() => {
    const initial = Object.fromEntries(
      DELIVERY_STEPS.map((step) => [step, 0])
    ) as Record<DeliveryTrackingStatus, number>;

    return deliveries.reduce((tally, delivery) => {
      tally[delivery.tracking_status] += 1;
      return tally;
    }, initial);
  }, [deliveries]);

  const visibleDeliveries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return deliveries.filter((delivery) => {
      const matchesStatus =
        statusFilter === ALL_STATUSES || delivery.tracking_status === statusFilter;
      const matchesQuery =
        !needle ||
        delivery.document_type.toLowerCase().includes(needle) ||
        delivery.delivery_address.toLowerCase().includes(needle) ||
        (delivery.client?.name ?? "").toLowerCase().includes(needle) ||
        delivery.delivery_id.toLowerCase().startsWith(needle);
      return matchesStatus && matchesQuery;
    });
  }, [deliveries, query, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Logistics Control Panel</h1>
        <p className="text-sm text-muted-foreground">
          Every document movement on the network.
        </p>
      </div>

      {loadError && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Deliveries could not be loaded: {loadError}
        </p>
      )}

      <TractionStrip />

      {/* ── Status tallies ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {DELIVERY_STEPS.map((step) => {
          const Icon = STAT_ICONS[step];
          const isActive = statusFilter === step;

          return (
            <Card
              key={step}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              onClick={() => setStatusFilter(isActive ? ALL_STATUSES : step)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setStatusFilter(isActive ? ALL_STATUSES : step);
                }
              }}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                isActive ? "ring-2 ring-ring" : ""
              }`}
            >
              <CardContent className="flex flex-col items-center justify-center space-y-2 pt-6 text-center">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div className="font-heading text-2xl font-bold">{counts[step]}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {DELIVERY_STATUS_LABELS[step]}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Master table, with the live feed alongside it ─────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <section id="deliveries" className="scroll-mt-6 xl:col-span-2">
        <Card>
          <CardHeader className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                All Deliveries
              </CardTitle>
              <CardDescription>
                Showing {visibleDeliveries.length} of {deliveries.length}
                {statusFilter !== ALL_STATUSES &&
                  ` · filtered to ${DELIVERY_STATUS_LABELS[statusFilter as DeliveryTrackingStatus]}`}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search client, document, address or ID"
                className="h-9 w-72"
                aria-label="Search deliveries"
              />
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleDeliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                      {deliveries.length === 0
                        ? "No deliveries have been requested yet."
                        : "No deliveries match that filter."}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleDeliveries.map((delivery) => (
                    <DeliveryRow key={delivery.delivery_id} delivery={delivery} />
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

        <ActivityTicker />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DeliveryTrackingStatus }) {
  if (status === "delivered") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
      >
        Delivered
      </Badge>
    );
  }

  const variant = status === "in_transit" ? "default" : status === "picked_up" ? "secondary" : "outline";
  return <Badge variant={variant}>{DELIVERY_STATUS_LABELS[status]}</Badge>;
}

function DeliveryRow({ delivery }: { delivery: DeliveryWithClient }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Undefined once a parcel is delivered — that is the terminal stage.
  const nextStep = DELIVERY_STEPS[DELIVERY_STEPS.indexOf(delivery.tracking_status) + 1];

  const handleStatusChange = (next: DeliveryTrackingStatus) => {
    setError(null);
    startTransition(async () => {
      const result = await updateDeliveryStatus(delivery.delivery_id, next);
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">
        {delivery.delivery_id.slice(0, 8)}
      </TableCell>
      <TableCell>{delivery.client?.name ?? "Unknown"}</TableCell>
      <TableCell>{delivery.document_type}</TableCell>
      <TableCell className="max-w-[16rem] truncate text-muted-foreground" title={delivery.delivery_address}>
        {delivery.delivery_address || "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDateTime(delivery.created_at)}
      </TableCell>
      <TableCell>
        <StatusBadge status={delivery.tracking_status} />
        {error && (
          <span role="alert" className="mt-1 block text-xs text-destructive">
            {error}
          </span>
        )}
      </TableCell>
      <TableCell>
        {/* One button, one stage. A dropdown made the presenter hunt for
            the right option mid-sentence, and offered backwards moves
            the timeline rejects anyway. */}
        {nextStep ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => handleStatusChange(nextStep)}
            className="w-[150px] justify-start"
          >
            <ArrowRight className="h-4 w-4" />
            {DELIVERY_STATUS_LABELS[nextStep]}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Complete</span>
        )}
      </TableCell>
    </TableRow>
  );
}
