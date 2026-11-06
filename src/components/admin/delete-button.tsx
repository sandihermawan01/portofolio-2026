"use client";

import * as React from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

/** Destructive action with a mandatory confirmation step, per the master
 * prompt's "confirm before delete" requirement. */
export function DeleteButton({
  itemLabel,
  onConfirm,
}: {
  itemLabel: string;
  onConfirm: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const result = await onConfirm();
      if (!result.ok) {
        toast.error(result.error ?? "Gagal menghapus.");
        return;
      }
      toast.success("Berhasil dihapus.");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={`Hapus ${itemLabel}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Hapus {itemLabel}?</DialogTitle>
        <DialogDescription>Tindakan ini tidak dapat dibatalkan.</DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Batal
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" disabled={loading} onClick={handleConfirm}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
