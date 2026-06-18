"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, ClipboardList, House, Truck } from "lucide-react";

const navItems = [
  {
    href: "/",
    icon: House,
    label: "홈",
    match: (pathname: string) => pathname === "/",
  },
  {
    href: "/calls",
    icon: ClipboardList,
    label: "요청",
    match: (pathname: string) => pathname === "/calls" || /^\/calls\/\d+$/.test(pathname),
  },
  {
    href: "/active",
    icon: Truck,
    label: "진행",
    match: (pathname: string) => pathname === "/active" || pathname.endsWith("/active"),
  },
  {
    href: "/completed",
    icon: CheckCircle2,
    label: "완료",
    match: (pathname: string) => pathname === "/completed",
  },
] as const;

export function CrewBottomNav() {
  const pathname = usePathname();

  return (
    <div className="shrink-0 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 md:px-5 md:pb-5">
      <nav className="mx-auto grid w-full max-w-[392px] grid-cols-4 rounded-[26px] border border-white/80 bg-white/95 px-3 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.10)] backdrop-blur">
        {navItems.map((item) => (
          <NavItem key={item.href} active={item.match(pathname)} href={item.href} icon={item.icon} label={item.label} />
        ))}
      </nav>
    </div>
  );
}

function NavItem({
  active,
  href,
  icon: Icon,
  label,
}: {
  active: boolean;
  href: string;
  icon: typeof House;
  label: string;
}) {
  return (
    <Link
      className={`mx-auto flex min-w-[70px] flex-col items-center gap-1 rounded-[14px] px-3 py-2 text-[11px] font-bold transition ${
        active ? "bg-lgred/10 text-lgred" : "text-slate-400"
      }`}
      href={href}
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}
