import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="relative isolate overflow-hidden">
      <div className="relative h-64 w-full sm:h-72 md:h-80">
        <Image
          src="/mt-hood-sunrise.jpg"
          alt="Mt. Hood at sunrise over the Portland skyline"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_32%]"
        />
        {/* Lighter overlay — photo breathes */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/55" />

        {/* Top row: circular logo (left) + frosted-glass nav pill (right) */}
        <div className="absolute inset-x-0 top-0 z-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-3">
            <Link href="/" aria-label="Home">
              <span className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-1 ring-black/5 sm:h-32 sm:w-32">
                <Image
                  src="/ohsu-logo-v2.jpg"
                  alt="OHSU"
                  width={1024}
                  height={731}
                  className="h-24 w-auto sm:h-28"
                />
              </span>
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 backdrop-blur-md">
              <Link
                href="/archive"
                className="rounded-full px-3 py-1 text-sm font-medium text-white/90 transition hover:bg-white/10"
              >
                Archive
              </Link>
              <div className="h-4 w-px bg-white/20" />
              {user && (
                <>
                  <span className="hidden text-xs text-white/60 md:inline">
                    {user.email}
                  </span>
                  <div className="hidden h-4 w-px bg-white/20 md:block" />
                </>
              )}
              {user ? (
                <form action={signOut}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-xs text-white/90 hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </Button>
                </form>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full px-3 py-1 text-sm font-medium text-white/90 transition hover:bg-white/10"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto max-w-7xl px-8 pb-7">
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-white drop-shadow-md sm:text-5xl md:text-6xl">
              Trauma Didactics
            </h1>
            <p className="mt-2 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/72">
              <span className="h-px w-6 rounded-full bg-[var(--gold)]" />
              OHSU Orthopaedic Trauma
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
