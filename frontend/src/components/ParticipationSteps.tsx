import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * How to participate — six-step alternating roadmap.
 *
 * Same construction as TimelineRoadmap: a fixed coordinate stage scaled to fit
 * its container by a ResizeObserver, with the six steps derived from one data
 * array instead of six near-identical markup blocks.
 *
 * Steps alternate sides of the bar. Each column is centred on its own node, so
 * a step's node, connector, icon and text all share one x — nothing is placed
 * by hand.
 */

const STAGE_WIDTH = 1400;
const STAGE_HEIGHT = 760;

/*
 * Sizes in plain pixels, not Tailwind's rem scale: the site sets
 * html{font-size:18px}, so every rem-based size would render 1.125x larger
 * than intended and quietly break the spacing inside a fixed stage.
 */
const BAR_TOP = 380;
const BAR_H = 16;
const NODE = 56;
const STEM_H = 70;
const STEM_W = 4;
const ICON = 78;
const TEXT_W = 226;

/*
 * Each side of the bar has to hold the tallest column: connector + icon ring +
 * title + body. At 21/18px type that is about 353px for step 06, so BAR_TOP and
 * STAGE_HEIGHT are set to leave 380px each way. Growing the type again means
 * growing both.
 */
const COLUMNS = 6;
/** Each step's node sits at the centre of its own equal colour segment. */
const nodeLeft = (i: number) => `${((i + 0.5) / COLUMNS) * 100}%`;

type Step = {
  number: string;
  title: string;
  body: string;
  color: string;
  /** Which side of the bar this step's content hangs on. */
  side: "below" | "above";
  icon: ReactNode;
};

const icon = (children: ReactNode) => (
  <svg
    className="w-full h-full"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const steps: Step[] = [
  {
    number: "01",
    title: "Check Eligibility",
    body: "Confirm your eligibility and select the appropriate regional or participation category.",
    color: "#E85929",
    side: "below",
    icon: icon(
      <>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="m9 14 2 2 4-4" />
        <path d="M9 10h6" />
      </>,
    ),
  },
  {
    number: "02",
    title: "Select Innovation Track",
    body: "Choose either National Level Innovation or Local Community Level Innovation.",
    color: "#F1A914",
    side: "above",
    icon: icon(
      <>
        <path d="M12 2v20" />
        <path d="M18 10H6a1 1 0 0 1-.8-.4l-2.5-3 2.5-3A1 1 0 0 1 6 4h12a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1z" />
        <path d="M6 20h12a1 1 0 0 0 .8-.4l2.5-3-2.5-3A1 1 0 0 0 18 13H6a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1z" />
      </>,
    ),
  },
  {
    number: "03",
    title: "Select Theme",
    body: "Choose the theme that best matches the challenge you wish to address.",
    color: "#76B82A",
    side: "below",
    icon: icon(
      <>
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </>,
    ),
  },
  {
    number: "04",
    title: "Select Problem Statement",
    body: "Select a specific problem statement from the list available under the chosen theme. You may also propose a relevant problem, where permitted.",
    color: "#0FB5B3",
    side: "above",
    icon: icon(
      <>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <circle cx="11.5" cy="14.5" r="2.5" />
        <path d="m13.5 16.5 2 2" />
      </>,
    ),
  },
  {
    number: "05",
    title: "Form Your Team",
    body: "Create your team and designate a Team Leader.",
    color: "#2368B2",
    side: "below",
    icon: icon(
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>,
    ),
  },
  {
    number: "06",
    title: "Submit Innovation Proposal",
    body: "Describe the problem, proposed solution, innovation, technology, beneficiaries, feasibility and expected impact.",
    color: "#6C2582",
    side: "above",
    icon: icon(
      <>
        <rect width="18" height="12" x="3" y="4" rx="2" />
        <line x1="2" x2="22" y1="20" y2="20" />
        <path d="m14 9-2 5 1.5-1 1.5 2 1-1-1.5-2L16 11z" fill="currentColor" stroke="none" />
      </>,
    ),
  },
];

function StepColumn({ step, index }: { step: Step; index: number }) {
  const stem = <div style={{ width: STEM_W, height: STEM_H, backgroundColor: step.color }} />;

  const ring = (
    <div
      className="rounded-full bg-white shadow-sm flex items-center justify-center shrink-0"
      style={{
        width: ICON,
        height: ICON,
        border: `3.5px solid ${step.color}`,
        color: step.color,
        padding: 18,
      }}
    >
      {step.icon}
    </div>
  );

  const text = (
    <>
      <p
        className="mt-3 text-center font-extrabold uppercase tracking-tight [hyphens:none]"
        style={{ color: step.color, fontSize: 21, lineHeight: 1.25 }}
      >
        {step.number} {step.title}
      </p>
      <p
        className="mt-1.5 text-center font-medium text-slate-600 [hyphens:none]"
        style={{ fontSize: 18, lineHeight: 1.5 }}
      >
        {step.body}
      </p>
    </>
  );

  return (
    <div
      className="absolute -translate-x-1/2 z-20 flex flex-col items-center"
      style={
        step.side === "below"
          ? { left: nodeLeft(index), top: BAR_TOP + BAR_H / 2, width: TEXT_W }
          : {
              left: nodeLeft(index),
              bottom: STAGE_HEIGHT - BAR_TOP - BAR_H / 2,
              width: TEXT_W,
            }
      }
    >
      {step.side === "below" ? (
        <>
          {stem}
          {ring}
          {text}
        </>
      ) : (
        <>
          {text}
          {ring}
          {stem}
        </>
      )}
    </div>
  );
}

export function ParticipationSteps() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const width = entry.contentRect.width;
      if (width > 0) setScale(width / STAGE_WIDTH);
    });

    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      className="w-full overflow-hidden"
      style={{ aspectRatio: `${STAGE_WIDTH} / ${STAGE_HEIGHT}` }}
      role="img"
      aria-label="How to participate: check eligibility, select innovation track, select theme, select problem statement, form your team, submit innovation proposal"
    >
      <div
        className="relative select-none"
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}
      >
        {/* Continuous bar: six equal colour segments */}
        <div
          className="absolute left-0 w-full flex z-0 rounded-full overflow-hidden shadow-sm"
          style={{ top: BAR_TOP, height: BAR_H }}
        >
          {steps.map((step) => (
            <div
              key={step.number}
              className="h-full"
              style={{ width: `${100 / COLUMNS}%`, backgroundColor: step.color }}
            />
          ))}
        </div>

        {/* Number pills, centred on the bar */}
        {steps.map((step, i) => (
          <div
            key={`node-${step.number}`}
            className="absolute -translate-x-1/2 z-30 rounded-full text-white flex items-center justify-center font-extrabold shadow-md"
            style={{
              left: nodeLeft(i),
              top: BAR_TOP + BAR_H / 2 - NODE / 2,
              width: NODE,
              height: NODE,
              backgroundColor: step.color,
              border: "5px solid #ffffff",
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            {step.number}
          </div>
        ))}

        {/* Connector, icon and text, alternating sides */}
        {steps.map((step, i) => (
          <StepColumn key={`col-${step.number}`} step={step} index={i} />
        ))}
      </div>
    </div>
  );
}
