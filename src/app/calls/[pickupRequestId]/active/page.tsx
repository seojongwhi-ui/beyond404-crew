"use client";

import { CrewPhoneShell } from "@/components/CrewPhoneShell";
import {
  arriveCrewCall,
  applianceName,
  completeCrewCall,
  departCrewCall,
  fetchCrewCallDetail,
  formatDistance,
  statusLabel,
  updateCrewLocation,
  type CrewCall,
} from "@/lib/crew-api";
import { ArrowLeft, Home, MapPin, Truck, Warehouse } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type LocationPayload = {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
};

export default function CrewActiveCallPage() {
  const router = useRouter();
  const params = useParams<{ pickupRequestId: string }>();
  const pickupRequestId = Number(params.pickupRequestId);
  const [call, setCall] = useState<CrewCall | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("진행 중인 콜 정보를 불러오는 중입니다.");
  const [pickupPhotoFileName, setPickupPhotoFileName] = useState("crew-pickup-proof-demo.jpg");
  const [hubPhotoFileName, setHubPhotoFileName] = useState("crew-hub-proof-demo.jpg");
  const [inspectionMemo, setInspectionMemo] = useState("문앞 도착 후 상태 확인 및 수거 완료");
  const [hubMemo, setHubMemo] = useState("e-waste 공장 도착 후 전달 완료 등록");

  const loadCall = async () => {
    setLoading(true);
    try {
      const data = await fetchCrewCallDetail(pickupRequestId);
      setCall(data);
      setMessage("진행 중인 콜 정보를 업데이트했습니다.");
    } catch {
      setMessage("진행 중인 콜 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCall();
    const timer = window.setInterval(() => {
      void loadCall();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [pickupRequestId]);

  const status = call?.pickupRequest?.status ?? "";
  const locationTrackingEnabled = useMemo(
    () => ["ASSIGNED", "IN_PROGRESS", "ARRIVED"].includes(status),
    [status],
  );

  useEffect(() => {
    if (!locationTrackingEnabled) {
      return undefined;
    }

    let fallbackCleanup: (() => void) | undefined;
    let stopped = false;
    let lastSentAt = 0;

    const sendLocation = async (payload: LocationPayload) => {
      try {
        const updated = await updateCrewLocation(pickupRequestId, payload);
        if (!stopped) {
          setCall(updated);
          setMessage("크루 위치를 사용자 앱에 실시간으로 공유 중입니다.");
        }
      } catch {
        if (!stopped) {
          setMessage("크루 위치 전송 중 문제가 발생했습니다.");
        }
      }
    };

    const buildFallbackStep = () => {
      const pickupLat = call?.booking?.pickupLat ?? 37.5665;
      const pickupLng = call?.booking?.pickupLng ?? 126.978;
      const processingCenterLat = call?.tracking?.processingCenter?.lat ?? pickupLat + 0.014;
      const processingCenterLng = call?.tracking?.processingCenter?.lng ?? pickupLng - 0.012;
      const headingToHub = status === "ARRIVED";
      const targetLat = headingToHub ? processingCenterLat : pickupLat;
      const targetLng = headingToHub ? processingCenterLng : pickupLng;
      const startLat = call?.tracking?.driverLocation?.lat ?? targetLat - 0.01;
      const startLng = call?.tracking?.driverLocation?.lng ?? targetLng + 0.01;
      return { headingToHub, startLat, startLng, targetLat, targetLng };
    };

    const startFallbackSimulation = () => {
      const { headingToHub, startLat, startLng, targetLat, targetLng } = buildFallbackStep();
      let step = 0;

      const sendStep = async () => {
        step += 1;
        const ratio = Math.min(step / 10, 1);
        const lat = startLat + (targetLat - startLat) * ratio;
        const lng = startLng + (targetLng - startLng) * ratio;
        await sendLocation({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          heading: headingToHub ? 135 : 90,
          speed: Math.max(4, 18 - step),
        });
      };

      void sendStep();
      const timer = window.setInterval(() => {
        void sendStep();
      }, 3000);

      return () => window.clearInterval(timer);
    };

    if ("geolocation" in navigator && window.isSecureContext) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          if (now - lastSentAt < 3000) {
            return;
          }
          lastSentAt = now;

          void sendLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            heading: position.coords.heading ?? 0,
            speed: position.coords.speed ?? 0,
          });
        },
        () => {
          if (!fallbackCleanup) {
            setMessage("위치 권한을 받지 못해 시뮬레이션 위치를 전송합니다.");
            fallbackCleanup = startFallbackSimulation();
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 10000,
        },
      );

      return () => {
        stopped = true;
        navigator.geolocation.clearWatch(watchId);
        fallbackCleanup?.();
      };
    }

    setMessage("이 기기에서는 GPS를 사용할 수 없어 시뮬레이션 위치를 전송합니다.");
    fallbackCleanup = startFallbackSimulation();

    return () => {
      stopped = true;
      fallbackCleanup?.();
    };
  }, [
    call?.booking?.pickupLat,
    call?.booking?.pickupLng,
    call?.tracking?.driverLocation?.lat,
    call?.tracking?.driverLocation?.lng,
    call?.tracking?.processingCenter?.lat,
    call?.tracking?.processingCenter?.lng,
    locationTrackingEnabled,
    pickupRequestId,
    status,
  ]);

  const runAction = async (action: "depart" | "arrive" | "complete") => {
    setLoading(true);
    try {
      const updated =
        action === "depart"
          ? await departCrewCall(pickupRequestId)
          : action === "arrive"
            ? await arriveCrewCall(pickupRequestId)
            : await completeCrewCall(pickupRequestId, {
                pickupPhotoFileName,
                hubPhotoFileName,
                inspectionMemo,
                hubMemo,
              });
      setCall(updated);
      setMessage(actionMessage(action));
      if (action === "complete") {
        router.push("/");
      }
    } catch {
      setMessage("처리 요청 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CrewPhoneShell>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pb-5">
        <header className="flex items-start justify-between">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-ink"
            onClick={() => router.push(`/calls/${pickupRequestId}`)}
            type="button"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            className="flex h-10 items-center gap-2 rounded-full bg-slate-100 px-4 text-sm font-black text-slate-700"
            onClick={() => router.push("/")}
            type="button"
          >
            <Home size={14} />
            홈
          </button>
        </header>

        <section className="mt-4 rounded-[18px] bg-lgred p-4 text-white">
          <p className="text-xs font-black text-white/70">진행 중인 콜</p>
          <h1 className="mt-2 text-2xl font-black">{call ? applianceName(call) : "수거 요청"}</h1>
          <p className="mt-2 text-sm font-semibold text-white/85">
            {call?.pickupRequest?.address ?? "수거 주소 정보 없음"}
          </p>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-2">
          <InfoTile label="현재 상태" value={statusLabel(status)} />
          <InfoTile label="수거지까지" value={formatDistance(call?.tracking?.metrics?.crewToPickupMeters)} />
          <InfoTile label="허브까지" value={formatDistance(call?.tracking?.metrics?.crewToProcessingCenterMeters)} />
          <InfoTile label="처리 허브" value={call?.tracking?.processingCenter?.label ?? "허브 정보 없음"} />
        </section>

        <section className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-black text-black">
            <Truck size={16} />
            진행 처리
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ActionButton
              disabled={loading || status !== "ASSIGNED"}
              icon={<Truck size={16} />}
              label="수거지 출발"
              onClick={() => void runAction("depart")}
            />
            <ActionButton
              disabled={loading || status !== "IN_PROGRESS"}
              icon={<MapPin size={16} />}
              label="문앞 도착"
              onClick={() => void runAction("arrive")}
            />
            <ActionButton
              disabled={loading || status !== "ARRIVED"}
              icon={<Warehouse size={16} />}
              label="처리 완료"
              onClick={() => void runAction("complete")}
            />
            <div className="rounded-[12px] bg-slate-50 p-3">
              <p className="text-[11px] font-bold text-slate-500">사용자 앱 반영</p>
              <p className="mt-1 text-sm font-black text-black">
                {status === "ARRIVED"
                  ? "문앞 도착 단계 반영"
                  : status === "COMPLETED"
                    ? "e-waste 공장 전달 완료"
                    : "실시간 이동 공유"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-black text-black">
            <Warehouse size={16} />
            현장 및 허브 증빙 등록
          </div>
          <div className="mt-3 space-y-3">
            <InputField label="현장 수거 사진 파일명" value={pickupPhotoFileName} onChange={setPickupPhotoFileName} />
            <InputField label="현장 확인 메모" value={inspectionMemo} onChange={setInspectionMemo} />
            <InputField label="허브 완료 사진 파일명" value={hubPhotoFileName} onChange={setHubPhotoFileName} />
            <InputField label="허브 전달 메모" value={hubMemo} onChange={setHubMemo} />
          </div>
        </section>

        <div className="mt-4 rounded-[14px] bg-slate-50 px-4 py-3 text-sm font-bold leading-6 text-slate-600">
          {loading ? "처리 중..." : message}
        </div>
      </div>
    </CrewPhoneShell>
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

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-slate-50 p-3">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-black">{value}</p>
    </div>
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

function actionMessage(action: "depart" | "arrive" | "complete") {
  switch (action) {
    case "depart":
      return "수거지 출발 처리가 완료되었습니다.";
    case "arrive":
      return "문앞 도착 처리가 완료되었습니다. 사용자 앱에는 문앞 도착 단계만 반영됩니다.";
    case "complete":
      return "처리 완료가 반영되었습니다. 사용자 앱에는 e-waste 공장 전달 완료가 표시됩니다.";
  }
}
