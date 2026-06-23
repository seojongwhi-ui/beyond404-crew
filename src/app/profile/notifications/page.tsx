"use client";

import { CrewPhoneShell } from "@/components/CrewPhoneShell";
import { ArrowLeft, Bell, CheckCircle2, MessageSquareText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const NOTIFICATION_SETTINGS_KEY = "swapit-crew-notification-settings";

export default function CrewNotificationsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    requests: true,
    progress: true,
    reviews: true,
  });
  const [settingsHydrated, setSettingsHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved) as Partial<typeof settings>;
      setSettings((current) => ({
        requests: typeof parsed.requests === "boolean" ? parsed.requests : current.requests,
        progress: typeof parsed.progress === "boolean" ? parsed.progress : current.progress,
        reviews: typeof parsed.reviews === "boolean" ? parsed.reviews : current.reviews,
      }));
    } catch {
      window.localStorage.removeItem(NOTIFICATION_SETTINGS_KEY);
    } finally {
      setSettingsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!settingsHydrated) return;
    window.localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, settingsHydrated]);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <CrewPhoneShell>
      <div className="flex min-h-0 flex-1 flex-col bg-cloud px-4 pb-6">
        <header className="relative mb-3 flex items-center justify-between">
          <button
            aria-label="내정보로 돌아가기"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink"
            onClick={() => router.push("/profile")}
            type="button"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-xs font-semibold leading-none text-lgred">LG Crew</p>
            <p className="mt-1 text-[11px] font-semibold leading-none text-slate-500">Notifications</p>
          </div>
          <span className="h-9 w-9" aria-hidden />
        </header>

        <section className="phone-scroll min-h-0 flex-1 overflow-y-auto pb-4 pt-3">
          <p className="text-[12px] font-bold text-lgred">ALERT</p>
          <h1 className="mt-1 text-[24px] font-bold leading-tight text-ink">알림 설정</h1>
          <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-500">
            새 수거 요청과 진행 상태 알림을 받을 항목을 확인할 수 있어요.
          </p>

          <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm">
            <SettingRow
              active={settings.requests}
              icon={<Bell size={18} />}
              title="새 수거 요청"
              description="수신 중 상태일 때 새 요청 알림을 받습니다."
              onClick={() => toggleSetting("requests")}
            />
            <SettingRow
              active={settings.progress}
              icon={<CheckCircle2 size={18} />}
              title="진행 상태 변경"
              description="수거 완료, 허브 이동, 처리 완료 상태를 안내합니다."
              onClick={() => toggleSetting("progress")}
            />
            <SettingRow
              active={settings.reviews}
              icon={<MessageSquareText size={18} />}
              title="고객 리뷰"
              description="고객이 남긴 별점과 리뷰를 내정보에서 확인합니다."
              onClick={() => toggleSetting("reviews")}
            />
          </section>
        </section>
      </div>
    </CrewPhoneShell>
  );
}

function SettingRow({
  active,
  description,
  icon,
  onClick,
  title,
}: {
  active: boolean;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      aria-pressed={active}
      className="flex w-full items-center gap-3 border-b border-slate-100 py-3 text-left transition last:border-b-0 active:scale-[0.99]"
      onClick={onClick}
      type="button"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-cloud text-lgred">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold text-ink">{title}</p>
        <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">{description}</p>
      </div>
      <span
        className={`min-w-[46px] rounded-full px-3 py-1 text-center text-[11px] font-black transition ${
          active ? "bg-lgred text-white" : "bg-slate-200 text-slate-500"
        }`}
      >
        {active ? "ON" : "OFF"}
      </span>
    </button>
  );
}
