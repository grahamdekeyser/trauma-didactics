"use client";

import { format, parseISO } from "date-fns";
import {
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  addPaper,
  deletePaper,
  deleteSession,
  fetchPubmedMetadata,
  updatePaper,
  upsertSession,
  type SessionActionState,
} from "@/app/actions/sessions";
import { PaperViewButton } from "@/components/paper-view-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { defaultWebexUrl } from "@/lib/dates";
import type { Paper, Session, SessionType } from "@/lib/types";
import { SESSION_TYPE_LABEL } from "@/lib/types";

type Props = {
  type: SessionType;
  isoDate: string;
  session: Session | null;
};

export function ManageSessionDialog({ type, isoDate, session }: Props) {
  const [open, setOpen] = useState(false);
  const displayDate = parseISO(isoDate);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <Pencil className="h-3 w-3" /> Manage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {SESSION_TYPE_LABEL[type]} · {format(displayDate, "EEE MMM d, yyyy")}
          </DialogTitle>
        </DialogHeader>

        <SessionForm
          type={type}
          isoDate={isoDate}
          session={session}
          onSaved={() => {
            if (!session) setOpen(false);
          }}
        />

        {session && (
          <PapersSection
            sessionId={session.id}
            papers={session.papers}
          />
        )}

        {!session && (
          <p className="text-xs text-muted-foreground">
            Save the session first to attach papers.
          </p>
        )}

        <DialogFooter className="justify-between sm:justify-between">
          {session ? (
            <form
              action={async (formData) => {
                if (
                  !confirm(
                    "Delete this session and all attached papers? This cannot be undone.",
                  )
                ) {
                  return;
                }
                await deleteSession(formData);
                setOpen(false);
              }}
            >
              <input type="hidden" name="id" value={session.id} />
              <Button type="submit" variant="ghost" size="sm">
                <Trash2 className="h-4 w-4" /> Delete session
              </Button>
            </form>
          ) : (
            <span />
          )}
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SessionForm({
  type,
  isoDate,
  session,
  onSaved,
}: {
  type: SessionType;
  isoDate: string;
  session: Session | null;
  onSaved: () => void;
}) {
  const [state, action, pending] = useActionState<
    SessionActionState,
    FormData
  >(upsertSession, null);
  const lastHandledRef = useRef<SessionActionState>(null);

  useEffect(() => {
    if (state && state !== lastHandledRef.current) {
      lastHandledRef.current = state;
      if (state.ok) {
        toast.success(state.message);
        onSaved();
      } else {
        toast.error(state.message);
      }
    }
  }, [state, onSaved]);

  const initialWebex = session?.webexUrl ?? defaultWebexUrl(type) ?? "";
  const [cancelled, setCancelled] = useState(session?.isCancelled ?? false);

  return (
    <form action={action} className="space-y-3">
      {session && <input type="hidden" name="id" value={session.id} />}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="date" value={isoDate} />
      <input
        type="hidden"
        name="isCancelled"
        value={cancelled ? "1" : "0"}
      />
      <div className="space-y-1">
        <Label htmlFor="session-topic">Topic</Label>
        <Input
          id="session-topic"
          name="topic"
          defaultValue={session?.topic ?? ""}
          placeholder="e.g., Bicondylar tibial plateau"
          disabled={pending || cancelled}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="session-webex">Webex URL</Label>
        <Input
          id="session-webex"
          name="webexUrl"
          type="url"
          defaultValue={initialWebex}
          placeholder="https://ohsu.webex.com/…"
          disabled={pending || cancelled}
        />
      </div>
      <div className="rounded-md border border-dashed p-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={cancelled}
            onChange={(e) => setCancelled(e.target.checked)}
            disabled={pending}
            className="h-4 w-4"
          />
          Cancel this {SESSION_TYPE_LABEL[type].toLowerCase()}
        </label>
        {cancelled && (
          <div className="mt-2 space-y-1">
            <Label htmlFor="session-cancel-note">Reason (optional)</Label>
            <Input
              id="session-cancel-note"
              name="cancellationNote"
              defaultValue={session?.cancellationNote ?? ""}
              placeholder="e.g., Resident graduation, holiday"
              disabled={pending}
            />
          </div>
        )}
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending
          ? "Saving…"
          : session
            ? "Save changes"
            : "Create session"}
      </Button>
    </form>
  );
}

function PapersSection({
  sessionId,
  papers,
}: {
  sessionId: string;
  papers: Paper[];
}) {
  return (
    <div className="space-y-3 border-t pt-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Papers</h3>
        <span className="text-xs text-muted-foreground">
          {papers.length} attached
        </span>
      </div>

      <ul className="space-y-2">
        {papers.length === 0 && (
          <li className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
            No papers attached yet.
          </li>
        )}
        {papers.map((paper) => (
          <PaperRow key={paper.id} paper={paper} />
        ))}
      </ul>

      <AddPaperForm sessionId={sessionId} />
    </div>
  );
}

function PaperRow({ paper }: { paper: Paper }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-md border p-3">
        <EditPaperForm paper={paper} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="flex items-start gap-2 rounded-md border p-3 text-sm">
      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 space-y-0.5">
        <p className="font-medium">{paper.title}</p>
        {paper.citation && (
          <p className="text-xs italic text-muted-foreground">
            {paper.citation}
          </p>
        )}
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs">
          {paper.pubmedUrl && (
            <a
              href={paper.pubmedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              PubMed <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {paper.pdfPath && <PaperViewButton pdfPath={paper.pdfPath} />}
          {paper.needsCleanup && (
            <span className="text-amber-700">Needs review</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          aria-label="Edit paper"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <form action={deletePaper}>
          <input type="hidden" name="id" value={paper.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            aria-label="Delete paper"
            onClick={(e) => {
              if (!confirm("Delete this paper? This cannot be undone.")) {
                e.preventDefault();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </li>
  );
}

function EditPaperForm({
  paper,
  onDone,
}: {
  paper: Paper;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const [pmid, setPmid] = useState(extractPmidFromUrl(paper.pubmedUrl));
  const [title, setTitle] = useState(paper.title);
  const [citation, setCitation] = useState(paper.citation ?? "");
  const [pubmedUrl, setPubmedUrl] = useState(paper.pubmedUrl ?? "");
  const [removePdf, setRemovePdf] = useState(false);

  function handleAction(formData: FormData) {
    startTransition(async () => {
      const result = await updatePaper(null, formData);
      if (result?.ok) {
        toast.success(result.message);
        onDone();
      } else if (result) {
        toast.error(result.message);
      }
    });
  }

  const hasExistingPdf = !!paper.pdfPath;

  return (
    <form action={handleAction} className="space-y-2">
      <input type="hidden" name="id" value={paper.id} />
      {removePdf && <input type="hidden" name="removePdf" value="1" />}
      <PmidLookupRow
        idPrefix={`ed-${paper.id}`}
        pmid={pmid}
        onPmidChange={setPmid}
        onFilled={(r) => {
          setTitle(r.title);
          setCitation(r.citation);
          setPubmedUrl(r.pubmedUrl);
        }}
        disabled={pending}
      />
      <div className="space-y-1">
        <Label htmlFor={`title-${paper.id}`}>Title</Label>
        <Input
          id={`title-${paper.id}`}
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`cite-${paper.id}`}>Citation</Label>
        <Textarea
          id={`cite-${paper.id}`}
          name="citation"
          value={citation}
          onChange={(e) => setCitation(e.target.value)}
          rows={2}
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`pm-${paper.id}`}>PubMed URL</Label>
        <Input
          id={`pm-${paper.id}`}
          name="pubmedUrl"
          type="url"
          value={pubmedUrl}
          onChange={(e) => setPubmedUrl(e.target.value)}
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`pdf-${paper.id}`}>
          {hasExistingPdf ? "Replace PDF" : "Upload PDF"}
        </Label>
        <Input
          id={`pdf-${paper.id}`}
          name="pdf"
          type="file"
          accept="application/pdf"
          disabled={pending || removePdf}
        />
        {hasExistingPdf && (
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
            <span>PDF currently attached.</span>
            {removePdf ? (
              <button
                type="button"
                onClick={() => setRemovePdf(false)}
                className="text-primary hover:underline"
              >
                Keep existing PDF
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setRemovePdf(true)}
                className="text-destructive hover:underline"
              >
                Remove PDF
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDone}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function AddPaperForm({ sessionId }: { sessionId: string }) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [pmid, setPmid] = useState("");
  const [title, setTitle] = useState("");
  const [citation, setCitation] = useState("");
  const [pubmedUrl, setPubmedUrl] = useState("");

  function handleAction(formData: FormData) {
    startTransition(async () => {
      const result = await addPaper(null, formData);
      if (result?.ok) {
        toast.success(result.message);
        formRef.current?.reset();
        setPmid("");
        setTitle("");
        setCitation("");
        setPubmedUrl("");
      } else if (result) {
        toast.error(result.message);
      }
    });
  }

  function applyLookup(result: {
    title: string;
    citation: string;
    pubmedUrl: string;
  }) {
    setTitle(result.title);
    setCitation(result.citation);
    setPubmedUrl(result.pubmedUrl);
  }

  return (
    <form
      ref={formRef}
      action={handleAction}
      className="space-y-2 rounded-md border border-dashed p-3"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Add paper
      </p>
      <input type="hidden" name="sessionId" value={sessionId} />
      <PmidLookupRow
        idPrefix="np"
        pmid={pmid}
        onPmidChange={setPmid}
        onFilled={applyLookup}
        disabled={pending}
      />
      <div className="space-y-1">
        <Label htmlFor="np-title">Title</Label>
        <Input
          id="np-title"
          name="title"
          placeholder="Paper title"
          required
          disabled={pending}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="np-cite">Citation</Label>
        <Textarea
          id="np-cite"
          name="citation"
          placeholder="Author(s). Title. Journal. Year;Vol:Pages."
          rows={2}
          disabled={pending}
          value={citation}
          onChange={(e) => setCitation(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="np-pm">PubMed URL</Label>
        <Input
          id="np-pm"
          name="pubmedUrl"
          type="url"
          placeholder="https://pubmed.ncbi.nlm.nih.gov/…"
          disabled={pending}
          value={pubmedUrl}
          onChange={(e) => setPubmedUrl(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="np-pdf">PDF (optional)</Label>
        <Input
          id="np-pdf"
          name="pdf"
          type="file"
          accept="application/pdf"
          disabled={pending}
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        <Plus className="h-4 w-4" /> {pending ? "Adding…" : "Add paper"}
      </Button>
    </form>
  );
}

function extractPmidFromUrl(url: string | null): string {
  if (!url) return "";
  const m = url.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/i);
  return m ? m[1] : "";
}

function PmidLookupRow({
  idPrefix,
  pmid,
  onPmidChange,
  onFilled,
  disabled,
}: {
  idPrefix: string;
  pmid: string;
  onPmidChange: (v: string) => void;
  onFilled: (r: { title: string; citation: string; pubmedUrl: string }) => void;
  disabled?: boolean;
}) {
  const [lookupPending, startLookup] = useTransition();

  function handleLookup() {
    const value = pmid.trim();
    if (!value) {
      toast.error("Enter a PMID first.");
      return;
    }
    startLookup(async () => {
      const res = await fetchPubmedMetadata(value);
      if (res.ok) {
        onFilled({
          title: res.title,
          citation: res.citation,
          pubmedUrl: res.pubmedUrl,
        });
        toast.success("Filled from PubMed.");
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={`${idPrefix}-pmid`}>PMID (optional)</Label>
      <div className="flex gap-2">
        <Input
          id={`${idPrefix}-pmid`}
          inputMode="numeric"
          placeholder="e.g., 33156077"
          value={pmid}
          onChange={(e) => onPmidChange(e.target.value)}
          disabled={disabled || lookupPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleLookup();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLookup}
          disabled={disabled || lookupPending || !pmid.trim()}
        >
          {lookupPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Look up
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Fills Title, Citation, and PubMed URL from PubMed.
      </p>
    </div>
  );
}
