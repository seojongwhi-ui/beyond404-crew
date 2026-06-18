"use client";

import type { ReactNode } from "react";

export function CrewPhoneShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="flex h-[100dvh] justify-center overflow-hidden bg-[#eef2f7] px-0 py-0 md:items-center md:bg-[#0b0b0d] md:px-4 md:py-8">
      <div className="relative h-[100dvh] w-full md:h-auto md:w-auto md:rounded-[58px] md:border-[14px] md:border-[#0f0f11] md:bg-[#0f0f11] md:shadow-[0_40px_90px_rgba(0,0,0,0.55)]">
        <div className="pointer-events-none absolute left-1/2 top-[10px] z-50 hidden h-[26px] w-[112px] -translate-x-1/2 rounded-full bg-black md:block" />
        <section className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[linear-gradient(180deg,#f7f9fc_0%,#eef2f7_100%)] md:h-[min(844px,calc(100dvh-64px))] md:aspect-[390/844] md:w-auto md:rounded-[44px]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_right,rgba(182,20,75,0.08),transparent_40%),radial-gradient(circle_at_top_left,rgba(214,90,130,0.08),transparent_38%)]" />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
        </section>
      </div>
    </main>
  );
}
