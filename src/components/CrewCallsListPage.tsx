"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, ChevronRight, RefreshCw, type LucideIcon } from "lucide-react";
import { CrewBottomNav } from "@/components/CrewBottomNav";
import { CrewPhoneShell } from "@/components/CrewPhoneShell";
import { CrewTopBar } from "@/components/CrewTopBar";
import {
  applianceName,
  formatCallTime,
  pickupTypeLabel,
  sortCallsByLatest,
  statusLabel,
  type CrewCall,
} from "@/lib/crew-api";

export function CrewCallsListPage({
  actionLabel,
  emptyMessage,
  fetchCalls,
  icon: Icon,
  subtitle,
  title,
  topSubtitle,
  toHref,
}: {
  actionLabel: string;
  emptyMessage: string;
  fetchCalls: () => Promise<CrewCall[]>;
  icon: LucideIcon;
  subtitle: string;
  title: string;
  topSubtitle: string;
  toHref: (pickupRequestId: number) => string;
}) {
  const [calls, setCalls] = useState<CrewCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  const loadCalls = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const nextCalls = await fetchCalls();
      setCalls(sortCallsByLatest(nextCalls));
      setLastLoadedAt(formatLoadedTime(new Date()));
    } catch {
      setErrorMessage("목록을 불러오지 못했습니다. 백엔드 연결 상태를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCalls();
    const timer = window.setInterval(() => {
      void loadCalls();
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <CrewPhoneShell>
      <div className="relative flex min-h-0 flex-1 flex-col bg-cloud px-4 pb-0">
        <div className="shrink-0">
          <CrewTopBar backHref="/" subtitle={topSubtitle} />

          <section className="px-1 pb-1 pt-2">
            <h1 className="text-[22px] font-bold leading-tight text-ink">{title}</h1>
            <p className="mt-2 text-[13px] font-medium leading-5 text-slate-500">{subtitle}</p>
          </section>

          <section className="mt-3 flex items-center justify-between rounded-[20px] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-lgred/10 text-lgred">
                <Icon size={20} />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">현재 목록</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  {lastLoadedAt ? `마지막 확인 ${lastLoadedAt}` : "목록을 불러오는 중"}
                </p>
              </div>
            </div>

            <button
              aria-label="새로고침"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-100 disabled:opacity-60"
              disabled={loading}
              onClick={() => void loadCalls()}
              type="button"
            >
              <RefreshCw className={loading ? "animate-spin" : ""} size={17} />
            </button>
          </section>

          {errorMessage ? (
            <div className="mt-3 rounded-[18px] bg-red-50 px-4 py-4 text-sm font-semibold leading-6 text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <section className="phone-scroll mt-3 min-h-0 flex-1 overflow-y-auto pb-3">
          <div className="space-y-3">
            {calls.length > 0 ? (
              calls.map((call) => {
                const pickupRequestId = call.pickupRequest?.pickupRequestId;
                if (!pickupRequestId) return null;

                return (
                  <Link
                    key={`${title}-${call.id}`}
                    className="block rounded-[20px] bg-white p-4 shadow-sm"
                    href={toHref(pickupRequestId)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{applianceName(call)}</p>
                        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-500">
                          {call.pickupRequest?.address ?? "수거 주소 정보 없음"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-slate-600">
                        {statusLabel(call.pickupRequest?.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <InfoTile label="요청 시간" value={formatCallTime(call)} />
                      <InfoTile label="예약 방식" value={pickupTypeLabel(call.pickupRequest?.pickupType)} />
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-[16px] bg-cloud px-4 py-3 text-sm font-bold text-lgred">
                      <span className="inline-flex items-center gap-2">
                        <Bell size={15} />
                        {actionLabel}
                      </span>
                      <ChevronRight size={16} />
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-[20px] bg-white px-4 py-12 text-center text-sm font-semibold leading-6 text-slate-500 shadow-sm">
                {loading ? "목록을 불러오고 있습니다..." : emptyMessage}
              </div>
            )}
          </div>
        </section>

        <CrewBottomNav />
      </div>
    </CrewPhoneShell>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-cloud px-3 py-3">
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function formatLoadedTime(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}
