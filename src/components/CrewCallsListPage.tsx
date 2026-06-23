"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { CrewPhoneShell } from "@/components/CrewPhoneShell";
import { CrewRequestCard, getPickupRequestId } from "@/components/CrewRequestCard";
import { CrewTopBar } from "@/components/CrewTopBar";
import {
  acceptCrewCall,
  applianceName,
  fetchActiveCrewCalls,
  formatCallTime,
  pickupTypeLabel,
  sortCallsByLatest,
  statusLabel,
  type CrewCall,
} from "@/lib/crew-api";

const REFRESH_PULL_THRESHOLD = 64;

export function CrewCallsListPage({
  actionLabel,
  emptyMessage,
  fetchCalls,
  requestActions = false,
  showProfileButton = true,
  title,
  topSubtitle,
  toHref,
}: {
  actionLabel: string;
  emptyMessage: string;
  fetchCalls: () => Promise<CrewCall[]>;
  icon: LucideIcon;
  requestActions?: boolean;
  showProfileButton?: boolean;
  subtitle: string;
  title: string;
  topSubtitle: string;
  toHref: (pickupRequestId: number) => string;
}) {
  const router = useRouter();
  const [calls, setCalls] = useState<CrewCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);
  const [hasBlockingActiveCall, setHasBlockingActiveCall] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const loadCalls = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [nextCalls, activeCalls] = await Promise.all([
        fetchCalls(),
        requestActions ? fetchActiveCrewCalls().catch(() => []) : Promise.resolve([]),
      ]);

      setCalls(sortCallsByLatest(nextCalls));
      if (requestActions) {
        setHasBlockingActiveCall(activeCalls.some((call) => isActivePickupStatus(call.pickupRequest?.status)));
      }
    } catch {
      setErrorMessage("목록을 불러오지 못했습니다. 백엔드 연결 상태를 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCalls();
  }, []);

  const refreshCalls = async () => {
    if (loading || isRefreshing) return;

    setIsRefreshing(true);
    setPullDistance(REFRESH_PULL_THRESHOLD);

    try {
      await loadCalls();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      touchStartYRef.current = null;
    }
  };

  const visibleCalls = requestActions
    ? calls.filter((call) => !dismissedIds.includes(getPickupRequestId(call)))
    : calls;

  const acceptFromList = async (call: CrewCall) => {
    if (hasBlockingActiveCall) {
      setErrorMessage("진행 중인 수거를 먼저 완료한 뒤 새 요청을 수락할 수 있어요.");
      return;
    }

    const pickupRequestId = getPickupRequestId(call);
    setAcceptingId(pickupRequestId);
    setErrorMessage(null);

    try {
      const crewLocation = await getCurrentCrewLocation();
      await acceptCrewCall(pickupRequestId, crewLocation);
      router.push(`/calls/${pickupRequestId}/active`);
    } catch {
      setErrorMessage("콜을 수락하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setAcceptingId(null);
    }
  };

  const rejectFromList = (call: CrewCall) => {
    const pickupRequestId = getPickupRequestId(call);
    setDismissedIds((prev) => (prev.includes(pickupRequestId) ? prev : [...prev, pickupRequestId]));
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    if (event.currentTarget.scrollTop > 0 || loading || isRefreshing) {
      touchStartYRef.current = null;
      return;
    }

    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    const startY = touchStartYRef.current;
    if (startY == null || event.currentTarget.scrollTop > 0) return;

    const currentY = event.touches[0]?.clientY ?? startY;
    const nextDistance = Math.max(0, currentY - startY);
    setPullDistance(Math.min(96, nextDistance));
  };

  const handleTouchEnd = () => {
    if (pullDistance >= REFRESH_PULL_THRESHOLD) {
      void refreshCalls();
      return;
    }

    setPullDistance(0);
    touchStartYRef.current = null;
  };

  return (
    <CrewPhoneShell>
      <div className="relative flex min-h-0 flex-1 flex-col bg-cloud px-4 pb-0">
        <div className="shrink-0">
          <CrewTopBar backHref="/" showProfileButton={showProfileButton} subtitle={topSubtitle} />

          <section className="px-1 pb-1 pt-2">
            <h1 className="text-[22px] font-bold leading-tight text-ink">{title}</h1>
          </section>

          {errorMessage ? (
            <div className="mt-3 rounded-[18px] bg-red-50 px-4 py-4 text-sm font-semibold leading-6 text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <section
          className="phone-scroll mt-3 min-h-0 flex-1 overflow-y-auto pb-5"
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchStart}
        >
          <PullRefreshIndicator isRefreshing={isRefreshing} pullDistance={pullDistance} />

          <div className="space-y-3">
            {visibleCalls.length > 0 ? (
              visibleCalls.map((call) => {
                const pickupRequestId = call.pickupRequest?.pickupRequestId;
                if (!pickupRequestId) return null;

                return requestActions ? (
                  <CrewRequestCard
                    accepting={acceptingId === getPickupRequestId(call)}
                    blocked={hasBlockingActiveCall}
                    call={call}
                    detailHref={toHref(pickupRequestId)}
                    key={`${title}-${call.id}`}
                    onAccept={() => void acceptFromList(call)}
                    onReject={() => rejectFromList(call)}
                  />
                ) : (
                  <Link
                    key={`${title}-${call.id}`}
                    className="block rounded-[20px] bg-white p-4 shadow-sm"
                    href={toHref(pickupRequestId)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{applianceName(call)}</p>
                        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-slate-500">
                          {call.pickupRequest?.address ?? "수거 주소 정보가 없습니다."}
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

                    <div className="mt-4 flex items-center justify-between text-sm font-bold text-lgred">
                      <span>{actionLabel}</span>
                      <ChevronRight size={16} />
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-[20px] bg-white px-4 py-12 text-center text-sm font-semibold leading-6 text-slate-500 shadow-sm">
                {loading ? "목록을 불러오는 중입니다..." : emptyMessage}
              </div>
            )}
          </div>
        </section>

      </div>
    </CrewPhoneShell>
  );
}

type CrewLocationPayload = {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  capturedAt?: number;
};

function getCurrentCrewLocation() {
  return new Promise<CrewLocationPayload | undefined>((resolve) => {
    if (!("geolocation" in navigator) || !window.isSecureContext) {
      resolve(undefined);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading ?? 0,
          speed: position.coords.speed ?? 0,
          accuracy: position.coords.accuracy,
          capturedAt: position.timestamp,
        });
      },
      () => resolve(undefined),
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      },
    );
  });
}

function isActivePickupStatus(status?: string | null) {
  return status === "ASSIGNED" || status === "IN_PROGRESS" || status === "ARRIVED";
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-cloud px-3 py-3">
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function PullRefreshIndicator({
  isRefreshing,
  pullDistance,
}: {
  isRefreshing: boolean;
  pullDistance: number;
}) {
  const visible = isRefreshing || pullDistance > 0;
  const progress = isRefreshing ? 100 : Math.min(100, Math.round((pullDistance / REFRESH_PULL_THRESHOLD) * 100));

  return (
    <div
      className="overflow-hidden transition-[height,opacity] duration-200"
      style={{
        height: visible ? 42 : 0,
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="flex h-10 items-center justify-center">
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-lgred transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {isRefreshing ? "목록 확인 중" : progress >= 100 ? "놓으면 새로고침" : "아래로 당겨 새로고침"}
          </span>
        </div>
      </div>
    </div>
  );
}
