import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Header, Footer } from "./SewaSite";

/* ── Reusable Pagination ──────────────────────────────────────────── */
function Pagination({
  total = 24,
  current = 1,
  onChange,
}: {
  total?: number;
  current?: number;
  onChange?: (page: number) => void;
}) {
  const btnBase =
    "t-content-sm font-semibold! inline-flex items-center justify-center h-9 min-w-[36px] rounded-xl border transition-colors select-none cursor-pointer";
  const activeCls = `${btnBase} bg-[#2368B2] border-[#2368B2] text-white shadow-[0px_2px_6px_rgba(35,104,178,0.3)]`;
  const inactiveCls =
    `${btnBase} bg-white border-[rgba(226,232,240,0.9)] text-[#374151] hover:bg-[#F1F5F9]`;
  const navCls =
    `${btnBase} px-4 gap-1.5 bg-white border-[rgba(226,232,240,0.9)] text-[#374151] hover:bg-[#F1F5F9]`;

  // Show: 1 2 3 4 5 … 24
  const pages = [1, 2, 3, 4, 5];

  return (
    <div className="mt-6 flex items-center justify-center gap-1.5 flex-wrap">
      {/* Previous */}
      <button
        type="button"
        className={navCls}
        aria-label="Previous page"
        disabled={current <= 1}
        onClick={() => onChange?.(Math.max(1, current - 1))}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Previous
      </button>

      {/* Page numbers */}
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={p === current ? activeCls : inactiveCls}
          onClick={() => onChange?.(p)}
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
      <button
        type="button"
        className={total === current ? activeCls : inactiveCls}
        onClick={() => onChange?.(total)}
        style={{ padding: "0 12px" }}
      >
        {total}
      </button>

      {/* Next */}
      <button
        type="button"
        className={navCls}
        aria-label="Next page"
        disabled={current >= total}
        onClick={() => onChange?.(Math.min(total, current + 1))}
      >
        Next
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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

type NationalCategory = Category & {
  psTitle: string;
  psUrl?: string;
  psId: string;
  openId: string;
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

/* ── Problem Modal ─────────────────────────────────────────────────── */
function ProblemModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#122033]/45 p-4 backdrop-blur-[3px] sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="problem-modal-title"
        className="relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[20px] border border-[#E3EAF2] bg-white shadow-[0_24px_80px_rgba(15,35,65,0.25)] sm:max-h-[calc(100vh-3rem)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close problem statement details"
          className="absolute right-4 top-4 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-[#EDF3F8] text-[#1E3554] transition-colors hover:bg-[#DDE8F2] focus-visible:ring-2 focus-visible:ring-[#2368B2]"
        >
          <X size={18} />
        </button>

        <div className="px-6 pb-7 pt-8 sm:px-8 sm:pt-9">
          <h2
            id="problem-modal-title"
            className="pr-12 text-2xl font-bold leading-tight text-[#142340] sm:text-3xl"
          >
            {title}
          </h2>

          <div className="mt-6 rounded-xl border border-[#DCE6F0] bg-[#F8FAFC] p-5 text-sm leading-relaxed text-[#45566E]">
            {children}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#EAF1F8] px-5 py-2.5 text-sm font-semibold text-[#142340] transition-colors hover:bg-[#DDE8F2]"
            >
              Close
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

/* ── Table Card ────────────────────────────────────────────────────── */
function TableCard({
  categories,
  showPsColumn,
}: {
  categories: Category[];
  showPsColumn: boolean;
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"category" | "id">("category");
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<Category | null>(null);

  const pageSize = 5;

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categories
      .filter((row) => {
        const national = row as Partial<NationalCategory>;

        const searchable = [
          row.label,
          row.idNumber,
          national.psTitle,
          national.psId,
          national.openId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return !query || searchable.includes(query);
      })
      .sort((left, right) => {
        const leftValue = sortBy === "id" ? left.idNumber : left.label;
        const rightValue = sortBy === "id" ? right.idNumber : right.label;

        return leftValue.localeCompare(rightValue);
      });
  }, [categories, search, sortBy]);

  const totalPages = 24;

  const visibleCategories = filteredCategories.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, categories]);

  const categoryWidth = showPsColumn ? "40%" : "62%";
  const idWidth = "16%";

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[300px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8291A7]"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search problem statements..."
            aria-label="Search problem statements"
            className="h-10 w-full rounded-lg border border-[#DCE6F0] bg-white pl-9 pr-3 text-sm text-[#142340] outline-none placeholder:text-[#8291A7] focus:border-[#2368B2] focus:ring-2 focus:ring-[#2368B2]/15"
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-[#60718B]">
          Sort by
          <select
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as "category" | "id")
            }
            className="h-10 cursor-pointer rounded-lg border border-[#DCE6F0] bg-white px-3 text-sm font-semibold text-[#263A56] outline-none focus:border-[#2368B2]"
          >
            <option value="category">Category</option>
            <option value="id">ID Number</option>
          </select>
        </label>
      </div>

      <div className="w-full rounded-[24px] border border-[rgba(226,232,240,0.8)] bg-white shadow-[0px_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className={`w-full border-collapse ${
              showPsColumn ? "min-w-[780px]" : "min-w-[560px]"
            }`}
          >
            <thead>
              <tr
                className="border-b border-[#E2E9F2]"
                style={{
                  background:
                    "linear-gradient(180deg,#EDF2F7 0%,#E8EEF6 100%)",
                }}
              >
                {/* # */}
                <th className="w-[84px] px-6 py-4 text-center">
                  <span className="t-content-sm font-bold! tracking-[0.65px] uppercase text-[#60718B]">
                    #
                  </span>
                </th>

                {/* CATEGORY */}
                <th
                  className="px-6 py-4 text-left"
                  style={{ width: categoryWidth }}
                >
                  <span className="t-content-sm font-bold! tracking-[0.65px] uppercase text-[#60718B]">
                    Category
                  </span>
                </th>

                {/* PROBLEM STATEMENT */}
                {showPsColumn && (
                  <th
                    className="px-6 py-4 text-left"
                    style={{ width: "31%" }}
                  >
                    <span className="t-content-sm font-bold! tracking-[0.65px] uppercase text-[#60718B]">
                      Problem Statement
                    </span>
                  </th>
                )}

                {/* ID NUMBER */}
                <th
                  className="px-6 py-4 text-center"
                  style={{ width: idWidth }}
                >
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
              {visibleCategories.map((row, i) => {
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
                        {(page - 1) * pageSize + i + 1}
                      </span>
                    </td>

                    {/* Category name */}
                    <td className="px-6 py-[27.5px]" style={{ width: categoryWidth }}>
                      <span className="t-content-sm font-bold! tracking-[-0.375px] text-[#142340]">
                        {row.label}
                      </span>
                    </td>

                    {/* Problem statement */}
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
                            <button
                              type="button"
                              onClick={() => setSelectedRow(row)}
                              className="t-content-sm font-bold! text-[#142340] hover:text-[#2368B2] text-left cursor-pointer transition-colors"
                            >
                              {national.psTitle}
                            </button>
                            {/* External link badge */}
                            <button
                              type="button"
                              onClick={() => setSelectedRow(row)}
                              className="inline-flex items-center justify-center w-7 h-7 shrink-0 rounded-full bg-white border border-[rgba(226,232,240,0.8)] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] hover:bg-[#F1F5F9] cursor-pointer transition-colors"
                              aria-label="View problem statement details"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </button>
                          </div>
                        ) : null}
                      </td>
                    )}

                    {/* ID pill */}
                    <td className="px-6 py-[24.5px] text-center" style={{ width: idWidth }}>
                      <button
                        type="button"
                        onClick={() => setSelectedRow(row)}
                        className="t-content-sm font-semibold! inline-flex items-center justify-center px-5 py-1.5 rounded-full bg-[#EAF1F8] tracking-[0.3px] text-[#1E2F4D] whitespace-nowrap hover:bg-[#DDE8F2] cursor-pointer transition-colors"
                      >
                        {row.idNumber}
                      </button>
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

      {visibleCategories.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-[#60718B]">
          No problem statements match your search.
        </p>
      ) : null}

      <Pagination total={totalPages} current={page} onChange={setPage} />

      {selectedRow ? (
        <ProblemModal
          title={selectedRow.label}
          onClose={() => setSelectedRow(null)}
        >
          {(() => {
            const national = selectedRow as Partial<NationalCategory>;

            return (
              <div className="space-y-4">
                {showPsColumn && national.psTitle ? (
                  <div>
                    <p className="font-semibold text-[#263A56]">
                      Problem Statement
                    </p>
                    <p className="mt-1">{national.psTitle}</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-[#263A56]">Track</p>
                    <p className="mt-1">
                      Open innovation proposal within this category.
                    </p>
                  </div>
                )}

                <div>
                  <p className="font-semibold text-[#263A56]">Category</p>
                  <p className="mt-1">{selectedRow.label}</p>
                </div>

                <div>
                  <p className="font-semibold text-[#263A56]">ID Number</p>
                  <p className="mt-1">{selectedRow.idNumber}</p>
                </div>

                <div className="pt-2">
                  <a
                    href="/team-register"
                    className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#E03137] hover:bg-[#c52a2f] text-white text-sm font-bold transition-colors shadow-sm"
                  >
                    Register for this Challenge
                  </a>
                </div>
              </div>
            );
          })()}
        </ProblemModal>
      ) : null}
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
              </section>

            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}