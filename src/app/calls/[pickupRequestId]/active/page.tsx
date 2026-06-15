"use client";

import { CrewPhoneShell } from "@/components/CrewPhoneShell";
import {
  applianceName,
  arriveCrewCall,
  completeCrewCall,
  departCrewCall,
  fetchCrewCallDetail,
  formatDistance,
  statusLabel,
  updateCrewLocation,
  type CrewCall,
} from "@/lib/crew-api";
import { ArrowLeft, Home, MapPin, Navigation, Truck, Warehouse } from "lucide-react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type Coordinates = {
  lat: number;
  lng: number;
};

type LocationPayload = {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
};

const LeafletTrackingMap = dynamic(
  () => import("@/components/maps/LeafletTrackingMap").then((module) => module.LeafletTrackingMap),
  { ssr: false },
);

const GoogleCanvasMap = dynamic(
  () => import("@/components/maps/GoogleCanvasMap").then((module) => module.GoogleCanvasMap),
  { ssr: false },
);

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
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

export default function CrewActiveCallPage() {
  const router = useRouter();
  const params = useParams<{ pickupRequestId: string }>();
  const pickupRequestId = Number(params.pickupRequestId);

  const [call, setCall] = useState<CrewCall | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("진행 중인 수거 정보를 불러오는 중입니다.");
  const [pickupPhotoFileName, setPickupPhotoFileName] = useState("crew-pickup-proof-demo.jpg");
  const [hubPhotoFileName, setHubPhotoFileName] = useState("crew-hub-proof-demo.jpg");
  const [inspectionMemo, setInspectionMemo] = useState("문앞 도착 후 상태 확인 및 수거 완료");
  const [hubMemo, setHubMemo] = useState("e-waste 공장 전달 및 처리 완료 등록");

  const loadCall = async () => {
    setLoading(true);
    try {
      const data = await fetchCrewCallDetail(pickupRequestId);
      setCall(data);
      setMessage("진행 중인 수거 정보를 업데이트했습니다.");
    } catch {
      setMessage("진행 중인 수거 정보를 불러오지 못했습니다.");
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
  const locationTrackingEnabled = ["ASSIGNED", "IN_PROGRESS", "ARRIVED"].includes(status);

  useEffect(() => {
    if (!locationTrackingEnabled) {
      return undefined;
    }

    let stopped = false;
    let fallbackCleanup: (() => void) | undefined;
    let lastSentAt = 0;

    const sendLocation = async (payload: LocationPayload) => {
      try {
        const updated = await updateCrewLocation(pickupRequestId, payload);
        if (!stopped) {
          setCall(updated);
          setMessage("크루 위치를 실시간으로 사용자 앱에 공유하고 있습니다.");
        }
      } catch {
        if (!stopped) {
          setMessage("크루 위치 전송 중 문제가 발생했습니다.");
        }
      }
    };

    const startFallbackSimulation = () => {
      const pickupLat = call?.booking?.pickupLat ?? 37.5665;
      const pickupLng = call?.booking?.pickupLng ?? 126.978;
      const hubLat = call?.tracking?.processingCenter?.lat ?? pickupLat + 0.014;
      const hubLng = call?.tracking?.processingCenter?.lng ?? pickupLng - 0.012;
      const headingToHub = status === "ARRIVED";
      const targetLat = headingToHub ? hubLat : pickupLat;
      const targetLng = headingToHub ? hubLng : pickupLng;
      const startLat = call?.tracking?.driverLocation?.lat ?? targetLat - 0.01;
      const startLng = call?.tracking?.driverLocation?.lng ?? targetLng + 0.01;
      let step = 0;

      const tick = async () => {
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

      void tick();
      const timer = window.setInterval(() => {
        void tick();
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

    setMessage("이 기기에서는 GPS 사용이 어려워 시뮬레이션 위치를 전송합니다.");
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

  const crewLocation = call?.tracking?.driverLocation
    ? { lat: call.tracking.driverLocation.lat, lng: call.tracking.driverLocation.lng }
    : null;
  const pickupLocation =
    call?.booking?.pickupLat != null && call?.booking?.pickupLng != null
      ? { lat: call.booking.pickupLat, lng: call.booking.pickupLng }
      : null;
  const hubLocation = call?.tracking?.processingCenter
    ? { lat: call.tracking.processingCenter.lat, lng: call.tracking.processingCenter.lng }
    : null;

  const mapCenter = crewLocation ?? pickupLocation ?? hubLocation ?? { lat: 37.5665, lng: 126.978 };
  const mapMarkers = [
    ...(pickupLocation ? [{ key: "pickup", label: "P", position: pickupLocation, variant: "pickup" as const }] : []),
    ...(crewLocation ? [{ key: "crew", label: "C", position: crewLocation, variant: "crew" as const }] : []),
    ...(hubLocation ? [{ key: "hub", label: "H", position: hubLocation, variant: "hub" as const }] : []),
  ];
  const mapPath = crewLocation && routeTarget ? [crewLocation, routeTarget] : [];
  const pickupAddress = call?.pickupRequest?.address ?? "수거 위치 정보 없음";
  const hubAddress = call?.tracking?.processingCenter?.label ?? "처리 허브 정보 없음";
  const crewAddress = crewLocation ? "크루 현재 이동 위치" : "크루 위치 확인 중";
  const crewToPickupDistance = formatDistance(call?.tracking?.metrics?.crewToPickupMeters);
  const crewToHubDistance = formatDistance(call?.tracking?.metrics?.crewToProcessingCenterMeters);

  return (
    <CrewPhoneShell>
      <div className="flex min-h-0 flex-1 flex-col overflow-auto px-5 pb-5">
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
          <p className="text-xs font-black text-white/70">진행 중인 수거</p>
          <h1 className="mt-2 text-2xl font-black">{call ? applianceName(call) : "수거 요청"}</h1>
          <p className="mt-2 text-sm font-semibold text-white/85">{call?.pickupRequest?.address ?? "수거 주소 정보 없음"}</p>
        </section>

        <section className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-white">
          {googleMapsApiKey ? (
            <GoogleCanvasMap
              apiKey={googleMapsApiKey}
              center={mapCenter}
              className="h-[260px] w-full"
              fitBounds
              markers={mapMarkers.map((marker) => ({
                key: marker.key,
                label: marker.label,
                position: marker.position,
                title: marker.key,
              }))}
              path={mapPath}
              zoom={16}
            />
          ) : (
            <LeafletTrackingMap center={mapCenter} className="h-[260px] w-full" markers={mapMarkers} path={mapPath} />
          )}
          <div className="grid grid-cols-1 gap-2 border-t border-slate-200 bg-white p-4">
            <InfoTile label="크루 현재 위치" value={`${crewAddress} · 수거지까지 ${crewToPickupDistance}`} />
            <InfoTile label="수거 위치" value={pickupAddress} />
            <InfoTile label="처리 허브" value={`${hubAddress} · 허브까지 ${crewToHubDistance}`} />
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-2">
          <InfoTile label="현재 상태" value={statusLabel(status)} />
          <InfoTile label="수거지까지" value={crewToPickupDistance} />
          <InfoTile label="허브까지" value={crewToHubDistance} />
          <InfoTile label="좌표 갱신 시각" value={formatDateTime(call?.tracking?.driverLocation?.updatedAt)} />
        </section>

        <section className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-black text-black">
            <Navigation size={16} />
            진행 안내
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2">
            <InfoTile label="수거 위치" value={call?.pickupRequest?.address ?? "-"} />
            <InfoTile label="처리 허브" value={call?.tracking?.processingCenter?.label ?? "-"} />
            <InfoTile
              label="실시간 위치 상태"
              value={call?.tracking?.metrics?.locationLive ? "실시간 GPS 반영 중" : "위치 확인 중"}
            />
          </div>
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
                    ? "e-waste 공장 전달 완료 반영"
                    : "실시간 위치 공유"}
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
      <p className="mt-1 text-sm font-black leading-6 text-black">{value}</p>
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
