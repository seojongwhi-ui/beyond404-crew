"use client";

export type NearbyCrew = {
  crewId: number | null;
  crewName: string;
  status: string;
  lat: number;
  lng: number;
  distanceMeters: number;
  assigned: boolean;
};

export type CrewCall = {
  id: number;
  status: string;
  appliance?: {
    applianceType: string;
    brand: string;
    modelName?: string | null;
  } | null;
  userConsent?: {
    agreedToCreditPolicy: boolean;
    notice: string;
    agreedAt?: string | null;
  } | null;
  captureEvidence?: {
    pickupPhotoFileName?: string | null;
    hubPhotoFileName?: string | null;
    pickupInspectionMemo?: string | null;
    hubMemo?: string | null;
  } | null;
  selectedProduct?: {
    productName: string;
    productGrade: string;
    productPrice: number;
  } | null;
  pickupRequest?: {
    pickupRequestId: number;
    pickupType: string;
    status: string;
    crewId?: number | null;
    crewName: string | null;
    address: string | null;
    scheduledAt: string;
    requestedAt?: string | null;
    nearbyCrews?: NearbyCrew[];
  } | null;
  crewProfile?: {
    name: string;
    photoUrl: string;
    rating: number;
    reviewSummary: string[];
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
    nearbyCrews?: NearbyCrew[];
    driverLocation?: {
      lat: number;
      lng: number;
      heading: number;
      speed: number;
      updatedAt?: string | null;
    } | null;
  } | null;
  settlement?: {
    baseFee: number | null;
    distanceFee: number | null;
    incentive: number | null;
    penalty: number | null;
    totalAmount: number | null;
    status: string;
  } | null;
};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function resolveApiBaseUrl() {
  const publicBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (publicBaseUrl) {
    return trimTrailingSlash(publicBaseUrl);
  }

  if (typeof window === "undefined") {
    return "http://127.0.0.1:8080";
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
    const body = await response.text().catch(() => "");
    throw new Error(body || `Crew API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchCrewCalls() {
  return crewRequest<CrewCall[]>("/api/crew/calls");
}

export function fetchCrewCallDetail(pickupRequestId: number) {
  return crewRequest<CrewCall>(`/api/crew/calls/${pickupRequestId}`);
}

export function acceptCrewCall(pickupRequestId: number) {
  return crewRequest<CrewCall>(`/api/crew/calls/${pickupRequestId}/accept`, { method: "POST" });
}

export function departCrewCall(pickupRequestId: number) {
  return crewRequest<CrewCall>(`/api/crew/pickups/${pickupRequestId}/depart`, { method: "POST" });
}

export function arriveCrewCall(pickupRequestId: number) {
  return crewRequest<CrewCall>(`/api/crew/pickups/${pickupRequestId}/arrive`, { method: "POST" });
}

export function completeCrewCall(
  pickupRequestId: number,
  payload: {
    pickupPhotoFileName: string;
    hubPhotoFileName: string;
    inspectionMemo: string;
    hubMemo: string;
  },
) {
  return crewRequest<CrewCall>(`/api/crew/pickups/${pickupRequestId}/complete`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCrewLocation(
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

export function applianceName(call: CrewCall) {
  const model = call.appliance?.modelName ?? "LG demo model";
  const type = call.appliance?.applianceType ?? "washing_machine";

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

export function formatRequestTime(requestedAt?: string | null, scheduledAt?: string | null) {
  const source = requestedAt ?? scheduledAt;
  if (!source) return "-";

  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return source;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

export function pickupTypeLabel(value?: string | null) {
  if (value === "INSTANT_CALL") return "바로콜";
  if (value === "BOOKING") return "시간 예약";
  return "-";
}

export function formatDistance(distance: number | null | undefined) {
  if (distance == null) return "-";
  if (distance >= 1000) return `${(distance / 1000).toFixed(1)} km`;
  return `${Math.round(distance)} m`;
}

export function statusLabel(status?: string | null) {
  switch (status) {
    case "REQUESTED":
      return "수락 대기";
    case "CONFIRMED":
      return "예약 확정";
    case "ASSIGNED":
      return "수락 완료";
    case "IN_PROGRESS":
      return "수거지 이동 중";
    case "ARRIVED":
      return "문앞 도착";
    case "COMPLETED":
      return "허브 완료";
    default:
      return status ?? "-";
  }
}
