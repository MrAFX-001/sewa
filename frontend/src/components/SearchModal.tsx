import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ExternalLink,
  FileText,
  HelpCircle,
  Layers,
  Mail,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: "Pages" | "Themes" | "Resources" | "Actions";
  href: string;
  keywords: string[];
  external?: boolean;
}

export const SEARCH_ITEMS: SearchItem[] = [
  {
    id: "home",
    title: "Home",
    description: "SEVA 2026 portal landing page, overview, and challenge vision.",
    category: "Pages",
    href: "/",
    keywords: ["home", "main", "start", "landing", "overview", "sewa 2026"],
  },
  {
    id: "about",
    title: "About SEVA FIRST RYIC 2026",
    description:
      "Rashtriya Youth Innovation Challenge vision, DTU partnership, and innovation journey.",
    category: "Pages",
    href: "/about",
    keywords: [
      "about",
      "mission",
      "vision",
      "ryic",
      "dtu",
      "delhi technological university",
      "philosophy",
      "aim",
      "objectives",
    ],
  },
  {
    id: "benefits",
    title: "Guidelines & Participation Benefits",
    description:
      "Eligibility rules, category criteria (School/College/Startups), and prize benefits.",
    category: "Pages",
    href: "/#benefits",
    keywords: [
      "guidelines",
      "rules",
      "eligibility",
      "benefits",
      "prizes",
      "grants",
      "funding",
      "awards",
      "school",
      "college",
    ],
  },
  {
    id: "themes",
    title: "Problem Statements & Themes",
    description:
      "Flagship national challenges and grassroots community innovation problem statements.",
    category: "Themes",
    href: "/problem-statements",
    keywords: ["themes", "problem statements", "udan", "challenges", "topics", "priorities"],
  },
  {
    id: "national-themes",
    title: "Theme 1 - National Level Innovation",
    description:
      "Defence, Space & National Security, AI, Robotics, Manufacturing, Energy, Mobility.",
    category: "Themes",
    href: "/problem-statements#national",
    keywords: [
      "defence",
      "space",
      "security",
      "ai",
      "robotics",
      "energy",
      "infrastructure",
      "mobility",
      "manufacturing",
    ],
  },
  {
    id: "community-themes",
    title: "Theme 2 - Local Community Innovations",
    description: "Agriculture, Healthcare, Rural Dev, Urban Issues, Women Safety, Tourism.",
    category: "Themes",
    href: "/problem-statements#community",
    keywords: [
      "agriculture",
      "rural",
      "healthcare",
      "urban",
      "water",
      "safety",
      "women",
      "tourism",
      "grassroots",
      "sports",
      "khelo india",
      "employment",
      "livelihood",
      "miscellaneous",
    ],
  },
  {
    id: "timeline",
    title: "Innovation Timeline",
    description: "Key dates from September 19 launch through Regional Hubs and DTU Grand Finale.",
    category: "Pages",
    href: "/#timeline",
    keywords: ["timeline", "dates", "schedule", "stages", "deadlines", "grand finale", "september"],
  },
  {
    id: "events",
    title: "Events & Competition Roadmap",
    description:
      "National launch festival at DTU, milestone roadmap, and regional showcase stages.",
    category: "Pages",
    href: "/events",
    keywords: ["events", "roadmap", "hackathon", "launch", "festival", "ceremony", "schedule"],
  },
  {
    id: "resources",
    title: "Additional Resources & Documents",
    description:
      "Download challenge handbooks, official templates, reference PDFs, and external links.",
    category: "Resources",
    href: "/resources",
    keywords: ["resources", "downloads", "documents", "templates", "links", "handbook", "pdf"],
  },
  {
    id: "faq",
    title: "Frequently Asked Questions (FAQ)",
    description: "Questions on team formation, cross-college teams, hostel stays, and evaluation.",
    category: "Pages",
    href: "/faq",
    keywords: [
      "faq",
      "questions",
      "answers",
      "help",
      "queries",
      "rules",
      "accommodation",
      "support",
      "hostel",
      "travel",
    ],
  },
  {
    id: "contact",
    title: "Contact Us & Grievance Redressal",
    description: "Reach DTU coordinator desk, submit evaluation appeals or technical inquiries.",
    category: "Pages",
    href: "/contact",
    keywords: [
      "contact",
      "grievance",
      "support",
      "helpdesk",
      "email",
      "phone",
      "queries",
      "appeal",
    ],
  },
  {
    id: "register",
    title: "Register Your Team",
    description: "Create or join a team, submit innovation ideas, and track participation.",
    category: "Actions",
    href: "/event-register",
    keywords: ["register", "signup", "join", "team", "leader", "apply", "submission"],
  },
  {
    id: "signin",
    title: "Sign In / Portal Login",
    description: "Access your participant dashboard, team roster, and prototype evaluation status.",
    category: "Actions",
    href: "/signin",
    keywords: ["login", "signin", "account", "dashboard", "portal", "profile"],
  },
  {
    id: "directions",
    title: "DTU Delhi Campus Directions",
    description: "Open Google Maps directions to Delhi Technological University, Rohini, Delhi.",
    category: "Actions",
    href: "https://www.google.com/maps/dir//Delhi+Technological+University,+Bawana+Rd,+Shahbad+Daulatpur,+Village+Badli,+Rohini,+Delhi,+110042",
    keywords: [
      "directions",
      "map",
      "location",
      "dtu",
      "campus",
      "how to reach",
      "metro",
      "samaypur badli",
    ],
    external: true,
  },
];

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  // Global ESC and Cmd+K handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Filter items
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_ITEMS;

    return SEARCH_ITEMS.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [query]);

  // Handle arrow key navigation & Enter selection
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filtered[selectedIndex];
      if (target) {
        handleSelect(target);
      }
    }
  };

  const handleSelect = (item: SearchItem) => {
    onClose();
    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
    } else if (item.href.startsWith("/#")) {
      window.location.href = item.href;
    } else if (item.href.includes("#")) {
      // Route + anchor, e.g. "/problem-statements#national" - TanStack Router
      // needs these passed as separate `to` and `hash` values.
      const [to, hash] = item.href.split("#");
      navigate({ to: (to || "/") as any, hash: hash || undefined } as any);
    } else {
      navigate({ to: item.href });
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search SEVA 2026 Portal"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[80vh] animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <Search size={19} className="text-[#ff4d4f] shrink-0 stroke-[2.2]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search pages, problem statements, themes, guidelines..."
            className="w-full bg-transparent text-sm sm:text-[15px] font-medium text-gray-900 placeholder:text-gray-400 outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium text-gray-400 bg-gray-100 rounded border border-gray-200">
              ESC
            </kbd>
          )}
        </div>

        {/* Quick Suggestion Pills when empty */}
        {!query && (
          <div className="px-4 sm:px-5 py-2.5 bg-gray-50/30 border-b border-gray-100 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
            <span className="font-semibold text-gray-400 text-[11px] mr-1">Quick:</span>
            {["Themes", "Guidelines", "Events", "Timeline", "FAQ", "Contact"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setQuery(tag)}
                className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-[#ff4d4f] hover:border-[#ff4d4f]/40 hover:bg-red-50/30 transition-all text-[11px] font-medium cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        <div className="overflow-y-auto p-2 sm:p-2.5 divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-sm font-semibold text-gray-700">
                No results found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching for themes, guidelines, timeline, or FAQs.
              </p>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer group ${
                    isSelected
                      ? "bg-red-50/60 border border-red-100 shadow-2xs"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-[#ff4d4f] text-white"
                        : "bg-gray-100 text-gray-500 group-hover:text-[#ff4d4f] group-hover:bg-red-50"
                    }`}
                  >
                    {item.category === "Pages" && <FileText size={16} strokeWidth={1.8} />}
                    {item.category === "Themes" && <Layers size={16} strokeWidth={1.8} />}
                    {item.category === "Resources" && <Sparkles size={16} strokeWidth={1.8} />}
                    {item.category === "Actions" &&
                      (item.id === "directions" ? (
                        <Navigation size={16} strokeWidth={1.8} />
                      ) : (
                        <ArrowRight size={16} strokeWidth={1.8} />
                      ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#ff4d4f] transition-colors leading-snug">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 font-normal">
                      {item.description}
                    </p>
                  </div>
                  <div className="shrink-0 text-gray-300 group-hover:text-[#ff4d4f] transition-colors self-center">
                    {item.external ? <ExternalLink size={14} /> : <ArrowRight size={14} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer helper */}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium">
          <div className="flex items-center gap-3">
            <span>
              Use{" "}
              <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200 text-gray-500">
                ↑
              </kbd>{" "}
              <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200 text-gray-500">
                ↓
              </kbd>{" "}
              to navigate
            </span>
            <span>
              <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200 text-gray-500">
                ↵
              </kbd>{" "}
              to select
            </span>
          </div>
          <span>SEVA 2026 Portal</span>
        </div>
      </div>
    </div>
  );
}
