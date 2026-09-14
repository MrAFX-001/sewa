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
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
    left: 110,
    top: 115,
    width: 216,
    minHeight: 154,
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 6h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-8-2h4v2h-4V4zm8 15H4V8h16v11z" />
        <path d="M10 11h4v2h-4z" />
      </svg>
    ),
  },
  {
    id: "sewa-first",
    title: "Sewa First Motto",
    body: "Imbibe the spirit of Sewa First in service of the nation.",
    surface: "#ebf3ff",
    badge: "#cce1ff",
    ink: "#1e4b88",
    left: 480,
    top: 58,
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
    left: 790,
    top: 145,
    width: 222,
    minHeight: 154,
    icon: iconPath(
      "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z",
    ),
  },
  {
    id: "prototype-funding",
    title: "Prototype Funding",
    body: "Opportunity for support / funding for building prototypes.",
    surface: "#ebf9f1",
    badge: "#caeedb",
    ink: "#1b6b3e",
    left: 170,
    top: 442,
    width: 210,
    minHeight: 146,
    icon: <span className="text-lg font-black leading-none">₹</span>,
  },
  {
    id: "networking",
    title: "Networking",
    body: "Connect with faculty, experts, industry, government and other innovators.",
    surface: "#eaf3fd",
    badge: "#c7defa",
    ink: "#1b5597",
    left: 420,
    top: 442,
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
    left: 672,
    top: 432,
    width: 210,
    minHeight: 146,
    icon: iconPath("M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"),
  },
  {
    id: "confidence",
    title: "Confidence",
    body: "Build confidence, leadership and teamwork skills.",
    surface: "#f4ecfd",
    badge: "#dfcefc",
    ink: "#5e329b",
    left: 928,
    top: 432,
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
    d: "M 125 348 L 74 348 A 12 12 0 0 1 62 336 L 62 202 A 12 12 0 0 1 74 190 L 108 190",
    color: "#f3b467",
    dots: [[74, 348]],
  },
  {
    d: "M 148 438 L 148 480 A 12 12 0 0 0 160 492 L 170 492",
    color: "#7fcaa4",
    dots: [[148, 438]],
  },
  {
    d: "M 508 300 L 580 300 A 14 14 0 0 0 594 286 L 594 220",
    color: "#7baee2",
    dots: [
      [508, 300],
      [594, 216],
    ],
  },
  {
    d: "M 508 322 L 892 322 A 14 14 0 0 0 906 308 L 906 288 A 8 8 0 0 1 914 280 L 916 280",
    color: "#7fcaa4",
    dots: [
      [508, 322],
      [916, 280],
    ],
  },
  {
    d: "M 508 344 L 1022 344 A 14 14 0 0 1 1036 358 L 1036 414",
    color: "#b39ddb",
    dots: [
      [508, 344],
      [1036, 414],
    ],
  },
  {
    d: "M 508 366 L 758 366 A 14 14 0 0 1 772 380 L 772 432",
    color: "#f09696",
    dots: [
      [508, 366],
      [772, 432],
    ],
  },
  {
    d: "M 508 388 L 626 388 A 14 14 0 0 1 640 402 L 640 488 A 12 12 0 0 1 628 500 L 618 500",
    color: "#7fb3e8",
    dots: [
      [508, 388],
      [640, 500],
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
    <div
      ref={frameRef}
      className="diagram-frame"
      style={{ "--diagram-scale": scale } as React.CSSProperties}
      role="img"
      aria-label="Participation Benefits — seven benefits of taking part in SEWA FIRST RYIC 2026"
    >
      <div className="diagram-stage">
        {/* Connector network, drawn under the cards */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          fill="none"
          viewBox="0 0 1200 680"
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
          className="absolute z-20 bg-white rounded-2xl p-6 px-8 soft-card-shadow border border-slate-100 flex flex-col justify-center"
          style={{ left: 95, top: 295, width: 400, height: 132 }}
        >
          <p className="text-3xl font-extrabold tracking-tight text-slate-800 text-left">
            Participation <span className="text-[#0e3b43]">Benefits</span>
          </p>

          <div className="flex h-[3px] w-full rounded-full overflow-hidden mt-3 mb-3 bg-slate-200">
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
            className={`absolute z-20 rounded-2xl p-5 pt-8 soft-card-shadow transition-transform hover:-translate-y-0.5 ${card.centered ? "text-center" : ""}`}
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
              className="text-xs font-black tracking-wide uppercase mb-1.5 leading-snug text-left"
              style={{ color: card.ink, textAlign: card.centered ? "center" : "left" }}
            >
              {card.title}
            </p>
            <p className="text-[11.5px] leading-relaxed text-slate-700 font-medium text-left">
              {card.body}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
