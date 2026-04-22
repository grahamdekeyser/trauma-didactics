"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  addTeachingCase,
  type TeachingCaseActionState,
} from "@/app/actions/teaching-cases";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FRACTURE_TYPES } from "@/lib/types";

export function ManageTeachingCaseDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <Plus className="h-3 w-3" /> Add a case
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a teaching case</DialogTitle>
          <DialogDescription>
            This adds a new row to the OneDrive repository. Do not enter PHI
            here — add patient name and MRN directly in the Excel file.
          </DialogDescription>
        </DialogHeader>
        <TeachingCaseForm onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function TeachingCaseForm({ onSaved }: { onSaved: () => void }) {
  const [state, action, pending] = useActionState<
    TeachingCaseActionState,
    FormData
  >(addTeachingCase, null);
  const [fractureType, setFractureType] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);
  const lastHandledRef = useRef<TeachingCaseActionState>(null);

  useEffect(() => {
    if (state && state !== lastHandledRef.current) {
      lastHandledRef.current = state;
      if (state.ok) {
        toast.success(state.message);
        formRef.current?.reset();
        setFractureType("");
        onSaved();
      } else {
        toast.error(state.message);
      }
    }
  }, [state, onSaved]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="fractureType" value={fractureType} />
      <div className="space-y-1">
        <Label htmlFor="tc-fracture-type">Fracture type</Label>
        <Select
          value={fractureType}
          onValueChange={setFractureType}
          disabled={pending}
        >
          <SelectTrigger id="tc-fracture-type">
            <SelectValue placeholder="Pick a fracture type" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {FRACTURE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="tc-notes">Notes</Label>
        <Textarea
          id="tc-notes"
          name="notes"
          placeholder="Short teaching point — e.g., 'LC3 with oblique distractor for reduction'"
          rows={3}
          required
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">
          No patient identifiers. Add name and MRN in the Excel file.
        </p>
      </div>
      <Button type="submit" size="sm" disabled={pending || !fractureType}>
        {pending ? "Adding…" : "Add case"}
      </Button>
    </form>
  );
}
