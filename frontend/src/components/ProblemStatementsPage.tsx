import { useEffect } from "react";
import { Header, Footer } from "./SewaSite";

/* ── Reusable Pagination ──────────────────────────────────────────── */
function Pagination({ total = 24, current = 1 }: { total?: number; current?: number }) {
  const btnBase =
    "t-content-sm font-semibold! inline-flex items-center justify-center h-9 min-w-[36px] rounded-xl border transition-colors select-none cursor-pointer";
  const activeCls = `${btnBase} bg-[#2368B2] border-[#2368B2] text-white shadow-[0px_2px_6px_rgba(35,104,178,0.3)]`;
  const inactiveCls = `${btnBase} bg-white border-[rgba(226,232,240,0.9)] text-[#374151] hover:bg-[#F1F5F9]`;
  const navCls = `${btnBase} px-4 gap-1.5 bg-white border-[rgba(226,232,240,0.9)] text-[#374151] hover:bg-[#F1F5F9]`;

  // Show: 1 2 3 4 5 … 24
  const pages = [1, 2, 3, 4, 5];

  return (
    <div className="mt-6 flex items-center justify-center gap-1.5 flex-wrap">
      {/* Previous */}
      <button type="button" className={navCls} aria-label="Previous page">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Previous
      </button>

      {/* Page numbers */}
      {pages.map((p) => (
        <button key={p} type="button" className={p === current ? activeCls : inactiveCls}
          aria-current={p === current ? "page" : undefined}
          style={{ padding: "0 12px" }}
        >
          {p}
        </button>
      ))}

      {/* Ellipsis */}
      <span className="t-content-sm inline-flex items-center justify-center h-9 w-9 text-[#9CA3AF] font-semibold!">
        …
      </span>

      {/* Last page */}
      <button type="button" className={inactiveCls} style={{ padding: "0 12px" }}>
        {total}
      </button>

      {/* Next */}
      <button type="button" className={navCls} aria-label="Next page">
        Next
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

type Category = {
  label: string;
  idNumber: string;
  badgeBg: string;
  badgeText: string;
};

/*
 * National Level: every category offers two options, not two separate rows —
 * take the problem statement we've supplied, or propose your own within that
 * category. Both live inside the ONE row for that category, as two stacked
 * sub-entries in the Problem Statement and ID Number columns, so the table
 * stays five rows (one per category) instead of ten.
 */
type NationalCategory = Category & {
  psTitle: string;
  psUrl?: string;
  psId: string; // e.g. "NAT-001-PS"
  openId: string; // e.g. "NAT-001-OP"
};

export const NATIONAL_CATEGORIES: NationalCategory[] = [
  {
    label: "Defence, Intelligence, Space & National Security",
    psTitle: "PS1 TITLE",
    idNumber: "NAT-009",
    psId: "NAT-009",
    openId: "",
    badgeBg: "#FDE8E8",
    badgeText: "#E03137",
  },
  {
    label: "Disaster Management & Resilience",
    psTitle: "PS2 TITLE",
    idNumber: "NAT-008",
    psId: "NAT-008",
    openId: "",
    badgeBg: "#DBEAFE",
    badgeText: "#0284C7",
  },
  {
    label: "Manufacturing & Electronics, AI, Robotics & Autonomous Systems",
    psTitle: "PS3 TITLE",
    idNumber: "NAT-007",
    psId: "NAT-007",
    openId: "",
    badgeBg: "#DCFCE7",
    badgeText: "#16A34A",
  },
  {
    label: "Energy & Sustainable Technology & Environment",
    psTitle: "PS4 TITLE",
    idNumber: "NAT-006",
    psId: "NAT-006",
    openId: "",
    badgeBg: "#FEF3C7",
    badgeText: "#D97706",
  },
  {
    label: "Advanced Engineering, Infrastructure, Future Mobility & Transportation",
    psTitle: "PS5 TITLE",
    idNumber: "NAT-005",
    psId: "NAT-005",
    openId: "",
    badgeBg: "#EDE9FE",
    badgeText: "#7C3AED",
  },
];

/*
 * Regional (Local Community Level): open to all, with no problem statements
 * provided at all — every category is solved as an open proposal. There is
 * only ever one option per row, and the table has no Problem Statement
 * column since there is nothing to show in it.
 */
export const COMMUNITY_CATEGORIES: NationalCategory[] = [
  { label: "Village & Panchayat Development, Agriculture & Rural Economy", psTitle: "PS1 TITLE", idNumber: "REG-001", psId: "REG-001", openId: "", badgeBg: "#FDE8E8", badgeText: "#E03137" },
  { label: "Education & Skill Development", psTitle: "PS1 TITLE", idNumber: "REG-001", psId: "REG-001", openId: "", badgeBg: "#DBEAFE", badgeText: "#0284C7" },
  { label: "Healthcare & Community Well-being", psTitle: "PS1 TITLE", idNumber: "REG-001", psId: "REG-001", openId: "", badgeBg: "#DCFCE7", badgeText: "#16A34A" },
  { label: "City & Urban Problems", psTitle: "PS1 TITLE", idNumber: "REG-001", psId: "REG-001", openId: "", badgeBg: "#FEF3C7", badgeText: "#D97706" },
  { label: "Environment & Natural Resources", psTitle: "PS1 TITLE", idNumber: "REG-001", psId: "REG-001", openId: "", badgeBg: "#EDE9FE", badgeText: "#7C3AED" },
  { label: "Sports (Khelo India)", psTitle: "PS1 TITLE", idNumber: "REG-001", psId: "REG-001", openId: "", badgeBg: "#FDE8E8", badgeText: "#E03137" },
  { label: "Employment & Livelihood", psTitle: "PS1 TITLE", idNumber: "REG-001", psId: "REG-001", openId: "", badgeBg: "#DBEAFE", badgeText: "#0284C7" },
  { label: "Women & Child Safety and Development", psTitle: "PS1 TITLE", idNumber: "REG-001", psId: "REG-001", openId: "", badgeBg: "#DCFCE7", badgeText: "#16A34A" },
  { label: "Safety & Disaster Management", psTitle: "PS1 TITLE", idNumber: "REG-001", psId: "REG-001", openId: "", badgeBg: "#FEF3C7", badgeText: "#D97706" },
  { label: "Transport, Energy & Tourism", psTitle: "PS1 TITLE", idNumber: "REG-001", psId: "REG-001", openId: "", badgeBg: "#EDE9FE", badgeText: "#7C3AED" },
  { label: "Miscellaneous", psTitle: "PS1 TITLE", idNumber: "REG-001", psId: "REG-001", openId: "", badgeBg: "#FDE8E8", badgeText: "#E03137" },
];

/*
 * ── Table Card ──────────────────────────────────────────────────────
 * showPsColumn=true  (National): 4 columns — #, Category, Problem Statement,
 *   ID Number. A row either shows the PS we've supplied (with PDF/link
 *   icons) or, when row.psTitle is absent, an "Open — propose your own"
 *   badge in its place.
 * showPsColumn=false (Regional): 3 columns — #, Category, ID Number. There
 *   is no Problem Statement column at all, since every regional entry is an
 *   open proposal and there is nothing to show for it.
 */
function TableCard({ categories, showPsColumn }: { categories: Category[]; showPsColumn: boolean }) {
  const categoryWidth = showPsColumn ? "40%" : "62%";
  const idWidth = "16%";

  return (
    /* Outer card — white, rounded-[24px], soft border + shadow */
    <div className="w-full rounded-[24px] border border-[rgba(226,232,240,0.8)] shadow-[0px_4px_24px_rgba(0,0,0,0.03)] bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className={`w-full border-collapse ${showPsColumn ? "min-w-[780px]" : "min-w-[560px]"}`}>

          {/* ── Header ── */}
          <thead>
            <tr
              className="border-b border-[#E2E9F2]"
              style={{ background: "linear-gradient(180deg,#EDF2F7 0%,#E8EEF6 100%)" }}
            >
              {/* # */}
              <th className="w-[84px] px-6 py-4 text-center">
                <span className="t-content-sm font-bold! tracking-[0.65px] uppercase text-[#60718B]">
                  #
                </span>
              </th>
              {/* CATEGORY */}
              <th className="px-6 py-4 text-left" style={{ width: categoryWidth }}>
                <span className="t-content-sm font-bold! tracking-[0.65px] uppercase text-[#60718B]">
                  Category
                </span>
              </th>
              {/* PROBLEM STATEMENT — national only */}
              {showPsColumn && (
                <th className="px-6 py-4 text-left" style={{ width: "31%" }}>
                  <span className="t-content-sm font-bold! tracking-[0.65px] uppercase text-[#60718B]">
                    Problem Statement
                  </span>
                </th>
              )}
              {/* ID NUMBER */}
              <th className="px-6 py-4 text-center" style={{ width: idWidth }}>
                <span className="t-content-sm font-bold! tracking-[0.65px] uppercase text-[#60718B]">
                  ID Number
                </span>
              </th>
              {/* REGISTER */}
              <th className="w-[120px] px-4 py-4 text-center">
                <span className="t-content-sm font-bold! tracking-[0.65px] uppercase text-[#60718B]">
                  &nbsp;
                </span>
              </th>
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {categories.map((row, i) => {
              const national = row as Partial<NationalCategory>;
              const hasSinglePs = showPsColumn && national.psTitle !== undefined;

              return (
                <tr
                  key={`${row.idNumber}-${i}`}
                  className={`hover:bg-[#FAFBFD] transition-colors ${
                    i > 0 ? "border-t border-[#F1F5F9]" : ""
                  }`}
                >
                  {/* Number badge */}
                  <td className="w-[84px] px-6 py-[20.5px] text-center">
                    <span
                      className="t-content-sm font-bold! inline-flex items-center justify-center w-9 h-9 rounded-full shadow-[0px_1px_2px_rgba(0,0,0,0.05)]"
                      style={{ background: row.badgeBg, color: row.badgeText }}
                    >
                      {i + 1}
                    </span>
                  </td>

                  {/* Category name */}
                  <td className="px-6 py-[27.5px]" style={{ width: categoryWidth }}>
                    <span className="t-content-sm font-bold! tracking-[-0.375px] text-[#142340]">
                      {row.label}
                    </span>
                  </td>

                  {/* Problem statement — national only, single entry */}
                  {showPsColumn && (
                    <td className="px-6 py-[22.5px]" style={{ width: "31%" }}>
                      {hasSinglePs ? (
                        <div className="flex items-center gap-3">
                          {/* PDF icon badge */}
                          <span className="inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-lg border border-[#FECACA] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]" style={{ background: "rgba(254,242,242,0.6)" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </span>
                          <span className="t-content-sm font-bold! text-[#142340]">
                            {national.psTitle}
                          </span>
                          {/* External link badge */}
                          <span className="inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-full bg-white border border-[rgba(226,232,240,0.8)] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </span>
                        </div>
                      ) : null}
                    </td>
                  )}

                  {/* ID pill(s) — national rows stack the PS and OPEN IDs to
                      line up with their matching option above */}
                  <td className="px-6 py-[24.5px] text-center" style={{ width: idWidth }}>
                    <span className="t-content-sm font-semibold! inline-flex items-center justify-center px-5 py-1.5 rounded-full bg-[#EAF1F8] tracking-[0.3px] text-[#1E2F4D] whitespace-nowrap">
                      {row.idNumber}
                    </span>
                  </td>

                  {/* Register button */}
                  <td className="w-[120px] px-4 py-[24.5px] text-center">
                    <a
                      href="/team-register"
                      className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-[#E03137] hover:bg-[#c52a2f] text-white text-sm font-bold transition-colors shadow-sm"
                    >
                      Register
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */
export function ProblemStatementsPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <Header activeNav="problems" />

        <main className="pt-10 sm:pt-16 pb-20 sm:pb-28">
          <div className="site-shell">
            <h1 className="t-main-heading uppercase">Problem Statements</h1>

            <div className="t-section-stack mt-10 sm:mt-14 space-y-10 sm:space-y-14">

              {/* ── Theme 1 ── */}
              <section
                id="national"
                aria-labelledby="national-heading"
                className="scroll-mt-28 rounded-[28px] border border-[#eaecf0] bg-white px-6 py-8 shadow-[0_10px_40px_rgba(0,0,0,0.05)] sm:px-10 sm:py-12"
              >
                <h2
                  id="national-heading"
                  className="t-subheading-2 text-[#112347] uppercase"
                >
                  Theme 1: National Level Innovation
                </h2>
                <p className="t-content mt-5 text-[#334155] sm:text-justify">
                  Participants will work on identified challenges and problem statements of national
                  significance, developing innovative, sustainable and scalable solutions with the
                  potential for adoption across India. Innovations should have a starting TRL of
                  4–6 and are expected to progress towards TRL 7–9 by the end of the Challenge,
                  demonstrating a clear pathway from validated technology to an operational,
                  deployable solution.
                </p>

                <p className="t-content mt-4 text-[#334155]">
                  For each theme, choose either the problem statement we&apos;ve provided, or
                  propose and solve your own problem within that category.
                </p>

                <div className="mt-8">
                  <TableCard categories={NATIONAL_CATEGORIES} showPsColumn />
                </div>

                <Pagination total={24} current={1} />
              </section>

              {/* ── Theme 2 ── */}
              <section
                id="community"
                aria-labelledby="community-heading"
                className="scroll-mt-28 rounded-[28px] border border-[#eaecf0] bg-white px-6 py-8 shadow-[0_10px_40px_rgba(0,0,0,0.05)] sm:px-10 sm:py-12"
              >
                <h2
                  id="community-heading"
                  className="t-subheading-2 text-[#112347] uppercase"
                >
                  Theme 2: Local Community Level Innovations –{" "}
                  Village / District / State
                </h2>
                <p className="t-content mt-5 text-[#334155] sm:text-justify">
                  Participants will identify real problems and unmet needs within their own
                  villages, districts or states and develop locally relevant, affordable,
                  sustainable and implementable solutions that directly benefit the community and
                  have the potential to be replicated or scaled in other regions. Innovations
                  should have a starting TRL of 1–3 and are expected to progress towards TRL 6–7
                  by the end of the Challenge, demonstrating a clear journey from an initial
                  concept or proof of concept to a validated and demonstrable solution.
                </p>

                <p className="t-content mt-4 text-[#334155]">
                  This theme has no fixed problem statements — participants identify and propose
                  their own problem within a chosen category.
                </p>

                <div className="mt-8">
                  <TableCard categories={COMMUNITY_CATEGORIES} showPsColumn />
                </div>

                <Pagination total={24} current={1} />
              </section>

            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}