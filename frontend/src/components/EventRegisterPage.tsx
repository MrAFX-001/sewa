import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  Bookmark,
  Building,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Download,
  GraduationCap,
  IdCard,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Phone,
  School,
  ShieldCheck,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "../lib/auth";
import {
  ID_CARD_ACCEPT,
  ID_CARD_ALLOWED_MIME,
} from "../lib/problemCategories";
import { Footer, Header } from "./SewaSite";

// ─── ID Card limit: 500 KB ───────────────────────────────────────────────────
const ID_CARD_MAX_SIZE_BYTES = 500 * 1024; // 500 KB

// ─── Static option lists matching official SEWA Dossier ──────────────────────

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const NATIONALITY_OPTIONS = ["Indian Citizen (Bharat)", "Other / Foreign National"];
const COUNTRY_OPTIONS = ["India (Bharat)", "Other"];

// 36 States & Union Territories of India (28 States + 8 UTs)
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

export type ParticipationType = "Individual" | "Team / Group" | "Organisation";
export type ParticipantCategory =
  | "School & Vocational"
  | "Diploma & Higher Education"
  | "Industry & Government";
export type ParticipationLevel = "National Level" | "Local Community Level";

const SCHOOL_INSTITUTION_TYPES = ["School", "ITI", "Vocational Institution", "Other"];
const SCHOOL_CLASS_OPTIONS = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "ITI 1st Year",
  "ITI 2nd Year",
  "Vocational / Diploma",
  "Other",
] as const;
const HIGHER_ED_INSTITUTION_TYPES = [
  "College",
  "University",
  "Diploma Institute",
  "Research Institution",
  "Other",
];
const HIGHER_ED_YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year / Final Year",
  "Research Scholar / Ph.D",
];
const INDUSTRY_ORG_TYPES = [
  "Industry",
  "MSME",
  "Startup",
  "R&D Organization",
  "Government Laboratory",
  "Other",
];

const TEAM_SIZE_OPTIONS = [2, 3, 4, 5, 6];

const WIZARD_STEPS = [
  { n: 1, title: "Personal Details", desc: "Applicant Identity" },
  { n: 2, title: "Category & Participation", desc: "Affiliation & Category Selection" },
  { n: 3, title: "About Team", desc: "Member Details & Student ID Cards" },
  { n: 4, title: "Review & Confirmation", desc: "Review Dossier" },
  { n: 5, title: "Download Confirmation", desc: "Print PDF Slip" },
] as const;

type WizardStep = (typeof WIZARD_STEPS)[number]["n"];

// ─── Form Data Shapes ────────────────────────────────────────────────────────

interface PersonalDetails {
  firstName: string;
  middleName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
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
  email: string;
  backupEmail: string;
}

const defaultPersonal = (): PersonalDetails => ({
  firstName: "",
  middleName: "",
  lastName: "",
  nationality: NATIONALITY_OPTIONS[0]!,
  dateOfBirth: "",
  gender: "Male",
  aadhaarNumber: "",
  addressLine1: "",
  addressLine2: "",
  pinCode: "",
  city: "",
  state: "Delhi (NCT)",
  country: COUNTRY_OPTIONS[0]!,
  phone: "",
  alternatePhone: "",
  email: "",
  backupEmail: "",
});

interface AffiliationDetails {
  // Common
  institutionName: string;
  institutionType: string;
  institutionAddress: string;
  pinCode: string;
  city: string;
  state: string;
  institutionEmail: string;
  institutionPhone: string;

  // School & Vocational
  classLevel: string;

  // Diploma & Higher Education
  degreeProgramme: string;
  departmentBranch: string;
  yearOfStudy: string;
  coordinatorName: string;
  coordinatorEmail: string;
  coordinatorPhone: string;

  // Industry & Government
  departmentDivision: string;
  designationRole: string;
  officialOrgEmail: string;
  orgContactPhone: string;
}

const defaultAffiliation = (): AffiliationDetails => ({
  institutionName: "",
  institutionType: HIGHER_ED_INSTITUTION_TYPES[0]!,
  institutionAddress: "",
  pinCode: "",
  city: "",
  state: "Delhi (NCT)",
  institutionEmail: "",
  institutionPhone: "",
  classLevel: "Class 12",
  degreeProgramme: "B.Tech",
  departmentBranch: "Computer Science & Engineering",
  yearOfStudy: "3rd Year",
  coordinatorName: "",
  coordinatorEmail: "",
  coordinatorPhone: "",
  departmentDivision: "",
  designationRole: "",
  officialOrgEmail: "",
  orgContactPhone: "",
});

interface MemberDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role?: string;
  idCardFile?: File | null;
  idCardName?: string;
  idCardError?: string;
}

const emptyMember = (role = "Member"): MemberDetails => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role,
  idCardFile: null,
  idCardName: "",
  idCardError: "",
});

interface MentorDetails {
  name: string;
  designation: string;
  email: string;
  phone: string;
}

const defaultMentor = (): MentorDetails => ({
  name: "",
  designation: "",
  email: "",
  phone: "",
});

const PHONE_RE = /^(\+91)?[6-9]\d{9}$/;
const AADHAAR_RE = /^\d{12}$/;
const PIN_RE = /^\d{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const phoneOk = (v: string) => PHONE_RE.test(v.replace(/\s+/g, ""));

const inputClass =
  "w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-[#f8faff] text-sm text-gray-800 placeholder-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/20 focus:border-[#ff4d4f] focus:bg-white transition-all " +
  "disabled:bg-gray-100 disabled:text-gray-500";

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
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
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
          className={`shrink-0 ml-2 transition-transform duration-200 ${
            open ? "rotate-180 text-[#ff4d4f]" : "text-gray-400"
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto rounded-xl border border-red-100/90 bg-white p-1.5 shadow-xl shadow-red-950/10 ring-1 ring-black/5">
          <div className="space-y-0.5" role="listbox">
            {options.map((opt) => {
              const isSelected = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-xs sm:text-sm text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-red-50 text-[#ff4d4f] font-bold"
                      : "text-gray-700 hover:bg-slate-50 hover:text-gray-950 font-medium"
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && <CheckCircle2 size={15} className="text-[#ff4d4f] shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── UI Helper Components ───────────────────────────────────────────────────

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
      {hint && <p className="mt-1 text-[11px] text-gray-500">{hint}</p>}
    </div>
  );
}

function SectionHeader({
  n,
  icon: Icon,
  title,
  required = true,
}: {
  n: number;
  icon: typeof User;
  title: string;
  required?: boolean;
}) {
  return (
    <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-3">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-[#ff4d4f]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
          {n}. {title}
        </h3>
      </div>
      {required && <span className="text-xs font-semibold text-[#ff4d4f]">* Required</span>}
    </div>
  );
}

function DossierSidebar({
  step,
  onSelectStep,
}: {
  step: WizardStep;
  onSelectStep?: (s: WizardStep) => void;
}) {
  return (
    <aside className="no-print w-full shrink-0 rounded-2xl border border-red-200/90 bg-white p-6 shadow-xs lg:w-72">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
        REGISTRATION DOSSIER
      </p>
      <h2 className="mt-1 mb-6 text-xl font-black tracking-tight text-gray-900">SEWA 2026</h2>

      <ol className="space-y-6">
        {WIZARD_STEPS.map((s) => {
          const isActive = step === s.n;
          const isDone = step > s.n;
          return (
            <li
              key={s.n}
              onClick={() => onSelectStep?.(s.n)}
              className="flex items-start gap-3.5 cursor-pointer group select-none"
              title={`Step ${s.n}: ${s.title}`}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all group-hover:scale-105 ${
                  isActive
                    ? "bg-[#ff4d4f] text-white shadow-sm"
                    : isDone
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-slate-100 text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-700"
                }`}
              >
                {isDone ? <CheckCircle2 size={15} /> : s.n}
              </span>
              <div className="pt-0.5">
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    isActive ? "text-[#ff4d4f]" : "text-gray-400 group-hover:text-amber-700"
                  }`}
                >
                  STEP {s.n}
                </p>
                <p
                  className={`text-[13px] font-bold leading-tight transition-colors ${
                    isActive
                      ? "text-[#ff4d4f]"
                      : isDone
                        ? "text-gray-800 group-hover:text-[#ff4d4f]"
                        : "text-gray-500 group-hover:text-gray-900"
                  }`}
                >
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

function PrintableConfirmationSlip({
  regId,
  personal,
  participationType,
  participantCategory,
  participationLevel,
  affiliation,
  teamName,
  members,
  mentor,
}: {
  regId: string;
  personal: PersonalDetails;
  participationType: ParticipationType;
  participantCategory: ParticipantCategory;
  participationLevel: ParticipationLevel;
  affiliation: AffiliationDetails;
  teamName: string;
  members: MemberDetails[];
  mentor: MentorDetails;
}) {
  const maskedAadhaar = personal.aadhaarNumber
    ? `•••• •••• ${personal.aadhaarNumber.slice(-4)}`
    : "-";

  const rows: [string, string][] = [
    [
      "Applicant Name",
      [personal.firstName, personal.middleName, personal.lastName].filter(Boolean).join(" "),
    ],
    ["Date of Birth", personal.dateOfBirth || "-"],
    ["Gender Identity", personal.gender || "-"],
    ["Nationality", personal.nationality || "-"],
    ["Government Aadhaar ID", maskedAadhaar],
    [
      "Permanent Address",
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
    ["Primary Contact Phone", personal.phone || "-"],
    ["Official Email", personal.email || "-"],
    ["Participation Type", participationType],
    ["Participant Category", participantCategory],
    ["Participation Level", participationLevel],
    ["Institution / Organization Name", affiliation.institutionName || "-"],
    ["Institution Type", affiliation.institutionType || "-"],
    ...(participantCategory === "School & Vocational"
      ? ([["Class / Level", affiliation.classLevel || "-"]] as [string, string][])
      : participantCategory === "Diploma & Higher Education"
        ? ([
            ["Degree / Programme", affiliation.degreeProgramme || "-"],
            ["Department / Branch", affiliation.departmentBranch || "-"],
            ["Year of Study", affiliation.yearOfStudy || "-"],
            [
              "Faculty Coordinator",
              affiliation.coordinatorName
                ? `${affiliation.coordinatorName} (${affiliation.coordinatorEmail || affiliation.coordinatorPhone || "Contact provided"})`
                : "-",
            ],
          ] as [string, string][])
        : ([
            ["Applicant Role / Designation", affiliation.designationRole || "-"],
            ["Department / Division", affiliation.departmentDivision || "-"],
            ["Official Org Email", affiliation.officialOrgEmail || "-"],
          ] as [string, string][])),
    [
      "Team / Entry Name",
      teamName?.trim() ||
        (personal.firstName?.trim()
          ? `${personal.firstName}'s Innovation Entry`
          : participationType === "Individual"
            ? "Individual Innovation Entry"
            : "SEWA Innovation Entry"),
    ],
    ["Team Size", `${members.length} participant(s)`],
    ...(mentor.name
      ? ([
          [
            "Mentor / Guide",
            `${mentor.name}${mentor.designation ? ` (${mentor.designation})` : ""}${mentor.email ? ` · ${mentor.email}` : ""}`,
          ],
        ] as [string, string][])
      : []),
  ];

  return (
    <div className="print-area space-y-6 text-sm text-gray-700">
      <div className="text-center border-b border-gray-200 pb-5" style={{ textAlign: "center" }}>
        <p
          className="text-center text-xs font-bold uppercase tracking-widest text-[#ff4d4f]"
          style={{ textAlign: "center" }}
        >
          SEWA 2026 · RASHTRIYA YOUTH INNOVATION CHALLENGE
        </p>
        <h2
          className="mt-1 text-2xl font-black text-gray-900 text-center"
          style={{ textAlign: "center" }}
        >
          Official Registration Confirmation Dossier
        </h2>
        <p
          className="mt-1 text-xs text-gray-500 text-center"
          style={{ textAlign: "center" }}
        >
          Delhi Technological University (DTU), Delhi
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/60 px-4 py-2">
          <span className="text-xs text-gray-600 font-medium">Registration ID:</span>
          <span className="font-mono text-sm font-black text-[#ff4d4f]">{regId || "SEWA26-CONFIRMED"}</span>
          <span className="text-xs text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full ml-1">
            CONFIRMED
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
            <span className="text-xs font-semibold text-gray-500">{label}</span>
            <span className="max-w-[65%] text-right text-xs font-semibold text-gray-900">
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-700">
            {participationType === "Individual"
              ? "Individual Participant & Uploaded ID"
              : `Registered Team Roster & Student ID Cards (${members.length} Members)`}
          </p>
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={13} /> All ID Cards Uploaded
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map((m, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-[#ff4d4f]">
                  {(m.firstName || m.email || "M")[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    {`${m.firstName} ${m.lastName}`.trim() || `Member ${i + 1}`}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {m.email} {m.phone ? `· ${m.phone}` : ""}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right pl-11 sm:pl-0">
                <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                  {i === 0 ? "Leader / Applicant" : m.role || `Member ${i + 1}`}
                </span>
                <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 sm:justify-end mt-0.5">
                  <CheckCircle2 size={12} />
                  <span>ID Card: {m.idCardName || "Uploaded"}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
        <p>This is a computer generated confirmation slip for SEWA 2026. No physical signature is required.</p>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

const STORAGE_KEY_DRAFT = "sewa_event_registration_draft";
const STORAGE_KEY_SUBMITTED = "sewa_event_registration_submitted";

export function EventRegisterPage() {
  const { user } = useAuth();

  const [step, setStep] = useState<WizardStep>(1);

  // Step 1 state
  const [personal, setPersonal] = useState<PersonalDetails>(defaultPersonal());

  // Step 2 state
  const [participationType, setParticipationType] = useState<ParticipationType>("Team / Group");
  const [participantCategory, setParticipantCategory] =
    useState<ParticipantCategory>("Diploma & Higher Education");
  const [participationLevel, setParticipationLevel] =
    useState<ParticipationLevel>("National Level");
  const [affiliation, setAffiliation] = useState<AffiliationDetails>(defaultAffiliation());

  // Step 3 state
  const [teamName, setTeamName] = useState<string>("");
  const [teamSize, setTeamSize] = useState<number>(2);
  const [members, setMembers] = useState<MemberDetails[]>([
    emptyMember("Team Leader"),
    emptyMember("Member"),
  ]);
  const [mentor, setMentor] = useState<MentorDetails>(defaultMentor());

  // Step 4 & 5 state
  const [agreed, setAgreed] = useState<boolean>(false);
  const [regId, setRegId] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [draftSavedMessage, setDraftSavedMessage] = useState<string>("");

  // Restore draft or populate from auth if available
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY_DRAFT);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.personal) setPersonal(parsed.personal);
        if (parsed.participationType) setParticipationType(parsed.participationType);
        if (parsed.participantCategory) setParticipantCategory(parsed.participantCategory);
        if (parsed.participationLevel) setParticipationLevel(parsed.participationLevel);
        if (parsed.affiliation) setAffiliation(parsed.affiliation);
        if (parsed.teamName) setTeamName(parsed.teamName);
        if (parsed.teamSize) setTeamSize(parsed.teamSize);
        if (parsed.members && Array.isArray(parsed.members)) setMembers(parsed.members);
        if (parsed.mentor) setMentor(parsed.mentor);
        return;
      }
    } catch {
      // ignore JSON parse error
    }

    if (user) {
      setPersonal((prev) => ({
        ...prev,
        firstName: prev.firstName || user.firstName || "",
        lastName: prev.lastName || user.lastName || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
      setMembers((prev) => [
        {
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phone || "",
          role: "Team Leader",
          idCardFile: null,
          idCardName: prev[0]?.idCardName || "",
        },
        prev[1] || emptyMember("Member"),
      ]);
    }
  }, [user]);

  // Keep member[0] in sync with personal details
  useEffect(() => {
    setMembers((prev) => [
      {
        ...prev[0],
        firstName: personal.firstName,
        lastName: personal.lastName,
        email: personal.email,
        phone: personal.phone,
        role: participationType === "Individual" ? "Individual Participant" : "Team Leader",
      },
      ...prev.slice(1),
    ]);
  }, [personal.firstName, personal.lastName, personal.email, personal.phone, participationType]);

  // Adjust member slots based on participationType
  useEffect(() => {
    if (participationType === "Individual") {
      setTeamSize(1);
      setMembers((prev) => [
        {
          firstName: personal.firstName,
          lastName: personal.lastName,
          email: personal.email,
          phone: personal.phone,
          role: "Individual Participant",
          idCardFile: prev[0]?.idCardFile || null,
          idCardName: prev[0]?.idCardName || "",
        },
      ]);
    } else if (teamSize < 2) {
      setTeamSize(2);
      setMembers((prev) => [
        {
          firstName: personal.firstName,
          lastName: personal.lastName,
          email: personal.email,
          phone: personal.phone,
          role: "Team Leader",
          idCardFile: prev[0]?.idCardFile || null,
          idCardName: prev[0]?.idCardName || "",
        },
        prev[1] || emptyMember("Member"),
      ]);
    }
  }, [participationType]);

  const handleSizeChange = (n: number) => {
    setTeamSize(n);
    setMembers((prev) => {
      const next = [...prev];
      while (next.length < n) next.push(emptyMember(`Member ${next.length + 1}`));
      return next.slice(0, n);
    });
  };

  const updateMember = (i: number, field: keyof MemberDetails, val: string) => {
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)));
  };

  const handleMemberIdCardChange = (i: number, file: File | null) => {
    if (!file) {
      setMembers((prev) =>
        prev.map((m, idx) =>
          idx === i ? { ...m, idCardFile: null, idCardName: "", idCardError: "" } : m,
        ),
      );
      return;
    }
    if (!ID_CARD_ALLOWED_MIME.has(file.type)) {
      setMembers((prev) =>
        prev.map((m, idx) =>
          idx === i
            ? {
                ...m,
                idCardFile: null,
                idCardName: "",
                idCardError: "ID card must be a PDF, JPG, or PNG file.",
              }
            : m,
        ),
      );
      return;
    }
    if (file.size > ID_CARD_MAX_SIZE_BYTES) {
      setMembers((prev) =>
        prev.map((m, idx) =>
          idx === i
            ? {
                ...m,
                idCardFile: null,
                idCardName: "",
                idCardError: "ID card file is too large (max 500 KB).",
              }
            : m,
        ),
      );
      return;
    }
    setMembers((prev) =>
      prev.map((m, idx) =>
        idx === i
          ? {
              ...m,
              idCardFile: file,
              idCardName: file.name,
              idCardError: "",
            }
          : m,
      ),
    );
  };

  const saveDraft = () => {
    try {
      const dataToSave = {
        personal,
        participationType,
        participantCategory,
        participationLevel,
        affiliation,
        teamName,
        teamSize,
        members: members.map((m) => ({
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          phone: m.phone,
          role: m.role,
          idCardName: m.idCardName,
        })),
        mentor,
      };
      localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(dataToSave));
      setDraftSavedMessage("Draft saved! You can return anytime to continue your dossier.");
      setTimeout(() => setDraftSavedMessage(""), 4000);
    } catch {
      setDraftSavedMessage("Could not save to browser storage.");
    }
  };

  // ─── Step Validation Handlers ──────────────────────────────────────────────

  const handleNextFromStep1 = () => {
    setError("");
    if (!personal.firstName.trim() || !personal.lastName.trim()) {
      setError("Please fill in Candidate First Name and Last Name.");
      return;
    }
    if (!personal.email.trim() || !EMAIL_RE.test(personal.email.trim())) {
      setError("Please provide a valid Official University/Organization Email Address.");
      return;
    }
    if (!personal.phone.trim() || !phoneOk(personal.phone)) {
      setError("Please enter a valid 10-digit primary mobile number (+91).");
      return;
    }
    if (personal.aadhaarNumber && !AADHAAR_RE.test(personal.aadhaarNumber)) {
      setError("Aadhaar Number must be 12 digits.");
      return;
    }
    if (personal.pinCode && !PIN_RE.test(personal.pinCode)) {
      setError("PIN Code must be 6 digits.");
      return;
    }

    saveDraft();
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    setError("");
    if (!affiliation.institutionName.trim()) {
      setError(
        participantCategory === "Industry & Government"
          ? "Please enter your Organization Name."
          : "Please enter your School / College / Institution Name.",
      );
      return;
    }
    if (!affiliation.institutionAddress.trim()) {
      setError("Please enter the address of your institution / organization.");
      return;
    }
    if (!affiliation.city.trim()) {
      setError("Please enter the City / District of your institution.");
      return;
    }

    if (participantCategory === "School & Vocational") {
      if (!affiliation.classLevel.trim()) {
        setError("Please select your Class / Grade.");
        return;
      }
      if (!affiliation.pinCode.trim() || !PIN_RE.test(affiliation.pinCode.trim())) {
        setError("Please enter a valid 6-digit School PIN / Postal code.");
        return;
      }
    } else if (participantCategory === "Diploma & Higher Education") {
      if (!affiliation.degreeProgramme.trim()) {
        setError("Please enter your Degree / Programme (e.g. B.Tech, Diploma, M.Tech).");
        return;
      }
      if (!affiliation.departmentBranch.trim()) {
        setError("Please enter your Department / Branch.");
        return;
      }
      if (!affiliation.yearOfStudy) {
        setError("Please select your Year of Study.");
        return;
      }
    } else if (participantCategory === "Industry & Government") {
      if (!affiliation.designationRole.trim()) {
        setError("Please enter the Applicant's Designation / Role in the organization.");
        return;
      }
      if (!affiliation.officialOrgEmail.trim() || !EMAIL_RE.test(affiliation.officialOrgEmail.trim())) {
        setError("Please provide a valid Official Organization Email Address.");
        return;
      }
    }

    saveDraft();
    setStep(3);
  };

  const handleNextFromStep3 = () => {
    setError("");
    if (participationType !== "Individual" && teamName.trim().length < 3) {
      setError("Team Name must be at least 3 characters.");
      return;
    }

    // Verify student ID card uploaded for every student / member
    for (let i = 0; i < members.length; i++) {
      const m = members[i]!;
      const who =
        participationType === "Individual"
          ? "Individual Applicant"
          : i === 0
            ? "Team Leader"
            : `Team Member ${i + 1}`;
      if (!m.idCardFile && !m.idCardName) {
        setError(`Please upload the Student / Institution ID Card for ${who}.`);
        return;
      }
    }

    if (participationType !== "Individual") {
      for (let i = 1; i < members.length; i++) {
        const m = members[i]!;
        if (!m.firstName.trim() || !m.lastName.trim()) {
          setError(`Please enter full name for Member ${i + 1}.`);
          return;
        }
        if (!m.email.trim() || !EMAIL_RE.test(m.email.trim())) {
          setError(`Please enter a valid email for Member ${i + 1}.`);
          return;
        }
      }

      const emails = members.map((m) => m.email.trim().toLowerCase());
      const uniqueEmails = new Set(emails);
      if (uniqueEmails.size < emails.length) {
        setError("Each team member must have a distinct email address.");
        return;
      }
    }

    saveDraft();
    setStep(4);
  };

  const handleFinalSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const randomCode = Math.floor(100000 + Math.random() * 900000);
      const generatedId = `SEWA26-${randomCode}`;
      setRegId(generatedId);

      const payload = {
        regId: generatedId,
        submittedAt: new Date().toISOString(),
        personal,
        participationType,
        participantCategory,
        participationLevel,
        affiliation,
        teamName:
          teamName?.trim() ||
          (personal.firstName?.trim()
            ? `${personal.firstName}'s Innovation Entry`
            : participationType === "Individual"
              ? "Individual Innovation Entry"
              : "SEWA Innovation Entry"),
        members,
        mentor,
      };

      localStorage.setItem(STORAGE_KEY_SUBMITTED, JSON.stringify(payload));
      localStorage.removeItem(STORAGE_KEY_DRAFT);

      setStep(5);
    } catch {
      setError("Failed to record registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const jumpToStep = (targetStep: WizardStep) => {
    setError("");
    if (targetStep === 5 && !regId) {
      setRegId(`SEWA26-${Math.floor(100000 + Math.random() * 900000)}`);
    }
    setStep(targetStep);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <Header activeNav="event-register" />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="no-print mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#ff4d4f]">
            SEWA 2026 · RASHTRIYA YOUTH INNOVATION CHALLENGE
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
            Event Registration Dossier
          </h1>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl">
            Official registration dossier for SEWA 2026. Complete your personal identity, select your
            participant category and institution affiliation, and configure your team roster.
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row items-start">
          {/* Left Dossier Sidebar */}
          <DossierSidebar step={step} onSelectStep={jumpToStep} />

          {/* Right Form Card */}
          <div className="flex-1 w-full rounded-2xl border border-red-200/90 bg-white p-6 sm:p-8 shadow-xs">
            {/* ═══════════════════════════════════════════════════════════════════
                STEP 1: Personal Details (Matches User Screenshot Exact Design)
            ═══════════════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <div className="space-y-7">
                <div>
                  <SectionHeader n={1} icon={User} title="Candidate Full Name & Profile" />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="First Name" required>
                      <input
                        className={inputClass}
                        value={personal.firstName}
                        onChange={(e) =>
                          setPersonal((p) => ({ ...p, firstName: e.target.value }))
                        }
                        placeholder="Aarav"
                      />
                    </Field>
                    <Field label="Middle Name">
                      <input
                        className={inputClass}
                        value={personal.middleName}
                        onChange={(e) =>
                          setPersonal((p) => ({ ...p, middleName: e.target.value }))
                        }
                        placeholder="e.g. Kumar"
                      />
                    </Field>
                    <Field label="Last Name" required>
                      <input
                        className={inputClass}
                        value={personal.lastName}
                        onChange={(e) =>
                          setPersonal((p) => ({ ...p, lastName: e.target.value }))
                        }
                        placeholder="Sharma"
                      />
                    </Field>

                    <div>
                      <Field label="Nationality / Citizenship" required>
                        <DossierSelect
                          value={personal.nationality}
                          onChange={(val) => setPersonal((p) => ({ ...p, nationality: val }))}
                          options={NATIONALITY_OPTIONS}
                        />
                      </Field>
                    </div>

                    <div>
                      <Field label="Date of Birth (As per High School Certificate)" required>
                        <input
                          type="date"
                          className={inputClass}
                          value={personal.dateOfBirth}
                          onChange={(e) =>
                            setPersonal((p) => ({ ...p, dateOfBirth: e.target.value }))
                          }
                        />
                      </Field>
                    </div>

                    <div>
                      <Field label="Gender Identity" required>
                        <DossierSelect
                          value={personal.gender}
                          onChange={(val) => setPersonal((p) => ({ ...p, gender: val }))}
                          options={GENDER_OPTIONS}
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                <div>
                  <SectionHeader n={2} icon={IdCard} title="Government Identity" />
                  <div>
                    <Field
                      label="Aadhaar Number"
                      required
                      hint="ℹ Must match your official verified Government ID."
                    >
                      <div className="relative max-w-md">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                          <ShieldCheck size={18} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={12}
                          className={`${inputClass} pl-10 pr-10 font-mono tracking-wider`}
                          value={personal.aadhaarNumber}
                          onChange={(e) =>
                            setPersonal((p) => ({
                              ...p,
                              aadhaarNumber: e.target.value.replace(/\D/g, "").slice(0, 12),
                            }))
                          }
                          placeholder="12-digit Aadhaar number"
                        />
                        {personal.aadhaarNumber.length === 12 && (
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                            <CheckCircle2 size={17} className="text-[#ff4d4f]" />
                          </div>
                        )}
                      </div>
                    </Field>
                  </div>
                </div>

                <div>
                  <SectionHeader n={3} icon={MapPin} title="Residential & Permanent Address" />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="sm:col-span-4">
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
                    <div className="sm:col-span-4">
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
                    <div>
                      <Field label="PIN / Postal Code" required>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          className={inputClass}
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
                    </div>
                    <div>
                      <Field label="City / District" required>
                        <input
                          className={inputClass}
                          value={personal.city}
                          onChange={(e) => setPersonal((p) => ({ ...p, city: e.target.value }))}
                          placeholder="North West Delhi"
                        />
                      </Field>
                    </div>
                    <div>
                      <Field label="State / UT" required>
                        <DossierSelect
                          value={personal.state}
                          onChange={(val) => setPersonal((p) => ({ ...p, state: val }))}
                          options={INDIA_STATE_OPTIONS}
                        />
                      </Field>
                    </div>
                    <div>
                      <Field label="Country" required>
                        <DossierSelect
                          value={personal.country}
                          onChange={(val) => setPersonal((p) => ({ ...p, country: val }))}
                          options={COUNTRY_OPTIONS}
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                <div>
                  <SectionHeader n={4} icon={Users} title="Verified Contact Channels" />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Field
                        label="Primary Mobile Number"
                        required
                        hint="Used for critical Stage 1 jury alerts and hackathon team SMS dispatch."
                      >
                        <div className="relative flex items-center">
                          <span className="inline-flex h-11 items-center gap-1.5 rounded-l-lg border border-r-0 border-slate-200 bg-gray-50 px-3 text-xs font-bold text-gray-700 select-none shrink-0">
                            <span>🇮🇳</span> +91
                          </span>
                          <input
                            type="tel"
                            className={`${inputClass} rounded-l-none pr-24`}
                            value={personal.phone}
                            onChange={(e) =>
                              setPersonal((p) => ({ ...p, phone: e.target.value }))
                            }
                            placeholder="98101 23456"
                          />
                          <div className="absolute right-2.5 flex items-center pointer-events-none">
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-100">
                              ✓ OTP READY
                            </span>
                          </div>
                        </div>
                      </Field>
                    </div>

                    <div>
                      <Field
                        label="Alternate Phone (Emergency / Parent / Guardian)"
                        hint="Secondary fallback for event pass dispatch if primary unreachable."
                      >
                        <div className="relative flex items-center">
                          <span className="inline-flex h-11 items-center gap-1 rounded-l-lg border border-r-0 border-slate-200 bg-gray-50 px-3 text-xs font-semibold text-gray-600 select-none shrink-0">
                            <Phone size={14} className="text-gray-400" /> +91
                          </span>
                          <input
                            type="tel"
                            className={`${inputClass} rounded-l-none`}
                            value={personal.alternatePhone}
                            onChange={(e) =>
                              setPersonal((p) => ({ ...p, alternatePhone: e.target.value }))
                            }
                            placeholder="94120 56789"
                          />
                        </div>
                      </Field>
                    </div>

                    <div>
                      <Field
                        label="Official University/organization Email Address"
                        required
                        hint="Must belong to an affiliated .ac.in / .edu institution domain."
                      >
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 font-bold">
                            @
                          </div>
                          <input
                            type="email"
                            className={`${inputClass} pl-9 pr-10`}
                            value={personal.email}
                            onChange={(e) =>
                              setPersonal((p) => ({ ...p, email: e.target.value }))
                            }
                            placeholder="aarav_co23@dtu.ac.in"
                          />
                          {personal.email.includes("@") && (
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                              <CheckCircle2 size={16} className="text-[#ff4d4f]" />
                            </div>
                          )}
                        </div>
                      </Field>
                    </div>

                    <div>
                      <Field
                        label="Personal Backup Email Address"
                        hint="Receipts and participation certificates will be copied here."
                      >
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                            <Mail size={15} className="text-gray-400" />
                          </div>
                          <input
                            type="email"
                            className={`${inputClass} pl-9`}
                            value={personal.backupEmail}
                            onChange={(e) =>
                              setPersonal((p) => ({ ...p, backupEmail: e.target.value }))
                            }
                            placeholder="aarav.sharma.tech@gmail.com"
                          />
                        </div>
                      </Field>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-[#ff4d4f]">
                    {error}
                  </div>
                )}

                {draftSavedMessage && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                    {draftSavedMessage}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors cursor-pointer"
                    >
                      <Bookmark size={14} />
                      <span>Save draft &amp; continue later</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextFromStep1}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#e53e3e] px-7 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#c53030] active:scale-[0.99] cursor-pointer"
                  >
                    <span>Next: Category &amp; Participation</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                STEP 2: Category & Participation (Affiliation Focus)
            ═══════════════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <div className="space-y-8">
                {/* 1. PARTICIPATION TYPE */}
                <div>
                  <SectionHeader n={1} icon={Users} title="Participation Type" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      [
                        {
                          type: "Individual",
                          title: "Individual",
                          desc: "Single innovator submitting project",
                          icon: User,
                        },
                        {
                          type: "Team / Group",
                          title: "Team / Group",
                          desc: "Collaborative team of 2 to 6 students/researchers",
                          icon: Users,
                        },
                        {
                          type: "Organisation",
                          title: "Organisation",
                          desc: "Industry, Startup or Institutional sponsored team",
                          icon: Building2,
                        },
                      ] as const
                    ).map((item) => {
                      const Icon = item.icon;
                      const isSelected = participationType === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setParticipationType(item.type)}
                          className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#ff4d4f] bg-red-50/40 ring-1 ring-[#ff4d4f] shadow-xs"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Icon
                              size={18}
                              className={isSelected ? "text-[#ff4d4f]" : "text-gray-400"}
                            />
                            {isSelected && <CheckCircle2 size={16} className="text-[#ff4d4f]" />}
                          </div>
                          <p
                            className={`mt-2 text-sm font-bold ${
                              isSelected ? "text-gray-900" : "text-gray-700"
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 leading-snug">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. PARTICIPANT CATEGORY */}
                <div>
                  <SectionHeader n={2} icon={GraduationCap} title="Participant Category" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      [
                        {
                          cat: "School & Vocational",
                          title: "School & Vocational",
                          desc: "Secondary, Higher Secondary, ITI & Vocational students",
                          icon: School,
                        },
                        {
                          cat: "Diploma & Higher Education",
                          title: "Diploma & Higher Education",
                          desc: "Polytechnic, UG, PG & Ph.D. scholars in North India",
                          icon: GraduationCap,
                        },
                        {
                          cat: "Industry & Government",
                          title: "Industry & Government",
                          desc: "Startups, MSMEs, Corporate innovators & Govt laboratories",
                          icon: Building,
                        },
                      ] as const
                    ).map((item) => {
                      const Icon = item.icon;
                      const isSelected = participantCategory === item.cat;
                      return (
                        <button
                          key={item.cat}
                          type="button"
                          onClick={() => {
                            setParticipantCategory(item.cat);
                            if (item.cat === "School & Vocational") {
                              setAffiliation((prev) => ({
                                ...prev,
                                institutionType: SCHOOL_INSTITUTION_TYPES[0]!,
                              }));
                            } else if (item.cat === "Diploma & Higher Education") {
                              setAffiliation((prev) => ({
                                ...prev,
                                institutionType: HIGHER_ED_INSTITUTION_TYPES[0]!,
                              }));
                            } else {
                              setAffiliation((prev) => ({
                                ...prev,
                                institutionType: INDUSTRY_ORG_TYPES[0]!,
                              }));
                            }
                          }}
                          className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#ff4d4f] bg-red-50/40 ring-1 ring-[#ff4d4f] shadow-xs"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Icon
                              size={18}
                              className={isSelected ? "text-[#ff4d4f]" : "text-gray-400"}
                            />
                            {isSelected && <CheckCircle2 size={16} className="text-[#ff4d4f]" />}
                          </div>
                          <p
                            className={`mt-2 text-sm font-bold ${
                              isSelected ? "text-gray-900" : "text-gray-700"
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 leading-snug">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. CHALLENGE LEVEL / PARTICIPATION LEVEL */}
                <div>
                  <SectionHeader n={3} icon={Award} title="Participation Level" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(
                      [
                        {
                          level: "National Level",
                          title: "National Level",
                          desc: "Grand national innovation themes solving flagship strategic priorities for Viksit Bharat.",
                        },
                        {
                          level: "Local Community Level",
                          title: "Local Community Level",
                          desc: "Ground-up regional innovation targeting municipal, societal and environmental challenges in North Indian states.",
                        },
                      ] as const
                    ).map((item) => {
                      const isSelected = participationLevel === item.level;
                      return (
                        <button
                          key={item.level}
                          type="button"
                          onClick={() => setParticipationLevel(item.level)}
                          className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#ff4d4f] bg-red-50/40 ring-1 ring-[#ff4d4f] shadow-xs"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Award
                              size={18}
                              className={isSelected ? "text-[#ff4d4f]" : "text-gray-400"}
                            />
                            {isSelected && <CheckCircle2 size={16} className="text-[#ff4d4f]" />}
                          </div>
                          <p
                            className={`mt-2 text-sm font-bold ${
                              isSelected ? "text-gray-900" : "text-gray-700"
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. SCHOOL / COLLEGE / ORGANIZATION DETAILS (DYNAMIC) */}
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

                  {/* CATEGORY A: School & Vocational */}
                  {participantCategory === "School & Vocational" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Field label="School / Institution Name" required>
                          <input
                            className={inputClass}
                            value={affiliation.institutionName}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, institutionName: e.target.value }))
                            }
                            placeholder="e.g. Kendriya Vidyalaya / Government Senior Secondary School"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="Institution Type" required>
                          <DossierSelect
                            value={affiliation.institutionType}
                            onChange={(val) =>
                              setAffiliation((a) => ({ ...a, institutionType: val }))
                            }
                            options={SCHOOL_INSTITUTION_TYPES}
                            placeholder="Select institution type"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="Class / Grade" required>
                          <DossierSelect
                            value={affiliation.classLevel}
                            onChange={(val) =>
                              setAffiliation((a) => ({ ...a, classLevel: val }))
                            }
                            options={SCHOOL_CLASS_OPTIONS}
                            placeholder="Select Class / Grade"
                          />
                        </Field>
                      </div>

                      <div className="sm:col-span-2">
                        <Field label="School Address" required>
                          <textarea
                            className={`${inputClass} min-h-[70px] py-2 resize-y`}
                            value={affiliation.institutionAddress}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, institutionAddress: e.target.value }))
                            }
                            placeholder="School premises, street / area / landmark"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="School PIN / Postal Code" required hint="6-digit Indian PIN code">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            className={inputClass}
                            value={affiliation.pinCode}
                            onChange={(e) =>
                              setAffiliation((a) => ({
                                ...a,
                                pinCode: e.target.value.replace(/\D/g, "").slice(0, 6),
                              }))
                            }
                            placeholder="110042"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="City / District" required>
                          <input
                            className={inputClass}
                            value={affiliation.city}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, city: e.target.value }))
                            }
                            placeholder="e.g. North West Delhi"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="State / UT" required>
                          <DossierSelect
                            value={affiliation.state}
                            onChange={(val) =>
                              setAffiliation((a) => ({ ...a, state: val }))
                            }
                            options={INDIA_STATE_OPTIONS}
                            placeholder="Select State / UT"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="School / Institutional Email (Optional)">
                          <input
                            type="email"
                            className={inputClass}
                            value={affiliation.institutionEmail}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, institutionEmail: e.target.value }))
                            }
                            placeholder="schooloffice@domain.edu.in"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="School Contact Number (Optional)">
                          <input
                            type="tel"
                            className={inputClass}
                            value={affiliation.institutionPhone}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, institutionPhone: e.target.value }))
                            }
                            placeholder="011-XXXXXXXX / +91 Mobile"
                          />
                        </Field>
                      </div>
                    </div>
                  )}

                  {/* CATEGORY B: Diploma & Higher Education */}
                  {participantCategory === "Diploma & Higher Education" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <Field label="College / University / Institution Name" required>
                          <input
                            className={inputClass}
                            value={affiliation.institutionName}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, institutionName: e.target.value }))
                            }
                            placeholder="e.g. Delhi Technological University"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="Institution Type" required>
                          <DossierSelect
                            value={affiliation.institutionType}
                            onChange={(val) =>
                              setAffiliation((a) => ({ ...a, institutionType: val }))
                            }
                            options={HIGHER_ED_INSTITUTION_TYPES}
                            placeholder="Select institution type"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="Degree / Programme" required>
                          <input
                            className={inputClass}
                            value={affiliation.degreeProgramme}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, degreeProgramme: e.target.value }))
                            }
                            placeholder="e.g. B.Tech / Diploma / M.Sc / Ph.D"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="Department / Branch" required>
                          <input
                            className={inputClass}
                            value={affiliation.departmentBranch}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, departmentBranch: e.target.value }))
                            }
                            placeholder="e.g. Computer Engineering / Mechanical"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="Year of Study" required>
                          <DossierSelect
                            value={affiliation.yearOfStudy}
                            onChange={(val) =>
                              setAffiliation((a) => ({ ...a, yearOfStudy: val }))
                            }
                            options={HIGHER_ED_YEARS}
                            placeholder="Select year of study"
                          />
                        </Field>
                      </div>

                      <div className="sm:col-span-3">
                        <Field label="Institution Address" required>
                          <textarea
                            className={`${inputClass} min-h-[70px] py-2 resize-y`}
                            value={affiliation.institutionAddress}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, institutionAddress: e.target.value }))
                            }
                            placeholder="Campus road, locality, district, state, PIN"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="City / District" required>
                          <input
                            className={inputClass}
                            value={affiliation.city}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, city: e.target.value }))
                            }
                            placeholder="e.g. North West Delhi"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="State / UT" required>
                          <DossierSelect
                            value={affiliation.state}
                            onChange={(val) =>
                              setAffiliation((a) => ({ ...a, state: val }))
                            }
                            options={INDIA_STATE_OPTIONS}
                            placeholder="Select State / UT"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="Institutional Email">
                          <input
                            type="email"
                            className={inputClass}
                            value={affiliation.institutionEmail}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, institutionEmail: e.target.value }))
                            }
                            placeholder="registrar@dtu.ac.in"
                          />
                        </Field>
                      </div>

                      {/* Faculty / Coordinator Section */}
                      <div className="sm:col-span-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                          Faculty / Institution Coordinator Details (Optional)
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <Field label="Coordinator Name">
                              <input
                                className={inputClass}
                                value={affiliation.coordinatorName}
                                onChange={(e) =>
                                  setAffiliation((a) => ({ ...a, coordinatorName: e.target.value }))
                                }
                                placeholder="Prof. / Dr. Coordinator Name"
                              />
                            </Field>
                          </div>
                          <div>
                            <Field label="Coordinator Email">
                              <input
                                type="email"
                                className={inputClass}
                                value={affiliation.coordinatorEmail}
                                onChange={(e) =>
                                  setAffiliation((a) => ({
                                    ...a,
                                    coordinatorEmail: e.target.value,
                                  }))
                                }
                                placeholder="coordinator@dtu.ac.in"
                              />
                            </Field>
                          </div>
                          <div>
                            <Field label="Coordinator Contact Number">
                              <input
                                type="tel"
                                className={inputClass}
                                value={affiliation.coordinatorPhone}
                                onChange={(e) =>
                                  setAffiliation((a) => ({
                                    ...a,
                                    coordinatorPhone: e.target.value,
                                  }))
                                }
                                placeholder="+91 98XXXXXXXX"
                              />
                            </Field>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CATEGORY C: Industry & Government */}
                  {participantCategory === "Industry & Government" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <Field label="Organization Name" required>
                          <input
                            className={inputClass}
                            value={affiliation.institutionName}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, institutionName: e.target.value }))
                            }
                            placeholder="e.g. Bharat Dynamics / DRDO / Tech Innovation Pvt Ltd"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="Organization Type" required>
                          <DossierSelect
                            value={affiliation.institutionType}
                            onChange={(val) =>
                              setAffiliation((a) => ({ ...a, institutionType: val }))
                            }
                            options={INDUSTRY_ORG_TYPES}
                            placeholder="Select organization type"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="Applicant's Designation / Role" required>
                          <input
                            className={inputClass}
                            value={affiliation.designationRole}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, designationRole: e.target.value }))
                            }
                            placeholder="e.g. Founder, Lead Scientist, Project Engineer"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="Department / Division">
                          <input
                            className={inputClass}
                            value={affiliation.departmentDivision}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, departmentDivision: e.target.value }))
                            }
                            placeholder="e.g. Advanced AI Lab / Robotics Division"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="Official Organization Email" required>
                          <input
                            type="email"
                            className={inputClass}
                            value={affiliation.officialOrgEmail}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, officialOrgEmail: e.target.value }))
                            }
                            placeholder="applicant@company.com"
                          />
                        </Field>
                      </div>

                      <div className="sm:col-span-3">
                        <Field label="Organization Address" required>
                          <textarea
                            className={`${inputClass} min-h-[70px] py-2 resize-y`}
                            value={affiliation.institutionAddress}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, institutionAddress: e.target.value }))
                            }
                            placeholder="Registered address, office complex, area, PIN"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="City / District" required>
                          <input
                            className={inputClass}
                            value={affiliation.city}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, city: e.target.value }))
                            }
                            placeholder="e.g. New Delhi"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="State / UT" required>
                          <DossierSelect
                            value={affiliation.state}
                            onChange={(val) =>
                              setAffiliation((a) => ({ ...a, state: val }))
                            }
                            options={INDIA_STATE_OPTIONS}
                            placeholder="Select State / UT"
                          />
                        </Field>
                      </div>

                      <div>
                        <Field label="Organization Contact Number">
                          <input
                            type="tel"
                            className={inputClass}
                            value={affiliation.orgContactPhone}
                            onChange={(e) =>
                              setAffiliation((a) => ({ ...a, orgContactPhone: e.target.value }))
                            }
                            placeholder="+91 / Office Landline"
                          />
                        </Field>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-[#ff4d4f]">
                    {error}
                  </div>
                )}

                {draftSavedMessage && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                    {draftSavedMessage}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex h-10 items-center gap-1.5 rounded-lg border border-gray-200 px-5 text-sm font-semibold text-gray-600 hover:border-gray-400 cursor-pointer"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors cursor-pointer"
                    >
                      <Bookmark size={14} />
                      <span>Save draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNextFromStep2}
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#e53e3e] px-7 text-sm font-semibold text-white shadow-md hover:bg-[#c53030] cursor-pointer"
                    >
                      <span>Next: About Team</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                STEP 3: About Team (Student ID Cards for EVERY student)
            ═══════════════════════════════════════════════════════════════════ */}
            {step === 3 && (
              <div className="space-y-8">
                {/* Team Name / Entry Title */}
                <div>
                  <SectionHeader
                    n={1}
                    icon={IdCard}
                    title={
                      participationType === "Individual" ? "Innovation Entry Title" : "Team Identity"
                    }
                  />
                  <div>
                    <Field
                      label={
                        participationType === "Individual"
                          ? "Project / Innovation Title"
                          : "Team Name"
                      }
                      required={participationType !== "Individual"}
                      hint="A unique identifier for your entry throughout the 100-Day challenge."
                    >
                      <input
                        className={inputClass}
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder={
                          participationType === "Individual"
                            ? "e.g. Automated Precision Agrotech Rover"
                            : "e.g. Circuit Breakers / DroneVanguard"
                        }
                      />
                    </Field>
                  </div>
                </div>

                {/* Team Composition & Individual Student ID Cards */}
                <div>
                  <SectionHeader
                    n={2}
                    icon={Users}
                    title={
                      participationType === "Individual"
                        ? "Participant Identity & Student ID Card"
                        : "Team Members & Student ID Cards"
                    }
                  />

                  {/* Individual Mode */}
                  {participationType === "Individual" ? (
                    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-5 space-y-4">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          Individual Participant: {personal.firstName} {personal.lastName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Email: {personal.email} · Phone: {personal.phone}
                        </p>
                      </div>

                      {/* Individual Student ID Card */}
                      <div className="pt-3 border-t border-gray-200">
                        <Field
                          label="Student / Institution ID Card"
                          required
                          hint="PDF, JPG, or PNG · max 500 KB. Official student or organizational identity card confirming your affiliation."
                        >
                          <input
                            type="file"
                            accept={ID_CARD_ACCEPT}
                            onChange={(e) =>
                              handleMemberIdCardChange(0, e.target.files?.[0] ?? null)
                            }
                            className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-red-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#ff4d4f] hover:file:bg-red-100 cursor-pointer"
                          />
                          {members[0]?.idCardName && (
                            <p className="mt-1.5 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 size={13} />
                              <span>Uploaded ID: {members[0].idCardName}</span>
                            </p>
                          )}
                          {members[0]?.idCardError && (
                            <p className="mt-1 text-xs font-semibold text-[#ff4d4f]">
                              {members[0].idCardError}
                            </p>
                          )}
                        </Field>
                      </div>
                    </div>
                  ) : (
                    /* Multi-Member Team Mode */
                    <div className="space-y-5">
                      <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 text-xs">
                        <p className="font-bold text-gray-900">
                          Team Member 1 (Applicant / Team Leader) registers on behalf of all team members.
                        </p>
                        <p className="text-gray-600 mt-0.5">
                          Please enter details and upload the Student ID card (max 500 KB) for each team member.
                        </p>
                      </div>

                      <Field label="Total Team Size (Including Team Leader)" required>
                        <div className="flex gap-2.5">
                          {TEAM_SIZE_OPTIONS.map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => handleSizeChange(n)}
                              className={`size-11 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                                teamSize === n
                                  ? "bg-[#ff4d4f] text-white shadow-sm"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </Field>

                      <div className="space-y-5">
                        {members.map((m, i) => {
                          const isLeader = i === 0;
                          const roleLabel = isLeader
                            ? "Team Member 1 / Team Leader (Registering for all)"
                            : `Team Member ${i + 1}`;
                          return (
                            <div
                              key={i}
                              className="rounded-xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4"
                            >
                              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="flex size-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-[#ff4d4f]">
                                    {i + 1}
                                  </span>
                                  <p className="text-xs font-bold uppercase tracking-wider text-gray-800">
                                    {roleLabel}
                                  </p>
                                </div>
                                {isLeader && (
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                                    (Auto-filled from Step 1)
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    First Name <span className="text-[#ff4d4f]">*</span>
                                  </label>
                                  <input
                                    className={inputClass}
                                    disabled={isLeader}
                                    value={m.firstName}
                                    onChange={(e) => updateMember(i, "firstName", e.target.value)}
                                    placeholder="First Name"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Last Name <span className="text-[#ff4d4f]">*</span>
                                  </label>
                                  <input
                                    className={inputClass}
                                    disabled={isLeader}
                                    value={m.lastName}
                                    onChange={(e) => updateMember(i, "lastName", e.target.value)}
                                    placeholder="Last Name"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Official / Institutional Email <span className="text-[#ff4d4f]">*</span>
                                  </label>
                                  <input
                                    type="email"
                                    className={inputClass}
                                    disabled={isLeader}
                                    value={m.email}
                                    onChange={(e) => updateMember(i, "email", e.target.value)}
                                    placeholder="member@institution.edu.in"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Contact Mobile Number
                                  </label>
                                  <input
                                    type="tel"
                                    className={inputClass}
                                    disabled={isLeader}
                                    value={m.phone}
                                    onChange={(e) => updateMember(i, "phone", e.target.value)}
                                    placeholder="+91 Mobile (Optional)"
                                  />
                                </div>
                              </div>

                              {/* Student ID Card for THIS member */}
                              <div className="pt-3 border-t border-gray-100 bg-gray-50/70 p-3.5 rounded-lg">
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                  {roleLabel}'s Student / Institution ID Card{" "}
                                  <span className="text-[#ff4d4f]">*</span>
                                </label>
                                <p className="text-[11px] text-gray-500 mb-2">
                                  PDF, JPG, or PNG · max 500 KB. College ID, Student ID or Bonafide certificate.
                                </p>

                                <input
                                  type="file"
                                  accept={ID_CARD_ACCEPT}
                                  onChange={(e) =>
                                    handleMemberIdCardChange(i, e.target.files?.[0] ?? null)
                                  }
                                  className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-red-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#ff4d4f] hover:file:bg-red-100 cursor-pointer"
                                />

                                {m.idCardName && (
                                  <p className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    <span>Uploaded ID: {m.idCardName}</span>
                                  </p>
                                )}
                                {m.idCardError && (
                                  <p className="mt-1 text-xs font-semibold text-[#ff4d4f]">
                                    {m.idCardError}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mentor Section */}
                <div>
                  <SectionHeader
                    n={3}
                    icon={UserCheck}
                    title="Mentor (Optional)"
                    required={false}
                  />
                  <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-700">
                        Mentor Details (Optional)
                      </p>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      If you have a faculty guide, incubator manager, or industry mentor assisting
                      your prototype, enter their details here.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        className={inputClass}
                        value={mentor.name}
                        onChange={(e) => setMentor((m) => ({ ...m, name: e.target.value }))}
                        placeholder="Mentor Full Name"
                      />
                      <input
                        className={inputClass}
                        value={mentor.designation}
                        onChange={(e) =>
                          setMentor((m) => ({ ...m, designation: e.target.value }))
                        }
                        placeholder="Designation / Department / Org"
                      />
                      <input
                        type="email"
                        className={inputClass}
                        value={mentor.email}
                        onChange={(e) => setMentor((m) => ({ ...m, email: e.target.value }))}
                        placeholder="Mentor Email"
                      />
                      <input
                        type="tel"
                        className={inputClass}
                        value={mentor.phone}
                        onChange={(e) => setMentor((m) => ({ ...m, phone: e.target.value }))}
                        placeholder="Mentor Phone Number"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-[#ff4d4f]">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex h-10 items-center gap-1.5 rounded-lg border border-gray-200 px-5 text-sm font-semibold text-gray-600 hover:border-gray-400 cursor-pointer"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => jumpToStep(4)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Skip to Step 4"
                    >
                      <span>Skip (Temp)</span>
                      <ArrowRight size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={saveDraft}
                      className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors cursor-pointer"
                    >
                      <Bookmark size={14} />
                      <span>Save draft</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNextFromStep3}
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#e53e3e] px-7 text-sm font-semibold text-white shadow-md hover:bg-[#c53030] cursor-pointer"
                    >
                      <span>Next: Review &amp; Confirmation</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                STEP 4: Review & Confirmation
            ═══════════════════════════════════════════════════════════════════ */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Review Application Dossier</h2>
                      <p className="text-xs text-gray-500 mt-1">
                        Please verify your applicant profile, category, affiliation, and team roster before final submission.
                      </p>
                    </div>
                    <span className="self-start sm:self-auto rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-[#ff4d4f] border border-red-200">
                      Step 4 of 5 · Pre-Submission Review
                    </span>
                  </div>
                </div>

                {/* 1. Candidate Profile */}
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <User size={15} className="text-[#ff4d4f]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                        1. Candidate Profile &amp; Contact
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-[#ff4d4f] hover:underline cursor-pointer"
                    >
                      Edit Step 1
                    </button>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block">Full Name</span>
                      <span className="font-semibold text-gray-800">
                        {[personal.firstName, personal.middleName, personal.lastName].filter(Boolean).join(" ") || "Not provided"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Nationality</span>
                      <span className="font-semibold text-gray-800">{personal.nationality || "-"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Date of Birth &amp; Gender</span>
                      <span className="font-semibold text-gray-800">
                        {personal.dateOfBirth || "-"} · {personal.gender || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Aadhaar Number</span>
                      <span className="font-semibold text-gray-800 font-mono">
                        {personal.aadhaarNumber ? `•••• •••• ${personal.aadhaarNumber.slice(-4)}` : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Primary Mobile</span>
                      <span className="font-semibold text-gray-800">
                        {personal.phone ? `+91 ${personal.phone}` : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Official Email</span>
                      <span className="font-semibold text-gray-800">{personal.email || "-"}</span>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                      <span className="text-gray-400 block">Permanent Address</span>
                      <span className="font-semibold text-gray-800">
                        {[personal.addressLine1, personal.addressLine2, personal.city, personal.state, personal.pinCode, personal.country].filter(Boolean).join(", ") || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Category & Affiliation */}
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <GraduationCap size={15} className="text-[#ff4d4f]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                        2. Category &amp; Participation
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs font-semibold text-[#ff4d4f] hover:underline cursor-pointer"
                    >
                      Edit Step 2
                    </button>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block">Participation Type</span>
                      <span className="font-semibold text-gray-800">{participationType}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Participant Category</span>
                      <span className="font-semibold text-gray-800">{participantCategory}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Participation Level</span>
                      <span className="font-semibold text-gray-800">{participationLevel}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-400 block">Institution / Organization</span>
                      <span className="font-semibold text-gray-800">
                        {affiliation.institutionName || "-"} ({affiliation.institutionType})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">City, State &amp; PIN</span>
                      <span className="font-semibold text-gray-800">
                        {[affiliation.city, affiliation.state, affiliation.pinCode ? `PIN: ${affiliation.pinCode}` : ""].filter(Boolean).join(", ") || "-"}
                      </span>
                    </div>
                    {participantCategory === "School & Vocational" && (
                      <div>
                        <span className="text-gray-400 block">Class / Grade</span>
                        <span className="font-semibold text-gray-800">{affiliation.classLevel || "-"}</span>
                      </div>
                    )}
                    {participantCategory === "Diploma & Higher Education" && (
                      <>
                        <div>
                          <span className="text-gray-400 block">Degree &amp; Department</span>
                          <span className="font-semibold text-gray-800">
                            {affiliation.degreeProgramme} · {affiliation.departmentBranch}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Year of Study</span>
                          <span className="font-semibold text-gray-800">{affiliation.yearOfStudy}</span>
                        </div>
                        {affiliation.coordinatorName && (
                          <div>
                            <span className="text-gray-400 block">Faculty Coordinator</span>
                            <span className="font-semibold text-gray-800">{affiliation.coordinatorName}</span>
                          </div>
                        )}
                      </>
                    )}
                    {participantCategory === "Industry & Government" && (
                      <>
                        <div>
                          <span className="text-gray-400 block">Applicant Role</span>
                          <span className="font-semibold text-gray-800">
                            {affiliation.designationRole} ({affiliation.departmentDivision || "Division"})
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Official Org Email</span>
                          <span className="font-semibold text-gray-800">{affiliation.officialOrgEmail || "-"}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Team Roster & ID Cards */}
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-[#ff4d4f]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                        3. Team Roster &amp; Student ID Cards
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-xs font-semibold text-[#ff4d4f] hover:underline cursor-pointer"
                    >
                      Edit Step 3
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 text-xs">
                      <div>
                        <span className="text-gray-400">Team / Project Title: </span>
                        <span className="font-bold text-gray-800">
                          {teamName || (participationType === "Individual" ? `${personal.firstName || "Applicant"}'s Individual Entry` : "Innovation Project")}
                        </span>
                      </div>
                      <span className="text-gray-500 font-semibold">{members.length} Member(s)</span>
                    </div>

                    <div className="space-y-2">
                      {members.map((m, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg bg-gray-50 p-3 text-xs gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800">
                                {`${m.firstName} ${m.lastName}`.trim() || `Member ${idx + 1}`}
                              </span>
                              <span className="rounded bg-gray-200/80 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                                {idx === 0 ? (participationType === "Individual" ? "Applicant" : "Team Leader") : m.role || `Member ${idx + 1}`}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {m.email || "No email"} {m.phone ? `· ${m.phone}` : ""}
                            </p>
                          </div>
                          <div>
                            {m.idCardName || m.idCardFile ? (
                              <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={12} /> ID Card: {m.idCardName || "Attached"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 border border-amber-200">
                                ID Card Pending
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {mentor.name && (
                      <div className="pt-2 border-t border-gray-100 text-xs">
                        <span className="text-gray-400">Mentor / Guide: </span>
                        <span className="font-semibold text-gray-800">
                          {mentor.name} {mentor.designation ? `(${mentor.designation})` : ""} {mentor.email ? `· ${mentor.email}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-xs text-gray-700 space-y-1.5">
                  <p className="font-bold text-gray-900 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#ff4d4f]" />
                    Official Event Undertaking &amp; Terms:
                  </p>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    • All decisions with respect to conduct and evaluation of the event will be final and binding.
                  </p>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    • DTU Delhi reserves the rights to change, modify, or create guidelines, schedules, rules, and evaluation criteria.
                  </p>
                </div>

                <label className="flex cursor-pointer select-none items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 size-4 accent-[#ff4d4f]"
                  />
                  <span className="text-xs leading-relaxed text-gray-600">
                    I hereby confirm that the information and identification documents provided for
                    myself and all team members are accurate and complete. I agree that all decisions with respect to conduct and evaluation of the event will be final and binding, and DTU Delhi reserves the rights to change, modify, or create guidelines, rules, and evaluation criteria as required.
                  </span>
                </label>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-[#ff4d4f]">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex h-10 items-center gap-1.5 rounded-lg border border-gray-200 px-5 text-sm font-semibold text-gray-600 hover:border-gray-400 cursor-pointer"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => jumpToStep(5)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Skip to Step 5 (Confirmation)"
                    >
                      <span>Skip (Temp)</span>
                      <ArrowRight size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={handleFinalSubmit}
                      disabled={!agreed || submitting}
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#e53e3e] px-8 text-sm font-semibold text-white shadow-md hover:bg-[#c53030] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {submitting ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      <span>{submitting ? "Submitting Dossier…" : "Submit Event Registration"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                STEP 5: Download Confirmation
            ═══════════════════════════════════════════════════════════════════ */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="no-print text-center py-4" style={{ textAlign: "center" }}>
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <h2
                    className="mt-3 text-2xl font-black text-gray-900 text-center"
                    style={{ textAlign: "center" }}
                  >
                    Registration Confirmed!
                  </h2>
                  <p
                    className="mx-auto mt-1 max-w-md text-sm text-gray-600 text-center"
                    style={{ textAlign: "center" }}
                  >
                    Your registration dossier for{" "}
                    <span className="font-bold text-gray-900">
                      {teamName?.trim() ||
                        (personal.firstName?.trim()
                          ? `${personal.firstName}'s Innovation Entry`
                          : participationType === "Individual"
                            ? "Individual Innovation Entry"
                            : "SEWA Innovation Entry")}
                    </span>{" "}
                    has been recorded for the SEWA 2026 Innovation Challenge.
                  </p>
                </div>

                <PrintableConfirmationSlip
                  regId={regId}
                  personal={personal}
                  participationType={participationType}
                  participantCategory={participantCategory}
                  participationLevel={participationLevel}
                  affiliation={affiliation}
                  teamName={teamName}
                  members={members}
                  mentor={mentor}
                />

                <div className="no-print flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => jumpToStep(1)}
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    title="Restart registration flow"
                  >
                    <span>← Restart / Step 1 (Temp)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#ff4d4f] px-6 text-sm font-semibold text-white shadow-md hover:bg-[#e03d3f] cursor-pointer"
                  >
                    <Download size={16} /> Download / Print Confirmation (PDF)
                  </button>

                  <Link
                    to="/"
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <ChevronLeft size={16} /> Back to Home
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
