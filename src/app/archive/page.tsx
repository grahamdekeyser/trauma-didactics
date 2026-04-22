import { PastBreakfastClubs } from "@/components/past-breakfast-clubs";
import { SiteHeader } from "@/components/site-header";
import { fetchPastBreakfastClubs, isCurrentUserAdmin } from "@/lib/data";

export default async function ArchivePage() {
  const [sessions, admin] = await Promise.all([
    fetchPastBreakfastClubs(),
    isCurrentUserAdmin(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Past Breakfast Clubs
          </h1>
          <p className="text-sm text-muted-foreground">
            Searchable archive of previous Wednesday journal club sessions.
          </p>
        </div>
        <PastBreakfastClubs sessions={sessions} isAdmin={admin} />
      </main>
    </div>
  );
}
