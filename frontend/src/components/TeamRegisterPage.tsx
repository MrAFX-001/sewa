import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Download,
  IdCard,
  Layers,
  ListChecks,
  Loader2,
  MapPin,
  Save,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  ApiError,
  profileApi,
  teamApi,
  type CandidateProfile,
  type Team,
  type TeamMember,
} from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  PROBLEM_CATEGORIES,
  findProblemCategory,
  themeLabel,
  ID_CARD_ACCEPT,
  ID_CARD_ALLOWED_MIME,
  ID_CARD_MAX_SIZE_BYTES,
} from "../lib/problemCategories";
import { Footer, Header } from "./SewaSite";

// ─── Static option lists ────────────────────────────────────────────────────
// Kept as plain arrays rather than a backend-driven catalogue - same
// rationale as team.schema's theme/problemStatement list: small, unlikely
// to change mid-event, not worth a DB round trip.

const CATEGORY_OPTIONS = ["General / Open", "OBC", "SC", "ST", "EWS", "Other"];
const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];
const NATIONALITY_OPTIONS = ["Indian Citizen (Bharat)", "Other / Foreign National"];
const COUNTRY_OPTIONS = ["India (Bharat)", "Other"];
const NORTH_STATE_OPTIONS = [
  "J&K",
  "Ladakh",
  "HP",
  "Punjab",
  "Haryana",
  "Delhi",
  "UP",
  "Chandigarh",
];

// Real category catalogue (National + Regional, PS/OPEN) now lives in
// lib/problemCategories.ts, shared with the backend's validation - this used
// to be a disconnected set of placeholder themes/problem-statements with no
// relationship to the site's actual Problem Statements page or the backend
// schema at all.

const TEAM_SIZE_OPTIONS = [2, 3, 4, 5, 6]; // mirrors backend TEAM_MIN/MAX_MEMBERS

const WIZARD_STEPS = [
  { n: 1, title: "Personal Details", desc: "Applicant Identity" },
  { n: 2, title: "Category & Participation", desc: "Select your category and participation type" },
  { n: 3, title: "About Team", desc: "Member Details" },
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
}

const emptyMember = (): MemberDraft => ({ firstName: "", lastName: "", email: "", phone: "" });

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
  (!m.phone.trim() || phoneOk(m.phone));

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
  "w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all " +
  "disabled:bg-gray-50 disabled:text-gray-500";
const selectClass = `${inputClass} appearance-none cursor-pointer`;

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
      <label className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label} {required && <span className="text-primary">*</span>}
        {!required && <span className="text-gray-400 font-normal"> (Optional)</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
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
    <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2.5">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700">
          {n}. {title}
        </h3>
      </div>
      {badge ?? <span className="text-[10px] font-bold text-primary">*Required</span>}
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
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
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
    <aside className="no-print w-full shrink-0 border-b border-gray-100 px-5 py-6 sm:w-[230px] sm:border-b-0 sm:border-r">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">SEVA 2026</p>
      <h2 className="mb-6 text-sm font-extrabold text-gray-900">Registration Dossier</h2>

      <ol className="space-y-5">
        {WIZARD_STEPS.map((s) => {
          const state = step === s.n ? "active" : step > s.n ? "done" : "upcoming";
          return (
            <li key={s.n} className="flex items-start gap-3">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  state === "active"
                    ? "bg-primary text-white"
                    : state === "done"
                      ? "bg-primary/15 text-primary"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {state === "done" ? <CheckCircle2 size={14} /> : s.n}
              </span>
              <div className="pt-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-300">
                  Step {s.n}
                </p>
                <p
                  className={`text-[13px] font-bold leading-tight ${
                    state === "active"
                      ? "text-primary"
                      : state === "done"
                        ? "text-gray-700"
                        : "text-gray-400"
                  }`}
                >
                  {s.title}
                </p>
                <p className="text-[11px] leading-tight text-gray-400">{s.desc}</p>
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
  teamName,
  institute,
  institutionAddress,
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
  teamName: string;
  institute: string;
  institutionAddress: string;
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
    ["Institute / Organisation Address", institutionAddress || "-"],
    ["Theme / Track", theme || "-"],
    ["Problem Statement", problem || "-"],
    ["Organisation ID Card", idCardName || "-"],
    ["Team Size", `${teamSize} members`],
  ];

  return (
    <div className="print-area space-y-6 text-sm text-gray-700">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          SEVA 2026 · Registration Confirmation
        </p>
        <h2 className="mt-1 text-xl font-extrabold text-gray-900">{teamName || "Untitled Team"}</h2>
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
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Team Members</p>
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
                {m.email} · {i === 0 ? "Team Leader" : `Member ${i + 1}`}
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
  // "" until a category is picked, then defaults to the only option a
  // REGIONAL category has ("open") or is left for the user to choose on a
  // NATIONAL one - see handleCategoryChange.
  const [problemOptionType, setProblemOptionType] = useState<"" | "ps" | "open">("");
  const [proposedProblemStatement, setProposedProblemStatement] = useState("");
  const [teamSize, setTeamSize] = useState(2);
  const [teamName, setTeamName] = useState("");
  const [institute, setInstitute] = useState("");
  const [institutionAddress, setInstitutionAddress] = useState("");
  // File objects can't be restored from a resumed draft (the browser never
  // hands the server's stored file back to JS) - existingIdCardName shows
  // what's already on file, and idCardFile is only set when the user
  // chooses to replace it (or must be set, on first-time creation).
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
            state: profile.state,
            country: profile.country,
            alternatePhone: profile.alternatePhone ?? "",
            backupEmail: profile.backupEmail ?? "",
          }));
        }

        if (!team) return;

        setTeamStatus(team.status);
        if (team.status !== "draft") {
          setExistingTeam(team);
          setTeamName(team.name);
          setInstitute(team.institute);
          setInstitutionAddress(team.institutionAddress);
          setProblemCategoryCode(team.problemCategoryCode);
          setProblemOptionType(team.problemOptionType);
          setProposedProblemStatement(team.proposedProblemStatement ?? "");
          setExistingIdCardName(team.idCardOriginalName);
          const roster = (team.members ?? []).map((m: TeamMember): MemberDraft => ({
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            phone: m.phone ?? "",
          }));
          if (roster.length) setMembers(roster);
          return;
        }

        setTeamId(team.id);
        setTeamName(team.name);
        setInstitute(team.institute);
        setInstitutionAddress(team.institutionAddress);
        setProblemCategoryCode(team.problemCategoryCode);
        setProblemOptionType(team.problemOptionType);
        setProposedProblemStatement(team.proposedProblemStatement ?? "");
        setExistingIdCardName(team.idCardOriginalName);

        const existing = team.members ?? [];
        const leader = existing.find((m: TeamMember) => m.role === "leader");
        const others = existing.filter((m: TeamMember) => m.role !== "leader");
        const toDraft = (m: TeamMember): MemberDraft => ({
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          phone: m.phone ?? "",
        });
        const roster = [leader ? toDraft(leader) : emptyMember(), ...others.map(toDraft)];
        setMembers(roster.length >= 2 ? roster : [...roster, emptyMember()]);
        setTeamSize(Math.max(2, roster.length));
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

  const updateMember = (i: number, field: keyof MemberDraft, val: string) => {
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: val } : m)));
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
  const idCardDisplay = idCardFile?.name ?? existingIdCardName ?? "-";

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

  const handleIdCardChange = (file: File | null) => {
    setIdCardError("");
    if (!file) {
      setIdCardFile(null);
      return;
    }
    if (!ID_CARD_ALLOWED_MIME.has(file.type)) {
      setIdCardError("ID card must be a PDF, JPG, or PNG file.");
      return;
    }
    if (file.size > ID_CARD_MAX_SIZE_BYTES) {
      setIdCardError("ID card file is too large (max 5 MB).");
      return;
    }
    setIdCardFile(file);
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
      setError(
        "Choose a category and whether you're taking the official problem statement or proposing your own.",
      );
      setStep(2);
      return;
    }
    if (problemOptionType === "open" && proposedProblemStatement.trim().length < 10) {
      setError("Describe the problem you're proposing to solve (at least 10 characters).");
      setStep(2);
      return;
    }
    if (!idCardFile && !existingIdCardName) {
      setError("Upload your organisation/institution ID card (PDF, JPG, or PNG).");
      setStep(3);
      return;
    }

    setSubmitting(true);
    setError("");

    const problemSelection = {
      name: teamName,
      institute,
      institutionAddress,
      problemCategoryCode,
      problemOptionType,
      ...(problemOptionType === "open" ? { proposedProblemStatement } : {}),
    };

    try {
      let id = teamId;

      if (!id) {
        // idCardFile is guaranteed non-null here: the check above already
        // returned early if both it and existingIdCardName were empty, and
        // a brand-new team (no teamId yet) can't have an existingIdCardName.
        const { team } = await teamApi.create(problemSelection, idCardFile!);
        id = team.id;
        setTeamId(id);
      } else {
        // Resumed draft - the create() branch above is skipped, so push any
        // edits made since it loaded. idCardFile is only passed when the
        // user chose to replace the card already on file; omitting it
        // leaves the existing upload untouched (see teamApi.update).
        await teamApi.update(id, problemSelection, idCardFile ?? undefined);
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
      const localEmails = new Set(members.slice(1).map((m) => m.email.toLowerCase()));

      for (const cm of currentMembers) {
        if (!localEmails.has(cm.email.toLowerCase())) {
          await teamApi.removeMember(id, cm.id);
        }
      }

      for (const m of members.slice(1)) {
        const existing = currentByEmail.get(m.email.toLowerCase());
        const changed =
          !!existing &&
          (existing.firstName !== m.firstName ||
            existing.lastName !== m.lastName ||
            (existing.phone ?? "") !== m.phone);

        if (existing && !changed) continue;
        if (existing && changed) await teamApi.removeMember(id, existing.id);

        await teamApi.addMember(id, {
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          phone: m.phone || undefined,
        });
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
        title: "Your team has been registered!",
        body: "Sit tight - wait for further rounds. We'll notify every team member by email as the process moves forward.",
      },
      under_review: {
        title: "Your team is under review",
        body: "Your registration is being reviewed by the SEVA 2026 jury. Wait for further rounds - we'll notify you by email.",
      },
      shortlisted: {
        title: "Congratulations - you're shortlisted!",
        body: "Your team has been shortlisted for the next round of SEVA 2026. Watch your email for next steps.",
      },
      rejected: {
        title: "Thank you for participating",
        body: "Your team was not shortlisted this round. We appreciate the effort you put into your registration.",
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
              teamName={teamName}
              institute={institute}
              institutionAddress={institutionAddress}
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
    <div className="flex min-h-screen flex-col bg-[#fdf6f6]">
      <Header activeNav="team-register" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="no-print mb-6">
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
            SEVA 2026 · DTU Youth Innovation Challenge
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Team Registration
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Complete every step of the dossier to register your team for SEVA 2026.
          </p>
        </div>

        <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:flex-row">
          <DossierSidebar step={step} />

          <div className="min-w-0 flex-1">
            {/* ── STEP 1: Personal Details ── */}
            {step === 1 && (
              <div className="space-y-7 px-6 py-8 sm:px-8">
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
                    <select
                      className={selectClass}
                      value={personal.nationality}
                      onChange={(e) => setPersonal((p) => ({ ...p, nationality: e.target.value }))}
                    >
                      {NATIONALITY_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
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
                    <select
                      className={selectClass}
                      value={personal.gender}
                      onChange={(e) => setPersonal((p) => ({ ...p, gender: e.target.value }))}
                    >
                      <option value="">Select…</option>
                      {GENDER_OPTIONS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
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
                    <select
                      className={selectClass}
                      value={personal.state}
                      onChange={(e) => setPersonal((p) => ({ ...p, state: e.target.value }))}
                    >
                      <option value="">Select…</option>
                      {NORTH_STATE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Country" required>
                    <select
                      className={selectClass}
                      value={personal.country}
                      onChange={(e) => setPersonal((p) => ({ ...p, country: e.target.value }))}
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
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
              <div className="space-y-7 px-6 py-8 sm:px-8">
                <SectionHeader n={1} icon={Layers} title="Category" />
                <div className="-mt-5">
                  <Field label="Problem Category" required>
                    <select
                      className={selectClass}
                      value={problemCategoryCode}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                    >
                      <option value="">Select a category…</option>
                      <optgroup label="National Level Innovation">
                        {PROBLEM_CATEGORIES.filter((c) => c.theme === "NATIONAL").map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Local Community Level Innovation">
                        {PROBLEM_CATEGORIES.filter((c) => c.theme === "REGIONAL").map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </Field>
                </div>

                <SectionHeader n={2} icon={ListChecks} title="Problem Statement" />
                <div className="-mt-5 space-y-4">
                  {!problemCategoryCode ? (
                    <p className="text-xs text-gray-400">Pick a category first.</p>
                  ) : selectedCategory?.theme === "REGIONAL" ? (
                    // Regional categories have no official PS at all - every
                    // regional team proposes and solves its own problem, so
                    // there is no PS/OPEN choice to make here, only the
                    // proposal text itself.
                    <p className="text-xs text-gray-500">
                      This category has no official problem statement - describe the problem you're
                      proposing to solve below.
                    </p>
                  ) : (
                    <Field label="How do you want to participate?" required>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => setProblemOptionType("ps")}
                          className={`flex-1 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all cursor-pointer ${
                            problemOptionType === "ps"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          Take the official Problem Statement
                          <span className="mt-0.5 block text-xs font-normal text-gray-400">
                            {selectedCategory?.psTitle}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setProblemOptionType("open")}
                          className={`flex-1 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all cursor-pointer ${
                            problemOptionType === "open"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          Propose my own problem
                          <span className="mt-0.5 block text-xs font-normal text-gray-400">
                            Identify and solve a problem of your own within this category.
                          </span>
                        </button>
                      </div>
                    </Field>
                  )}

                  {problemOptionType === "open" && (
                    <Field
                      label="Describe the problem you're proposing to solve"
                      required
                      hint="At least 10 characters."
                    >
                      <textarea
                        className={`${inputClass} min-h-[110px] resize-y`}
                        value={proposedProblemStatement}
                        onChange={(e) => setProposedProblemStatement(e.target.value)}
                        placeholder="What's the problem, who does it affect, and what's your proposed direction?"
                      />
                    </Field>
                  )}
                </div>

                <SectionHeader n={3} icon={Users} title="Team Composition" />
                <div className="-mt-5">
                  <Field label="Team Size" required hint="Including team leader (you).">
                    <div className="flex gap-2">
                      {TEAM_SIZE_OPTIONS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handleSizeChange(n)}
                          className={`size-10 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                            teamSize === n
                              ? "bg-primary text-white"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                {error && (
                  <p role="alert" className="text-xs font-semibold text-primary">
                    {error}
                  </p>
                )}

                <StepFooter
                  onBack={() => setStep(1)}
                  nextLabel="Next: About Team"
                  onNext={() => setStep(3)}
                  nextDisabled={
                    !problemCategoryCode ||
                    !problemOptionType ||
                    (problemOptionType === "open" && proposedProblemStatement.trim().length < 10)
                  }
                />
              </div>
            )}

            {/* ── STEP 3: About Team ── */}
            {step === 3 && (
              <div className="space-y-7 px-6 py-8 sm:px-8">
                <SectionHeader n={1} icon={IdCard} title="Team Identity" />
                <div className="-mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Team Name" required hint="At least 3 characters.">
                    <input
                      className={inputClass}
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Circuit Breakers"
                    />
                  </Field>
                  <Field label="Institute / College" required>
                    <input
                      className={inputClass}
                      value={institute}
                      onChange={(e) => setInstitute(e.target.value)}
                      placeholder="e.g. Delhi Technological University"
                    />
                  </Field>
                  <Field
                    label="Institute / Organisation Address"
                    required
                    hint="Postal address of the institution or organisation you're registering under."
                  >
                    <textarea
                      className={`${inputClass} min-h-[80px] resize-y`}
                      value={institutionAddress}
                      onChange={(e) => setInstitutionAddress(e.target.value)}
                      placeholder="Street, city, state, PIN code"
                    />
                  </Field>
                  <Field
                    label="Organisation ID Card"
                    required={!existingIdCardName}
                    hint="PDF, JPG, or PNG · max 5 MB. Institute, staff, or student ID confirming your affiliation."
                  >
                    <input
                      type="file"
                      accept={ID_CARD_ACCEPT}
                      onChange={(e) => handleIdCardChange(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-xs file:font-bold file:text-primary hover:file:bg-primary/20"
                    />
                    {idCardFile ? (
                      <p className="mt-1.5 text-xs font-medium text-emerald-600">
                        Selected: {idCardFile.name}
                      </p>
                    ) : existingIdCardName ? (
                      <p className="mt-1.5 text-xs text-gray-400">
                        Currently on file: {existingIdCardName}. Choose a new file to replace it.
                      </p>
                    ) : null}
                    {idCardError && (
                      <p role="alert" className="mt-1.5 text-xs font-semibold text-primary">
                        {idCardError}
                      </p>
                    )}
                  </Field>
                </div>

                <SectionHeader n={2} icon={Users} title="Member Details" />
                <div className="-mt-5 space-y-3">
                  {members.map((m, i) => {
                    const who = i === 0 ? "Team Leader" : `Member ${i + 1}`;
                    return (
                      <div key={i} className="space-y-3 rounded-xl border border-gray-100 p-4">
                        <label className="block text-xs font-semibold text-gray-600">
                          {i === 0 ? "Team Leader (You)" : `Member ${i + 1} *`}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
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
                        </div>
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
                    );
                  })}
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
                    teamName.trim().length < TEAM_NAME_MIN ||
                    institute.trim().length < INSTITUTE_MIN ||
                    institutionAddress.trim().length < 5 ||
                    (!idCardFile && !existingIdCardName) ||
                    members.some((m) => !memberComplete(m))
                  }
                />
              </div>
            )}

            {/* ── STEP 4: Review & Confirmation ── */}
            {step === 4 && (
              <div className="space-y-6 px-6 py-8 sm:px-8">
                <h2 className="text-lg font-bold text-gray-900">Review &amp; Confirm</h2>
                <ConfirmationSummary
                  personal={personal}
                  email={user?.email ?? ""}
                  teamName={teamName}
                  institute={institute}
                  institutionAddress={institutionAddress}
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
                    I hereby confirm that the information and identification documents provided for
                    myself and all team members are accurate and complete to the best of my
                    knowledge. I accept full responsibility for any discrepancies or inaccuracies
                    and understand that the committee reserves the right to reject or disqualify our
                    participation if any information or documents are found to be false, misleading,
                    or inconsistent.
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
              <div className="space-y-6 px-6 py-8 sm:px-8">
                <div className="no-print text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50">
                    <CheckCircle2 className="size-7 text-emerald-500" />
                  </div>
                  <h2 className="mt-3 text-xl font-extrabold text-gray-900">Team Registered!</h2>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                    <span className="font-semibold text-gray-800">{teamName}</span> has been
                    successfully registered for SEVA 2026. Wait for further rounds - we'll notify
                    every team member by email.
                  </p>
                </div>

                <ConfirmationSummary
                  personal={personal}
                  email={user?.email ?? ""}
                  teamName={teamName}
                  institute={institute}
                  institutionAddress={institutionAddress}
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
