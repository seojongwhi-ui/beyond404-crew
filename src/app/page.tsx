"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Clock,
  MapPin,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

type CrewCall = {
  id: number;
  status: string;
  userConsent?: {
    agreedToCreditPolicy: boolean;
    notice: string;
    agreedAt?: string | null;
  } | null;
  captureEvidence?: {
    exteriorPhotoFileName?: string | null;
    labelPhotoFileName?: string | null;
    pickupPhotoFileName?: string | null;
    hubPhotoFileName?: string | null;
    pickupInspectionMemo?: string | null;
    hubMemo?: string | null;
  } | null;
  appliance?: {
    applianceType: string;
    brand: string;
    modelName?: string;
  };
  pickupRequest?: {
    pickupRequestId: number;
    pickupType: string;
    status: string;
    crewName: string | null;
    address: string | null;
    scheduledAt: string;
    nearbyCrews?: {
      crewId: number | null;
      crewName: string;
      status: string;
      lat: number;
      lng: number;
      distanceMeters: number;
      assigned: boolean;
    }[];
  } | null;
  booking?: {
    bookingDate?: string | null;
    bookingTime?: string | null;
    address?: string | null;
    detailAddress?: string | null;
    pickupLat?: number | null;
    pickupLng?: number | null;
  } | null;
  dispatchInfo?: {
    alertMessage: string;
    matchScore: number;
    priorityRank: number;
    rejectCount: number;
    cancelCount: number;
    penaltyCount: number;
    recommendedReason: string;
  } | null;
  tracking?: {
    message: string;
    phase?: string;
    processingCenter?: {
      label: string;
      lat: number;
      lng: number;
    } | null;
    metrics?: {
      crewToPickupMeters: number | null;
      crewToProcessingCenterMeters: number | null;
      locationLive: boolean;
    } | null;
    nearbyCrews?: {
      crewId: number | null;
      crewName: string;
      status: string;
      lat: number;
      lng: number;
      distanceMeters: number;
      assigned: boolean;
    }[];
    driverLocation?: {
      lat: number;
      lng: number;
      heading: number;
      speed: number;
      updatedAt?: string;
    } | null;
  };
  settlement?: {
    baseFee: number | null;
    distanceFee: number | null;
    incentive: number | null;
    penalty: number | null;
    totalAmount: number | null;
    status: string;
  } | null;
};

function resolveApiBaseUrl() {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8080";
  }

  return "";
}

const API_BASE_URL = resolveApiBaseUrl();

async function crewRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Crew API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function updateCrewLocation(
  pickupRequestId: number,
  payload: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
  },
) {
  return crewRequest<CrewCall>(`/api/crew/pickups/${pickupRequestId}/location`, {
    method: "POST",
    body: JSON.stringify({
      lat: payload.lat,
      lng: payload.lng,
      heading: payload.heading ?? 0,
      speed: payload.speed ?? 0,
    }),
  });
}

export default function CrewAppPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#202124] px-3 py-8">
      <section className="relative w-[min(100%,424px)] rounded-[52px] border-[8px] border-[#090a0f] bg-[#090a0f] p-[3px] shadow-phone">
        <div className="aspect-[402/874] overflow-hidden rounded-[43px] bg-white">
          <div className="flex h-full flex-col">
            <PhoneStatusBar />
            <CrewDashboard />
          </div>
        </div>
      </section>
    </main>
  );
}

function PhoneStatusBar() {
  return (
    <div className="flex h-[62px] shrink-0 items-start justify-between px-8 pt-4 text-[14px] font-black text-black">
      <span>11:07</span>
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

function CrewDashboard() {
  const [calls, setCalls] = useState<CrewCall[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("수거 요청 목록을 불러오고 있습니다.");
  const [knownCallIds, setKnownCallIds] = useState<number[]>([]);
  const [pickupPhotoFileName, setPickupPhotoFileName] = useState("crew-pickup-proof-demo.jpg");
  const [hubPhotoFileName, setHubPhotoFileName] = useState("crew-hub-proof-demo.jpg");
  const [inspectionMemo, setInspectionMemo] = useState("소비자 문앞 도착 후 실물 확인 및 수거 완료");
  const [hubMemo, setHubMemo] = useState("리사이클 허브 도착 후 최종 촬영 및 완료 등록");

  const selectedCall = calls.find((call) => call.id === selectedCallId) ?? calls[0] ?? null;
  const pickupRequestId = selectedCall?.pickupRequest?.pickupRequestId ?? null;
  const locationTrackingEnabled = useMemo(
    () => ["ASSIGNED", "IN_PROGRESS", "ARRIVED"].includes(selectedCall?.pickupRequest?.status ?? ""),
    [selectedCall?.pickupRequest?.status],
  );

  const upsertCall = (updated: CrewCall) => {
    setCalls((current) => {
      const exists = current.some((call) => call.id === updated.id);
      return exists ? current.map((call) => (call.id === updated.id ? updated : call)) : [updated, ...current];
    });
    setSelectedCallId(updated.id);
  };

  const loadCalls = async () => {
    setLoading(true);
    try {
      const data = await crewRequest<CrewCall[]>("/api/crew/calls");
      setCalls(data);
      setKnownCallIds((current) => {
        const incomingIds = data.map((call) => call.id);
        const newIds = incomingIds.filter((id) => !current.includes(id));
        if (newIds.length > 0 && current.length > 0) {
          setMessage(`새 수거 요청 ${newIds.length}건이 도착했습니다.`);
        }
        return incomingIds;
      });
      setSelectedCallId((current) => {
        if (current && data.some((call) => call.id === current)) {
          return current;
        }
        return data[0]?.id ?? null;
      });
      if (data.length === 0) {
        setMessage("현재 확인 가능한 수거 요청이 없습니다.");
      } else if (knownCallIds.length === 0) {
        setMessage("수거 요청 목록을 확인했습니다.");
      }
    } catch {
      setMessage("수거 요청 목록을 불러오지 못했습니다. 백엔드 연결을 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCalls();
    const timer = window.setInterval(() => {
      void loadCalls();
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!pickupRequestId || !locationTrackingEnabled) {
      return undefined;
    }

    const applyLocationUpdate = async (payload: {
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
    }) => {
      try {
        const updated = await updateCrewLocation(pickupRequestId, payload);
        upsertCall(updated);
        setMessage("크루 현재 위치를 사용자 앱 추적 화면으로 전송했습니다.");
      } catch {
        setMessage("크루 위치 전송 중 문제가 발생했습니다.");
      }
    };

    const startFallbackSimulation = () => {
      const pickupLat = selectedCall?.booking?.pickupLat ?? 37.5665;
      const pickupLng = selectedCall?.booking?.pickupLng ?? 126.978;
      const processingCenterLat = selectedCall?.tracking?.processingCenter?.lat ?? pickupLat + 0.014;
      const processingCenterLng = selectedCall?.tracking?.processingCenter?.lng ?? pickupLng - 0.012;
      const headingToHub = selectedCall?.pickupRequest?.status === "ARRIVED";
      const targetLat = headingToHub ? processingCenterLat : pickupLat;
      const targetLng = headingToHub ? processingCenterLng : pickupLng;
      const startLat =
        selectedCall?.tracking?.driverLocation?.lat ?? (headingToHub ? pickupLat : targetLat - 0.012);
      const startLng =
        selectedCall?.tracking?.driverLocation?.lng ?? (headingToHub ? pickupLng : targetLng + 0.01);
      let step = 0;

      setMessage("실제 GPS가 없어서 시뮬레이션 위치를 전송하고 있습니다.");

      const timer = window.setInterval(() => {
        step += 1;
        const ratio = Math.min(step / 8, 1);
        const lat = startLat + (targetLat - startLat) * ratio;
        const lng = startLng + (targetLng - startLng) * ratio;

        void applyLocationUpdate({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          heading: headingToHub ? 135 : 90,
          speed: Math.max(4, 18 - step),
        });
      }, 5000);

      return () => window.clearInterval(timer);
    };

    if ("geolocation" in navigator && window.isSecureContext) {
      let lastSentAt = 0;
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          if (now - lastSentAt < 4000) {
            return;
          }
          lastSentAt = now;
          void applyLocationUpdate({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            heading: position.coords.heading ?? 0,
            speed: position.coords.speed ?? 0,
          });
        },
        () => {
          setMessage("위치 권한을 받지 못해 시뮬레이션 이동으로 전환합니다.");
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 10000,
        },
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }

    const cleanup = startFallbackSimulation();
    return () => cleanup();
  }, [
    locationTrackingEnabled,
    pickupRequestId,
    selectedCall?.booking?.pickupLat,
    selectedCall?.booking?.pickupLng,
    selectedCall?.pickupRequest?.status,
    selectedCall?.tracking?.processingCenter?.lat,
    selectedCall?.tracking?.processingCenter?.lng,
    selectedCall?.tracking?.driverLocation?.lat,
    selectedCall?.tracking?.driverLocation?.lng,
  ]);

  const runPickupAction = async (action: "accept" | "depart" | "arrive" | "complete") => {
    if (!pickupRequestId) {
      setMessage("먼저 수거 요청을 선택해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const path =
        action === "accept"
          ? `/api/crew/calls/${pickupRequestId}/accept`
          : action === "depart"
            ? `/api/crew/pickups/${pickupRequestId}/depart`
            : action === "arrive"
              ? `/api/crew/pickups/${pickupRequestId}/arrive`
              : `/api/crew/pickups/${pickupRequestId}/complete`;

      const data = await crewRequest<CrewCall>(path, {
        method: "POST",
        body:
          action === "complete"
            ? JSON.stringify({
                pickupPhotoFileName,
                hubPhotoFileName,
                inspectionMemo,
                hubMemo,
              })
            : undefined,
      });

      upsertCall(data);
      setMessage(actionMessage(action));
    } catch {
      setMessage("처리 요청 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm font-black text-lgred">PICKUP CREW</p>
          <h1 className="mt-1 text-3xl font-black text-black">수거 요청 처리</h1>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            콜 업데이트 확인 후 요청을 선택하고, 수락부터 허브 완료와 정산까지 순서대로 진행합니다.
          </p>
        </div>
        <button
          className="flex h-11 items-center gap-2 rounded-[12px] bg-slate-100 px-4 text-sm font-black text-slate-700"
          disabled={loading}
          onClick={() => void loadCalls()}
          type="button"
        >
          <RefreshCw size={16} />
          새로고침
        </button>
      </header>

      {selectedCall?.dispatchInfo?.alertMessage ? (
        <div className="mt-4 rounded-[18px] border border-[#ffd9d9] bg-[#fff7f7] px-4 py-3 text-sm font-black text-[#cb2431]">
          {selectedCall.dispatchInfo.alertMessage}
        </div>
      ) : null}

      <section className="mt-4 rounded-[18px] bg-lgred p-4 text-white">
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="전체 콜" value={String(calls.length)} />
          <MiniStat label="선택 상태" value={selectedCall?.pickupRequest?.status ?? "-"} />
          <MiniStat label="콜 유형" value={selectedCall?.pickupRequest?.pickupType ?? "-"} />
        </div>
      </section>

      <section className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-black text-black">
          <Users size={16} />
          수거 요청 목록
        </div>
        <div className="mt-3 max-h-[180px] space-y-2 overflow-y-auto pr-1">
          {calls.length > 0 ? (
            calls.map((call) => {
              const active = call.id === selectedCall?.id;
              return (
                <button
                  key={call.id}
                  className={`block w-full rounded-[14px] border px-4 py-3 text-left transition ${
                    active ? "border-lgred bg-lgred/5 shadow-sm" : "border-slate-200 bg-slate-50"
                  }`}
                  onClick={() => setSelectedCallId(call.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-black">{applianceName(call)}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {call.pickupRequest?.address ?? "수거 주소가 아직 없습니다."}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black ${
                        active ? "bg-lgred text-white" : "bg-white text-slate-500"
                      }`}
                    >
                      {call.pickupRequest?.status ?? "NEW"}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] font-bold text-slate-400">
                    {call.pickupRequest?.scheduledAt ?? "즉시 수거 콜"}
                  </p>
                </button>
              );
            })
          ) : (
            <div className="rounded-[14px] bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-500">
              현재 확인 가능한 수거 요청이 없습니다.
            </div>
          )}
        </div>
      </section>

      <section className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
        <InfoLine
          icon={<MapPin size={18} />}
          title="수거 위치"
          description={selectedCall?.pickupRequest?.address ?? "좌측 목록에서 수거 콜을 선택해 주세요."}
        />
        <InfoLine
          icon={<PackageCheck size={18} />}
          title="수거 대상"
          description={selectedCall ? applianceName(selectedCall) : "선택된 요청이 없습니다."}
        />
        <InfoLine
          icon={<ShieldCheck size={18} />}
          title="사용자 동의"
          description={
            selectedCall?.userConsent?.agreedToCreditPolicy
              ? "크레딧 조정/회수 정책 동의 완료"
              : "동의 정보가 아직 없습니다."
          }
        />
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2">
        <MiniPanel label="매칭 점수" value={`${selectedCall?.dispatchInfo?.matchScore ?? 0}점`} />
        <MiniPanel label="우선 순위" value={`${selectedCall?.dispatchInfo?.priorityRank ?? 0}순위`} />
        <MiniPanel label="패널티" value={`${selectedCall?.dispatchInfo?.penaltyCount ?? 0}회`} />
      </section>

      <section className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
        <div className="text-sm font-black text-black">배차 및 GPS 정보</div>
        <div className="mt-3 space-y-2">
          <DetailBox
            label="우선 배차 사유"
            value={
              selectedCall?.dispatchInfo?.recommendedReason ??
              "현재 위치 및 이동 동선을 기반으로 우선 배차 정보가 표시됩니다."
            }
          />
          <DetailBox
            label="처리 허브"
            value={
              selectedCall?.tracking?.processingCenter
                ? `${selectedCall.tracking.processingCenter.label} (${selectedCall.tracking.processingCenter.lat.toFixed(4)}, ${selectedCall.tracking.processingCenter.lng.toFixed(4)})`
                : "수거 좌표가 등록되면 가장 가까운 허브가 표시됩니다."
            }
          />
          <DetailBox
            label="근처 크루"
            value={formatNearbyCrewSummary(selectedCall?.tracking?.nearbyCrews ?? selectedCall?.pickupRequest?.nearbyCrews)}
          />
          <div className="grid grid-cols-2 gap-2">
            <MiniPanel label="픽업까지" value={formatDistance(selectedCall?.tracking?.metrics?.crewToPickupMeters ?? null)} />
            <MiniPanel
              label="허브까지"
              value={formatDistance(selectedCall?.tracking?.metrics?.crewToProcessingCenterMeters ?? null)}
            />
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-black text-black">
          <AlertCircle size={16} />
          현장/허브 증빙 등록
        </div>
        <div className="mt-3 space-y-3">
          <InputField label="현장 수거 사진 파일명" value={pickupPhotoFileName} onChange={setPickupPhotoFileName} />
          <InputField label="현장 확인 메모" value={inspectionMemo} onChange={setInspectionMemo} />
          <InputField label="허브 완료 사진 파일명" value={hubPhotoFileName} onChange={setHubPhotoFileName} />
          <InputField label="허브 처리 메모" value={hubMemo} onChange={setHubMemo} />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-2">
        <ActionButton
          disabled={loading || !pickupRequestId}
          icon={<Check size={16} />}
          label="수거 콜 수락"
          onClick={() => void runPickupAction("accept")}
        />
        <ActionButton
          disabled={loading || !pickupRequestId}
          icon={<Truck size={16} />}
          label="수거 출발 처리"
          onClick={() => void runPickupAction("depart")}
        />
        <ActionButton
          disabled={loading || !pickupRequestId}
          icon={<MapPin size={16} />}
          label="소비자 도착 처리"
          onClick={() => void runPickupAction("arrive")}
        />
        <ActionButton
          disabled={loading || !pickupRequestId}
          icon={<Clock size={16} />}
          label="허브 완료 등록"
          onClick={() => void runPickupAction("complete")}
        />
      </section>

      <section className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-black text-black">
          <Wallet size={16} />
          정산
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniPanel label="기본 수당" value={formatMoney(selectedCall?.settlement?.baseFee ?? null)} />
          <MiniPanel label="거리 수당" value={formatMoney(selectedCall?.settlement?.distanceFee ?? null)} />
          <MiniPanel label="인센티브" value={formatMoney(selectedCall?.settlement?.incentive ?? null)} />
          <MiniPanel label="패널티 차감" value={formatMoney(selectedCall?.settlement?.penalty ?? null)} />
        </div>
        <div className="mt-3 rounded-[14px] bg-slate-50 px-4 py-3">
          <p className="text-xs font-black text-slate-500">최종 정산 금액</p>
          <p className="mt-1 text-lg font-black text-black">
            {formatMoney(selectedCall?.settlement?.totalAmount ?? null)}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {selectedCall?.settlement?.status ?? "정산 정보는 허브 완료 등록 후 표시됩니다."}
          </p>
        </div>
      </section>

      <div className="mt-4 rounded-[14px] bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600">
        {loading ? "처리 중..." : message}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-white/12 p-2">
      <p className="text-[11px] font-bold text-white/60">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function MiniPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-slate-50 p-3">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-black">{value}</p>
    </div>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-slate-50 p-3">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-black">{value}</p>
    </div>
  );
}

function InfoLine({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-lgred/10 text-lgred">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-black text-black">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function ActionButton({
  disabled,
  icon,
  label,
  onClick,
}: {
  disabled: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex h-12 items-center justify-center gap-2 rounded-[12px] bg-slate-100 text-sm font-black text-slate-700 disabled:text-slate-300"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <input
        className="mt-1 h-11 w-full rounded-[12px] border border-slate-200 px-3 text-sm font-semibold text-black outline-none focus:border-lgred"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function formatDistance(distance: number | null) {
  if (distance === null) return "-";
  if (distance >= 1000) return `${(distance / 1000).toFixed(1)} km`;
  return `${Math.round(distance)} m`;
}

function formatMoney(amount: number | null) {
  if (amount === null) return "-";
  return `${amount.toLocaleString()}원`;
}

function formatNearbyCrewSummary(
  crews:
    | {
        crewId: number | null;
        crewName: string;
        status: string;
        lat: number;
        lng: number;
        distanceMeters: number;
        assigned: boolean;
      }[]
    | undefined,
) {
  if (!crews || crews.length === 0) {
    return "근처 크루 좌표가 아직 없습니다.";
  }

  return crews
    .slice(0, 3)
    .map((crew) => `${crew.crewName} ${formatDistance(crew.distanceMeters)}`)
    .join(" / ");
}

function applianceName(call: CrewCall) {
  const model = call.appliance?.modelName ?? "LG demo model";
  const type = call.appliance?.applianceType ?? "appliance";
  const label =
    type === "refrigerator"
      ? "냉장고"
      : type === "air_conditioner"
        ? "에어컨"
        : type === "tv"
          ? "TV"
          : type === "microwave"
            ? "전자레인지"
            : "세탁기";
  return `${label} / ${model}`;
}

function actionMessage(action: "accept" | "depart" | "arrive" | "complete") {
  switch (action) {
    case "accept":
      return "선택한 수거 요청을 수락했습니다.";
    case "depart":
      return "수거 출발 처리 완료. 사용자 앱에 이동 상태가 공유됩니다.";
    case "arrive":
      return "소비자 도착 처리 완료. 현장 확인 및 수거 단계로 넘어갑니다.";
    case "complete":
      return "허브 완료 등록이 끝났고 정산 정보가 갱신되었습니다.";
  }
}
