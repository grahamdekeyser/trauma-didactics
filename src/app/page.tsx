import { PastBreakfastClubs } from "@/components/past-breakfast-clubs";
import { ResearchIdeas } from "@/components/research-ideas";
import { ResourceLinks } from "@/components/resource-links";
import { SiteHeader } from "@/components/site-header";
import { TeachingCaseRepository } from "@/components/teaching-case-repository";
import { TopicWishList } from "@/components/topic-wish-list";
import { UpcomingCalendar } from "@/components/upcoming-calendar";
import { UpcomingWebinars } from "@/components/upcoming-webinars";
import {
  fetchPastBreakfastClubs,
  fetchResearchIdeas,
  fetchResources,
  fetchUpcomingSessions,
  fetchWebinars,
  fetchWishList,
  isCurrentUserAdmin,
} from "@/lib/data";

export default async function Home() {
  const [
    upcomingSessions,
    pastSessions,
    wishList,
    researchIdeas,
    webinars,
    resources,
    admin,
  ] = await Promise.all([
    fetchUpcomingSessions(),
    fetchPastBreakfastClubs(),
    fetchWishList(),
    fetchResearchIdeas(),
    fetchWebinars(),
    fetchResources(),
    isCurrentUserAdmin(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <UpcomingCalendar sessions={upcomingSessions} isAdmin={admin} />
            <TopicWishList items={wishList} isAdmin={admin} />
          </div>
          <div className="space-y-6">
            <PastBreakfastClubs sessions={pastSessions} isAdmin={admin} />
            <TeachingCaseRepository />
            <ResearchIdeas items={researchIdeas} isAdmin={admin} />
            <ResourceLinks resources={resources} isAdmin={admin} />
            <UpcomingWebinars webinars={webinars} isAdmin={admin} />
          </div>
        </div>
      </main>
      <footer className="border-t bg-background py-5 text-center shadow-[0_-1px_8px_oklch(0_0_0/0.05)]">
        <p className="font-serif text-xs tracking-[0.08em] text-muted-foreground [font-variant:small-caps]">
          OHSU Orthopaedic Trauma Didactics
          <span className="mx-2 opacity-40">·</span>
          Access restricted to @ohsu.edu and @uoregon.edu
        </p>
      </footer>
    </div>
  );
}
