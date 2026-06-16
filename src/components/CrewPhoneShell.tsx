"use client";

import type { ReactNode } from "react";

export function CrewPhoneShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="flex h-[100dvh] overflow-hidden justify-center bg-[#eef2f7] px-0 py-0 md:px-4 md:py-8">
      <section className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#f7f9fc_0%,#eef2f7_100%)] md:h-[874px] md:w-[min(100%,424px)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_right,rgba(182,20,75,0.08),transparent_40%),radial-gradient(circle_at_top_left,rgba(214,90,130,0.08),transparent_38%)]" />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
      </section>
    </main>
  );
}
