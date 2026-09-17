import { Fragment, type ReactNode } from "react";

/**
 * Objectives — ten-step vertical roadmap.
 *
 * Replaces the flat objective.svg on the About page, so the icons and copy
 * are editable.
 *
 * Unlike the timeline and benefits diagrams this is an ordinary flow layout,
 * so it reflows naturally and needs no scaling.
 *
 * Card titles and body copy both come from the type scale, at the same
 * t-content font-size — the title stays bold for hierarchy, but matches
 * the body's actual size rather than being scaled down or up.
 *
 * The badge sizes below are in explicit pixels rather than Tailwind's
 * rem scale, because the site sets html{font-size:18px} and every rem-based
 * size would render 1.125x larger than the source design intended.
 */

const BADGE = 56;
const ICON = 24;

type Objective = {
  number: string;
  title: string;
  body: string;
  /** Number badge fill. */
  numberBg: string;
  /** Number and icon colour. */
  ink: string;
  /** Icon badge fill. */
  iconBg: string;
  icon: ReactNode;
};

const svg = (children: ReactNode, strokeWidth = 2) => (
  <svg
    width={ICON}
    height={ICON}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const objectives: Objective[] = [
  {
    number: "01",
    title: "Problem Identification",
    body: "Encourage young people to identify genuine problems and unmet needs in their local communities.",
    numberBg: "#e0f2fe",
    ink: "#0369a1",
    iconBg: "#f0f9ff",
    icon: svg(
      <>
        <circle cx="11" cy="11" r="7" />
        <line x1="16.65" x2="21" y1="16.65" y2="21" />
      </>,
      2.2,
    ),
  },
  {
    number: "02",
    title: "Local-to-National Innovation",
    body: "Enable solutions emerging from local problems to address similar challenges.",
    numberBg: "#dcfce7",
    ink: "#15803d",
    iconBg: "#f0fdf4",
    icon: svg(
      <>
        <path d="M12 21c-4.97-4.97-8-8.5-8-12a8 8 0 1 1 16 0c0 3.5-3.03 7.03-8 12z" />
        <circle cx="12" cy="9" r="2.5" />
      </>,
    ),
  },
  {
    number: "03",
    title: "Innovation & Creativity",
    body: "Encourage youth to develop novel approaches using science, technology, engineering, and design.",
    numberBg: "#fef3c7",
    ink: "#d97706",
    iconBg: "#fffbeb",
    // The source path for this bulb was malformed: its arc flags produced a
    // lopsided outline that did not close, and the ray lines overlapped it.
    // Replaced with a clean bulb matching the one used on the timeline.
    icon: svg(
      <>
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </>,
    ),
  },
  {
    number: "04",
    title: "Solution Development",
    body: "Move participants beyond conceptual ideas towards design, development, and implementation.",
    numberBg: "#ffe4e6",
    ink: "#e11d48",
    iconBg: "#fff1f2",
    icon: svg(
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>,
    ),
  },
  {
    number: "05",
    title: "Prototype Creation",
    body: "Require promising solutions to culminate in working prototypes or proof-of-concepts.",
    numberBg: "#ede9fe",
    ink: "#7c3aed",
    iconBg: "#f5f3ff",
    icon: svg(
      <>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" x2="12" y1="22.08" y2="12" />
      </>,
    ),
  },
  {
    number: "06",
    title: "Sustainability & Affordability",
    body: "Promote solutions that are environmentally sustainable, viable, and affordable.",
    numberBg: "#ccfbf1",
    ink: "#0d9488",
    iconBg: "#f0fdfa",
    icon: svg(
      <>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6" />
      </>,
    ),
  },
  {
    number: "07",
    title: "Implementation Pathway",
    body: "Require innovators to define the resources, cost, timeline, and arrangements necessary.",
    numberBg: "#dcfce7",
    ink: "#16a34a",
    iconBg: "#f0fdf4",
    icon: svg(
      <>
        <line x1="18" x2="18" y1="20" y2="4" />
        <line x1="12" x2="12" y1="20" y2="10" />
        <line x1="6" x2="6" y1="20" y2="16" />
      </>,
      2.2,
    ),
  },
  {
    number: "08",
    title: "Mentoring & Support",
    body: "Connect young innovators with faculty, experts, industry, and support institutions.",
    numberBg: "#ffedd5",
    ink: "#c2410c",
    iconBg: "#fff7ed",
    icon: svg(
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>,
    ),
  },
  {
    number: "09",
    title: "Field Validation",
    body: "Facilitate testing and validation of promising solutions in real or representative environments.",
    numberBg: "#e0e7ff",
    ink: "#4338ca",
    iconBg: "#eef2ff",
    icon: svg(
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" x2="15" y1="13" y2="13" />
        <line x1="9" x2="13" y1="17" y2="17" />
      </>,
    ),
  },
  {
    number: "10",
    title: "Innovation-to-Impact",
    body: "Create a pathway for successful innovations to be scaled and create real-world impact.",
    numberBg: "#fce7f3",
    ink: "#be185d",
    iconBg: "#fdf2f8",
    icon: svg(
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
        <line x1="17.5" x2="22" y1="6.5" y2="2" />
        <line x1="19" x2="22" y1="2" y2="2" />
        <line x1="22" x2="22" y1="2" y2="5" />
      </>,
    ),
  },
];

const downArrow = (
  <div aria-hidden="true" className="objectives-arrow flex w-full justify-center py-1.5">
    <svg
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      className="text-slate-400"
    >
      <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  </div>
);

export function ObjectivesRoadmap() {
  return (
    <div className="w-full">
      {/* Mobile View (< 640px) */}
      <div className="block sm:hidden space-y-3">
        {objectives.map((item, i) => (
          <div key={item.number} className="space-y-3">
            <div className="roadmap-card p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-2.5">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm shadow-2xs"
                  style={{ backgroundColor: item.numberBg, color: item.ink }}
                >
                  {item.number}
                </span>
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl border shadow-2xs"
                  style={{
                    backgroundColor: item.iconBg,
                    borderColor: item.numberBg,
                    color: item.ink,
                  }}
                >
                  {item.icon}
                </span>
                <h3 className="font-bold text-[15px] sm:text-base text-[#0f172a] leading-snug [hyphens:none]">
                  {item.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-[#475569] [hyphens:none]">
                {item.body}
              </p>
            </div>

            {i < objectives.length - 1 && (
              <div aria-hidden="true" className="flex justify-center py-0.5 text-slate-400">
                <svg
                  width={18}
                  height={18}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop / Tablet View (>= 640px) */}
      <div className="hidden sm:grid objectives-grid w-full">
        {objectives.map((item, i) => (
          <Fragment key={item.number}>
            {/* Number badge */}
            <div
              className="flex shrink-0 items-center justify-center rounded-full"
              style={{ width: BADGE, height: BADGE, backgroundColor: item.numberBg }}
            >
              <span
                className="font-bold tracking-tight"
                style={{ color: item.ink, fontSize: 19, lineHeight: 1 }}
              >
                {item.number}
              </span>
            </div>

            {/* Icon badge */}
            <div
              className="flex shrink-0 items-center justify-center rounded-full border"
              style={{
                width: BADGE,
                height: BADGE,
                backgroundColor: item.iconBg,
                borderColor: item.numberBg,
                color: item.ink,
              }}
            >
              {item.icon}
            </div>

            {/* Content card */}
            <div className="roadmap-card px-5 py-5 sm:px-6">
              <h3 className="t-content font-bold! mb-2 text-left tracking-tight text-[#0f172a] [hyphens:none]">
                {item.title}
              </h3>
              <p className="t-content text-left text-[#475569] [hyphens:none]">
                {item.body}
              </p>
            </div>

            {i < objectives.length - 1 && downArrow}
          </Fragment>
        ))}
      </div>
    </div>
  );
}



