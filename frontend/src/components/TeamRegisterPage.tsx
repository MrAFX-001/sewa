import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  Award,
  Bookmark,
  Building2,
  Download,
  GraduationCap,
  IdCard,
  Layers,
  ListChecks,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  School,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ApiError,
  profileApi,
  teamApi,
  type CandidateProfile,
  type Team,
  type TeamMember,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import { PROBLEM_CATEGORIES, findProblemCategory, themeLabel, ID_CARD_ACCEPT } from "../lib/problemCategories";
import { Footer, Header } from "./SewaSite";

// ─── Static option lists ────────────────────────────────────────────────────
// Kept as plain arrays rather than a backend-driven catalogue - same
// rationale as team.schema's theme/problemStatement list: small, unlikely
// to change mid-event, not worth a DB round trip.

const CATEGORY_OPTIONS = ["General / Open", "OBC", "SC", "ST", "EWS", "Other"];
const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const NATIONALITY_OPTIONS = ["Indian Citizen (Bharat)", "Other / Foreign National"];
const COUNTRY_OPTIONS = ["India (Bharat)", "Other"];
const INDIA_STATE_OPTIONS = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi (NCT)",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

const LEGACY_STATE_ALIASES: Record<string, string> = {
  "J&K": "Jammu and Kashmir",
  "HP": "Himachal Pradesh",
  Delhi: "Delhi (NCT)",
  UP: "Uttar Pradesh",
};

const normalizeIndiaState = (state: string | null | undefined) =>
  state ? (LEGACY_STATE_ALIASES[state] ?? state) : "";

const PARTICIPANT_CATEGORIES = [
  "School & Vocational",
  "Diploma & Higher Education",
  "Industry & Government",
] as const;

const PARTICIPATION_LEVELS = ["National Level", "Local Community Level"] as const;
const SCHOOL_INSTITUTION_TYPES = ["School", "ITI", "Vocational Institution", "Other"] as const;
const HIGHER_ED_INSTITUTION_TYPES = [
  "College",
  "University",
  "Diploma Institute",
  "Research Institution",
  "Other",
] as const;
const INDUSTRY_INSTITUTION_TYPES = [
  "Industry",
  "MSME",
  "Startup",
  "R&D Organization",
  "Government Laboratory",
  "Other",
] as const;
const SCHOOL_CLASS_OPTIONS = [
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
  "ITI 1st Year", "ITI 2nd Year", "Vocational / Diploma", "Other",
] as const;
const HIGHER_ED_YEARS = [
  "1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year / Final Year", "Research Scholar / Ph.D",
] as const;

// Real category catalogue (National + Regional, PS/OPEN) now lives in
// lib/problemCategories.ts, shared with the backend's validation - this used
// to be a disconnected set of placeholder themes/problem-statements with no
// relationship to the site's actual Problem Statements page or the backend
// schema at all.

const TEAM_SIZE_OPTIONS = [2, 3, 4, 5, 6]; // Team / Organisation sizes; Individual is fixed at 1

const WIZARD_STEPS = [
  { n: 1, title: "Personal Details", desc: "Applicant Identity" },
  { n: 2, title: "Category & Participation", desc: "Select your category and participation type" },
  { n: 3, title: "Entry Details", desc: "Entry identity and participants" },
  { n: 4, title: "Review & Confirmation", desc: "Review Details" },
  { n: 5, title: "Download Confirmation", desc: "Print PDF" },
] as const;

type WizardStep = (typeof WIZARD_STEPS)[number]["n"];

// ─── Local draft shapes ─────────────────────────────────────────────────────

interface PersonalDraft {
  firstName: string;
  middleName: string;
  lastName: string;
  category: string;
  nationality: string;
  dateOfBirth: string; // yyyy-mm-dd, matches <input type="date">
  gender: string;
  aadhaarNumber: string;
  addressLine1: string;
  addressLine2: string;
  pinCode: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  alternatePhone: string;
  backupEmail: string;
}

const emptyPersonal = (): PersonalDraft => ({
  firstName: "",
  middleName: "",
  lastName: "",
  category: "",
  nationality: NATIONALITY_OPTIONS[0]!,
  dateOfBirth: "",
  gender: "",
  aadhaarNumber: "",
  addressLine1: "",
  addressLine2: "",
  pinCode: "",
  city: "",
  state: "",
  country: COUNTRY_OPTIONS[0]!,
  phone: "",
  alternatePhone: "",
  backupEmail: "",
});

interface MemberDraft {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idCardFile: File | null;
  idCardName: string;
  idCardError: string;
}

const emptyMember = (): MemberDraft => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  idCardFile: null,
  idCardName: "",
  idCardError: "",
});

// These mirror the server's schemas (backend/src/schemas/phone.ts plus
// profile.schema.ts / team.schema.ts). The wizard's gates used to check only
// that a field was non-empty, so a 5-digit Aadhaar or a 2-character team name
// passed "Next" and then came back as a 400 from the endpoint. Keeping the
// shapes in sync means the button is disabled for exactly the input the
// server would reject. The server remains the real validator.
const PHONE_RE = /^(\+91)?[6-9]\d{9}$/;
const AADHAAR_RE = /^\d{12}$/;
const PIN_RE = /^\d{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Whitespace is stripped first, matching the server's phone schema. */
const phoneOk = (v: string) => PHONE_RE.test(v.replace(/\s+/g, ""));

const TEAM_NAME_MIN = 3; // createTeamSchema.name.min(3)
const INSTITUTE_MIN = 2; // createTeamSchema.institute.min(2)
const MEMBER_ID_CARD_MAX_SIZE_BYTES = 500 * 1024; // Event dossier requirement
const MEMBER_ID_CARD_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

const personalComplete = (p: PersonalDraft) =>
  !!(
    p.firstName.trim() &&
    p.lastName.trim() &&
    p.nationality &&
    p.dateOfBirth &&
    p.gender &&
    p.state &&
    p.country
  ) &&
  p.addressLine1.trim().length >= 3 &&
  p.city.trim().length >= 2 &&
  AADHAAR_RE.test(p.aadhaarNumber) &&
  PIN_RE.test(p.pinCode) &&
  phoneOk(p.phone) &&
  (!p.alternatePhone.trim() || phoneOk(p.alternatePhone)) &&
  (!p.backupEmail.trim() || EMAIL_RE.test(p.backupEmail.trim()));

const memberComplete = (m: MemberDraft) =>
  !!(m.firstName.trim() && m.lastName.trim()) &&
  EMAIL_RE.test(m.email.trim()) &&
  (!m.phone.trim() || phoneOk(m.phone)) &&
  !!(m.idCardFile || m.idCardName);

  const affiliationComplete = (
    category: "School & Vocational" | "Diploma & Higher Education" | "Industry & Government",
    fields: {
      institutionType: string;
      affiliationPinCode: string;
      affiliationCity: string;
      affiliationState: string;
      institutionEmail: string;
      institutionPhone: string;
      classLevel: string;
      degreeProgramme: string;
      departmentBranch: string;
      yearOfStudy: string;
      coordinatorName: string;
      coordinatorEmail: string;
      coordinatorPhone: string;
      designationRole: string;
      departmentDivision: string;
      officialOrgEmail: string;
      orgContactPhone: string;
    },
  ) => {
    if (!fields.institutionType || !fields.affiliationCity.trim() || !fields.affiliationState) return false;
    if (fields.institutionEmail && !EMAIL_RE.test(fields.institutionEmail.trim())) return false;
    if (fields.institutionPhone && !phoneOk(fields.institutionPhone)) return false;

    if (category === "School & Vocational") {
      return !!fields.classLevel && PIN_RE.test(fields.affiliationPinCode.trim());
    }

    if (category === "Diploma & Higher Education") {
      if (!fields.degreeProgramme.trim() || !fields.departmentBranch.trim() || !fields.yearOfStudy) return false;
      if (fields.coordinatorEmail && !EMAIL_RE.test(fields.coordinatorEmail.trim())) return false;
      if (fields.coordinatorPhone && !phoneOk(fields.coordinatorPhone)) return false;
      return true;
    }

    return !!(
      fields.designationRole.trim() &&
      EMAIL_RE.test(fields.officialOrgEmail.trim())
    ) &&
      (!fields.departmentDivision.trim() || fields.departmentDivision.trim().length >= 1) &&
      (!fields.orgContactPhone.trim() || phoneOk(fields.orgContactPhone));
  };

/** First duplicate email among members (leader included), or null. */
function findDuplicateEmail(members: MemberDraft[]): string | null {
  const seen = new Set<string>();
  for (const m of members) {
    if (!m.email) continue;
    const key = m.email.trim().toLowerCase();
    if (seen.has(key)) return m.email;
    seen.add(key);
  }
  return null;
}

// ─── Small presentational helpers ───────────────────────────────────────────

const inputClass =
  "w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-[#f8faff] text-sm text-gray-800 placeholder-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/20 focus:border-[#ff4d4f] focus:bg-white transition-all " +
  "disabled:bg-gray-100 disabled:text-gray-500";
const selectClass = `${inputClass} appearance-none cursor-pointer`;

interface DossierSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: readonly string[] | string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function DossierSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className = "",
}: DossierSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`w-full h-11 px-3.5 rounded-lg border text-left text-sm flex items-center justify-between transition-all cursor-pointer select-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${
          open
            ? "border-[#ff4d4f] ring-2 ring-[#ff4d4f]/20 bg-white"
            : "border-slate-200 bg-[#f8faff] text-gray-800 hover:border-slate-300 hover:bg-white"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${value ? "text-gray-800 font-medium" : "text-gray-400"}`}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`ml-2 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-[#ff4d4f]" : "text-gray-400"
          }`}
        />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-red-100/90 bg-white p-1.5 shadow-xl shadow-red-950/10 ring-1 ring-black/5">
          <div className="space-y-0.5" role="listbox">
            {options.map((opt) => {
              const selected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs transition-colors cursor-pointer sm:text-sm ${
                    selected
                      ? "bg-red-50 font-bold text-[#ff4d4f]"
                      : "font-medium text-gray-700 hover:bg-slate-50 hover:text-gray-950"
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {selected && <CheckCircle2 size={15} className="ml-2 shrink-0 text-[#ff4d4f]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: ReactNode;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
        {label} {required && <span className="text-[#ff4d4f]">*</span>}
        {!required && <span className="text-gray-400 font-normal"> (Optional)</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-[#ff4d4f]">
      {children}
    </span>
  );
}

function SectionHeader({
  n,
  icon: Icon,
  title,
  badge,
}: {
  n: number;
  icon: typeof User;
  title: string;
  badge?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-[#ff4d4f]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
          {n}. {title}
        </h3>
      </div>
      {badge ?? <span className="text-xs font-semibold text-[#ff4d4f]">* Required</span>}
    </div>
  );
}

function StepFooter({
  onBack,
  onSaveDraft,
  savingDraft,
  nextLabel,
  onNext,
  nextDisabled,
  nextBusy,
}: {
  onBack?: () => void;
  onSaveDraft?: () => void;
  savingDraft?: boolean;
  nextLabel: string;
  onNext: () => void;
  nextDisabled: boolean;
  nextBusy?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 items-center gap-1.5 rounded-lg border border-gray-200 px-5 text-sm font-semibold text-gray-600 transition-all hover:border-gray-400 cursor-pointer"
        >
          <ChevronLeft size={15} /> Back
        </button>
      ) : onSaveDraft ? (
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={savingDraft}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#ff4d4f] transition-colors cursor-pointer disabled:opacity-50"
        >
          {savingDraft ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Save draft &amp; continue later
        </button>
      ) : (
        <span />
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || nextBusy}
        className="flex h-10 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {nextBusy ? <Loader2 size={15} className="animate-spin" /> : null}
        {nextLabel} {!nextBusy && <ArrowRight size={15} />}
      </button>
    </div>
  );
}

function DossierSidebar({ step }: { step: WizardStep }) {
  return (
    <aside className="no-print w-full shrink-0 rounded-2xl border border-red-200/90 bg-white p-6 shadow-xs lg:w-72">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">REGISTRATION DOSSIER</p>
      <h2 className="mb-6 mt-1 text-xl font-black tracking-tight text-gray-900">SEWA 2026</h2>

      <ol className="space-y-6">
        {WIZARD_STEPS.map((s) => {
          const isActive = step === s.n;
          const isDone = step > s.n;
          return (
            <li key={s.n} className="group flex select-none items-start gap-3.5">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#ff4d4f] text-white shadow-sm"
                    : isDone
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {isDone ? <CheckCircle2 size={15} /> : s.n}
              </span>
              <div className="pt-0.5">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-[#ff4d4f]" : "text-gray-400"}`}>
                  STEP {s.n}
                </p>
                <p className={`text-[13px] font-bold leading-tight ${isActive ? "text-[#ff4d4f]" : isDone ? "text-gray-800" : "text-gray-500"}`}>
                  {s.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-tight text-gray-400">{s.desc}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

/** Printable summary shared by the final wizard step and the "already registered" gate. */
function ConfirmationSummary({
  personal,
  email,
  participationType,
  teamName,
  institute,
  institutionAddress,
  participantCategory,
  participationLevel,
  institutionType,
  affiliationCity,
  affiliationState,
  affiliationPinCode,
  institutionEmail,
  institutionPhone,
  degreeProgramme,
  departmentBranch,
  yearOfStudy,
  classLevel,
  designationRole,
  departmentDivision,
  officialOrgEmail,
  coordinatorName,
  coordinatorEmail,
  coordinatorPhone,
  mentorName,
  mentorDesignation,
  mentorEmail,
  mentorPhone,
  orgContactPhone,
  theme,
  problem,
  idCardName,
  teamSize,
  members,
  teamId,
  status,
}: {
  personal: PersonalDraft;
  email: string;
  participationType: "Individual" | "Team / Group" | "Organisation";
  teamName: string;
  institute: string;
  institutionAddress: string;
  participantCategory: string;
  participationLevel: string;
  institutionType: string;
  affiliationCity: string;
  affiliationState: string;
  affiliationPinCode: string;
  institutionEmail: string;
  institutionPhone: string;
  degreeProgramme: string;
  departmentBranch: string;
  yearOfStudy: string;
  classLevel: string;
  designationRole: string;
  departmentDivision: string;
  officialOrgEmail: string;
  coordinatorName: string;
  coordinatorEmail: string;
  coordinatorPhone: string;
  mentorName: string;
  mentorDesignation: string;
  mentorEmail: string;
  mentorPhone: string;
  orgContactPhone: string;
  theme: string;
  problem: string;
  idCardName: string;
  teamSize: number;
  members: MemberDraft[];
  teamId: string | null;
  status: string;
}) {
  const maskedAadhaar = personal.aadhaarNumber
    ? `•••• •••• ${personal.aadhaarNumber.slice(-4)}`
    : "-";

  const rows: [string, string][] = [
    [
      "Applicant",
      [personal.firstName, personal.middleName, personal.lastName].filter(Boolean).join(" "),
    ],
    ["Date of Birth", personal.dateOfBirth || "-"],
    ["Gender", personal.gender || "-"],
    ["Nationality / Citizenship", personal.nationality || "-"],
    ["Category / Social Group", personal.category || "-"],
    ["Aadhaar Number", maskedAadhaar],
    [
      "Address",
      [
        personal.addressLine1,
        personal.addressLine2,
        personal.city,
        personal.state,
        personal.pinCode,
        personal.country,
      ]
        .filter(Boolean)
        .join(", "),
    ],
    ["Mobile Number", personal.phone || "-"],
    ["University Email", email],
    ["Participation Type", participationType],
    ["Participant Category", participantCategory || "-"],
    ["Participation Level", participationLevel || "-"],
    ["Institution Type", institutionType || "-"],
    ["Institution City / District", affiliationCity || "-"],
    ["Institution State / UT", affiliationState || "-"],
    ["Institution PIN", affiliationPinCode || "-"],
    ["Institution Email", institutionEmail || "-"],
    ["Institution Phone", institutionPhone || "-"],
    ...(participantCategory === "School & Vocational"
      ? (["Class / Level", classLevel || "-"] as [string, string][]) 
      : participantCategory === "Diploma & Higher Education"
        ? ([
            ["Degree / Programme", degreeProgramme || "-"],
            ["Department / Branch", departmentBranch || "-"],
            ["Year of Study", yearOfStudy || "-"],
            ["Faculty Coordinator", coordinatorName || "-"],
            ["Coordinator Email", coordinatorEmail || "-"],
            ["Coordinator Phone", coordinatorPhone || "-"],
          ] as [string, string][])
        : ([
            ["Applicant Designation / Role", designationRole || "-"],
            ["Department / Division", departmentDivision || "-"],
            ["Official Organization Email", officialOrgEmail || "-"],
            ["Organization Contact Phone", orgContactPhone || "-"],
          ] as [string, string][])),
    ...(mentorName
      ? ([
          ["Mentor / Guide", mentorName],
          ["Mentor Designation", mentorDesignation || "-"],
          ["Mentor Email", mentorEmail || "-"],
          ["Mentor Phone", mentorPhone || "-"],
        ] as [string, string][])
      : []),
    ["Institute / Organisation Address", institutionAddress || "-"],
    ["Theme / Track", theme || "-"],
    ["Problem Statement", problem || "-"],
    ["Identity / Affiliation ID Card", idCardName || "-"],
    ["Participant Count", `${teamSize} ${teamSize === 1 ? "participant" : "participants"}`],
  ];

  return (
    <div className="print-area space-y-6 text-sm text-gray-700">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          SEWA 2026 · Registration Confirmation
        </p>
        <h2 className="mt-1 text-xl font-extrabold text-gray-900">{teamName || "Untitled Entry"}</h2>
        <p className="mt-1 text-xs text-gray-400">{institute}</p>
        {teamId && (
          <p className="mt-2 text-xs text-gray-500">
            Team ID: <span className="font-mono font-bold text-primary">{teamId}</span> · Status:{" "}
            <span className="font-semibold uppercase">{status}</span>
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-100 divide-y divide-gray-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
            <span className="text-xs font-semibold text-gray-400">{label}</span>
            <span className="max-w-[60%] text-right text-xs font-semibold text-gray-800">
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{participationType === "Individual" ? "Individual Participant" : participationType === "Organisation" ? "Organisation Participants" : "Team Members"}</p>
        </div>
        {members.map((m, i) => (
          <div key={i} className="flex items-center gap-3 border-t border-gray-100 px-4 py-2.5">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {(m.firstName || m.email)[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">
                {`${m.firstName} ${m.lastName}`.trim()}
              </p>
              <p className="text-[10px] text-gray-400">
                {m.email} · {i === 0 ? "Team Leader / Applicant" : `Member ${i + 1}`}
              </p>
              <p className={`text-[10px] font-semibold ${m.idCardName || m.idCardFile ? "text-emerald-600" : "text-primary"}`}>
                {m.idCardName || m.idCardFile ? `ID Card: ${m.idCardName || m.idCardFile?.name || "Uploaded"}` : "ID Card: Missing"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function TeamRegisterPage() {
  const { user, refresh } = useAuth();

  const [step, setStep] = useState<WizardStep>(1);
  const [personal, setPersonal] = useState<PersonalDraft>(emptyPersonal());
  const [problemCategoryCode, setProblemCategoryCode] = useState("");
  const [participationType, setParticipationType] = useState<"Individual" | "Team / Group" | "Organisation">("Team / Group");
  // "" until a category is picked, then defaults to the only option a
  // REGIONAL category has ("open") or is left for the user to choose on a
  // NATIONAL one - see handleCategoryChange.
  const [problemOptionType, setProblemOptionType] = useState<"" | "ps" | "open">("");
  const [proposedProblemStatement, setProposedProblemStatement] = useState("");
  const [teamSize, setTeamSize] = useState(2);
  const [participantCategory, setParticipantCategory] = useState<"School & Vocational" | "Diploma & Higher Education" | "Industry & Government">("Diploma & Higher Education");
  const [participationLevel, setParticipationLevel] = useState<"National Level" | "Local Community Level">("National Level");
  const [institutionType, setInstitutionType] = useState("College");
  const [affiliationPinCode, setAffiliationPinCode] = useState("");
  const [affiliationCity, setAffiliationCity] = useState("");
  const [affiliationState, setAffiliationState] = useState("");
  const [institutionEmail, setInstitutionEmail] = useState("");
  const [institutionPhone, setInstitutionPhone] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [degreeProgramme, setDegreeProgramme] = useState("");
  const [departmentBranch, setDepartmentBranch] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [coordinatorName, setCoordinatorName] = useState("");
  const [coordinatorEmail, setCoordinatorEmail] = useState("");
  const [coordinatorPhone, setCoordinatorPhone] = useState("");
  const [designationRole, setDesignationRole] = useState("");
  const [departmentDivision, setDepartmentDivision] = useState("");
  const [officialOrgEmail, setOfficialOrgEmail] = useState("");
  const [orgContactPhone, setOrgContactPhone] = useState("");
  const [mentorName, setMentorName] = useState("");
  const [mentorDesignation, setMentorDesignation] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [mentorPhone, setMentorPhone] = useState("");
  const [teamName, setTeamName] = useState("");
  const [institute, setInstitute] = useState("");
  const [institutionAddress, setInstitutionAddress] = useState("");
  // Legacy team-level ID-card columns are retained for database compatibility,
  // but this state now mirrors the leader's per-participant document.
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [existingIdCardName, setExistingIdCardName] = useState<string | null>(null);
  const [idCardError, setIdCardError] = useState("");
  // Slot 0 is always the signed-in leader. The backend seeds the leader into
  // team_members itself when the team is created, so slot 0 is display-only
  // here and never POSTed as a member (that would collide with the unique
  // [teamId, email] constraint).
  const [members, setMembers] = useState<MemberDraft[]>([emptyMember(), emptyMember()]);
  const [agreed, setAgreed] = useState(false);

  const [teamId, setTeamId] = useState<string | null>(null);
  const [existingTeam, setExistingTeam] = useState<Team | null>(null); // non-draft => already submitted
  const [teamStatus, setTeamStatus] = useState<string>("draft");

  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [draftSavedNote, setDraftSavedNote] = useState("");

  // Mirror the leader's account into personal details + roster slot 0 once
  // the session resolves.
  useEffect(() => {
    if (!user) return;
    setPersonal((prev) => ({
      ...prev,
      firstName: prev.firstName || user.firstName,
      lastName: prev.lastName || user.lastName,
      phone: prev.phone || user.phone || "",
    }));
    setMembers((prev) =>
      prev.map((m, idx) =>
        idx === 0
          ? {
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone ?? "",
              idCardFile: prev[idx]?.idCardFile ?? null,
              idCardName: prev[idx]?.idCardName ?? "",
              idCardError: prev[idx]?.idCardError ?? "",
            }
          : m,
      ),
    );
  }, [user]);

  // Load any saved profile + draft/submitted team once on mount. A leader
  // can only ever own one team, so an existing draft is resumed rather than
  // letting the user fill the form again and hit a 409 at the end.
  useEffect(() => {
    let cancelled = false;

    Promise.all([profileApi.getMine(), teamApi.getMine()])
      .then(([{ profile }, { team }]) => {
        if (cancelled) return;

        if (profile) {
          setPersonal((prev) => ({
            ...prev,
            middleName: profile.middleName ?? "",
            category: profile.category ?? "",
            nationality: profile.nationality,
            dateOfBirth: profile.dateOfBirth.slice(0, 10),
            gender: profile.gender,
            aadhaarNumber: profile.aadhaarNumber,
            addressLine1: profile.addressLine1,
            addressLine2: profile.addressLine2 ?? "",
            pinCode: profile.pinCode,
            city: profile.city,
            state: normalizeIndiaState(profile.state),
            country: profile.country,
            alternatePhone: profile.alternatePhone ?? "",
            backupEmail: profile.backupEmail ?? "",
          }));
        }

        if (!team) return;

        setTeamStatus(team.status);
        if (team.status !== "draft") {
          setExistingTeam(team);
          setParticipationType(team.participationType ?? "Team / Group");
          setTeamName(team.name);
          setInstitute(team.institute);
          setInstitutionAddress(team.institutionAddress);
          setProblemCategoryCode(team.problemCategoryCode);
          setProblemOptionType(team.problemOptionType);
          setProposedProblemStatement(team.proposedProblemStatement ?? "");
          setParticipantCategory(team.participantCategory ?? "Diploma & Higher Education");
          setParticipationLevel(team.participationLevel ?? "National Level");
          setInstitutionType(team.institutionType ?? "");
          setAffiliationPinCode(team.affiliationPinCode ?? "");
          setAffiliationCity(team.affiliationCity ?? "");
          setAffiliationState(normalizeIndiaState(team.affiliationState));
          setInstitutionEmail(team.institutionEmail ?? "");
          setInstitutionPhone(team.institutionPhone ?? "");
          setClassLevel(team.classLevel ?? "");
          setDegreeProgramme(team.degreeProgramme ?? "");
          setDepartmentBranch(team.departmentBranch ?? "");
          setYearOfStudy(team.yearOfStudy ?? "");
          setCoordinatorName(team.coordinatorName ?? "");
          setCoordinatorEmail(team.coordinatorEmail ?? "");
          setCoordinatorPhone(team.coordinatorPhone ?? "");
          setDesignationRole(team.designationRole ?? "");
          setDepartmentDivision(team.departmentDivision ?? "");
          setOfficialOrgEmail(team.officialOrgEmail ?? "");
          setOrgContactPhone(team.orgContactPhone ?? "");
          setMentorName(team.mentorName ?? "");
          setMentorDesignation(team.mentorDesignation ?? "");
          setMentorEmail(team.mentorEmail ?? "");
          setMentorPhone(team.mentorPhone ?? "");
          setExistingIdCardName(team.idCardOriginalName);
          const roster = (team.members ?? []).map((m: TeamMember): MemberDraft => ({
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            phone: m.phone ?? "",
            idCardFile: null,
            idCardName: m.idCardOriginalName ?? (m.role === "leader" ? team.idCardOriginalName ?? "" : ""),
            idCardError: "",
          }));
          if (roster.length) setMembers(roster);
          return;
        }

        setTeamId(team.id);
        setParticipationType(team.participationType ?? "Team / Group");
        setTeamName(team.name);
        setInstitute(team.institute);
        setInstitutionAddress(team.institutionAddress);
        setProblemCategoryCode(team.problemCategoryCode);
        setProblemOptionType(team.problemOptionType);
        setProposedProblemStatement(team.proposedProblemStatement ?? "");
        setParticipantCategory(team.participantCategory ?? "Diploma & Higher Education");
        setParticipationLevel(team.participationLevel ?? "National Level");
        setInstitutionType(team.institutionType ?? "");
        setAffiliationPinCode(team.affiliationPinCode ?? "");
        setAffiliationCity(team.affiliationCity ?? "");
        setAffiliationState(normalizeIndiaState(team.affiliationState));
        setInstitutionEmail(team.institutionEmail ?? "");
        setInstitutionPhone(team.institutionPhone ?? "");
        setClassLevel(team.classLevel ?? "");
        setDegreeProgramme(team.degreeProgramme ?? "");
        setDepartmentBranch(team.departmentBranch ?? "");
        setYearOfStudy(team.yearOfStudy ?? "");
        setCoordinatorName(team.coordinatorName ?? "");
        setCoordinatorEmail(team.coordinatorEmail ?? "");
        setCoordinatorPhone(team.coordinatorPhone ?? "");
        setDesignationRole(team.designationRole ?? "");
        setDepartmentDivision(team.departmentDivision ?? "");
        setOfficialOrgEmail(team.officialOrgEmail ?? "");
        setOrgContactPhone(team.orgContactPhone ?? "");
        setMentorName(team.mentorName ?? "");
        setMentorDesignation(team.mentorDesignation ?? "");
        setMentorEmail(team.mentorEmail ?? "");
        setMentorPhone(team.mentorPhone ?? "");
        setExistingIdCardName(team.idCardOriginalName);

        const existing = team.members ?? [];
        const leader = existing.find((m: TeamMember) => m.role === "leader");
        const others = existing.filter((m: TeamMember) => m.role !== "leader");
        const toDraft = (m: TeamMember): MemberDraft => ({
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          phone: m.phone ?? "",
          idCardFile: null,
          idCardName: m.idCardOriginalName ?? (m.role === "leader" ? team.idCardOriginalName ?? "" : ""),
          idCardError: "",
        });
        const roster = [leader ? toDraft(leader) : emptyMember(), ...others.map(toDraft)];
        const normalizedRoster = team.participationType === "Individual"
          ? roster.slice(0, 1)
          : roster.length >= 2
            ? roster
            : [...roster, emptyMember()];
        setMembers(normalizedRoster);
        setTeamSize(team.participationType === "Individual" ? 1 : Math.max(2, normalizedRoster.length));
      })
      .catch(() => {
        /* 401/403 is handled by RequireAuth; anything else surfaces on submit */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (participationType === "Individual") {
      setTeamSize(1);
      setMembers((prev) => [{
        firstName: personal.firstName,
        lastName: personal.lastName,
        email: user?.email ?? prev[0]?.email ?? "",
        phone: personal.phone,
        idCardFile: prev[0]?.idCardFile ?? null,
        idCardName: prev[0]?.idCardName ?? "",
        idCardError: prev[0]?.idCardError ?? "",
      }]);
      return;
    }

    const targetSize = Math.max(2, Math.min(teamSize, 6));
    setTeamSize(targetSize);
    setMembers((prev) => {
      const next = [...prev];
      while (next.length < targetSize) next.push(emptyMember());
      return next.slice(0, targetSize);
    });
  }, [participationType]);

  const updateMember = (i: number, field: keyof MemberDraft, val: string) => {
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)));
  };

  const handleMemberIdCardChange = (index: number, file: File | null) => {
    if (index === 0) {
      setIdCardFile(null);
      setIdCardError("");
    }

    setMembers((prev) =>
      prev.map((member, idx) =>
        idx === index ? { ...member, idCardFile: null, idCardName: "", idCardError: "" } : member,
      ),
    );

    if (!file) return;

    if (!MEMBER_ID_CARD_MIME_TYPES.has(file.type)) {
      const message = "ID card must be a PDF, JPG, or PNG file.";
      if (index === 0) setIdCardError(message);
      setMembers((prev) =>
        prev.map((member, idx) => (idx === index ? { ...member, idCardError: message } : member)),
      );
      return;
    }

    if (file.size > MEMBER_ID_CARD_MAX_SIZE_BYTES) {
      const message = "ID card file is too large (max 500 KB).";
      if (index === 0) setIdCardError(message);
      setMembers((prev) =>
        prev.map((member, idx) => (idx === index ? { ...member, idCardError: message } : member)),
      );
      return;
    }

    setMembers((prev) =>
      prev.map((member, idx) =>
        idx === index
          ? { ...member, idCardFile: file, idCardName: file.name, idCardError: "" }
          : member,
      ),
    );
    if (index === 0) setIdCardFile(file);
  };

  const handleSizeChange = (n: number) => {
    setTeamSize(n);
    setMembers((prev) => {
      const next = [...prev];
      while (next.length < n) next.push(emptyMember());
      return next.slice(0, n);
    });
  };

  const selectedCategory = findProblemCategory(problemCategoryCode);

  // Display-only strings for ConfirmationSummary and the printable summary -
  // derived the same way the backend derives its `theme`/`problemStatement`
  // columns (problemStatement.service.ts), so what the participant reviews
  // matches what actually gets saved.
  const themeDisplay = selectedCategory ? themeLabel(selectedCategory.theme) : "-";
  const problemDisplay =
    problemOptionType === "ps"
      ? (selectedCategory?.psTitle ?? "-")
      : problemOptionType === "open"
        ? proposedProblemStatement || "-"
        : "-";
  const idCardDisplay = members[0]?.idCardFile?.name ?? members[0]?.idCardName ?? idCardFile?.name ?? existingIdCardName ?? "-";

  const resetAffiliationForCategory = (category: typeof participantCategory) => {
    setParticipantCategory(category);
    if (category === "School & Vocational") {
      setInstitutionType(SCHOOL_INSTITUTION_TYPES[0]);
    } else if (category === "Diploma & Higher Education") {
      setInstitutionType(HIGHER_ED_INSTITUTION_TYPES[0]);
    } else {
      setInstitutionType(INDUSTRY_INSTITUTION_TYPES[0]);
    }
  };

  /**
   * Regional categories have no official PS, so there's nothing to choose -
   * they're locked to "open" the moment they're picked. National categories
   * leave the choice to the user (cleared here so switching FROM regional TO
   * national, or between two national categories, never carries over a
   * stale "open"/"ps" pick along with its now-irrelevant proposed text).
   */
  const handleCategoryChange = (code: string) => {
    setProblemCategoryCode(code);
    const category = findProblemCategory(code);
    setProblemOptionType(category?.theme === "REGIONAL" ? "open" : "");
    setProposedProblemStatement("");
  };


  async function saveProfile(): Promise<boolean> {
    setError("");
    try {
      await profileApi.upsert({
        firstName: personal.firstName,
        lastName: personal.lastName,
        middleName: personal.middleName || undefined,
        category: personal.category || undefined,
        nationality: personal.nationality,
        dateOfBirth: personal.dateOfBirth,
        gender: personal.gender,
        aadhaarNumber: personal.aadhaarNumber,
        addressLine1: personal.addressLine1,
        addressLine2: personal.addressLine2 || undefined,
        pinCode: personal.pinCode,
        city: personal.city,
        state: personal.state,
        country: personal.country,
        phone: personal.phone,
        alternatePhone: personal.alternatePhone || undefined,
        backupEmail: personal.backupEmail || undefined,
      });
      // The leader's roster slot (used in Step 3's preview, Step 4's review,
      // and the printed confirmation) is otherwise only synced from the
      // session's `user` object on mount - without this, editing your name
      // or phone here leaves slot 0 showing what you signed up with.
      setMembers((prev) =>
        prev.map((m, idx) =>
          idx === 0
            ? {
                ...m,
                firstName: personal.firstName,
                lastName: personal.lastName,
                phone: personal.phone,
              }
            : m,
        ),
      );
      // Step 1 writes firstName/lastName/phone back to the User record, so the
      // cached `me` query is now stale -- without this the header and any other
      // consumer keep showing the pre-edit name until the 30s staleTime lapses.
      await refresh();
      return true;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.firstFieldError ?? err.message)
          : "Could not save your details. Please try again.",
      );
      return false;
    }
  }

  const handleNextFromPersonal = async () => {
    setSavingDraft(true);
    const ok = await saveProfile();
    setSavingDraft(false);
    if (ok) setStep(2);
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setDraftSavedNote("");
    const ok = await saveProfile();
    setSavingDraft(false);
    if (ok) setDraftSavedNote("Saved - you can pick up right here next time you sign in.");
  };

  /**
   * The backend models team creation as separate calls (create → add
   * members → submit), so a failure part-way through leaves a real draft
   * team behind. `teamId` is kept in state and reused on retry so a second
   * attempt adds only the missing members rather than trying to create a
   * duplicate team (which would 409).
   */
  const handleFinalSubmit = async () => {
    if (submitting) return;

    const dup = findDuplicateEmail(members);
    if (dup) {
      setError(`"${dup}" is used by more than one member. Each member needs a different email.`);
      setStep(3);
      return;
    }

    // Mirrors the backend's own rules (team.schema.ts) so a team never
    // discovers these problems only after a round trip to the server.
    if (!problemCategoryCode || !problemOptionType) {
      setError("Choose a category and whether you're taking the official problem statement or proposing your own.");
      setStep(2);
      return;
    }
    if (problemOptionType === "open" && proposedProblemStatement.trim().length < 10) {
      setError("Describe the problem you're proposing to solve (at least 10 characters).");
      setStep(2);
      return;
    }
    if (!affiliationComplete(participantCategory, {
      institutionType, affiliationPinCode, affiliationCity, affiliationState,
      institutionEmail, institutionPhone, classLevel, degreeProgramme,
      departmentBranch, yearOfStudy, coordinatorName, coordinatorEmail,
      coordinatorPhone, designationRole, departmentDivision, officialOrgEmail, orgContactPhone,
    })) {
      setError("Complete the required affiliation details before submitting.");
      setStep(2);
      return;
    }
    if (
      mentorName.trim() &&
      (!mentorEmail.trim() || !EMAIL_RE.test(mentorEmail.trim()) || !phoneOk(mentorPhone))
    ) {
      setError("When a mentor is provided, enter a valid mentor email and phone number.");
      setStep(3);
      return;
    }
    const missingMemberDocument = members.find((member) => !member.idCardFile && !member.idCardName);
    if (missingMemberDocument) {
      const index = members.indexOf(missingMemberDocument);
      const label = participationType === "Individual" ? "the applicant" : index === 0 ? "the team leader" : `Member ${index + 1}`;
      setError(`Upload a Student / Institution ID Card for ${label}. PDF, JPG, or PNG, max 500 KB.`);
      setStep(3);
      return;
    }

    setSubmitting(true);
    setError("");

    const problemSelection = {
      name: teamName.trim() || `${personal.firstName || "Participant"}'s Innovation Entry`,
      institute,
      institutionAddress,
      participationType,
      participantCategory,
      participationLevel,
      institutionType: institutionType || undefined,
      affiliationPinCode: affiliationPinCode || undefined,
      affiliationCity: affiliationCity || undefined,
      affiliationState: affiliationState || undefined,
      institutionEmail: institutionEmail || undefined,
      institutionPhone: institutionPhone || undefined,
      classLevel: classLevel || undefined,
      degreeProgramme: degreeProgramme || undefined,
      departmentBranch: departmentBranch || undefined,
      yearOfStudy: yearOfStudy || undefined,
      coordinatorName: coordinatorName || undefined,
      coordinatorEmail: coordinatorEmail || undefined,
      coordinatorPhone: coordinatorPhone || undefined,
      designationRole: designationRole || undefined,
      departmentDivision: departmentDivision || undefined,
      officialOrgEmail: officialOrgEmail || undefined,
      orgContactPhone: orgContactPhone || undefined,
      mentorName: mentorName || undefined,
      mentorDesignation: mentorDesignation || undefined,
      mentorEmail: mentorEmail || undefined,
      mentorPhone: mentorPhone || undefined,
      problemCategoryCode,
      problemOptionType,
      ...(problemOptionType === "open" ? { proposedProblemStatement } : {}),
    };

    try {
      let id = teamId;

      if (!id) {
        // The leader's participant document also supplies the legacy team-level
        // card column needed by the existing create API.
        const leaderIdCard = members[0]?.idCardFile ?? idCardFile;
        if (!leaderIdCard) {
          throw new ApiError(400, "Upload the Team Leader / Applicant ID Card first.");
        }
        const { team } = await teamApi.create(problemSelection, leaderIdCard);
        id = team.id;
        setTeamId(id);
      } else {
        // Resumed draft - the create() branch above is skipped, so push any
        // edits made since it loaded. idCardFile is only passed when the
        // user chose to replace the card already on file; omitting it
        // leaves the existing upload untouched (see teamApi.update).
        await teamApi.update(id, problemSelection, members[0]?.idCardFile ?? idCardFile ?? undefined);
      }

      // Reconcile the local roster against whatever's already on the team
      // server-side: drop members removed locally, add new ones, and treat
      // an edit to an existing member as remove-then-re-add (there's no
      // update-member endpoint). Without this, a resumed draft's edits or
      // removals never reach the backend and the submitted roster silently
      // diverges from what was reviewed.
      const { team: current } = await teamApi.getMine();
      const currentMembers = (current?.members ?? []).filter(
        (m: TeamMember) => m.role !== "leader",
      );
      const currentByEmail = new Map(
        currentMembers.map((m: TeamMember) => [m.email.toLowerCase(), m]),
      );
      const localOtherMembers = participationType === "Individual" ? [] : members.slice(1);
      const localEmails = new Set(localOtherMembers.map((m) => m.email.toLowerCase()));

      for (const cm of currentMembers) {
        if (!localEmails.has(cm.email.toLowerCase())) {
          await teamApi.removeMember(id, cm.id);
        }
      }

      for (const m of localOtherMembers) {
        const existing = currentByEmail.get(m.email.toLowerCase());

        if (!existing) {
          if (!m.idCardFile) {
            throw new ApiError(400, `Upload an ID Card for ${m.firstName} ${m.lastName}.`);
          }
          await teamApi.addMember(
            id,
            {
              firstName: m.firstName,
              lastName: m.lastName,
              email: m.email,
              phone: m.phone || undefined,
            },
            m.idCardFile,
          );
          continue;
        }

        const changed =
          existing.firstName !== m.firstName ||
          existing.lastName !== m.lastName ||
          (existing.phone ?? "") !== m.phone ||
          !!m.idCardFile;

        if (!changed) continue;

        await teamApi.updateMember(
          id,
          existing.id,
          {
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            phone: m.phone || undefined,
          },
          m.idCardFile ?? undefined,
        );
      }

      const { team } = await teamApi.submit(id);
      setTeamStatus(team.status);
      setStep(5);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.firstFieldError ?? err.message)
          : "Could not submit your registration. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fdf6f6]">
        <Header activeNav="team-register" />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // ── Already registered: dossier is closed, just show status + confirmation ──
  if (existingTeam) {
    const STATUS_COPY: Record<string, { title: string; body: string }> = {
      submitted: {
        title: "Your registration has been recorded!",
        body: "Sit tight - wait for further rounds. We'll notify every team member by email as the process moves forward.",
      },
      under_review: {
        title: "Your registration is under review",
        body: "Your registration is being reviewed by the SEWA 2026 jury. Wait for further rounds - we'll notify you by email.",
      },
      shortlisted: {
        title: "Congratulations - you're shortlisted!",
        body: "Your registration has been shortlisted for the next round of SEWA 2026. Watch your email for next steps.",
      },
      rejected: {
        title: "Thank you for participating",
        body: "Your registration was not shortlisted this round. We appreciate the effort you put into your registration.",
      },
    };
    const copy = STATUS_COPY[existingTeam.status] ?? STATUS_COPY["submitted"]!;

    return (
      <div className="flex min-h-screen flex-col bg-[#fdf6f6]">
        <Header activeNav="team-register" />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
          <div className="no-print rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center shadow-sm sm:px-10">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="size-8 text-primary" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-gray-900">{copy.title}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
              {copy.body}
            </p>
            <div className="mt-2 inline-block rounded-xl border border-primary/20 bg-primary/5 px-6 py-3">
              <p className="text-xs text-gray-500">Team ID</p>
              <p className="break-all font-mono text-sm font-black tracking-wider text-primary">
                {existingTeam.id}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-all hover:opacity-90 cursor-pointer"
              >
                <Download size={15} /> Download / Print Confirmation
              </button>
              <Link
                to="/"
                className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-5 text-sm font-semibold text-gray-600 hover:border-gray-400"
              >
                <ChevronLeft size={15} /> Back to Home
              </Link>
            </div>
          </div>

          {/* Hidden on screen but still laid out when printing. `hidden`
              (display:none) would keep this out of the print layout too, so
              "Download / Print Confirmation" produced a blank page. */}
          <div className="print-only">
            <ConfirmationSummary
              personal={personal}
              email={user?.email ?? ""}
              participationType={participationType}
              teamName={teamName || `${personal.firstName || "Participant"}'s Innovation Entry`}
              institute={institute}
              institutionAddress={institutionAddress}
              participantCategory={participantCategory}
              participationLevel={participationLevel}
              institutionType={institutionType}
              affiliationCity={affiliationCity}
              affiliationState={affiliationState}
              affiliationPinCode={affiliationPinCode}
              institutionEmail={institutionEmail}
              institutionPhone={institutionPhone}
              degreeProgramme={degreeProgramme}
              departmentBranch={departmentBranch}
              yearOfStudy={yearOfStudy}
              classLevel={classLevel}
              designationRole={designationRole}
              departmentDivision={departmentDivision}
              officialOrgEmail={officialOrgEmail}
              coordinatorName={coordinatorName}
              coordinatorEmail={coordinatorEmail}
              coordinatorPhone={coordinatorPhone}
              orgContactPhone={orgContactPhone}
              mentorName={mentorName}
              mentorDesignation={mentorDesignation}
              mentorEmail={mentorEmail}
              mentorPhone={mentorPhone}
              theme={themeDisplay}
              problem={problemDisplay}
              idCardName={idCardDisplay}
              teamSize={members.length}
              members={members}
              teamId={existingTeam.id}
              status={existingTeam.status}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <Header activeNav="team-register" />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="no-print mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#ff4d4f]">
            SEWA 2026 · RASHTRIYA YOUTH INNOVATION CHALLENGE
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Registration Dossier
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Complete your personal identity, problem category, participation details, entry information, and final confirmation to register for SEWA 2026.
          </p>
        </div>

        <div className="flex flex-col items-start gap-6 lg:flex-row">
          <DossierSidebar step={step} />

          <div className="w-full min-w-0 flex-1 rounded-2xl border border-red-200/90 bg-white p-6 shadow-xs sm:p-8">
            {/* ── STEP 1: Personal Details ── */}
            {step === 1 && (
              <div className="space-y-7">
                <SectionHeader n={1} icon={User} title="Candidate Full Name & Profile" />
                <div className="-mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="First Name" required>
                    <input
                      className={inputClass}
                      value={personal.firstName}
                      onChange={(e) => setPersonal((p) => ({ ...p, firstName: e.target.value }))}
                      placeholder="Aarav"
                    />
                  </Field>
                  <Field label="Middle Name">
                    <input
                      className={inputClass}
                      value={personal.middleName}
                      onChange={(e) => setPersonal((p) => ({ ...p, middleName: e.target.value }))}
                      placeholder="e.g. Kumar"
                    />
                  </Field>
                  <Field label="Last Name" required>
                    <input
                      className={inputClass}
                      value={personal.lastName}
                      onChange={(e) => setPersonal((p) => ({ ...p, lastName: e.target.value }))}
                      placeholder="Sharma"
                    />
                  </Field>
                  <Field label="Category / Social Group (For MoE Analytics)">
                    <select
                      className={selectClass}
                      value={personal.category}
                      onChange={(e) => setPersonal((p) => ({ ...p, category: e.target.value }))}
                    >
                      <option value="">Select…</option>
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Nationality / Citizenship" required>
                    <DossierSelect
                      value={personal.nationality}
                      onChange={(val) => setPersonal((p) => ({ ...p, nationality: val }))}
                      options={NATIONALITY_OPTIONS}
                    />
                  </Field>
                  <Field label="Date of Birth (As per High School Certificate)" required>
                    <input
                      type="date"
                      className={inputClass}
                      value={personal.dateOfBirth}
                      onChange={(e) => setPersonal((p) => ({ ...p, dateOfBirth: e.target.value }))}
                    />
                  </Field>
                  <Field label="Gender Identity" required>
                    <DossierSelect
                      value={personal.gender}
                      onChange={(val) => setPersonal((p) => ({ ...p, gender: val }))}
                      options={GENDER_OPTIONS}
                      placeholder="Select an option"
                    />
                  </Field>
                </div>

                <SectionHeader n={2} icon={IdCard} title="Government Identity" />
                <div className="-mt-5">
                  <Field
                    label="Aadhaar Number"
                    required
                    hint="Used only to verify identity at the event. Not shared publicly."
                  >
                    <input
                      className={`${inputClass} max-w-xs`}
                      inputMode="numeric"
                      maxLength={12}
                      value={personal.aadhaarNumber}
                      onChange={(e) =>
                        setPersonal((p) => ({
                          ...p,
                          aadhaarNumber: e.target.value.replace(/\D/g, "").slice(0, 12),
                        }))
                      }
                      placeholder="12-digit Aadhaar number"
                    />
                  </Field>
                </div>

                <SectionHeader n={3} icon={MapPin} title="Residential & Permanent Address" />
                <div className="-mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Address Line 1 (Hostel / Room No. / House / Street)" required>
                      <input
                        className={inputClass}
                        value={personal.addressLine1}
                        onChange={(e) =>
                          setPersonal((p) => ({ ...p, addressLine1: e.target.value }))
                        }
                        placeholder="Room 304, Aryabhatta Hostel, DTU Campus"
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Address Line 2 (Campus Sector / Area / Landmark)">
                      <input
                        className={inputClass}
                        value={personal.addressLine2}
                        onChange={(e) =>
                          setPersonal((p) => ({ ...p, addressLine2: e.target.value }))
                        }
                        placeholder="Shahbad Daulatpur, Bawana Road"
                      />
                    </Field>
                  </div>
                  <Field label="PIN / Postal Code" required>
                    <input
                      className={inputClass}
                      inputMode="numeric"
                      maxLength={6}
                      value={personal.pinCode}
                      onChange={(e) =>
                        setPersonal((p) => ({
                          ...p,
                          pinCode: e.target.value.replace(/\D/g, "").slice(0, 6),
                        }))
                      }
                      placeholder="110042"
                    />
                  </Field>
                  <Field label="City / District" required>
                    <input
                      className={inputClass}
                      value={personal.city}
                      onChange={(e) => setPersonal((p) => ({ ...p, city: e.target.value }))}
                      placeholder="North West Delhi"
                    />
                  </Field>
                  <Field label="State / UT" required>
                    <DossierSelect
                      value={personal.state}
                      onChange={(val) => setPersonal((p) => ({ ...p, state: val }))}
                      options={INDIA_STATE_OPTIONS}
                      placeholder="Select a state / UT"
                    />
                  </Field>
                  <Field label="Country" required>
                    <DossierSelect
                      value={personal.country}
                      onChange={(val) => setPersonal((p) => ({ ...p, country: val }))}
                      options={COUNTRY_OPTIONS}
                    />
                  </Field>
                </div>

                <SectionHeader n={4} icon={Users} title="Verified Contact Channels" />
                <div className="-mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Primary Mobile Number" required>
                    <input
                      type="tel"
                      className={inputClass}
                      value={personal.phone}
                      onChange={(e) => setPersonal((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                    />
                  </Field>
                  <Field label="Alternate Phone (Emergency / Parent / Guardian)">
                    <input
                      type="tel"
                      className={inputClass}
                      value={personal.alternatePhone}
                      onChange={(e) =>
                        setPersonal((p) => ({ ...p, alternatePhone: e.target.value }))
                      }
                      placeholder="+91 94120 56789"
                    />
                  </Field>
                  <Field
                    label={
                      <span className="flex items-center gap-2">
                        Official University Email Address <Badge>Domain Validated</Badge>
                      </span>
                    }
                    required
                  >
                    <input className={inputClass} value={user?.email ?? ""} disabled />
                  </Field>
                  <Field
                    label="Personal Backup Email Address"
                    hint="Receipts and participation certificates will be copied here."
                  >
                    <input
                      type="email"
                      className={inputClass}
                      value={personal.backupEmail}
                      onChange={(e) => setPersonal((p) => ({ ...p, backupEmail: e.target.value }))}
                      placeholder="you@gmail.com"
                    />
                  </Field>
                </div>

                {error && (
                  <p role="alert" className="text-xs font-semibold text-primary">
                    {error}
                  </p>
                )}
                {draftSavedNote && !error && (
                  <p className="text-xs font-semibold text-emerald-600">{draftSavedNote}</p>
                )}

                <StepFooter
                  onSaveDraft={handleSaveDraft}
                  savingDraft={savingDraft}
                  nextLabel="Next: Category & Participation"
                  onNext={handleNextFromPersonal}
                  nextDisabled={!personalComplete(personal)}
                  nextBusy={savingDraft}
                />
              </div>
            )}

            {/* ── STEP 2: Category & Participation ── */}
            {step === 2 && (
              <div className="space-y-8">
                <div>
                  <SectionHeader n={1} icon={Users} title="Participation Type" />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {([
                      { type: "Individual", title: "Individual", desc: "Single innovator submitting a project", icon: User },
                      { type: "Team / Group", title: "Team / Group", desc: "Collaborative team of 2 to 6 participants", icon: Users },
                      { type: "Organisation", title: "Organisation", desc: "Industry, startup or institution-sponsored entry", icon: Building2 },
                    ] as const).map((item) => {
                      const Icon = item.icon;
                      const selected = participationType === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setParticipationType(item.type)}
                          className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${selected ? "border-[#ff4d4f] bg-red-50/40 ring-1 ring-[#ff4d4f] shadow-xs" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"}`}
                        >
                          <div className="flex items-center justify-between">
                            <Icon size={18} className={selected ? "text-[#ff4d4f]" : "text-gray-400"} />
                            {selected && <CheckCircle2 size={16} className="text-[#ff4d4f]" />}
                          </div>
                          <p className={`mt-2 text-sm font-bold ${selected ? "text-gray-900" : "text-gray-700"}`}>{item.title}</p>
                          <p className="mt-0.5 text-xs text-gray-500 leading-snug">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <SectionHeader n={2} icon={GraduationCap} title="Participant Category" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {([
                      { cat: "School & Vocational", title: "School & Vocational", desc: "Secondary, Higher Secondary, ITI & vocational participants", icon: School },
                      { cat: "Diploma & Higher Education", title: "Diploma & Higher Education", desc: "Polytechnic, UG, PG & higher-education participants", icon: GraduationCap },
                      { cat: "Industry & Government", title: "Industry & Government", desc: "Startups, MSMEs, industry and government innovators", icon: Building2 },
                    ] as const).map((item) => {
                      const Icon = item.icon;
                      const selected = participantCategory === item.cat;
                      return (
                        <button
                          key={item.cat}
                          type="button"
                          onClick={() => resetAffiliationForCategory(item.cat)}
                          className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${selected ? "border-[#ff4d4f] bg-red-50/40 ring-1 ring-[#ff4d4f] shadow-xs" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"}`}
                        >
                          <div className="flex items-center justify-between">
                            <Icon size={18} className={selected ? "text-[#ff4d4f]" : "text-gray-400"} />
                            {selected && <CheckCircle2 size={16} className="text-[#ff4d4f]" />}
                          </div>
                          <p className={`mt-2 text-sm font-bold ${selected ? "text-gray-900" : "text-gray-700"}`}>{item.title}</p>
                          <p className="mt-0.5 text-xs text-gray-500 leading-snug">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <SectionHeader n={3} icon={Award} title="Participation Level" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([
                      { level: "National Level", title: "National Level", desc: "National-level innovation themes and official problem statements." },
                      { level: "Local Community Level", title: "Local Community Level", desc: "Regional and community-focused innovation challenges." },
                    ] as const).map((item) => {
                      const selected = participationLevel === item.level;
                      return (
                        <button
                          key={item.level}
                          type="button"
                          onClick={() => {
                            setParticipationLevel(item.level);
                            setProblemCategoryCode("");
                            setProblemOptionType("");
                            setProposedProblemStatement("");
                          }}
                          className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${selected ? "border-[#ff4d4f] bg-red-50/40 ring-1 ring-[#ff4d4f] shadow-xs" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"}`}
                        >
                          <div className="flex items-center justify-between">
                            <Award size={18} className={selected ? "text-[#ff4d4f]" : "text-gray-400"} />
                            {selected && <CheckCircle2 size={16} className="text-[#ff4d4f]" />}
                          </div>
                          <p className={`mt-2 text-sm font-bold ${selected ? "text-gray-900" : "text-gray-700"}`}>{item.title}</p>
                          <p className="mt-1 text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <SectionHeader
                    n={4}
                    icon={Building2}
                    title={
                      participantCategory === "School & Vocational"
                        ? "School & Vocational Institution Details"
                        : participantCategory === "Industry & Government"
                          ? "Organization Details"
                          : "College / University / Institution Details"
                    }
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                      label={
                        participantCategory === "School & Vocational"
                          ? "School / Institution Name"
                          : participantCategory === "Industry & Government"
                            ? "Organization Name"
                            : "College / University / Institution Name"
                      }
                      required
                    >
                      <input
                        className={inputClass}
                        value={institute}
                        onChange={(e) => setInstitute(e.target.value)}
                        placeholder={
                          participantCategory === "School & Vocational"
                            ? "e.g. Kendriya Vidyalaya / Government Senior Secondary School"
                            : participantCategory === "Industry & Government"
                              ? "e.g. Bharat Dynamics / DRDO / Tech Innovation Pvt Ltd"
                              : "e.g. Delhi Technological University"
                        }
                      />
                    </Field>
                    <Field label="Institution Type" required>
                      <DossierSelect
                        value={institutionType}
                        onChange={setInstitutionType}
                        options={
                          participantCategory === "School & Vocational"
                            ? SCHOOL_INSTITUTION_TYPES
                            : participantCategory === "Industry & Government"
                              ? INDUSTRY_INSTITUTION_TYPES
                              : HIGHER_ED_INSTITUTION_TYPES
                        }
                      />
                    </Field>
                    <Field label="Institution / Organization Email">
                      <div className="relative">
                        <Mail size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          className={`${inputClass} pl-9`}
                          value={institutionEmail}
                          onChange={(e) => setInstitutionEmail(e.target.value)}
                          placeholder="office@institution.ac.in"
                        />
                      </div>
                    </Field>
                    <Field label="Institution Contact Phone">
                      <div className="relative">
                        <Phone size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          className={`${inputClass} pl-9`}
                          value={institutionPhone}
                          onChange={(e) => setInstitutionPhone(e.target.value)}
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </Field>
                    <Field
                      label={
                        participantCategory === "School & Vocational"
                          ? "School Address"
                          : participantCategory === "Industry & Government"
                            ? "Organization Address"
                            : "Institution Address"
                      }
                      required
                    >
                      <textarea
                        className={`${inputClass} min-h-[80px] resize-y`}
                        value={institutionAddress}
                        onChange={(e) => setInstitutionAddress(e.target.value)}
                        placeholder={
                          participantCategory === "School & Vocational"
                            ? "School premises, street / area / landmark"
                            : participantCategory === "Industry & Government"
                              ? "Registered address, office complex, area, PIN"
                              : "Campus road, locality, district, state, PIN"
                        }
                      />
                    </Field>
                    {participantCategory === "School & Vocational" && (
                      <Field label="School PIN / Postal Code" required hint="6-digit Indian PIN code">
                        <input
                          inputMode="numeric"
                          maxLength={6}
                          className={inputClass}
                          value={affiliationPinCode}
                          onChange={(e) => setAffiliationPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="110042"
                        />
                      </Field>
                    )}
                    <Field label="City / District" required>
                      <input
                        className={inputClass}
                        value={affiliationCity}
                        onChange={(e) => setAffiliationCity(e.target.value)}
                        placeholder="New Delhi"
                      />
                    </Field>
                    <Field label="State / UT" required>
                      <DossierSelect value={affiliationState} onChange={setAffiliationState} options={INDIA_STATE_OPTIONS} />
                    </Field>
                  </div>

                  {participantCategory === "School & Vocational" && (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Class / Level" required>
                        <DossierSelect value={classLevel} onChange={setClassLevel} options={SCHOOL_CLASS_OPTIONS} />
                      </Field>
                    </div>
                  )}

                  {participantCategory === "Diploma & Higher Education" && (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Degree / Programme" required>
                        <input
                          className={inputClass}
                          value={degreeProgramme}
                          onChange={(e) => setDegreeProgramme(e.target.value)}
                          placeholder="B.Tech / Diploma / M.Tech / Ph.D"
                        />
                      </Field>
                      <Field label="Department / Branch" required>
                        <input
                          className={inputClass}
                          value={departmentBranch}
                          onChange={(e) => setDepartmentBranch(e.target.value)}
                          placeholder="Computer Science & Engineering"
                        />
                      </Field>
                      <Field label="Year of Study" required>
                        <DossierSelect value={yearOfStudy} onChange={setYearOfStudy} options={HIGHER_ED_YEARS} />
                      </Field>
                      <Field label="Coordinator Name">
                        <input
                          className={inputClass}
                          value={coordinatorName}
                          onChange={(e) => setCoordinatorName(e.target.value)}
                          placeholder="Dr. Faculty Coordinator"
                        />
                      </Field>
                      <Field label="Coordinator Email">
                        <input
                          type="email"
                          className={inputClass}
                          value={coordinatorEmail}
                          onChange={(e) => setCoordinatorEmail(e.target.value)}
                          placeholder="coordinator@institution.ac.in"
                        />
                      </Field>
                      <Field label="Coordinator Contact Number">
                        <input
                          type="tel"
                          className={inputClass}
                          value={coordinatorPhone}
                          onChange={(e) => setCoordinatorPhone(e.target.value)}
                          placeholder="+91 9876543210"
                        />
                      </Field>
                    </div>
                  )}

                  {participantCategory === "Industry & Government" && (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Applicant Role / Designation" required>
                        <input
                          className={inputClass}
                          value={designationRole}
                          onChange={(e) => setDesignationRole(e.target.value)}
                          placeholder="Founder / Scientist / Engineer"
                        />
                      </Field>
                      <Field label="Department / Division">
                        <input
                          className={inputClass}
                          value={departmentDivision}
                          onChange={(e) => setDepartmentDivision(e.target.value)}
                          placeholder="R&D / Innovation / Engineering"
                        />
                      </Field>
                      <Field label="Official Organization Email" required>
                        <input
                          type="email"
                          className={inputClass}
                          value={officialOrgEmail}
                          onChange={(e) => setOfficialOrgEmail(e.target.value)}
                          placeholder="innovation@organization.com"
                        />
                      </Field>
                      <Field label="Organization Contact Number">
                        <input
                          type="tel"
                          className={inputClass}
                          value={orgContactPhone}
                          onChange={(e) => setOrgContactPhone(e.target.value)}
                          placeholder="+91 9876543210"
                        />
                      </Field>
                    </div>
                  )}
                </div>

                <div>
                  <SectionHeader n={5} icon={Layers} title="Problem Category" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PROBLEM_CATEGORIES.filter((c) => (participationLevel === "National Level" ? c.theme === "NATIONAL" : c.theme === "REGIONAL")).map((c) => {
                      const selected = problemCategoryCode === c.code;
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleCategoryChange(c.code)}
                          className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${selected ? "border-[#ff4d4f] bg-red-50/40 ring-1 ring-[#ff4d4f] shadow-xs" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#ff4d4f]">{c.code}</span>
                            {selected && <CheckCircle2 size={16} className="text-[#ff4d4f]" />}
                          </div>
                          <p className="mt-2 text-sm font-bold text-gray-900">{c.label}</p>
                          {c.psTitle && <p className="mt-1 text-xs leading-relaxed text-gray-500">{c.psTitle}</p>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <SectionHeader n={6} icon={ListChecks} title="Problem Statement" />
                  {!problemCategoryCode ? (
                    <p className="text-xs text-gray-400">Choose a problem category first.</p>
                  ) : selectedCategory?.theme === "REGIONAL" ? (
                    <p className="text-xs text-gray-500">This regional category uses an open proposal. Describe the problem your team intends to solve.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setProblemOptionType("ps")}
                        className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${problemOptionType === "ps" ? "border-[#ff4d4f] bg-red-50/40 ring-1 ring-[#ff4d4f] shadow-xs" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"}`}
                      >
                        <div className="flex items-center justify-between">
                          <Bookmark size={18} className={problemOptionType === "ps" ? "text-[#ff4d4f]" : "text-gray-400"} />
                          {problemOptionType === "ps" && <CheckCircle2 size={16} className="text-[#ff4d4f]" />}
                        </div>
                        <p className="mt-2 text-sm font-bold text-gray-900">Official Problem Statement</p>
                        <p className="mt-1 text-xs text-gray-500">{selectedCategory?.psTitle}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProblemOptionType("open")}
                        className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${problemOptionType === "open" ? "border-[#ff4d4f] bg-red-50/40 ring-1 ring-[#ff4d4f] shadow-xs" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"}`}
                      >
                        <div className="flex items-center justify-between">
                          <Layers size={18} className={problemOptionType === "open" ? "text-[#ff4d4f]" : "text-gray-400"} />
                          {problemOptionType === "open" && <CheckCircle2 size={16} className="text-[#ff4d4f]" />}
                        </div>
                        <p className="mt-2 text-sm font-bold text-gray-900">Propose my own problem</p>
                        <p className="mt-1 text-xs text-gray-500">Define a problem within the selected challenge category.</p>
                      </button>
                    </div>
                  )}
                  {problemOptionType === "open" && (
                    <Field label="Describe the problem you're proposing to solve" required hint="At least 10 characters.">
                      <textarea
                        className={`${inputClass} mt-3 min-h-[110px] resize-y`}
                        value={proposedProblemStatement}
                        onChange={(e) => setProposedProblemStatement(e.target.value)}
                        placeholder="What's the problem, who does it affect, and what's your proposed direction?"
                      />
                    </Field>
                  )}
                </div>

                {error && <p role="alert" className="text-xs font-semibold text-[#ff4d4f]">{error}</p>}

                <StepFooter
                  onBack={() => setStep(1)}
                  nextLabel="Next: Entry Details"
                  onNext={() => setStep(3)}
                  nextDisabled={
                    !affiliationComplete(participantCategory, {
                      institutionType,
                      affiliationPinCode,
                      affiliationCity,
                      affiliationState,
                      institutionEmail,
                      institutionPhone,
                      classLevel,
                      degreeProgramme,
                      departmentBranch,
                      yearOfStudy,
                      coordinatorName,
                      coordinatorEmail,
                      coordinatorPhone,
                      designationRole,
                      departmentDivision,
                      officialOrgEmail,
                      orgContactPhone,
                    }) ||
                    !problemCategoryCode ||
                    !problemOptionType ||
                    (problemOptionType === "open" && proposedProblemStatement.trim().length < 10)
                  }
                />
              </div>
            )}

            {/* ── STEP 3: Entry Details ── */}
            {step === 3 && (
              <div className="space-y-7">
                <SectionHeader n={1} icon={IdCard} title={participationType === "Individual" ? "Innovation Entry" : participationType === "Organisation" ? "Organisation Entry" : "Team Identity"} />
                <div className="-mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={participationType === "Individual" ? "Project / Innovation Title" : participationType === "Organisation" ? "Organisation / Entry Name" : "Team Name"} required={participationType !== "Individual"} hint={participationType === "Individual" ? "Optional; a default title will be generated if left blank." : "At least 3 characters."}>
                    <input
                      className={inputClass}
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder={participationType === "Individual" ? "e.g. Automated Precision Agrotech Rover" : participationType === "Organisation" ? "e.g. ABC Innovation Cell" : "e.g. Circuit Breakers"}
                    />
                  </Field>
                </div>

                <SectionHeader n={2} icon={Users} title={participationType === "Individual" ? "Participant Details" : "Member Details"} />
                {participationType !== "Individual" && (
                  <div className="-mt-5 mb-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">Participant count</span>
                    {TEAM_SIZE_OPTIONS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleSizeChange(n)}
                        className={`size-8 rounded-lg border text-xs font-bold cursor-pointer ${teamSize === n ? "border-[#ff4d4f] bg-red-50 text-[#ff4d4f]" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
                <div className="-mt-2 space-y-3">
                  {members.map((m, i) => {
                    const who = i === 0
                      ? participationType === "Individual"
                        ? "Individual Applicant"
                        : "Team Leader"
                      : `${participationType === "Organisation" ? "Participant" : "Team Member"} ${i + 1}`;
                    return (
                      <div key={i} className="space-y-3 rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-gray-600">
                            {who}{i === 0 ? " (You)" : " *"}
                          </label>
                          {i === 0 && (
                            <span className="text-[10px] font-bold uppercase text-gray-400">Auto-filled from Step 1</span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <input
                            aria-label={`${who} first name`}
                            className={inputClass}
                            disabled={i === 0}
                            value={m.firstName}
                            onChange={(e) => updateMember(i, "firstName", e.target.value)}
                            placeholder="First name"
                          />
                          <input
                            aria-label={`${who} last name`}
                            className={inputClass}
                            disabled={i === 0}
                            value={m.lastName}
                            onChange={(e) => updateMember(i, "lastName", e.target.value)}
                            placeholder="Last name"
                          />
                          <input
                            type="email"
                            aria-label={`${who} email`}
                            className={inputClass}
                            disabled={i === 0}
                            value={m.email}
                            onChange={(e) => updateMember(i, "email", e.target.value)}
                            placeholder={i === 0 ? "your@email.com" : `member${i + 1}@email.com`}
                          />
                          <input
                            type="tel"
                            aria-label={`${who} phone`}
                            className={inputClass}
                            disabled={i === 0}
                            value={m.phone}
                            onChange={(e) => updateMember(i, "phone", e.target.value)}
                            placeholder="Phone (optional)"
                          />
                        </div>

                        <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                          <label className="block text-xs font-bold text-gray-700">
                            {who}'s Student / Institution ID Card <span className="text-[#ff4d4f]">*</span>
                          </label>
                          <p className="mt-1 text-[11px] text-gray-500">
                            PDF, JPG, or PNG · max 500 KB. College ID, Student ID or Bonafide certificate.
                          </p>
                          <input
                            type="file"
                            accept={ID_CARD_ACCEPT}
                            onChange={(e) => handleMemberIdCardChange(i, e.target.files?.[0] ?? null)}
                            className="mt-2 block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-red-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#ff4d4f] hover:file:bg-red-100 cursor-pointer"
                          />
                          {m.idCardFile ? (
                            <p className="mt-1.5 text-xs font-semibold text-emerald-600">Selected: {m.idCardFile.name}</p>
                          ) : m.idCardName ? (
                            <p className="mt-1.5 text-xs text-gray-500">Currently on file: {m.idCardName}. Choose a new file to replace it.</p>
                          ) : null}
                          {m.idCardError ? (
                            <p role="alert" className="mt-1.5 text-xs font-semibold text-[#ff4d4f]">{m.idCardError}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <SectionHeader n={3} icon={UserCheck} title="Mentor / Guide" />
                  <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4">
                    <p className="mb-3 text-xs leading-relaxed text-gray-500">
                      Optional. Add a faculty guide, incubator manager, industry mentor, or other mentor supporting your team.
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Mentor Full Name">
                        <input
                          className={inputClass}
                          value={mentorName}
                          onChange={(e) => setMentorName(e.target.value)}
                          placeholder="Mentor Full Name"
                        />
                      </Field>
                      <Field label="Designation / Department / Organization">
                        <input
                          className={inputClass}
                          value={mentorDesignation}
                          onChange={(e) => setMentorDesignation(e.target.value)}
                          placeholder="Professor / Research Scientist / Incubator Manager"
                        />
                      </Field>
                      <Field label="Mentor Email">
                        <input
                          type="email"
                          className={inputClass}
                          value={mentorEmail}
                          onChange={(e) => setMentorEmail(e.target.value)}
                          placeholder="mentor@institution.ac.in"
                        />
                      </Field>
                      <Field label="Mentor Phone Number">
                        <input
                          type="tel"
                          className={inputClass}
                          value={mentorPhone}
                          onChange={(e) => setMentorPhone(e.target.value)}
                          placeholder="+91 9876543210"
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-xs font-semibold text-primary">
                    {error}
                  </p>
                )}

                <StepFooter
                  onBack={() => setStep(2)}
                  nextLabel="Next: Review & Confirmation"
                  onNext={() => {
                    const dup = findDuplicateEmail(members);
                    if (dup) {
                      setError(
                        `"${dup}" is used by more than one member. Each member needs a different email.`,
                      );
                      return;
                    }
                    setError("");
                    setStep(4);
                  }}
                  nextDisabled={
                    (participationType !== "Individual" && teamName.trim().length < TEAM_NAME_MIN) ||
                    institute.trim().length < INSTITUTE_MIN ||
                    institutionAddress.trim().length < 5 ||
                    members.length !== (participationType === "Individual" ? 1 : teamSize) ||
                    members.some((m) => !memberComplete(m))
                  }
                />
              </div>
            )}

            {/* ── STEP 4: Review & Confirmation ── */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900">Review &amp; Confirm</h2>
                <ConfirmationSummary
                  personal={personal}
                  email={user?.email ?? ""}
                  participationType={participationType}
                  teamName={teamName || `${personal.firstName || "Participant"}'s Innovation Entry`}
                  institute={institute}
                  institutionAddress={institutionAddress}
                  participantCategory={participantCategory}
                  participationLevel={participationLevel}
                  institutionType={institutionType}
                  affiliationCity={affiliationCity}
                  affiliationState={affiliationState}
                  affiliationPinCode={affiliationPinCode}
                  institutionEmail={institutionEmail}
                  institutionPhone={institutionPhone}
                  degreeProgramme={degreeProgramme}
                  departmentBranch={departmentBranch}
                  yearOfStudy={yearOfStudy}
                  classLevel={classLevel}
                  designationRole={designationRole}
                  departmentDivision={departmentDivision}
                  officialOrgEmail={officialOrgEmail}
                  coordinatorName={coordinatorName}
                  coordinatorEmail={coordinatorEmail}
                  coordinatorPhone={coordinatorPhone}
                  orgContactPhone={orgContactPhone}
                  mentorName={mentorName}
                  mentorDesignation={mentorDesignation}
                  mentorEmail={mentorEmail}
                  mentorPhone={mentorPhone}
                  theme={themeDisplay}
                  problem={problemDisplay}
                  idCardName={idCardDisplay}
                  teamSize={teamSize}
                  members={members}
                  teamId={teamId}
                  status="draft"
                />

                <label className="flex cursor-pointer select-none items-start gap-3">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 accent-primary"
                  />
                  <span className="text-xs leading-relaxed text-gray-500">
                    I hereby confirm that the information and identification documents provided for myself and all team members are accurate and complete to the best of my knowledge. I accept full responsibility for any discrepancies or inaccuracies and understand that the committee reserves the right to reject or disqualify our participation if any information or documents are found to be false, misleading, or inconsistent.
                  </span>
                </label>

                {error && (
                  <p role="alert" className="text-xs font-semibold text-primary">
                    {error}
                  </p>
                )}

                <StepFooter
                  onBack={() => setStep(3)}
                  nextLabel={submitting ? "Submitting…" : "Submit Registration"}
                  onNext={handleFinalSubmit}
                  nextDisabled={!agreed}
                  nextBusy={submitting}
                />
              </div>
            )}

            {/* ── STEP 5: Download Confirmation ── */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="no-print text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle2 className="size-7 text-emerald-500" />
                  </div>
                  <h2 className="mt-3 text-xl font-extrabold text-gray-900">Registration Recorded!</h2>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                    <span className="font-semibold text-gray-800">{teamName || `${personal.firstName || "Participant"}'s Innovation Entry`}</span> has been
                    successfully registered for SEWA 2026. Wait for further rounds - we'll notify
                    every team member by email.
                  </p>
                </div>

                <ConfirmationSummary
                  personal={personal}
                  email={user?.email ?? ""}
                  participationType={participationType}
                  teamName={teamName || `${personal.firstName || "Participant"}'s Innovation Entry`}
                  institute={institute}
                  institutionAddress={institutionAddress}
                  participantCategory={participantCategory}
                  participationLevel={participationLevel}
                  institutionType={institutionType}
                  affiliationCity={affiliationCity}
                  affiliationState={affiliationState}
                  affiliationPinCode={affiliationPinCode}
                  institutionEmail={institutionEmail}
                  institutionPhone={institutionPhone}
                  degreeProgramme={degreeProgramme}
                  departmentBranch={departmentBranch}
                  yearOfStudy={yearOfStudy}
                  classLevel={classLevel}
                  designationRole={designationRole}
                  departmentDivision={departmentDivision}
                  officialOrgEmail={officialOrgEmail}
                  coordinatorName={coordinatorName}
                  coordinatorEmail={coordinatorEmail}
                  coordinatorPhone={coordinatorPhone}
                  orgContactPhone={orgContactPhone}
                  mentorName={mentorName}
                  mentorDesignation={mentorDesignation}
                  mentorEmail={mentorEmail}
                  mentorPhone={mentorPhone}
                  theme={themeDisplay}
                  problem={problemDisplay}
                  idCardName={idCardDisplay}
                  teamSize={teamSize}
                  members={members}
                  teamId={teamId}
                  status={teamStatus}
                />

                <div className="no-print flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex h-10 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white transition-all hover:opacity-90 cursor-pointer"
                  >
                    <Download size={15} /> Download / Print Confirmation
                  </button>
                  <Link
                    to="/"
                    className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-5 text-sm font-semibold text-gray-600 hover:border-gray-400"
                  >
                    <ChevronLeft size={15} /> Back to Home
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
