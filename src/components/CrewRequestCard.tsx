"use client";

import Link from "next/link";
import { Check, ChevronRight, PackageCheck, Truck, X } from "lucide-react";
import {
  applianceName,
  calculateCrewSettlement,
  formatCallTime,
  formatDistance,
  formatKrwAmount,
  pickupTypeLabel,
  type CrewCall,
} from "@/lib/crew-api";

type CrewRequestCardProps = {
  accepting?: boolean;
  blocked?: boolean;
  call: CrewCall;
  detailHref?: string;
  onAccept?: () => void;
  onReject?: () => void;
};

export function CrewRequestCard({
  accepting = false,
  blocked = false,
  call,
  detailHref,
  onAccept,
  onReject,
}: CrewRequestCardProps) {
  const pickupRequestId = getPickupRequestId(call);
  const href = detailHref ?? (pickupRequestId ? `/calls/${pickupRequestId}` : null);

  return (
    <article className="rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-lgred/10 text-lgred">
          <PackageCheck size={21} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-lgred/10 px-2.5 py-1 text-[11px] font-bold text-lgred">
                새 요청
              </span>
              <h3 className="mt-2 truncate text-[16px] font-bold leading-tight text-ink">{applianceName(call)}</h3>
            </div>
            {href ? (
              <Link
                className="flex shrink-0 items-center gap-1 rounded-full bg-cloud px-2.5 py-1.5 text-[11px] font-bold text-slate-600"
                href={href}
              >
                상세
                <ChevronRight size={13} />
              </Link>
            ) : null}
          </div>

          <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-5 text-slate-500">
            {call.pickupRequest?.address ?? "수거 주소 정보가 없습니다."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <InfoTile label="예상 정산" value={getPayoutLabel(call)} highlight />
        <InfoTile label="현재 거리" value={getDistanceLabel(call)} />
        <InfoTile label="요청 시간" value={formatCallTime(call)} />
        <InfoTile label="예약 방식" value={pickupTypeLabel(call.pickupRequest?.pickupType)} />
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-[14px] bg-cloud px-3 py-2 text-[12px] font-bold text-slate-500">
        <Truck size={14} />
        <span className="truncate">{getLegDistanceLabel(call)}</span>
      </div>

      {call.selectedProduct ? (
        <div className="mt-3 rounded-[16px] bg-lgred/5 px-3 py-3">
          <p className="text-[10px] font-bold text-lgred/70">선택 구매 제품</p>
          <p className="mt-1 truncate text-[13px] font-bold text-ink">{call.selectedProduct.productName}</p>
          <p className="mt-1 text-[12px] font-bold text-lgred">{formatKrwAmount(call.selectedProduct.productPrice)}</p>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className="flex h-11 items-center justify-center gap-1.5 rounded-[15px] bg-lgred text-[13px] font-bold text-white shadow-[0_10px_20px_rgba(166,15,59,0.2)] disabled:bg-slate-300 disabled:shadow-none"
          disabled={accepting || blocked}
          onClick={onAccept}
          type="button"
        >
          <Check size={15} />
          {blocked ? "진행 중" : accepting ? "수락 중" : "수락"}
        </button>
        <button
          className="flex h-11 items-center justify-center gap-1.5 rounded-[15px] border border-slate-200 bg-white text-[13px] font-bold text-slate-600"
          onClick={onReject}
          type="button"
        >
          <X size={15} />
          거절
        </button>
      </div>

      {blocked ? (
        <p className="mt-3 rounded-[13px] bg-slate-50 px-3 py-2 text-[11px] font-semibold leading-4 text-slate-500">
          진행 중인 수거를 처리 완료하면 새 요청을 수락할 수 있어요.
        </p>
      ) : null}
    </article>
  );
}

function InfoTile({ highlight = false, label, value }: { highlight?: boolean; label: string; value: string }) {
  return (
    <div className={`min-w-0 rounded-[14px] px-3 py-3 ${highlight ? "bg-lgred/10" : "bg-cloud"}`}>
      <p className={`text-[10px] font-bold ${highlight ? "text-lgred/70" : "text-slate-400"}`}>{label}</p>
      <p className={`mt-1 truncate text-[13px] font-bold ${highlight ? "text-lgred" : "text-ink"}`}>{value}</p>
    </div>
  );
}

export function getPickupRequestId(call: CrewCall) {
  return call.pickupRequest?.pickupRequestId ?? call.id;
}

function getDistanceMeters(call: CrewCall) {
  const assignedCrew = call.pickupRequest?.nearbyCrews?.find((crew) => crew.assigned);
  const nearestCrew = call.pickupRequest?.nearbyCrews?.[0];

  return (
    call.tracking?.route?.distanceMeters ??
    call.tracking?.metrics?.crewToPickupMeters ??
    assignedCrew?.distanceMeters ??
    nearestCrew?.distanceMeters ??
    null
  );
}

function getDistanceLabel(call: CrewCall) {
  return call.tracking?.route?.distanceLabel ?? formatDistance(getDistanceMeters(call));
}

function getLegDistanceLabel(call: CrewCall) {
  const settlement = calculateCrewSettlement(call);
  return `수거 ${formatDistance(settlement.pickupDistanceMeters)} · 허브 ${formatDistance(settlement.hubDistanceMeters)}`;
}

function getPayoutLabel(call: CrewCall) {
  return formatKrwAmount(calculateCrewSettlement(call).totalAmount);
}
