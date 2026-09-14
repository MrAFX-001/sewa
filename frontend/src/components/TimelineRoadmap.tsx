import { useEffect, useRef, useState } from "react";

/**
 * Timeline of the 100 Day Journey — six-step roadmap.
 *
 * Like the Participation Benefits diagram, this is laid out on a fixed
 * coordinate space (1400x720) because the pins, stems, node dots, display
 * numbers and text blocks are all positioned against the horizontal bar and
 * must stay registered to each other. The whole stage is scaled as a unit by
 * a ResizeObserver rather than reflowed.
 *
 * Steps alternate: odd steps hang below the bar, even steps sit above it.
 * Each step's text block is offset from its own pin so the six blocks
 * interleave — hence the explicit coordinates. Every block is positioned to
 * sit in the horizontal gap between the two pins on ITS OWN row (pins are
 * 176px wide, centred on nodeLeft), so widths and lefts here are not free
 * parameters: widening a block will push it under a pin.
 */

const STAGE_WIDTH = 1400;
const STAGE_HEIGHT = 700;

/*
 * Geometry in plain pixels. Tailwind's rem-based sizes are NOT safe here: the
 * site sets html{font-size:18px}, so w-44 resolves to 198px, not the 176px the
 * source markup assumed. Inside a fixed coordinate stage that silently breaks
 * the spacing math, so everything below is sized in px.
 */
const PIN = 150;
const PIN_INNER = 108;
const STEM_H = 140;
const STEM_W = 16;
const NODE = 36;
const NODE_INNER = 18;

/** y of the top of the horizontal bar, and its thickness. */
const BAR_TOP = 330;
const BAR_H = 16;

/*
 * Each step is one column: the pin hangs on one side of the bar and the step's
 * text sits directly opposite, both centred on the same x. Consecutive steps
 * alternate sides, so every row carries pins and text in turn and a text block
 * only ever has to clear its NEIGHBOURS' pins.
 *
 * With six evenly spaced nodes the gap between them is 233px, so a text block
 * and a neighbouring pin need half-widths summing to less than that:
 *   PIN/2 + TEXT_W/2 = 75 + 110 = 185 < 233, leaving 48px of clearance.
 * Widening either constant past that pushes text under a pin.
 */
const TEXT_W = 220;

/*
 * The bar is six equal colour segments and each step's node sits at the centre
 * of its own segment. Deriving both from the index keeps the colour changes
 * evenly spaced — the hand-written segment widths this replaces (20/17/21/18/
 * 13/11) never lined up with the node positions, so the bands read as uneven.
 */
const COLUMNS = 6;
const nodeLeft = (i: number) => `${((i + 0.5) / COLUMNS) * 100}%`;

/** Where the pin badge starts, by side. */
const PIN_TOP_ABOVE = BAR_TOP - STEM_H - PIN;
const PIN_TOP_BELOW = BAR_TOP + BAR_H;

/*
 * Gap between the bar and the nearest edge of a text block. Blocks below the
 * bar are anchored by their top edge; blocks above it are anchored by their
 * BOTTOM edge, so both sit the same distance from the bar no matter how many
 * lines they run to. Anchoring the upper blocks by `top` instead would leave
 * a ragged gap that grows with every line removed.
 */
const TEXT_GAP = 26;
const TEXT_BOTTOM_ABOVE = STAGE_HEIGHT - BAR_TOP + TEXT_GAP;
const TEXT_TOP_BELOW = BAR_TOP + BAR_H + TEXT_GAP;

/** Large display number, tucked beside its own stem. */
const NUMBER_TOP_ABOVE = BAR_TOP - STEM_H + 40;
const NUMBER_TOP_BELOW = BAR_TOP + BAR_H + 40;

type Step = {
  number: string;
  title: string;
  dates: string;
  body: string;
  color: string;
  /** Whether the pin hangs below the bar or sits above it. */
  side: "below" | "above";
  icon: React.ReactNode;
};

const stroke = {
  fill: "none" as const,
  stroke: "currentColor" as const,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  className: "text-black stroke-[2.2]",
  width: 64,
  height: 64,
};

const steps: Step[] = [
  {
    number: "01",
    title: "Ideate",
    dates: "Days 1–15 • 15 Sep – 1 Oct 2026",
    body: "Launch of 50 National Problem Statements, online orientation, team registrations, and idea submissions.",
    color: "#F25C22",
    side: "below",
    icon: (
      <svg {...stroke}>
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Screen",
    dates: "Days 16–30 • 2 – 16 Oct 2026",
    body: "Preliminary eligibility scrutiny, regional screening, and announcement of shortlisted teams.",
    color: "#EFA00B",
    side: "above",
    icon: (
      <svg {...stroke}>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Build",
    dates: "Days 31–60 • 17 Oct – 15 Nov 2026",
    body: "Expert bootcamps, laboratory/maker-space access, design reviews, and working prototype fabrication.",
    color: "#48BF43",
    side: "below",
    icon: (
      <svg {...stroke}>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Validate",
    dates: "Days 61–80 • 16 Nov – 5 Dec 2026",
    body: "Technical benchmarking, safety/reliability testing, and performance validation.",
    color: "#00B4D8",
    side: "above",
    icon: (
      <svg {...stroke}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    number: "05",
    title: "Test",
    dates: "Days 81–95 • 6 – 20 Dec 2026",
    body: "Field demonstrations in real environments, usability testing, and cost/sustainability reviews.",
    color: "#0077B6",
    side: "below",
    icon: (
      <svg {...stroke}>
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    ),
  },
  {
    number: "06",
    title: "Select",
    dates: "Days 96–100 • 21 – 25 Dec 2026",
    body: "Final report submissions and Regional Jury evaluations to nominate finalists for Delhi.",
    color: "#7B2CBF",
    side: "above",
    icon: (
      <svg {...stroke}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
];

function Pin({ step, index }: { step: Step; index: number }) {
  const badge = (
    <div
      className="rounded-full flex items-center justify-center pin-shadow relative transition-transform duration-300 hover:scale-105"
      style={{ width: PIN, height: PIN, backgroundColor: step.color }}
    >
      <div
        className="rounded-full bg-white flex items-center justify-center inner-circle-shadow"
        style={{ width: PIN_INNER, height: PIN_INNER }}
      >
        {step.icon}
      </div>
    </div>
  );

  const stem = <div style={{ width: STEM_W, height: STEM_H, backgroundColor: step.color }} />;

  return (
    <div
      className="absolute -translate-x-1/2 z-20 flex flex-col items-center"
      style={{ left: nodeLeft(index), top: step.side === "below" ? PIN_TOP_BELOW : PIN_TOP_ABOVE }}
    >
      {step.side === "below" ? (
        <>
          {stem}
          <div className="-mt-1">{badge}</div>
        </>
      ) : (
        <>
          <div className="-mb-1">{badge}</div>
          {stem}
        </>
      )}
    </div>
  );
}

export function TimelineRoadmap() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new ResizeObserver(([entry]) => {
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
      aria-label="Timeline of the 100 day journey: Ideate, Screen, Build, Validate, Test, Select"
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
        {/* Continuous segmented bar */}
        <div className="absolute left-0 w-full flex z-10" style={{ top: BAR_TOP, height: BAR_H }}>
          {steps.map((step) => (
            <div
              key={step.number}
              className="h-full"
              style={{ width: `${100 / COLUMNS}%`, backgroundColor: step.color }}
            />
          ))}
        </div>

        {/* Node dots on the bar */}
        {steps.map((step, i) => (
          <div
            key={`node-${step.number}`}
            className="absolute -translate-x-1/2 z-30 flex flex-col items-center"
            style={{ left: nodeLeft(i), top: BAR_TOP + BAR_H / 2 - NODE / 2 }}
          >
            <div
              className="rounded-full flex items-center justify-center shadow-md"
              style={{ width: NODE, height: NODE, backgroundColor: step.color }}
            >
              <div className="rounded-full bg-white node-dot-shadow" style={{ width: NODE_INNER, height: NODE_INNER }} />
            </div>
          </div>
        ))}

        {/* Pins and stems */}
        {steps.map((step, i) => (
          <Pin key={`pin-${step.number}`} step={step} index={i} />
        ))}

        {/* Large display numbers */}
        {steps.map((step, i) => (
          <div
            key={`num-${step.number}`}
            className="absolute z-20 select-none pointer-events-none"
            style={{
              left: `calc(${nodeLeft(i)} + ${STEM_W / 2 + 12}px)`,
              top: step.side === "below" ? NUMBER_TOP_BELOW : NUMBER_TOP_ABOVE,
            }}
          >
            <span
              className="font-black tracking-tight"
              style={{ color: step.color, fontSize: 38, lineHeight: 1 }}
            >
              {step.number}
            </span>
          </div>
        ))}

        {/* Text blocks */}
        {steps.map((step, i) => (
          <div
            key={`text-${step.number}`}
            className="absolute z-40 -translate-x-1/2 text-center [hyphens:none]"
            style={
              step.side === "below"
                ? { left: nodeLeft(i), bottom: TEXT_BOTTOM_ABOVE, width: TEXT_W }
                : { left: nodeLeft(i), top: TEXT_TOP_BELOW, width: TEXT_W }
            }
          >
            <p
              className="flex items-center justify-center gap-2 text-center font-black tracking-tight text-[#0f172a] uppercase [hyphens:none]"
              style={{ fontSize: 27, lineHeight: 1.2 }}
            >
              <span style={{ color: step.color }}>{step.number}</span>
              {step.title}
            </p>
            <p
              className="mt-1 text-center font-bold text-slate-800 [hyphens:none]"
              style={{ fontSize: 15.5, lineHeight: 1.4 }}
            >
              {step.dates}
            </p>
            <p
              className="mt-1.5 text-center font-medium text-slate-700 [hyphens:none]"
              style={{ fontSize: 18, lineHeight: 1.5 }}
            >
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
