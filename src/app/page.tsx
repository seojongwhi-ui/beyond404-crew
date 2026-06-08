"use client";

import {
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Home,
  IdCard,
  Info,
  MapPin,
  PackageCheck,
  Phone,
  Search,
  ShieldCheck,
  Truck,
  UserCheck,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type Screen =
  | "login"
  | "verify"
  | "account"
  | "pickup"
  | "terms"
  | "complete"
  | "ready"
  | "dashboard";

const regionOptions = ["New Delhi", "Gurugram", "Noida", "Bengaluru"];
const vehicleOptions = ["LG Pickup Van", "Small Truck", "Motorbike", "Partner Vehicle"];
const applianceOptions = ["세탁기", "냉장고", "에어컨", "TV"];

export default function CrewAppPage() {
  const [screen, setScreen] = useState<Screen>("login");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [saveId, setSaveId] = useState(true);

  const canLogin = loginId.trim().length > 0 && password.trim().length > 0;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#202124] px-3 py-8">
      <section className="relative w-[min(100%,424px)] rounded-[52px] border-[8px] border-[#090a0f] bg-[#090a0f] p-[3px] shadow-phone">
        <div className="aspect-[402/874] overflow-hidden rounded-[43px] bg-white">
          <div className="flex h-full flex-col">
            <PhoneStatusBar />
            {screen === "login" ? (
              <LoginScreen
                canLogin={canLogin}
                loginId={loginId}
                password={password}
                saveId={saveId}
                onLogin={() => setScreen("ready")}
                onPasswordChange={setPassword}
                onSaveIdChange={() => setSaveId((value) => !value)}
                onSignUp={() => setScreen("verify")}
                onLoginIdChange={setLoginId}
              />
            ) : null}
            {screen === "verify" ? (
              <VerifyScreen onBack={() => setScreen("login")} onClose={() => setScreen("login")} onNext={() => setScreen("account")} />
            ) : null}
            {screen === "account" ? (
              <AccountScreen onBack={() => setScreen("verify")} onClose={() => setScreen("login")} onNext={() => setScreen("pickup")} />
            ) : null}
            {screen === "pickup" ? (
              <PickupInfoScreen onBack={() => setScreen("account")} onClose={() => setScreen("login")} onNext={() => setScreen("terms")} />
            ) : null}
            {screen === "terms" ? (
              <TermsScreen onBack={() => setScreen("pickup")} onClose={() => setScreen("login")} onNext={() => setScreen("complete")} />
            ) : null}
            {screen === "complete" ? (
              <CompleteScreen onClose={() => setScreen("login")} onLogin={() => setScreen("ready")} />
            ) : null}
            {screen === "ready" ? <ReadyScreen onStart={() => setScreen("dashboard")} /> : null}
            {screen === "dashboard" ? <CrewDashboard onLogout={() => setScreen("login")} /> : null}
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

function LoginScreen({
  canLogin,
  loginId,
  password,
  saveId,
  onLogin,
  onLoginIdChange,
  onPasswordChange,
  onSaveIdChange,
  onSignUp,
}: {
  canLogin: boolean;
  loginId: string;
  password: string;
  saveId: boolean;
  onLogin: () => void;
  onLoginIdChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSaveIdChange: () => void;
  onSignUp: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pb-8 pt-20">
      <div>
        <p className="text-[42px] font-black leading-none text-black">LG SwapIt Crew</p>
        <h1 className="mt-3 text-[31px] leading-tight text-black">수거를 시작해볼까요?</h1>
      </div>

      <div className="mt-16 space-y-3">
        <TextInput placeholder="아이디" value={loginId} onChange={onLoginIdChange} />
        <TextInput placeholder="비밀번호" type="password" value={password} onChange={onPasswordChange} />
      </div>

      <button className="mt-6 flex items-center gap-3 text-left" onClick={onSaveIdChange} type="button">
        <CheckBox checked={saveId} />
        <span className="text-xl font-bold text-black">아이디 저장</span>
      </button>

      <button
        className={`mt-14 h-14 w-full rounded-[8px] text-2xl font-black text-white ${
          canLogin ? "bg-mint" : "bg-[#d9d9d9]"
        }`}
        disabled={!canLogin}
        onClick={onLogin}
        type="button"
      >
        로그인
      </button>

      <div className="mt-8 text-center text-lg font-semibold text-slate-400">
        아이디 찾기 <span className="mx-3 text-slate-300">|</span> 비밀번호 찾기
      </div>

      <button className="mt-auto text-center text-xl font-bold text-black" onClick={onSignUp} type="button">
        처음이라면? <span className="font-black text-mint">크루 가입하기</span>
        <ChevronRight className="inline align-[-3px]" size={23} />
      </button>
    </div>
  );
}

function VerifyScreen({
  onBack,
  onClose,
  onNext,
}: {
  onBack: () => void;
  onClose: () => void;
  onNext: () => void;
}) {
  return (
    <OnboardingShell currentStep={1} totalSteps={4} onBack={onBack} onClose={onClose}>
      <TitleBlock title="휴대폰 본인인증을 진행해주세요" />
      <p className="mt-14 text-[22px] leading-8 text-slate-500">
        신규 가입을 위해 아래 버튼을 눌러 휴대폰 본인인증을 진행해주세요.
      </p>
      <NoticeBox
        title="본인인증 관련 안내"
        items={[
          "만 19세 이상 지원 가능합니다.",
          "실제 서비스에서는 통신사 본인인증 또는 신분 확인 API와 연결됩니다.",
          "데모에서는 버튼 클릭으로 인증 완료 처리합니다.",
        ]}
      />
      <BottomButton label="휴대폰 본인인증" active onClick={onNext} />
    </OnboardingShell>
  );
}

function AccountScreen({
  onBack,
  onClose,
  onNext,
}: {
  onBack: () => void;
  onClose: () => void;
  onNext: () => void;
}) {
  const [crewId, setCrewId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const canNext = crewId.length >= 4 && password.length >= 6 && password === passwordConfirm;

  return (
    <OnboardingShell currentStep={2} totalSteps={4} onBack={onBack} onClose={onClose}>
      <TitleBlock title="가입 정보를 입력해주세요" />
      <div className="mt-12">
        <Label text="아이디" />
        <div className="grid grid-cols-[1fr_96px] gap-2">
          <TextInput placeholder="사용하실 아이디" value={crewId} onChange={setCrewId} />
          <button className="h-14 rounded-[8px] border border-slate-200 text-lg font-black text-slate-500" type="button">
            중복확인
          </button>
        </div>
      </div>
      <div className="mt-8">
        <Label text="비밀번호" />
        <TextInput placeholder="영문, 숫자 혼합 6자리 이상" type="password" value={password} onChange={setPassword} />
        <div className="mt-3">
          <TextInput
            placeholder="다시 한번 입력해주세요"
            type="password"
            value={passwordConfirm}
            onChange={setPasswordConfirm}
          />
        </div>
      </div>
      <button className="mt-8 w-full text-center text-lg font-bold text-slate-500 underline" type="button">
        추천인이 있나요?
      </button>
      <BottomButton label="다음으로" active={canNext} onClick={onNext} />
    </OnboardingShell>
  );
}

function PickupInfoScreen({
  onBack,
  onClose,
  onNext,
}: {
  onBack: () => void;
  onClose: () => void;
  onNext: () => void;
}) {
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [region, setRegion] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [selectedAppliances, setSelectedAppliances] = useState<string[]>(["세탁기", "냉장고"]);

  const canNext = address.length > 3 && detailAddress.length > 2 && region && vehicle;

  const toggleAppliance = (item: string) => {
    setSelectedAppliances((current) =>
      current.includes(item) ? current.filter((value) => value !== item) : [...current, item],
    );
  };

  return (
    <OnboardingShell currentStep={3} totalSteps={4} onBack={onBack} onClose={onClose} scroll>
      <TitleBlock title="수거 정보를 입력해주세요" />
      <div className="mt-12">
        <Label
          text="거주지 주소"
          trailing={<CircleHelp size={16} className="text-slate-400" />}
        />
        <div className="grid grid-cols-[1fr_56px] gap-2">
          <TextInput placeholder="예) New Delhi A-12" value={address} onChange={setAddress} />
          <button className="flex h-14 items-center justify-center rounded-[8px] border border-slate-200" type="button">
            <Search size={24} />
          </button>
        </div>
        <div className="mt-3">
          <TextInput placeholder="나머지 주소를 입력하세요" value={detailAddress} onChange={setDetailAddress} />
        </div>
      </div>

      <div className="mt-8">
        <Label text="수거 지역" />
        <SelectBox value={region} placeholder="선택" options={["New Delhi", "Gurugram", "Noida"]} onChange={setRegion} />
      </div>

      <div className="mt-8">
        <Label text="수거 수단" />
        <SelectBox
          value={vehicle}
          placeholder="선택"
          options={["LG Pickup Van", "Small Truck", "Partner Vehicle"]}
          onChange={setVehicle}
        />
      </div>

      <div className="mt-8">
        <Label text="처리 가능 가전" />
        <div className="grid grid-cols-2 gap-2">
          {applianceOptions.map((item) => (
            <button
              key={item}
              className={`h-11 rounded-[8px] border text-sm font-black ${
                selectedAppliances.includes(item)
                  ? "border-mint bg-mint text-white"
                  : "border-slate-200 bg-white text-slate-500"
              }`}
              onClick={() => toggleAppliance(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <button className="mt-8 flex items-center text-xl font-black text-mint" type="button">
        수거 보상 확인하기
        <ChevronRight size={24} />
      </button>
      <BottomButton label="다음으로" active={Boolean(canNext)} onClick={onNext} />
    </OnboardingShell>
  );
}

function TermsScreen({
  onBack,
  onClose,
  onNext,
}: {
  onBack: () => void;
  onClose: () => void;
  onNext: () => void;
}) {
  const [checked, setChecked] = useState<string[]>(["location", "privacy"]);

  const terms = [
    { id: "service", label: "수거 크루 이용약관(필수)" },
    { id: "privacy", label: "개인정보 수집 이용동의(필수)" },
    { id: "vehicle", label: "차량 및 안전수칙 확인(필수)" },
    { id: "location", label: "위치기반서비스 이용약관 동의(필수)" },
  ];
  const allChecked = checked.length === terms.length;

  const toggleAll = () => {
    setChecked(allChecked ? [] : terms.map((term) => term.id));
  };

  const toggleTerm = (id: string) => {
    setChecked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <OnboardingShell currentStep={4} totalSteps={4} onBack={onBack} onClose={onClose} scroll>
      <TitleBlock title="수거를 시작하기 전 약관 동의가 필요해요" />
      <button className="mt-16 flex items-center gap-4 text-left" onClick={toggleAll} type="button">
        <CheckBox checked={allChecked} />
        <span className="text-2xl font-black text-black">전체동의</span>
      </button>
      <div className="mt-8 border-y border-slate-200 py-4">
        {terms.map((term) => {
          const active = checked.includes(term.id);
          return (
            <button
              key={term.id}
              className="flex w-full items-center gap-4 py-4 text-left"
              onClick={() => toggleTerm(term.id)}
              type="button"
            >
              <CheckBox checked={active} />
              <span className="min-w-0 flex-1 text-xl font-bold text-black">{term.label}</span>
              <ChevronRight className="text-slate-400" size={24} />
            </button>
          );
        })}
      </div>
      <BottomButton label="동의하고 가입하기" active={allChecked} onClick={onNext} />
    </OnboardingShell>
  );
}

function CompleteScreen({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col px-6 pb-8">
      <button className="ml-auto mt-2 flex h-10 w-10 items-center justify-center" onClick={onClose} type="button">
        <X size={28} />
      </button>
      <h1 className="mt-12 text-[42px] font-medium leading-tight text-black">
        신규 가입이
        <br />
        완료되었습니다
      </h1>
      <p className="mt-12 text-2xl leading-9 text-slate-500">
        입력하신 내용으로 서류심사가 시작됩니다.
        <br />
        로그인 후 남은 절차를 진행해주세요.
      </p>
      <div className="mt-auto flex h-56 items-end justify-center overflow-hidden">
        <div className="relative h-40 w-64">
          <div className="absolute bottom-0 left-8 h-28 w-28 rotate-[-8deg] rounded-t-full bg-lgred/70" />
          <div className="absolute bottom-0 right-8 h-28 w-28 rotate-[8deg] rounded-t-full bg-lgdark/80" />
          <Confetti />
        </div>
      </div>
      <button className="h-14 w-full rounded-[8px] bg-mint text-2xl font-black text-white" onClick={onLogin} type="button">
        로그인하러 가기
      </button>
    </div>
  );
}

function ReadyScreen({ onStart }: { onStart: () => void }) {
  const steps = ["수거자 정보 등록", "정산 계좌 등록", "안전 보건 교육 수료"];

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pb-8 pt-24">
      <h1 className="text-[42px] font-medium leading-tight text-black">
        첫 수거를 위해
        <br />
        준비해볼까요?
      </h1>
      <div className="mt-16 space-y-8">
        {steps.map((item, index) => (
          <div key={item} className="flex items-center gap-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-2xl font-black text-slate-500">
              {index + 1}
            </span>
            <span className="text-2xl font-bold text-slate-500">{item}</span>
          </div>
        ))}
      </div>
      <button className="mt-auto h-14 w-full rounded-[8px] bg-mint text-2xl font-black text-white" onClick={onStart} type="button">
        시작하기
      </button>
    </div>
  );
}

function CrewDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="phone-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-mint">AVAILABLE</p>
          <h1 className="mt-1 text-3xl font-black text-black">오늘의 수거 대기</h1>
        </div>
        <button className="rounded-[8px] bg-slate-100 px-3 py-2 text-xs font-black text-slate-500" onClick={onLogout} type="button">
          로그아웃
        </button>
      </header>

      <section className="mt-5 rounded-[8px] bg-lgred p-4 text-white">
        <div className="flex items-center gap-3">
          <Truck size={28} />
          <div>
            <p className="text-xs font-bold text-white/70">신규 바로 콜</p>
            <p className="mt-1 text-xl font-black">세탁기 수거 요청</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <MiniStat label="거리" value="2.4km" />
          <MiniStat label="도착" value="12분" />
          <MiniStat label="보상" value="₹180" />
        </div>
      </section>

      <section className="mt-4 rounded-[8px] border border-slate-200 bg-white p-4">
        <InfoLine icon={<MapPin size={18} />} title="수거 위치" description="A-12, New Delhi demo street" />
        <InfoLine icon={<PackageCheck size={18} />} title="수거 품목" description="LG Front Load Washer / 11kg" />
        <InfoLine icon={<ClipboardCheck size={18} />} title="고객 요청" description="엘리베이터 있음, 문 앞 수거 가능" />
      </section>

      <button className="mt-4 h-14 w-full rounded-[8px] bg-mint text-xl font-black text-white" type="button">
        수거 요청 수락
      </button>
      <button className="mt-2 h-12 w-full rounded-[8px] bg-slate-100 text-base font-black text-slate-500" type="button">
        잠시 대기
      </button>
    </div>
  );
}

function OnboardingShell({
  children,
  currentStep,
  totalSteps,
  onBack,
  onClose,
  scroll = false,
}: {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onClose: () => void;
  scroll?: boolean;
}) {
  return (
    <div className={`relative flex min-h-0 flex-1 flex-col px-6 pb-8 ${scroll ? "overflow-hidden" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            aria-label="이전 단계로 돌아가기"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-black"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft size={19} />
          </button>
          <StepDots current={currentStep} total={totalSteps} />
        </div>
        <button
          aria-label="가입 닫기"
          className="flex h-10 w-10 items-center justify-center"
          onClick={onClose}
          type="button"
        >
          <X size={28} />
        </button>
      </div>
      <div className={`${scroll ? "phone-scroll min-h-0 flex-1 overflow-y-auto pb-20" : "min-h-0 flex-1"}`}>
        {children}
      </div>
    </div>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }, (_, index) => {
        const value = index + 1;
        const active = value === current;
        return (
          <span
            key={value}
            className={`flex h-7 w-7 items-center justify-center rounded-full border text-lg font-bold ${
              active ? "border-mint bg-mint text-white" : "border-slate-200 text-slate-400"
            }`}
          >
            {value}
          </span>
        );
      })}
    </div>
  );
}

function TitleBlock({ title }: { title: string }) {
  return <h1 className="mt-16 whitespace-pre-line text-[42px] font-medium leading-tight text-black">{title}</h1>;
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      className="h-14 w-full rounded-[8px] border border-slate-200 bg-white px-5 text-xl font-semibold text-black outline-none placeholder:text-slate-400 focus:border-mint"
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function Label({ text, trailing }: { text: string; trailing?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-1">
      <span className="text-xl font-bold text-black">{text}</span>
      {trailing}
    </div>
  );
}

function SelectBox({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      className={`h-14 w-full rounded-[8px] border border-slate-200 bg-white px-5 text-xl font-semibold outline-none focus:border-mint ${
        value ? "text-black" : "text-slate-400"
      }`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] ${checked ? "bg-mint" : "bg-[#d9d9d9]"}`}>
      <Check className="text-white" size={22} strokeWidth={4} />
    </span>
  );
}

function NoticeBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-8 rounded-[8px] bg-slate-50 p-5">
      <p className="text-xl font-black text-slate-600">{title}</p>
      <ul className="mt-3 space-y-2 text-lg leading-7 text-slate-500">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

function BottomButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`absolute bottom-8 left-6 right-6 h-14 rounded-[8px] text-2xl font-black text-white ${
        active ? "bg-mint" : "bg-[#d9d9d9]"
      }`}
      disabled={!active}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        left: `${8 + ((index * 17) % 82)}%`,
        top: `${6 + ((index * 23) % 42)}%`,
        rotate: `${(index * 27) % 160}deg`,
        color: ["#A50034", "#6B0036", "#D91B5C", "#F3B4C8", "#7A002E"][index % 5],
      })),
    [],
  );

  return (
    <>
      {pieces.map((piece, index) => (
        <span
          key={index}
          className="absolute h-2 w-5 rounded-full"
          style={{
            backgroundColor: piece.color,
            left: piece.left,
            top: piece.top,
            transform: `rotate(${piece.rotate})`,
          }}
        />
      ))}
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-white/12 p-2">
      <p className="text-[11px] font-bold text-white/60">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function InfoLine({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-mint/10 text-mint">
        {icon}
      </span>
      <div>
        <p className="text-sm font-black text-black">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}
