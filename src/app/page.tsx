"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ClipboardList, Home, Truck } from "lucide-react";
import { CrewBottomNav } from "@/components/CrewBottomNav";
import { CrewPhoneShell } from "@/components/CrewPhoneShell";
import {
  fetchActiveCrewCalls,
  fetchCompletedCrewCalls,
  fetchPendingCrewCalls,
  type CrewCall,
} from "@/lib/crew-api";

export default function CrewHomePage() {
  const [pendingCalls, setPendingCalls] = useState<CrewCall[]>([]);
  const [activeCalls, setActiveCalls] = useState<CrewCall[]>([]);
  const [completedCalls, setCompletedCalls] = useState<CrewCall[]>([]);
  const [dispatchEnabled, setDispatchEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSummary = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [pending, active, completed] = await Promise.all([
        fetchPendingCrewCalls(),
        fetchActiveCrewCalls(),
        fetchCompletedCrewCalls(),
      ]);

      setPendingCalls(pending);
      setActiveCalls(active);
      setCompletedCalls(completed);
    } catch {
      setErrorMessage("수거 현황을 불러오지 못했습니다. 백엔드 연결 상태를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  useEffect(() => {
    if (!dispatchEnabled) {
      return undefined;
    }

    void loadSummary();
    const timer = window.setInterval(() => {
      void loadSummary();
    }, 5000);

    return () => window.clearInterval(timer);
  }, [dispatchEnabled]);

  const crewName = useMemo(() => resolveCrewName([...activeCalls, ...pendingCalls, ...completedCalls]), [activeCalls, completedCalls, pendingCalls]);
  const totalCalls = pendingCalls.length + activeCalls.length + completedCalls.length;

  const toggleDispatch = () => {
    setDispatchEnabled((enabled) => {
      const next = !enabled;
      if (next) {
        void loadSummary();
      }
      return next;
    });
  };

  return (
    <CrewPhoneShell>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-28 pt-4 phone-scroll">
        <header className="grid grid-cols-[40px_1fr_64px] items-center">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-white"
            type="button"
            aria-label="이전"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-[13px] font-extrabold leading-none text-lgred">LG ThinQ</p>
            <p className="mt-1 text-[12px] font-semibold text-slate-600">Crew Home</p>
          </div>
          <button className="text-right text-[12px] font-bold text-slate-600" type="button">
            로그아웃
          </button>
        </header>

        <section className="mt-7">
          <p className="text-[15px] font-bold text-slate-600">{crewName}님, 반가워요</p>
          <h1 className="mt-2 text-[22px] font-extrabold leading-snug text-ink">오늘 수거 현황을 한눈에 확인해보세요</h1>
        </section>

        <section className="mt-5 rounded-[22px] bg-white px-5 py-5 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-bold text-slate-500">오늘 배차 상태</p>
              <p className="mt-1 text-[28px] font-extrabold leading-none text-ink">{dispatchEnabled ? "수신 중" : "수신 중지"}</p>
              <p className="mt-3 text-[12px] font-medium text-slate-500">
                {dispatchEnabled ? "새 수거 요청을 받을 수 있어요" : "요청 수신을 잠시 멈춘 상태예요"}
              </p>
            </div>
            <button
              aria-pressed={dispatchEnabled}
              className={`flex h-9 w-[82px] items-center rounded-full px-1 transition ${
                dispatchEnabled ? "justify-end bg-lgred/10" : "justify-start bg-slate-100"
              }`}
              onClick={toggleDispatch}
              type="button"
            >
              <span
                className={`flex h-7 min-w-10 items-center justify-center rounded-full px-2 text-[11px] font-extrabold shadow-sm ${
                  dispatchEnabled ? "bg-lgred text-white" : "bg-white text-slate-500"
                }`}
              >
                {dispatchEnabled ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          <div className="mt-5 h-px bg-slate-100" />

          <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100">
            <StatusStat label="수거 요청" value={`${pendingCalls.length}건`} />
            <StatusStat label="진행 중" value={`${activeCalls.length}건`} />
            <StatusStat label="수거 완료" value={`${completedCalls.length}건`} />
          </div>
        </section>

        <section className="mt-4 rounded-[22px] bg-white py-3 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between px-4 py-2">
            <h2 className="text-[16px] font-extrabold text-ink">내 작업</h2>
            <span className="rounded-full bg-cloud px-3 py-1 text-[12px] font-bold text-slate-500">전체 {totalCalls}</span>
          </div>
          <WorkRow
            count={pendingCalls.length}
            href="/calls"
            icon={<ClipboardList size={20} />}
            label="수거 요청"
            sublabel="수락 대기"
          />
          <WorkRow
            count={activeCalls.length}
            href="/active"
            icon={<Truck size={20} />}
            label="진행 중인 수거"
            sublabel="이동 및 처리"
          />
          <WorkRow
            count={completedCalls.length}
            href="/completed"
            icon={<CheckCircle2 size={20} />}
            label="처리 완료"
            sublabel="완료 이력"
          />
        </section>

        {errorMessage ? (
          <div className="mt-4 rounded-[18px] bg-red-50 px-4 py-4 text-sm font-semibold leading-6 text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-4 rounded-[18px] bg-white px-4 py-4 text-sm font-semibold leading-6 text-slate-500 shadow-sm">
            현황을 불러오는 중입니다...
          </div>
        ) : null}
      </div>
      <CrewBottomNav />
    </CrewPhoneShell>
  );
}

function StatusStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 first:pl-0 last:pr-0">
      <p className="text-center text-[22px] font-extrabold leading-none text-ink">{value}</p>
      <p className="mt-2 text-center text-[12px] font-medium text-slate-500">{label}</p>
    </div>
  );
}

function WorkRow({
  count,
  href,
  icon,
  label,
  sublabel,
}: {
  count: number;
  href: string;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
}) {
  return (
    <Link
      className="mx-3 flex items-center gap-4 border-t border-slate-100 px-1 py-4 transition first:border-t-0 hover:bg-slate-50"
      href={href}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-lgred/10 text-lgred">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-extrabold text-ink">{label}</p>
        <p className="mt-1 text-[12px] font-medium text-slate-500">{sublabel}</p>
      </div>
      <span className="rounded-full bg-cloud px-3 py-1 text-[12px] font-bold text-slate-600">{count}건</span>
    </Link>
  );
}

function resolveCrewName(calls: CrewCall[]) {
  for (const call of calls) {
    const name = call.crewProfile?.name ?? call.pickupRequest?.crewName;
    if (name?.trim()) {
      return name.trim();
    }
  }

  return "크루";
}
