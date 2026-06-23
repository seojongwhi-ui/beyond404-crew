"use client";

import { CrewPhoneShell } from "@/components/CrewPhoneShell";
import { calculateCrewSettlement, fetchCompletedCrewCalls, formatKrwAmount, type CrewCall } from "@/lib/crew-api";
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
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type CrewReviewSummary = {
  rating: number;
  comment: string;
  createdAt?: string | null;
};

type CrewProfileSummary = {
  name: string;
  photoUrl: string | null;
  rating: number;
  totalCompleted: number;
  totalEarnings: number;
  monthCompleted: number;
  monthEarnings: number;
  todayCompleted: number;
  todayEarnings: number;
  reviews: CrewReviewSummary[];
};

const DEFAULT_CREW_NAME = "무함마드";
const DEFAULT_CREW_PHOTO = "/crew-muhammad.png";
const COMPLETED_CALLS_CACHE_KEY = "swapit-crew-completed-calls";

export default function CrewProfilePage() {
  const router = useRouter();
  const [completedCalls, setCompletedCalls] = useState<CrewCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  useEffect(() => {
    let cancelled = false;

    try {
      const cached = window.sessionStorage.getItem(COMPLETED_CALLS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as CrewCall[];
        if (Array.isArray(parsed)) {
          setCompletedCalls(parsed);
        }
      }
    } catch {
      window.sessionStorage.removeItem(COMPLETED_CALLS_CACHE_KEY);
    }

    const loadProfile = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const calls = await fetchCompletedCrewCalls();
        if (!cancelled) {
          setCompletedCalls(calls);
          window.sessionStorage.setItem(COMPLETED_CALLS_CACHE_KEY, JSON.stringify(calls));
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
  const visibleReviews = summary.reviews.slice(0, 2);

  return (
    <CrewPhoneShell>
      <div className="flex min-h-0 flex-1 flex-col bg-cloud px-4 pb-0">
        <header className="relative mb-3 flex items-center justify-between">
          <button
            aria-label="홈으로 돌아가기"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink"
            onClick={() => router.push("/")}
            type="button"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-xs font-semibold leading-none text-lgred">LG Crew</p>
            <p className="mt-1 text-[11px] font-semibold leading-none text-slate-500">My Info</p>
          </div>

          <div className="relative z-20">
            <button
              aria-label="내정보 메뉴 열기"
              className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition ${
                showSettingsMenu ? "bg-lgred text-white" : "bg-white text-slate-600"
              }`}
              onClick={() => setShowSettingsMenu((current) => !current)}
              type="button"
            >
              <Settings size={17} />
            </button>

            {showSettingsMenu ? (
              <div className="absolute right-0 top-11 z-30 w-[190px] rounded-[22px] bg-white p-2 shadow-[0_16px_44px_rgba(15,23,42,0.18)]">
                <ProfileMenuRow icon={<CreditCard size={17} />} label="정산 계좌 관리" onClick={() => router.push("/profile/settlement")} />
                <ProfileMenuRow icon={<Bell size={17} />} label="알림 설정" onClick={() => router.push("/profile/notifications")} />
                <ProfileMenuRow danger icon={<LogOut size={17} />} label="로그아웃" onClick={() => router.push("/")} />
              </div>
            ) : null}
          </div>
        </header>

        <section className="phone-scroll min-h-0 flex-1 overflow-y-auto pb-6 pt-3">
          <section className="px-1 pb-4 pt-2">
            <p className="text-[12px] font-bold text-lgred">MY INFO</p>
            <h1 className="mt-1 text-[24px] font-bold leading-tight text-ink">내정보</h1>
            <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-500">
              완료한 수거 실적과 정산 금액, 리뷰를 확인할 수 있어요.
            </p>
          </section>

          {errorMessage ? (
            <div className="mb-3 rounded-[18px] bg-red-50 px-4 py-3 text-[13px] font-semibold leading-5 text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <section className="rounded-[24px] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[20px] bg-lgred/10 text-lgred">
                {summary.photoUrl ? (
                  <img alt={`${summary.name} 프로필`} className="h-full w-full object-cover" src={summary.photoUrl} />
                ) : (
                  <UserRound size={24} />
                )}
              </span>
              <div className="min-w-0 flex flex-1 items-center gap-3">
                <h2 className="truncate text-[20px] font-bold leading-tight text-ink">{summary.name}</h2>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-[16px] font-black text-amber-600">
                  <Star className="fill-current" size={16} />
                  {summary.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </section>

          <section className="mt-3 rounded-[24px] border border-lgred/15 bg-lgred/5 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-white text-lgred shadow-sm">
                <WalletCards size={20} />
              </span>
              <div>
                <p className="text-[12px] font-bold text-slate-500">오늘 정산 실적</p>
                <p className="mt-1 text-[20px] font-bold leading-tight text-ink">오늘 {summary.todayCompleted}건 완료</p>
              </div>
            </div>
            <p className="mt-4 text-[30px] font-bold leading-none text-lgred">{formatKrwAmount(summary.todayEarnings)}</p>
            <p className="mt-2 text-[12px] font-semibold text-slate-500">
              총 누적 정산 {formatKrwAmount(summary.totalEarnings)}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <MiniMetric label="이번 달 완료" value={`${summary.monthCompleted}건`} />
              <MiniMetric label="이번 달 정산" value={formatKrwAmount(summary.monthEarnings)} />
            </div>
          </section>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <ProfileMetric icon={<CalendarCheck size={18} />} label="오늘 완료 건수" value={`${summary.todayCompleted}건`} />
            <ProfileMetric icon={<CheckCircle2 size={18} />} label="전체 완료" value={`${summary.totalCompleted}건`} />
          </div>

          <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquareText size={17} className="text-lgred" />
                <h3 className="text-[16px] font-bold text-ink">리뷰 확인</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-cloud px-3 py-1 text-[11px] font-bold text-slate-500">
                  {summary.reviews.length}개
                </span>
                {summary.reviews.length > 2 ? (
                  <button
                    className="rounded-full bg-lgred/10 px-3 py-1 text-[11px] font-bold text-lgred"
                    onClick={() => setShowAllReviews(true)}
                    type="button"
                  >
                    전체보기
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {loading ? (
                <p className="rounded-[16px] bg-cloud px-4 py-3 text-[13px] font-semibold text-slate-500">
                  리뷰를 불러오는 중이에요...
                </p>
              ) : visibleReviews.length > 0 ? (
                visibleReviews.map((review) => <ReviewItem key={`${review.createdAt ?? "review"}-${review.comment}`} review={review} />)
              ) : (
                <p className="rounded-[16px] bg-cloud px-4 py-3 text-[13px] font-semibold leading-5 text-slate-500">
                  아직 표시할 리뷰가 없어요.
                </p>
              )}
            </div>
          </section>

        </section>

        {showSettingsMenu ? (
          <button
            aria-label="내정보 메뉴 닫기"
            className="fixed inset-0 z-10 cursor-default bg-transparent"
            onClick={() => setShowSettingsMenu(false)}
            type="button"
          />
        ) : null}

        {showAllReviews ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-4 pb-5 pt-12 backdrop-blur-sm">
            <div className="flex max-h-[78vh] w-full max-w-[390px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <MessageSquareText size={18} className="text-lgred" />
                  <div>
                    <h3 className="text-[17px] font-bold text-ink">리뷰 전체보기</h3>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">총 {summary.reviews.length}개의 리뷰</p>
                  </div>
                </div>
                <button
                  aria-label="리뷰 전체보기 닫기"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cloud text-slate-500"
                  onClick={() => setShowAllReviews(false)}
                  type="button"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 phone-scroll">
                {summary.reviews.map((review) => (
                  <ReviewItem key={`${review.createdAt ?? "review"}-${review.comment}`} review={review} large />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </CrewPhoneShell>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-white px-3 py-3">
      <p className="text-[10px] font-bold text-slate-400">{label}</p>
      <p className="mt-1 truncate text-[13px] font-bold text-ink">{value}</p>
    </div>
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

function ReviewItem({ large = false, review }: { large?: boolean; review: CrewReviewSummary }) {
  return (
    <div className={`rounded-[16px] bg-cloud px-4 ${large ? "py-4" : "py-3"}`}>
      <div className="flex items-center gap-1 text-[12px] font-bold text-amber-600">
        <Star className="fill-current" size={13} />
        {review.rating.toFixed(1)}
      </div>
      <p className={`mt-2 font-semibold leading-5 text-slate-700 ${large ? "text-[14px]" : "text-[13px]"}`}>{review.comment}</p>
      {review.createdAt ? <p className="mt-2 text-[11px] font-medium text-slate-400">{formatDateTime(review.createdAt)}</p> : null}
    </div>
  );
}

function ProfileMenuRow({
  danger = false,
  icon,
  label,
  onClick,
}: {
  danger?: boolean;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      className={`flex h-12 w-full items-center gap-3 rounded-[16px] px-3 text-left text-[14px] font-bold ${
        danger ? "text-lgred" : "text-ink"
      }`}
      onClick={onClick}
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
  const now = new Date();
  const totalEarnings = calls.reduce((sum, call) => sum + getSettlementAmount(call), 0);
  const monthCalls = calls.filter((call) => isCompletedInMonth(call, now));
  const todayCalls = calls.filter(isCompletedToday);
  const reviews = collectReviews(calls);
  const ratings = reviews.length > 0 ? reviews.map((review) => review.rating) : collectProfileRatings(calls);
  const averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 4.9;
  const profileCall = calls.find((call) => call.crewProfile?.name);
  const name =
    profileCall?.crewProfile?.name?.trim() ||
    calls.find((call) => call.pickupRequest?.crewName)?.pickupRequest?.crewName?.trim() ||
    DEFAULT_CREW_NAME;
  const photoUrl = DEFAULT_CREW_PHOTO;

  return {
    name,
    photoUrl,
    rating: Number(averageRating.toFixed(1)),
    totalCompleted: calls.length,
    totalEarnings,
    monthCompleted: monthCalls.length,
    monthEarnings: monthCalls.reduce((sum, call) => sum + getSettlementAmount(call), 0),
    todayCompleted: todayCalls.length,
    todayEarnings: todayCalls.reduce((sum, call) => sum + getSettlementAmount(call), 0),
    reviews,
  };
}

function collectReviews(calls: CrewCall[]) {
  const seen = new Set<string>();
  const reviews: CrewReviewSummary[] = [];

  calls.forEach((call) => {
    const comment = call.crewReview?.comment?.trim();
    const rating = call.crewReview?.rating;
    if (comment && typeof rating === "number" && Number.isFinite(rating)) {
      const key = `${call.crewReview?.createdAt ?? ""}-${comment}`;
      if (!seen.has(key)) {
        seen.add(key);
        reviews.push({
          rating,
          comment,
          createdAt: call.crewReview?.createdAt,
        });
      }
      return;
    }

    call.crewProfile?.reviewSummary?.forEach((summary) => {
      const fallbackComment = summary.trim();
      if (!fallbackComment || seen.has(fallbackComment)) return;
      seen.add(fallbackComment);
      reviews.push({
        rating: call.crewProfile?.rating ?? 4.9,
        comment: fallbackComment,
      });
    });
  });

  return reviews.sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

function collectProfileRatings(calls: CrewCall[]) {
  return calls
    .map((call) => call.crewProfile?.rating)
    .filter((rating): rating is number => typeof rating === "number" && Number.isFinite(rating) && rating > 0);
}

function getSettlementAmount(call: CrewCall) {
  return calculateCrewSettlement(call).totalAmount;
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

function isCompletedInMonth(call: CrewCall, target: Date) {
  const completedAt = getCompletedAt(call);
  if (!completedAt) return false;

  return completedAt.getFullYear() === target.getFullYear() && completedAt.getMonth() === target.getMonth();
}

function getCompletedAt(call: CrewCall) {
  const completedEvent = call.tracking?.events?.find((event) => event.eventType === "EWASTE_HUB_DELIVERED");
  const source = completedEvent?.createdAt ?? call.tracking?.driverLocation?.updatedAt ?? call.pickupRequest?.scheduledAt;
  if (!source) return null;

  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}
