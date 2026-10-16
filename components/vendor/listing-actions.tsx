"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toaster";
import { deleteListing, setListingActive } from "@/lib/marketplace/vendor-actions";

/** Hide / show and delete buttons on a listing row. */
export function ListingRowActions({ listingId, title, active }: { listingId: string; title: string; active: boolean }) {
  const [toggling, startToggle] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function toggle() {
    startToggle(async () => {
      const result = await setListingActive({ listingId, active: !active });
      toast(result.ok ? { tone: "success", title: result.message ?? "Updated" } : { tone: "error", title: "Couldn't update", message: result.message });
    });
  }

  function remove() {
    startDelete(async () => {
      const result = await deleteListing({ listingId });
      if (result.ok) setConfirm(false);
      toast(result.ok ? { tone: "success", title: "Listing deleted" } : { tone: "error", title: "Couldn't delete", message: result.message });
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        disabled={toggling}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-bond-slate transition-colors hover:bg-bond-slate/10 disabled:opacity-60"
      >
        {toggling ? <Spinner className="size-4" /> : active ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        {active ? "Hide" : "Show"}
        <span className="sr-only"> {title}</span>
      </button>
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
      >
        <Trash2 className="size-4" aria-hidden />
        <span className="sr-only">Delete {title}</span>
      </button>
      <Dialog
        open={confirm}
        onClose={() => !deleting && setConfirm(false)}
        title={`Delete “${title}”?`}
        description="Customers won't see it anymore. Orders that already include it keep their details."
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setConfirm(false)} disabled={deleting}>
            Keep it
          </Button>
          <Button onClick={remove} loading={deleting} loadingText="Deleting…" className="bg-red-600! hover:bg-red-700!">
            Delete
          </Button>
        </div>
      </Dialog>
    </>
  );
}
