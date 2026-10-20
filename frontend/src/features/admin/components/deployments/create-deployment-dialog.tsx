"use client";

import { useState } from "react";
import { toast } from "sonner";

import { trpc } from "@/_trpc/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Status = "draft" | "live" | "closed";

const empty = {
  name: "",
  description: "",
  country: "",
  region: "",
  status: "draft" as Status,
  startsAt: "",
  endsAt: "",
  incidentTypeIds: [] as string[],
};

// A date input's "YYYY-MM-DD" as RFC 3339 (midnight UTC), or nothing.
const toRfc3339 = (date: string) =>
  date ? new Date(`${date}T00:00:00Z`).toISOString() : undefined;

interface CreateDeploymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

// Creating a deployment: its name and description, its theme (the incident
// types it tracks, at least one), its area, its status and optional dates.
// Go makes the slug from the name and checks the rest again.
export function CreateDeploymentDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateDeploymentDialogProps) {
  const [form, setForm] = useState(empty);
  const set = <K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // The platform's active incident types, as the public report form lists them.
  const { data: typesData, isLoading: typesLoading } =
    trpc.anonymousReports.getAllIncidentTypes.useQuery();
  const incidentTypes = typesData?.data ?? [];

  const createDeployment = trpc.createDeployment.useMutation({
    onSuccess: () => {
      toast.success("Deployment created");
      setForm(empty);
      onCreated();
    },
    onError: (error) => toast.error(error.message || "Failed to create deployment"),
  });

  const toggleType = (id: string, checked: boolean) =>
    set(
      "incidentTypeIds",
      checked
        ? [...form.incidentTypeIds, id]
        : form.incidentTypeIds.filter((t) => t !== id)
    );

  const datesInOrder =
    !form.startsAt || !form.endsAt || form.endsAt >= form.startsAt;
  const canSubmit =
    form.name.trim() !== "" &&
    form.incidentTypeIds.length > 0 &&
    datesInOrder &&
    !createDeployment.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    createDeployment.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      country: form.country.trim() || undefined,
      region: form.region.trim() || undefined,
      status: form.status,
      startsAt: toRfc3339(form.startsAt),
      endsAt: toRfc3339(form.endsAt),
      incidentTypeIds: form.incidentTypeIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-title">New deployment</DialogTitle>
          <DialogDescription>
            A map of your own, gathering the reports people send through its
            reporting link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="deployment-name">Name</Label>
            <Input
              id="deployment-name"
              placeholder="e.g. Uganda 2026 elections"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deployment-description">Description</Label>
            <Textarea
              id="deployment-description"
              placeholder="What this deployment tracks, and why"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Theme</legend>
            <p className="text-sm text-muted-foreground">
              The incident types this deployment tracks. Choose at least one.
            </p>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
              {typesLoading ? (
                <p className="p-2 text-sm text-muted-foreground">Loading…</p>
              ) : incidentTypes.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">
                  No incident types yet.
                </p>
              ) : (
                incidentTypes.map((type) => (
                  <label
                    key={type.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted"
                  >
                    <Checkbox
                      checked={form.incidentTypeIds.includes(type.id)}
                      onCheckedChange={(checked) =>
                        toggleType(type.id, checked === true)
                      }
                    />
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="text-sm">{type.name}</span>
                  </label>
                ))
              )}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deployment-country">Country</Label>
              <Input
                id="deployment-country"
                placeholder="e.g. Uganda"
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                In English, as reports name it.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deployment-region">Region</Label>
              <Input
                id="deployment-region"
                placeholder="Optional, e.g. Northern Region"
                value={form.region}
                onChange={(e) => set("region", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as Status)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deployment-starts">Starts</Label>
              <Input
                id="deployment-starts"
                type="date"
                value={form.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deployment-ends">Ends</Label>
              <Input
                id="deployment-ends"
                type="date"
                min={form.startsAt || undefined}
                value={form.endsAt}
                onChange={(e) => set("endsAt", e.target.value)}
              />
            </div>
          </div>
          {!datesInOrder && (
            <p className="text-sm text-destructive">
              The end date can&apos;t be before the start date.
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {createDeployment.isPending ? "Creating…" : "Create deployment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
