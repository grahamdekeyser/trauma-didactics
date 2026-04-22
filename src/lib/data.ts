import { todayIsoDateInAppTimezone } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type {
  Paper,
  ResearchIdea,
  ResourceLink,
  Session,
  SessionType,
  Webinar,
  WishListItem,
} from "@/lib/types";

type PaperRow = {
  id: string;
  session_id: string;
  title: string;
  citation: string | null;
  pubmed_url: string | null;
  pdf_path: string | null;
  needs_cleanup: boolean;
};

type SessionRow = {
  id: string;
  type: SessionType;
  date: string;
  topic: string | null;
  webex_url: string | null;
  is_cancelled: boolean;
  cancellation_note: string | null;
  papers: PaperRow[];
};

function toPaper(row: PaperRow): Paper {
  return {
    id: row.id,
    sessionId: row.session_id,
    title: row.title,
    citation: row.citation,
    pubmedUrl: row.pubmed_url,
    pdfPath: row.pdf_path,
    needsCleanup: row.needs_cleanup,
  };
}

function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    type: row.type,
    date: row.date,
    topic: row.topic,
    webexUrl: row.webex_url,
    isCancelled: row.is_cancelled ?? false,
    cancellationNote: row.cancellation_note,
    papers: (row.papers ?? []).map(toPaper),
  };
}

function today(): string {
  return todayIsoDateInAppTimezone();
}

export async function fetchUpcomingSessions(): Promise<Session[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*, papers(*)")
    .gte("date", today())
    .order("date", { ascending: true });
  if (error) throw error;
  return (data as unknown as SessionRow[]).map(toSession);
}

export async function fetchPastBreakfastClubs(): Promise<Session[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*, papers(*)")
    .eq("type", "breakfast_club")
    .lt("date", today())
    .order("date", { ascending: false });
  if (error) throw error;
  return (data as unknown as SessionRow[]).map(toSession);
}

export type WishListWithVotes = WishListItem & {
  voted: boolean;
};

export async function fetchWishList(): Promise<WishListWithVotes[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [itemsRes, votesRes] = await Promise.all([
    supabase
      .from("wish_list")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("wish_list_votes").select("wish_list_id, user_id"),
  ]);

  if (itemsRes.error) throw itemsRes.error;
  if (votesRes.error) throw votesRes.error;

  const voteCount = new Map<string, number>();
  const userVotedIds = new Set<string>();
  for (const v of votesRes.data) {
    voteCount.set(v.wish_list_id, (voteCount.get(v.wish_list_id) ?? 0) + 1);
    if (user && v.user_id === user.id) userVotedIds.add(v.wish_list_id);
  }

  return itemsRes.data.map((item) => ({
    id: item.id,
    topic: item.topic,
    submitterName: item.submitter_name,
    votes: voteCount.get(item.id) ?? 0,
    createdAt: item.created_at,
    voted: userVotedIds.has(item.id),
  }));
}

export async function fetchResearchIdeas(): Promise<ResearchIdea[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("research_ideas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    references: row.references,
    description: row.description,
    submitterRole: row.submitter_role,
    createdAt: row.created_at,
  }));
}

export async function fetchWebinars(): Promise<Webinar[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("webinars")
    .select("*")
    .gte("date", today())
    .order("date", { ascending: true });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    date: row.date,
    url: row.url,
    source: row.source,
  }));
}

export async function fetchResources(): Promise<ResourceLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    label: row.label,
    url: row.url,
    order: row.sort_order,
  }));
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return false;
  const { data } = await supabase
    .from("admins")
    .select("email")
    .eq("email", user.email)
    .maybeSingle();
  return !!data;
}
