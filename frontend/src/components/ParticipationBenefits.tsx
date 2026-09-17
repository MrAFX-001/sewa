import { useEffect, useRef, useState } from "react";

/**
 * Participation Benefits — node-network diagram.
 *
 * Laid out on a fixed 1200x680 coordinate space so the SVG connector paths
 * line up with the absolutely positioned cards. The whole stage is scaled as
 * a unit to fit its container, which keeps the connectors registered to the
 * cards at every width.
 *
 * The scale factor has to be measured in JS: CSS transform: scale() takes a
 * unitless number, and calc() cannot divide a container width by a length to
 * produce one. A ResizeObserver writes the ratio to --diagram-scale, which
 * .diagram-stage consumes (see styles.css).
 */

type BenefitCard = {
  id: string;
  title: string;
  body: string;
  /** Card background. */
  surface: string;
  /** Icon badge background. */
  badge: string;
  /** Title and icon colour. */
  ink: string;
  left: number;
  top: number;
  width: number;
  minHeight: number;
  centered?: boolean;
  icon: React.ReactNode;
};

const iconPath = (d: string) => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);

const cards: BenefitCard[] = [
  {
    id: "career",
    title: "Career & Entrepreneurship",
    body: "Create pathways for future careers, inclusion and entrepreneurship opportunities.",
    surface: "#fff6ea",
    badge: "#f7e1be",
    ink: "#b4691e",
    left: 131,
    top: 59,
    width: 216,
    minHeight: 166,
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 6h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-8-2h4v2h-4V4zm8 15H4V8h16v11z" />
        <path d="M10 11h4v2h-4z" />
      </svg>
    ),
  },
  {
    id: "sewa-first",
    title: "Seva First Motto",
    body: "Imbibe the spirit of Seva First in service of the nation.",
    surface: "#ebf3ff",
    badge: "#cce1ff",
    ink: "#1e4b88",
    left: 501,
    top: 59,
    width: 228,
    minHeight: 140,
    centered: true,
    icon: iconPath("M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"),
  },
  {
    id: "problem-solving",
    title: "Problem-Solving",
    body: "Develop innovation and problem-solving skills in service of the local community.",
    surface: "#eaf8ee",
    badge: "#c7eed2",
    ink: "#1f6e3c",
    left: 811,
    top: 146,
    width: 222,
    minHeight: 154,
    icon: iconPath(
      "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z",
    ),
  },
  {
    id: "prototype-funding",
    title: "Prize Pool",
    body: "Opportunity for support / funding for building prototypes. Award is up to ₹2 Cr.",
    surface: "#ebf9f1",
    badge: "#caeedb",
    ink: "#1b6b3e",
    left: 191,
    top: 488,
    width: 210,
    minHeight: 156,
    icon: <span className="text-xl font-black leading-none">₹</span>,
  },
  {
    id: "networking",
    title: "Networking",
    body: "Connect with faculty, experts, industry, government and other innovators.",
    surface: "#eaf3fd",
    badge: "#c7defa",
    ink: "#1b5597",
    left: 441,
    top: 488,
    width: 210,
    minHeight: 146,
    icon: iconPath(
      "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z",
    ),
  },
  {
    id: "recognition",
    title: "Recognition",
    body: "Gain national visibility, recognition and exposure.",
    surface: "#fdecef",
    badge: "#fad2d9",
    ink: "#9e3346",
    left: 693,
    top: 478,
    width: 210,
    minHeight: 146,
    icon: iconPath(
      "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
    ),
  },
  {
    id: "confidence",
    title: "Confidence",
    body: "Build confidence, leadership and teamwork skills.",
    surface: "#f4ecfd",
    badge: "#dfcefc",
    ink: "#5e329b",
    left: 949,
    top: 478,
    width: 210,
    minHeight: 146,
    icon: iconPath(
      "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    ),
  },
];

/** Connector paths, in the same 1200x680 coordinate space as the cards. */
const connectors: { d: string; color: string; dots: [number, number][] }[] = [
  {
    d: "M 103.7 348 H 95.55 C 88.94 348 83.58 342.62 83.58 336.01 V 145.37 C 83.58 138.76 88.94 133.4 95.55 133.4 H 140",
    color: "#F3B467",
    dots: [[103.7, 348]],
  },
  {
    d: "M 169.3 437.7 V 524.6 A 12 12 0 0 0 181.3 536.6 H 191",
    color: "#7FCAA4",
    dots: [[169.3, 437.7]],
  },
  {
    d: "M 528.3 300.1 H 600 A 14 14 0 0 0 614 286.2 V 199",
    color: "#7BAEE2",
    dots: [
      [528.3, 300.1],
      [614, 199],
    ],
  },
  {
    d: "M 528.3 322 H 911.1 A 14 14 0 0 0 925.1 308.1 V 288.2 A 8 8 0 0 1 933.1 280.2 H 935",
    color: "#7FCAA4",
    dots: [
      [528.3, 322],
      [935, 280.2],
    ],
  },
  {
    d: "M 528.3 344 H 1040.8 A 14 14 0 0 1 1054.7 358 V 478",
    color: "#B39DDB",
    dots: [
      [528.3, 344],
      [1054.7, 458.8],
    ],
  },
  {
    d: "M 528.3 365.9 H 777.5 A 14 14 0 0 1 791.5 379.9 V 478",
    color: "#F09696",
    dots: [
      [528.3, 365.9],
      [791.5, 476.7],
    ],
  },
  {
    d: "M 528.3 387.9 H 645.9 A 14 14 0 0 1 659.9 401.8 V 532.6 A 12 12 0 0 1 647.9 544.5 H 641",
    color: "#7FB3E8",
    dots: [
      [528.3, 387.9],
      [651, 544.5],
    ],
  },
];

/** Native coordinate space the cards and connectors are positioned in. */
const STAGE_WIDTH = 1200;

export function ParticipationBenefits() {
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
    <div className="w-full">
      {/* Mobile / Tablet Responsive Layout (< 1024px) */}
      <div className="block lg:hidden">
        {/* Central label card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 soft-card-shadow border border-slate-100 mb-6">
          <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 text-center sm:text-left [hyphens:none]">
            Participation <span className="text-[#0e3b43]">Benefits</span>
          </p>

          <div className="flex h-[3.5px] w-full rounded-full overflow-hidden mt-3.5 mb-4 bg-slate-200">
            <div className="w-[32%] bg-[#e58a2d]" />
            <div className="w-[28%] bg-[#4fa77f]" />
            <div className="w-[40%] bg-[#0e3b43]" />
          </div>

          <div className="text-[11px] sm:text-xs font-bold text-slate-700 tracking-wider flex items-center justify-between uppercase">
            <span>Learn</span>
            <span className="text-slate-300 font-normal">|</span>
            <span>Connect</span>
            <span className="text-slate-300 font-normal">|</span>
            <span>Create</span>
            <span className="text-slate-300 font-normal">|</span>
            <span>Make an Impact</span>
          </div>
        </div>

        {/* Benefit cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {cards.map((card) => (
            <article
              key={card.id}
              className="rounded-2xl p-5 sm:p-6 soft-card-shadow border border-slate-100/80 flex items-start gap-4 transition-transform hover:-translate-y-0.5 sm:last:col-span-2 sm:last:max-w-md sm:last:w-full sm:last:mx-auto"
              style={{ backgroundColor: card.surface }}
            >
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full shrink-0 flex items-center justify-center badge-shadow"
                style={{ backgroundColor: card.badge, color: card.ink }}
              >
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm sm:text-base font-black tracking-wide uppercase mb-1.5 leading-snug text-left [hyphens:none]"
                  style={{ color: card.ink }}
                >
                  {card.title}
                </p>
                <p className="text-sm sm:text-[15px] leading-relaxed text-slate-700 font-medium text-left [hyphens:none]">
                  {card.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Desktop Network Diagram (>= 1024px) */}
      <div
        ref={frameRef}
        className="hidden lg:block diagram-frame"
        style={{ "--diagram-scale": scale } as React.CSSProperties}
        role="img"
        aria-label="Participation Benefits — seven benefits of taking part in SEVA FIRST RYIC 2026"
      >
        <div className="diagram-stage">
          {/* Connector network, drawn under the cards */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            fill="none"
            viewBox="0 0 1200 740"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {connectors.map((c, i) => (
              <g key={i}>
                <path
                  d={c.d}
                  stroke={c.color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />
                {c.dots.map(([cx, cy], j) => (
                  <circle key={j} cx={cx} cy={cy} r="4.5" fill={c.color} />
                ))}
              </g>
            ))}
          </svg>

          {/* Central label card */}
          <div
            className="absolute z-20 bg-white rounded-2xl p-6 px-7 soft-card-shadow border border-slate-100 flex flex-col justify-center"
            style={{ left: 116, top: 296, width: 400, height: 132 }}
          >
            <p className="text-3xl sm:text-[32px] font-extrabold tracking-tight text-slate-800 text-left [hyphens:none]">
              Participation <span className="text-[#0e3b43]">Benefits</span>
            </p>

            <div className="flex h-[3.5px] w-full rounded-full overflow-hidden mt-3 mb-3 bg-slate-200">
              <div className="w-[32%] bg-[#e58a2d]" />
              <div className="w-[28%] bg-[#4fa77f]" />
              <div className="w-[40%] bg-[#0e3b43]" />
            </div>

            <div className="text-[11px] font-bold text-slate-700 tracking-wider flex items-center justify-between uppercase">
              <span>Learn</span>
              <span className="text-slate-300 font-normal">|</span>
              <span>Connect</span>
              <span className="text-slate-300 font-normal">|</span>
              <span>Create</span>
              <span className="text-slate-300 font-normal">|</span>
              <span>Make an Impact</span>
            </div>
          </div>

          {/* Benefit cards */}
          {cards.map((card) => (
            <article
              key={card.id}
              className={`absolute z-20 rounded-2xl p-5 pt-8 soft-card-shadow transition-transform hover:-translate-y-0.5 [hyphens:none] ${card.centered ? "text-center" : ""}`}
              style={{
                left: card.left,
                top: card.top,
                width: card.width,
                minHeight: card.minHeight,
                backgroundColor: card.surface,
              }}
            >
              <div
                className="icon-badge badge-shadow"
                style={{ backgroundColor: card.badge, color: card.ink }}
              >
                {card.icon}
              </div>
              <p
                className="text-[13.5px] sm:text-sm font-black tracking-wide uppercase mb-1.5 leading-snug text-left [hyphens:none]"
                style={{ color: card.ink, textAlign: card.centered ? "center" : "left" }}
              >
                {card.title}
              </p>
              <p
                className="text-[12.5px] sm:text-[13px] leading-relaxed text-slate-700 font-medium text-left [hyphens:none]"
                style={{ textAlign: card.centered ? "center" : "left" }}
              >
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
