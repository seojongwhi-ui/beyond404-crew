"use client";

import { ArrowLeft, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

type CrewTopBarProps = {
  subtitle: string;
  backHref?: string | null;
  onRightClick?: () => void;
};

export function CrewTopBar({
  backHref = null,
  onRightClick,
}: CrewTopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    if (backHref) {
      router.push(backHref);
      return;
    }

    router.push("/");
  };

  const openProfile = () => {
    onRightClick?.();
    router.push("/profile");
  };

  return (
    <header className="relative mb-3 flex items-center justify-between">
      <button
        aria-label="이전 화면으로 돌아가기"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink"
        onClick={handleBack}
        type="button"
      >
        <ArrowLeft size={18} />
      </button>

      <button
        aria-label="내정보 열기"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
        onClick={openProfile}
        type="button"
      >
        <UserRound size={17} strokeWidth={2.2} />
      </button>
    </header>
  );
}
