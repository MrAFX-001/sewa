import { useEffect, type ComponentType } from "react";
import {
  Box,
  CircleAlert,
  CircleCheck,
  ClipboardCheck,
  Trophy,
  Users,
  UsersRound,
  X,
} from "lucide-react";

/*
 * ── State-wise summary popups for the Statistics section ─────────────
 * Opened by clicking one of the six metric tiles. The shell (overlay,
 * rounded card, round close button, footer "Close") mirrors ProblemModal on
 * the Problem Statements page so every popup on the site feels the same.
 *
 * Data is fetched from the public statistics endpoint; the modal only renders
 * the backend-provided state/category rows. Laptop / tablet (sm+): a table — #, State/UT, Schools, Colleges,
 * Industries, Total — with the numbers in pills.
 * Phone (< sm): the same rows as compact cards (state + total on top, the
 * three counts underneath) because six columns do not fit in 360px.
 */

export type StatKey = "entries" | "shortlisted" | "mentored" | "prototypes" | "tested" | "validated";

type Counts = { schools: number; colleges: number; industries: number };

type StateRow = { state: string; note?: string } & Counts;

export type StatSummaryRow = StateRow;

export const STAT_META: Record<
  StatKey,
  { label: string; icon: ComponentType<{ size?: number; strokeWidth?: number }>; bg: string; fg: string }
> = {
  entries: { label: "Entries", icon: Users, bg: "#E6EEFF", fg: "#2F6BEA" },
  shortlisted: { label: "Shortlisted", icon: Trophy, bg: "#FFF1D6", fg: "#D98A06" },
  mentored: { label: "Mentored", icon: UsersRound, bg: "#EFEAFE", fg: "#7C5CE0" },
  prototypes: { label: "Prototypes", icon: Box, bg: "#DDF6F1", fg: "#12A38A" },
  tested: { label: "Tested", icon: ClipboardCheck, bg: "#FDE4E4", fg: "#E0474C" },
  validated: { label: "Validated", icon: CircleCheck, bg: "#DDF5E6", fg: "#1E9E57" },
};

/** Pastel circle colours for the row numbers, cycling like the design. */
const ROW_BADGES = [
  ["#FDE4E4", "#E0474C"],
  ["#E6EEFF", "#2F6BEA"],
  ["#DDF5E6", "#1E9E57"],
  ["#FFF1D6", "#D98A06"],
  ["#EFEAFE", "#7C5CE0"],
  ["#FDE4EC", "#DB2F6A"],
  ["#DDF6F1", "#12A38A"],
  ["#F3E8FF", "#9333EA"],
  ["#DDF5E6", "#1E9E57"],
] as const;

const fmt = (n: number) => n.toLocaleString("en-IN");

function Pill({ value, strong = false }: { value: number; strong?: boolean }) {
  return (
    <span
      className={`inline-flex min-w-[3.25rem] items-center justify-center rounded-full bg-[#EEF3F8] px-3 py-1 text-[13px] tabular-nums text-[#1E3554] ${
        strong ? "font-bold" : "font-medium"
      }`}
    >
      {fmt(value)}
    </span>
  );
}

function RowBadge({ index }: { index: number }) {
  const [bg, fg] = ROW_BADGES[index % ROW_BADGES.length]!;
  return (
    <span
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
      style={{ backgroundColor: bg, color: fg }}
    >
      {index + 1}
    </span>
  );
}

export function StatSummaryModal({
  stat,
  rows,
  onClose,
}: {
  stat: StatKey;
  rows: StateRow[];
  onClose: () => void;
}) {
  const meta = STAT_META[stat];
  const Icon = meta.icon;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const titleId = `stat-summary-${stat}-title`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#122033]/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-[20px] border border-[#E3EAF2] bg-white shadow-[0_24px_80px_rgba(15,35,65,0.25)] sm:max-h-[calc(100vh-3rem)] sm:rounded-[20px]"
      >
        {/* Phone: grab handle so it reads as a bottom sheet */}
        <div aria-hidden="true" className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[#DCE6F0] sm:hidden" />

        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${meta.label} summary`}
          className="absolute right-4 top-4 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-[#EDF3F8] text-[#1E3554] transition-colors hover:bg-[#DDE8F2] focus-visible:ring-2 focus-visible:ring-[#2368B2]"
        >
          <X size={18} />
        </button>

        <div className="px-4 pb-5 pt-5 sm:px-8 sm:pb-7 sm:pt-8">
          {/* Title */}
          <div className="flex items-center gap-3 pr-12">
            <span
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11"
              style={{ backgroundColor: meta.bg, color: meta.fg }}
            >
              <Icon size={20} strokeWidth={2.2} />
            </span>
            {/* Phone: label over subtitle. sm+: one line "Label | State-wise Summary". */}
            <h2 id={titleId} className="flex min-w-0 flex-col font-bold leading-tight text-[#142340] sm:block sm:text-2xl">
              <span className="text-lg sm:text-2xl">{meta.label}</span>
              <span aria-hidden="true" className="mx-2 hidden font-normal text-[#B6C2D1] sm:inline">|</span>
              <span className="text-sm font-semibold text-[#60718B] sm:text-2xl sm:font-bold sm:text-[#142340]">
                State-wise Summary
              </span>
            </h2>
          </div>

          {/* Laptop / tablet: table */}
          <div className="mt-6 hidden overflow-hidden rounded-xl border border-[#DCE6F0] sm:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#EEF3F8] text-[11px] font-semibold uppercase tracking-wider text-[#60718B]">
                  <th scope="col" className="w-12 py-2.5 pl-4 text-center">#</th>
                  <th scope="col" className="py-2.5 pl-2">State / UT</th>
                  <th scope="col" className="py-2.5 text-center">Schools</th>
                  <th scope="col" className="py-2.5 text-center">Colleges</th>
                  <th scope="col" className="py-2.5 text-center">Industries</th>
                  <th scope="col" className="py-2.5 pr-4 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.state} className="border-t border-[#EEF2F6]">
                    <td className="py-2.5 pl-4 text-center">
                      <RowBadge index={i} />
                    </td>
                    <th scope="row" className="py-2.5 pl-2 pr-2 text-sm font-medium text-[#142340]">
                      {row.state}
                      {row.note && <span className="ml-1 text-xs font-normal text-[#8193A9]">{row.note}</span>}
                    </th>
                    <td className="py-2.5 text-center"><Pill value={row.schools} /></td>
                    <td className="py-2.5 text-center"><Pill value={row.colleges} /></td>
                    <td className="py-2.5 text-center"><Pill value={row.industries} /></td>
                    <td className="py-2.5 pr-4 text-center">
                      <Pill value={row.schools + row.colleges + row.industries} strong />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone: stacked rows */}
          <ul className="mt-5 space-y-2.5 sm:hidden">
            {rows.map((row, i) => (
              <li key={row.state} className="rounded-xl border border-[#DCE6F0] bg-[#F8FAFC] p-3">
                <div className="flex items-center gap-2.5">
                  <RowBadge index={i} />
                  <p className="min-w-0 flex-1 pr-1 text-sm font-semibold leading-snug text-[#142340]">
                    {row.state}
                    {row.note && <span className="block text-xs font-normal text-[#8193A9]">{row.note}</span>}
                  </p>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#60718B]">Total</span>
                  <Pill value={row.schools + row.colleges + row.industries} strong />
                </div>
                <dl className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                  {(
                    [
                      ["Schools", row.schools],
                      ["Colleges", row.colleges],
                      ["Industries", row.industries],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-white px-1 py-1.5">
                      <dt className="text-[10px] font-semibold uppercase tracking-wider text-[#60718B]">{label}</dt>
                      <dd className="text-sm font-semibold tabular-nums text-[#1E3554]">{fmt(value)}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>

          {/* Note */}
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-[#FDECEC] px-4 py-3 text-xs leading-relaxed text-[#C8323A] sm:text-[13px]">
            <CircleAlert size={16} className="mt-px shrink-0" />
            <span>
              <strong className="font-semibold">Important:</strong> Chandigarh is a separate entry. Punjab and Haryana
              exclude Chandigarh.
            </span>
          </p>

          <div className="mt-5 flex justify-end sm:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#EAF1F8] px-5 py-2.5 text-sm font-semibold text-[#142340] transition-colors hover:bg-[#DDE8F2] sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
