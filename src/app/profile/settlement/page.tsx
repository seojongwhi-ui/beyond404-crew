"use client";

import { CrewPhoneShell } from "@/components/CrewPhoneShell";
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck, WalletCards } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

export default function CrewSettlementPage() {
  const router = useRouter();
  const [requestSent, setRequestSent] = useState(false);

  return (
    <CrewPhoneShell>
      <div className="flex min-h-0 flex-1 flex-col bg-cloud px-4 pb-6">
        <header className="relative mb-3 flex items-center justify-between">
          <button
            aria-label="내정보로 돌아가기"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink"
            onClick={() => router.push("/profile")}
            type="button"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-xs font-semibold leading-none text-lgred">LG Crew</p>
            <p className="mt-1 text-[11px] font-semibold leading-none text-slate-500">Settlement</p>
          </div>
          <span className="h-9 w-9" aria-hidden />
        </header>

        <section className="phone-scroll min-h-0 flex-1 overflow-y-auto pb-4 pt-3">
          <p className="text-[12px] font-bold text-lgred">SETTLEMENT</p>
          <h1 className="mt-1 text-[24px] font-bold leading-tight text-ink">정산 계좌 관리</h1>

          <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-lgred/10 text-lgred">
                <CreditCard size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-slate-500">등록 계좌</p>
                <p className="mt-1 text-[20px] font-bold text-ink">신한은행 110-****-4821</p>
                <p className="mt-2 text-[12px] font-semibold leading-5 text-slate-500">예금주 무함마드</p>
              </div>
            </div>

            <button
              className={`mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[16px] text-[14px] font-black transition ${
                requestSent ? "bg-emerald-50 text-emerald-700" : "bg-lgred text-white"
              }`}
              onClick={() => setRequestSent(true)}
              type="button"
            >
              {requestSent ? <CheckCircle2 size={17} /> : <CreditCard size={17} />}
              {requestSent ? "계좌 변경 요청이 접수됐어요" : "계좌 변경 요청하기"}
            </button>
          </section>

          <section className="mt-3 rounded-[24px] bg-white p-4 shadow-sm">
            <InfoRow
              icon={<WalletCards size={18} />}
              title="정산 주기"
              description="허브 전달 완료 후 당일 정산 실적에 자동 반영됩니다."
            />
            <InfoRow
              icon={<ShieldCheck size={18} />}
              title="계좌 보호"
              description="계좌 변경은 운영자 확인 후 반영되는 방식으로 관리됩니다."
            />
          </section>
        </section>
      </div>
    </CrewPhoneShell>
  );
}

function InfoRow({ description, icon, title }: { description: string; icon: ReactNode; title: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-cloud text-lgred">{icon}</span>
      <div>
        <p className="text-[14px] font-bold text-ink">{title}</p>
        <p className="mt-1 text-[12px] font-semibold leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}
