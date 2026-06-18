"use client";

import { CrewPhoneShell } from "@/components/CrewPhoneShell";
import { KakaoCanvasMap } from "@/components/maps/KakaoCanvasMap";
import {
  applianceName,
  completeCrewCall,
  departCrewCall,
  fetchCrewCallDetail,
  formatDistance,
  statusLabel,
  updateCrewLocation,
  type CrewCall,
} from "@/lib/crew-api";
import { ArrowLeft, Home, MapPin, Navigation, Truck, Warehouse, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type Coordinate = {
  lat: number;
  lng: number;
};

type LocationPayload = {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracyMeters?: number;
  collectedAt?: string;
  source?: string;
};

type TrackingMetrics = NonNullable<NonNullable<CrewCall["tracking"]>["metrics"]>;

type PickupMapMarker = {
  key: "pickup" | "crew" | "hub";
  label?: string;
  position: Coordinate;
  title: string;
  variant: "pickup" | "crew" | "hub";
};

const kakaoMapAppKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY?.trim() ?? "";
const DEFAULT_PICKUP_PHOTO = "crew-pickup-proof-demo.jpg";
const DEFAULT_HUB_PHOTO = "crew-hub-proof-demo.jpg";
const DEFAULT_PICKUP_MEMO = "문앞 도착 후 상태 확인 및 수거 완료";
const DEFAULT_HUB_MEMO = "e-waste 공장 전달 및 처리 완료 등록";

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hour = String(parsed.getHours()).padStart(2, "0");
  const minute = String(parsed.getMinutes()).padStart(2, "0");

  return `${month}.${day} ${hour}:${minute}`;
}

function formatEta(durationLabel?: string | null) {
  return durationLabel && durationLabel.trim().length > 0 ? durationLabel : "-";
}

function kakaoWalkRouteUrl(origin: Coordinate, destination: Coordinate) {
  return `https://map.kakao.com/link/by/walk/crew,${origin.lat},${origin.lng}/pickup,${destination.lat},${destination.lng}`;
}

export default function CrewActiveCallPage() {
  const router = useRouter();
  const params = useParams<{ pickupRequestId: string }>();
  const pickupRequestId = Number(params.pickupRequestId);

  const [call, setCall] = useState<CrewCall | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedPickupOpen, setSelectedPickupOpen] = useState(false);
  const [selectedMapCenter, setSelectedMapCenter] = useState<Coordinate | null>(null);
  const [selectedMapZoom, setSelectedMapZoom] = useState<number | null>(null);

  const loadCall = async () => {
    setLoading(true);
    try {
      const data = await fetchCrewCallDetail(pickupRequestId);
      setCall(data);
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
    if (!locationTrackingEnabled) return undefined;

    let stopped = false;
    let fallbackCleanup: (() => void) | undefined;
    let lastSentAt = 0;
    let bestPosition: GeolocationPosition | null = null;
    let bestFixTimer: number | undefined;
    let lastSentPoint: Coordinate | null = null;

    const sendLocation = async (payload: LocationPayload) => {
      try {
        const updated = await updateCrewLocation(pickupRequestId, payload);
        if (!stopped) {
          setCall(updated);
        }
      } catch {
        if (!stopped) {
          setMessage("크루 위치 전송 중 문제가 발생했습니다.");
        }
      }
    };

    const startFallbackSimulation = () => {
      if (call?.booking?.pickupLat == null || call?.booking?.pickupLng == null) {
        setMessage("수거지 좌표가 없어 위치 시뮬레이션을 시작할 수 없습니다.");
        return () => undefined;
      }

      const pickupLat = call.booking.pickupLat;
      const pickupLng = call.booking.pickupLng;
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
          accuracyMeters: 999,
          collectedAt: new Date().toISOString(),
          source: "simulation",
        });
      };

      void tick();
      const timer = window.setInterval(() => {
        void tick();
      }, 3000);

      return () => window.clearInterval(timer);
    };

    if ("geolocation" in navigator && window.isSecureContext) {
      const sendBrowserPosition = (position: GeolocationPosition) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const now = Date.now();
        const movedMeters = lastSentPoint ? distanceMeters(lastSentPoint, point) : Number.POSITIVE_INFINITY;
        const accuracy = position.coords.accuracy;

        if (now - position.timestamp > 10000) return;
        if (now - lastSentAt < 2500 && movedMeters < 10 && accuracy > 25) return;

        lastSentAt = now;
        lastSentPoint = point;
        void sendLocation({
          lat: point.lat,
          lng: point.lng,
          heading: position.coords.heading ?? 0,
          speed: position.coords.speed ?? 0,
          accuracyMeters: accuracy,
          collectedAt: new Date(position.timestamp).toISOString(),
          source: "browser_geolocation",
        });
      };

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (Date.now() - position.timestamp > 10000) return;

          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }

          if (position.coords.accuracy <= 25) {
            if (bestFixTimer) {
              window.clearTimeout(bestFixTimer);
              bestFixTimer = undefined;
            }
            bestPosition = null;
            sendBrowserPosition(position);
            return;
          }

          if (!bestFixTimer) {
            bestFixTimer = window.setTimeout(() => {
              if (bestPosition) {
                sendBrowserPosition(bestPosition);
                bestPosition = null;
              }
              bestFixTimer = undefined;
            }, 5000);
          }
        },
        () => {
          if (!fallbackCleanup) {
            fallbackCleanup = startFallbackSimulation();
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000,
        },
      );

      return () => {
        stopped = true;
        navigator.geolocation.clearWatch(watchId);
        if (bestFixTimer) {
          window.clearTimeout(bestFixTimer);
        }
        fallbackCleanup?.();
      };
    }

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

  const runAction = async (action: "depart" | "complete") => {
    setLoading(true);

    try {
      const updated =
        action === "depart"
          ? await departCrewCall(pickupRequestId)
          : await completeCrewCall(pickupRequestId, {
              pickupPhotoFileName: DEFAULT_PICKUP_PHOTO,
              hubPhotoFileName: DEFAULT_HUB_PHOTO,
              inspectionMemo: DEFAULT_PICKUP_MEMO,
              hubMemo: DEFAULT_HUB_MEMO,
            });

      setCall(updated);
      setMessage(action === "complete" ? "처리 완료가 반영되었습니다." : null);
    } catch {
      setMessage("진행 처리 중 문제가 발생했습니다.");
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

  const pickupAddress = call?.pickupRequest?.address ?? "수거지 주소 정보가 없습니다.";
  const routeTarget = status === "ARRIVED" || status === "COMPLETED" ? hubLocation ?? pickupLocation : pickupLocation;
  const mapCenter = selectedMapCenter ?? crewLocation ?? pickupLocation ?? hubLocation;
  const mapZoom = selectedMapZoom ?? 16;
  const mapMarkers: PickupMapMarker[] = [
    ...(pickupLocation
      ? [{ key: "pickup" as const, label: "home", position: pickupLocation, title: "수거지", variant: "pickup" as const }]
      : []),
    ...(crewLocation
      ? [{ key: "crew" as const, label: "C", position: crewLocation, title: "크루 현재 위치", variant: "crew" as const }]
      : []),
    ...(hubLocation
      ? [{ key: "hub" as const, label: "H", position: hubLocation, title: "처리 허브", variant: "hub" as const }]
      : []),
  ];

  const roadRoutePoints =
    call?.tracking?.route?.points?.map((point) => ({
      lat: point.lat,
      lng: point.lng,
    })) ?? [];
  const hasRoadRoute = roadRoutePoints.length > 1;
  const canOpenWalkLink = Boolean(crewLocation && routeTarget);
  const routeDistanceLabel = call?.tracking?.route?.distanceLabel ?? formatDistance(call?.tracking?.metrics?.crewToPickupMeters);
  const routeDurationLabel = formatEta(call?.tracking?.route?.durationLabel);
  const hubAddress = call?.tracking?.processingCenter?.label ?? "처리 허브 정보가 없습니다.";
  const hubDistance = formatDistance(call?.tracking?.metrics?.crewToProcessingCenterMeters);
  const detailAddress = call?.booking?.detailAddress?.trim() || "상세 위치 정보 없음";
  const canDepart = status === "ASSIGNED";
  const canComplete = ["IN_PROGRESS", "ARRIVED"].includes(status);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(`/calls/${pickupRequestId}`);
  };

  const handleMarkerClick = (marker: { key: string; position: Coordinate }) => {
    if (marker.key !== "pickup") return;
    setSelectedPickupOpen(true);
    setSelectedMapCenter(marker.position);
    setSelectedMapZoom(18);
  };

  const closePickupCard = () => {
    setSelectedPickupOpen(false);
    setSelectedMapCenter(null);
    setSelectedMapZoom(null);
  };

  return (
    <CrewPhoneShell>
      <div className="relative flex min-h-0 flex-1 flex-col bg-cloud px-4 pb-0">
        <div className="phone-scroll min-h-0 flex-1 overflow-y-auto pb-44">
          <header className="flex items-start justify-between">
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white bg-white text-ink shadow-sm"
              onClick={handleBack}
              type="button"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              className="flex h-11 items-center gap-2 rounded-full border border-white bg-white px-4 text-sm font-black text-slate-700 shadow-sm"
              onClick={() => router.push("/")}
              type="button"
            >
              <Home size={14} />
              홈
            </button>
          </header>

          <section className="mt-3 rounded-[20px] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-ink">
              <Navigation size={16} className="text-lgred" />
              이동 지도
            </div>

            <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200 bg-cloud">
              {mapCenter ? (
                kakaoMapAppKey ? (
                  <div className="relative isolate overflow-hidden">
                    <KakaoCanvasMap
                      appKey={kakaoMapAppKey}
                      center={mapCenter}
                      className="relative z-0 h-[500px] w-full"
                      fitBounds
                      markers={mapMarkers}
                      onMarkerClick={handleMarkerClick}
                      path={roadRoutePoints}
                      routeColor={hasRoadRoute ? "#d33126" : "#64748b"}
                      routeOpacity={hasRoadRoute ? 0.94 : 0.58}
                      routeWeight={hasRoadRoute ? 10 : 5}
                      zoom={mapZoom}
                    />

                    <div className="pointer-events-none absolute left-3 right-3 top-3 z-30 rounded-[18px] bg-white/95 px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.10)] backdrop-blur">
                      <p className="text-xs font-black text-lgred">{statusLabel(status)}</p>
                      <p className="mt-1 text-sm font-black text-ink">{call ? applianceName(call) : "진행 중인 수거"}</p>
                      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{pickupAddress}</p>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between rounded-[16px] bg-white/95 px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.10)] backdrop-blur">
                      <div>
                        <p className="text-xs font-black text-slate-500">현재 경로 정보</p>
                        <p className="mt-1 text-sm font-black text-ink">
                          {routeDistanceLabel} · {routeDurationLabel}
                        </p>
                      </div>
                      {canOpenWalkLink && crewLocation && routeTarget ? (
                        <button
                          className="rounded-full bg-ink px-3 py-1 text-xs font-black text-white"
                          onClick={() =>
                            window.open(kakaoWalkRouteUrl(crewLocation, routeTarget), "_blank", "noopener,noreferrer")
                          }
                          type="button"
                        >
                          카카오맵 열기
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[500px] w-full items-center justify-center px-6 text-center">
                    <div>
                      <p className="text-sm font-black text-ink">Kakao Maps 연결이 필요합니다.</p>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                        `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` 환경변수를 설정하면 지도를 확인할 수 있어요.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex h-[500px] w-full items-center justify-center px-6 text-center">
                  <div>
                    <p className="text-sm font-black text-ink">이동 지도를 표시할 수 없습니다.</p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                      수거지 좌표 또는 크루 위치가 확인되면 경로가 표시됩니다.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {selectedPickupOpen ? (
              <div className="mt-3 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-5">
                  <div>
                    <p className="text-[28px] font-black leading-none text-ink">{call ? applianceName(call) : "수거지 정보"}</p>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{pickupAddress}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">{detailAddress}</p>
                  </div>
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-cloud text-slate-500"
                    onClick={closePickupCard}
                    type="button"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 px-5 pb-5 pt-3">
                  <InfoTile label="현재 상태" value={statusLabel(status)} />
                  <InfoTile label="수거지까지" value={routeDistanceLabel} />
                  <InfoTile label="예상 시간" value={routeDurationLabel} />
                  <InfoTile label="처리 허브" value={`${hubAddress} · ${hubDistance}`} />
                </div>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3">
                <InfoTile label="수거지 주소" value={pickupAddress} />
                <InfoTile label="처리 허브" value={hubAddress} />
                <InfoTile label="위치 갱신 시각" value={formatDateTime(call?.tracking?.driverLocation?.updatedAt)} />
              </div>
            )}
          </section>

          <section className="mt-3 rounded-[20px] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-black text-ink">
              <Truck size={16} className="text-lgred" />
              진행 처리
            </div>

            <div className="mt-4 space-y-3">
              <ProgressActionCard
                active={canDepart}
                disabled={loading || !canDepart}
                icon={<Truck size={18} />}
                label="수거지 출발"
                description="콜 수락 후 수거지로 이동을 시작할 때 눌러 주세요."
                onClick={() => void runAction("depart")}
              />
              <ProgressActionCard
                active={canComplete}
                disabled={loading || !canComplete}
                icon={<Warehouse size={18} />}
                label="처리 완료"
                description="수거 후 처리 허브 전달이 끝나면 완료로 등록됩니다."
                onClick={() => void runAction("complete")}
              />
            </div>
          </section>

          <section className="mt-3 rounded-[20px] bg-white p-4 shadow-sm">
            <div className="text-sm font-black text-ink">현재 진행 안내</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <InfoTile label="진행 상태" value={statusLabel(status)} />
              <InfoTile label="예상 시간" value={routeDurationLabel} />
            </div>
          </section>
        </div>

        <div className="absolute bottom-0 left-0 right-0 rounded-t-[24px] border-t border-slate-200 bg-white/95 px-4 pb-4 pt-3 shadow-[0_-8px_20px_rgba(15,23,42,0.06)] backdrop-blur">
          <button
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[16px] border border-slate-200 bg-white text-sm font-black text-slate-700"
            onClick={() => router.push("/active")}
            type="button"
          >
            목록으로 돌아가기
          </button>

          {message ? (
            <div className="mt-3 rounded-[16px] bg-cloud px-4 py-3 text-sm font-bold leading-6 text-slate-600">{message}</div>
          ) : null}
        </div>
      </div>
    </CrewPhoneShell>
  );
}

function ProgressActionCard({
  active,
  disabled,
  icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  icon: ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex min-h-[92px] w-full items-start gap-4 rounded-[18px] border p-4 text-left transition ${
        active ? "border-lgred/25 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)]" : "border-slate-200 bg-cloud text-slate-400"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span
        className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] ${
          active ? "bg-lgred text-white" : "bg-white text-slate-300"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-black ${active ? "text-ink" : "text-slate-400"}`}>{label}</span>
        <span className="mt-2 block text-sm leading-6 text-slate-500">{description}</span>
      </span>
    </button>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-cloud p-4">
      <p className="text-[11px] font-bold text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-black leading-6 text-ink">{value}</p>
    </div>
  );
}
