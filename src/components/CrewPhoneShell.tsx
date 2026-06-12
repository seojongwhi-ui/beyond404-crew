"use client";

import { useEffect, useState, type ReactNode } from "react";

export function CrewPhoneShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#202124] px-3 py-8">
      <section className="relative w-[min(100%,424px)] rounded-[52px] border-[8px] border-[#090a0f] bg-[#090a0f] p-[3px] shadow-phone">
        <div className="aspect-[402/874] overflow-hidden rounded-[43px] bg-white">
          <div className="flex h-full flex-col">
            <PhoneStatusBar />
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

function PhoneStatusBar() {
  const [currentTime, setCurrentTime] = useState(() =>
    new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date()),
  );

  useEffect(() => {
    const update = () =>
      setCurrentTime(
        new Intl.DateTimeFormat("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date()),
      );

    update();
    const timer = window.setInterval(update, 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex h-[62px] shrink-0 items-start justify-between px-8 pt-4 text-[14px] font-black text-black">
      <span>{currentTime}</span>
      <div className="flex items-center gap-1.5">
        <span className="flex items-end gap-0.5">
          <span className="h-2 w-1 rounded-sm bg-black" />
          <span className="h-3 w-1 rounded-sm bg-black" />
          <span className="h-4 w-1 rounded-sm bg-black" />
        </span>
        <span className="h-3 w-4 rounded-t-full border-2 border-b-0 border-black" />
        <span className="relative h-4 w-7 rounded-md bg-slate-200">
          <span className="absolute left-0 top-0 h-full w-2 rounded-l-md bg-[#ffd52e]" />
          <span className="absolute right-1 top-1 text-[10px] leading-none">20</span>
        </span>
      </div>
    </div>
  );
}
