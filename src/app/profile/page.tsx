"use client";

import { CrewPhoneShell } from "@/components/CrewPhoneShell";
import { fetchCompletedCrewCalls, type CrewCall } from "@/lib/crew-api";
import {
  ArrowLeft,
  Bell,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  LogOut,
  MessageSquareText,
  Settings,
  Star,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type CrewProfileSummary = {
  name: string;
  rating: number;
  totalCompleted: number;
  totalEarnings: number;
  todayCompleted: number;
  reviews: string[];
};

export default function CrewProfilePage() {
  const router = useRouter();
  const [completedCalls, setCompletedCalls] = useState<CrewCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const calls = await fetchCompletedCrewCalls();
        if (!cancelled) {
          setCompletedCalls(calls);
        }
      } catch {
        if (!cancelled) {
          setErrorMessage("내정보를 불러오지 못했어요.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => buildProfileSummary(completedCalls), [completedCalls]);

  return (
    <CrewPhoneShell>
      <div className="flex min-h-0 flex-1 flex-col bg-cloud px-4 pb-0">
        <header className="relative mb-3 flex items-center justify-between">
          <button
            aria-label="이전 화면으로 돌아가기"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-xs font-semibold leading-none text-lgred">LG ThinQ</p>
            <p className="mt-1 text-[11px] font-semibold leading-none text-slate-500">My Info</p>
          </div>

          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm">
            <UserRound size={17} strokeWidth={2.2} />
          </span>
        </header>

        <section className="px-1 pb-1 pt-2">
          <p className="text-[12px] font-bold text-lgred">MY INFO</p>
          <h1 className="mt-1 text-[24px] font-bold leading-tight text-ink">내정보</h1>
          <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-500">
            완료한 수거 실적과 정산 금액, 리뷰를 확인할 수 있어요.
          </p>
        </section>

        <section className="phone-scroll min-h-0 flex-1 overflow-y-auto pb-6 pt-3">
          {errorMessage ? (
            <div className="mb-3 rounded-[18px] bg-red-50 px-4 py-3 text-[13px] font-semibold leading-5 text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <section className="rounded-[24px] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-lgred/10 text-lgred">
                <UserRound size={24} />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-[20px] font-bold leading-tight text-ink">{summary.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-[13px] font-bold text-amber-600">
                  <Star className="fill-current" size={14} />
                  {summary.rating.toFixed(1)}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-3 rounded-[24px] border border-lgred/15 bg-lgred/5 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-white text-lgred shadow-sm">
                <WalletCards size={20} />
              </span>
              <div>
                <p className="text-[12px] font-bold text-slate-500">누적 처리 실적</p>
                <p className="mt-1 text-[20px] font-bold leading-tight text-ink">총 {summary.totalCompleted}건 완료</p>
              </div>
            </div>
            <p className="mt-4 text-[30px] font-bold leading-none text-lgred">{formatWon(summary.totalEarnings)}</p>
            <p className="mt-2 text-[12px] font-semibold text-slate-500">처리 완료된 건의 정산 금액만 합산했어요.</p>
          </section>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <ProfileMetric icon={<CalendarCheck size={18} />} label="오늘 일한 건수" value={`${summary.todayCompleted}건`} />
            <ProfileMetric icon={<CheckCircle2 size={18} />} label="전체 완료" value={`${summary.totalCompleted}건`} />
          </div>

          <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquareText size={17} className="text-lgred" />
                <h3 className="text-[16px] font-bold text-ink">리뷰 확인</h3>
              </div>
              <span className="rounded-full bg-cloud px-3 py-1 text-[11px] font-bold text-slate-500">
                {summary.reviews.length}개
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {loading ? (
                <p className="rounded-[16px] bg-cloud px-4 py-3 text-[13px] font-semibold text-slate-500">
                  리뷰를 불러오는 중이에요...
                </p>
              ) : summary.reviews.length > 0 ? (
                summary.reviews.map((review) => (
                  <p key={review} className="rounded-[16px] bg-cloud px-4 py-3 text-[13px] font-semibold leading-5 text-slate-700">
                    {review}
                  </p>
                ))
              ) : (
                <p className="rounded-[16px] bg-cloud px-4 py-3 text-[13px] font-semibold leading-5 text-slate-500">
                  아직 표시할 리뷰 요약이 없어요.
                </p>
              )}
            </div>
          </section>

          <section className="mt-5 rounded-[24px] bg-white p-2 shadow-sm">
            <ProfileMenuRow icon={<Settings size={17} />} label="계정 관리" />
            <ProfileMenuRow icon={<CreditCard size={17} />} label="정산 계좌 관리" />
            <ProfileMenuRow icon={<Bell size={17} />} label="알림 설정" />
            <ProfileMenuRow danger icon={<LogOut size={17} />} label="로그아웃" />
          </section>
        </section>
      </div>
    </CrewPhoneShell>
  );
}

function ProfileMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-white px-4 py-4 shadow-sm">
      <span className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-lgred/10 text-lgred">{icon}</span>
      <p className="mt-3 text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-[18px] font-bold text-ink">{value}</p>
    </div>
  );
}

function ProfileMenuRow({ danger = false, icon, label }: { danger?: boolean; icon: ReactNode; label: string }) {
  return (
    <button
      className={`flex h-12 w-full items-center gap-3 rounded-[16px] px-3 text-left text-[14px] font-bold ${
        danger ? "text-lgred" : "text-ink"
      }`}
      type="button"
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-[14px] bg-cloud ${danger ? "text-lgred" : "text-slate-600"}`}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function buildProfileSummary(calls: CrewCall[]): CrewProfileSummary {
  const totalEarnings = calls.reduce((sum, call) => sum + getSettlementAmount(call), 0);
  const todayCompleted = calls.filter(isCompletedToday).length;
  const reviews = Array.from(new Set(calls.flatMap((call) => call.crewProfile?.reviewSummary ?? []).filter(Boolean))).slice(0, 4);
  const ratings = calls
    .map((call) => call.crewProfile?.rating)
    .filter((rating): rating is number => typeof rating === "number" && Number.isFinite(rating) && rating > 0);
  const averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 4.9;
  const name =
    calls.find((call) => call.crewProfile?.name)?.crewProfile?.name ??
    calls.find((call) => call.pickupRequest?.crewName)?.pickupRequest?.crewName ??
    "LG 수거 크루";

  return {
    name,
    rating: Number(averageRating.toFixed(1)),
    totalCompleted: calls.length,
    totalEarnings,
    todayCompleted,
    reviews,
  };
}

function getSettlementAmount(call: CrewCall) {
  return call.settlement?.totalAmount ?? 0;
}

function isCompletedToday(call: CrewCall) {
  const completedAt = getCompletedAt(call);
  if (!completedAt) return false;

  const today = new Date();
  return (
    completedAt.getFullYear() === today.getFullYear() &&
    completedAt.getMonth() === today.getMonth() &&
    completedAt.getDate() === today.getDate()
  );
}

function getCompletedAt(call: CrewCall) {
  const completedEvent = call.tracking?.events?.find((event) => event.eventType === "EWASTE_HUB_DELIVERED");
  const source = completedEvent?.createdAt ?? call.tracking?.driverLocation?.updatedAt ?? call.pickupRequest?.scheduledAt;
  if (!source) return null;

  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatWon(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "0원";
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}
