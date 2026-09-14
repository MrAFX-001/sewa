import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BarChart3,
  BoxSelect,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  EyeOff,
  ExternalLink,
  Facebook,
  FileEdit,
  FileText,
  Instagram,
  Mail,
  Map,
  MapPin,
  Phone,
  Play,
  Search,
  Send,
  ShieldCheck,
  Twitter,
  UploadCloud,
  User,
  Server,
  X,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ApiError, authApi, contactApi, announcementsApi, CONTACT_CATEGORIES, type ContactCategory, type Announcement } from "../lib/api";
import { useAuth } from "../lib/auth";
import campusImage from "../assets/dtu-campus-aerial.jpeg";
import campus2Image from "../assets/campus2.jpeg";
import campus3Image from "../assets/campus3.jpg";
import campus4Image from "../assets/campus4.jpeg";
import studentsImage from "../assets/sewa-students.jpg";
import dtuLogo from "../assets/dtu_logo.png";
import footerImage from "../assets/footer.jpeg";
import satymevjayteLogo from "../assets/satymevjayte.svg";
import govtofnctLogo from "../assets/govtofnctdelhi.svg";
import sewaLogo from "../assets/sewalogo.svg";
import sewaWhiteLogo from "../assets/sewawhite.svg";
import uniqueFeaturesSvg from "../assets/unique_features.svg";
import { InnovationJourney } from "./InnovationJourney";
import { ObjectivesRoadmap } from "./ObjectivesRoadmap";
import { ParticipationBenefits } from "./ParticipationBenefits";
import { SearchModal } from "./SearchModal";
import { TimelineRoadmap } from "./TimelineRoadmap";

const heroImages = [
  {
    src: campusImage,
    alt: "Delhi Technological University campus aerial view",
  },
  {
    src: campus2Image,
    alt: "Delhi Technological University campus view 2",
  },
  {
    src: campus3Image,
    alt: "Delhi Technological University campus view 3",
  },
  {
    src: campus4Image,
    alt: "Delhi Technological University campus view 4",
  },
];

export function Brand() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 sm:gap-2.5 group select-none shrink-0"
      aria-label="SEWA 2026 home"
    >
      {/* 1. Indian Satyamev Jayate Emblem */}
      <img
        src={satymevjayteLogo}
        alt="Satyamev Jayate"
        className="h-9 sm:h-11 md:h-13 w-auto object-contain shrink-0 dark:invert -mr-1 sm:-mr-1.5 md:-mr-2"
      />

      {/* 2. Text of Govt of National Capital Territory of Delhi */}
      <img
        src={govtofnctLogo}
        alt="Government of National Capital Territory of Delhi"
        className="h-[25px] sm:h-[30px] md:h-[34px] w-auto object-contain shrink dark:invert"
      />

      {/* 3. DTU Logo */}
      <img
        src={dtuLogo}
        alt="Delhi Technological University"
        className="size-9 sm:size-12 md:size-13 object-contain shrink-0 mr-2 sm:mr-3 md:mr-4"
      />

      {/* 4. SEWA Logo */}
      <img
        src={sewaLogo}
        alt="SEWA"
        className="h-9 sm:h-11 md:h-13 w-auto object-contain shrink-0"
      />
    </Link>
  );
}

export function Header({ activeNav = "home" }: { activeNav?: "home" | "events" | "guidelines" | "about" | "problems" | "contact" | "faq" | "resources" | "signin" | "signup" | "team-register" | string } = {}) {
  const { user, isSignedIn, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    announcementsApi
      .list()
      .then((items) => setLatestAnnouncement(items[0] ?? null))
      .catch(() => {
        // Keep the ticker available even if the public announcements endpoint is unavailable.
      });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Global Ctrl+K / Cmd+K shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Row 1: Light gray background - scrolls away naturally on scroll */}
      <div className="w-full bg-[#F3F4F6] border-b border-gray-200/50 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between">
        <Brand />
        <div className="flex items-center gap-2.5 sm:gap-4 md:gap-5">
          {/* dtu.ac.in link */}
          <a
            href="https://dtu.ac.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[#ff4d4f] font-semibold text-xs sm:text-sm underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            <span>dtu.ac.in</span>
            <ExternalLink size={14} className="stroke-[2.2]" />
          </a>

          {/* Social icons */}
          <div className="flex items-center gap-2 sm:gap-2.5 text-[#ff4d4f]">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:opacity-80 transition-opacity">
              <Facebook size={16} fill="currentColor" strokeWidth={0} />
            </a>
            <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X (Twitter)" className="hover:opacity-80 transition-opacity flex items-center">
              <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:opacity-80 transition-opacity">
              <Instagram size={16} strokeWidth={2} />
            </a>
          </div>

          {/* Search Button in Row 1 */}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200/90 text-xs font-medium shadow-2xs hover:border-[#ff4d4f]/40 hover:shadow-xs transition-all cursor-pointer group"
            title="Search SEWA portal (Ctrl+K)"
            aria-label="Search portal"
          >
            <Search size={14} className="text-[#ff4d4f] group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-gray-600 font-medium">Search</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.2 text-[9.5px] font-mono text-gray-400 bg-gray-100 rounded border border-gray-200">
              ⌘K
            </kbd>
          </button>

          {/* Login / Auth */}
          {isSignedIn ? (
            <div className="flex items-center gap-2">
              <span
                className="hidden max-w-[110px] truncate text-xs text-muted-foreground sm:inline"
                title={user?.firstName}
              >
                Hi, {user?.firstName}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="button button-outline shrink-0 cursor-pointer text-xs sm:text-sm"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/signin"
              className="inline-flex items-center justify-center rounded-full bg-[#ff4d4f] px-5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#e03d3f] transition-colors sm:px-6 sm:py-2 sm:text-sm"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Row 2: Sticky navigation bar that transforms on scroll with increased height */}
      <header
        className={`sticky top-0 z-50 bg-white border-b border-gray-200/80 transition-all duration-300 ${!isScrolled
          ? "hidden lg:block shadow-sm py-2.5 sm:py-3"
          : "block shadow-md py-3.5 sm:py-4 min-h-[64px] sm:min-h-[72px]"
          }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left slot: SEWA FIRST Logo (appears on scroll like the screenshot) */}
          <div className="flex items-center min-w-[140px] sm:min-w-[185px]">
            <Link
              to="/"
              className={`flex items-center transition-all duration-300 ${isScrolled ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3 pointer-events-none"
                }`}
              aria-label="SEWA FIRST Home"
            >
              <img
                src={sewaLogo}
                alt="SEWA FIRST"
                className="h-11 sm:h-13 md:h-14 w-auto object-contain shrink-0"
              />
            </Link>
          </div>

          {/* Center slot: Navigation menu */}
          <nav
            className="hidden lg:flex flex-1 items-center justify-center gap-x-5 lg:gap-x-7 xl:gap-x-9 text-[13px] font-semibold text-gray-800 lg:text-sm"
            aria-label="Primary navigation"
          >
            <Link to="/" className={`nav-link ${activeNav === "home" ? "text-primary font-bold" : ""}`}>
              Home
            </Link>

            {/* About dropdown */}
            <div className="nav-dropdown flex items-center gap-1 cursor-pointer">
              <Link to="/about" className={`nav-link ${activeNav === "about" ? "text-primary font-bold" : ""}`}>
                About
              </Link>
              <ChevronDown size={14} className="text-gray-500 mt-0.5" />
              <div className="nav-dropdown-menu">
                <Link to="/about">About SEWA</Link>
                <a href="https://dtu.ac.in" target="_blank" rel="noreferrer">About DTU</a>
                <a href="/#committee">Our Team</a>
              </div>
            </div>

            {/* Guidelines dropdown */}
            <div className="nav-dropdown flex items-center gap-1 cursor-pointer">
              <Link to="/guidelines" className={`nav-link ${activeNav === "guidelines" ? "text-primary font-bold" : ""}`}>
                Guidelines
              </Link>
              <ChevronDown size={14} className="text-gray-500 mt-0.5" />
              <div className="nav-dropdown-menu">
                <Link to="/guidelines">All Guidelines</Link>
                <Link to="/guidelines" hash="eligibility-heading">Eligibility</Link>
                <Link to="/guidelines" hash="submission-heading">Submission Format</Link>
                <a href="/#benefits">Benefits</a>
              </div>
            </div>

            {/* Problem Statements dropdown */}
            <div className="nav-dropdown flex items-center gap-1 cursor-pointer">
              <Link
                to="/problem-statements"
                className={`nav-link ${activeNav === "problems" ? "text-primary font-bold" : ""}`}
              >
                Problem Statements
              </Link>
              <ChevronDown size={14} className="text-gray-500 mt-0.5" />
              <div className="nav-dropdown-menu">
                <Link to="/problem-statements">All Problem Statements</Link>
                <Link to="/problem-statements" hash="national">National Level Innovation</Link>
                <Link to="/problem-statements" hash="community">Local / Regional Innovation</Link>
                <a href="/#themes">Themes Overview</a>
              </div>
            </div>

            {/* Events dropdown */}
            <div className="nav-dropdown flex items-center gap-1 cursor-pointer">
              <Link to="/events" className={`nav-link ${activeNav === "events" ? "text-primary font-bold" : ""}`}>
                Events
              </Link>
              <ChevronDown size={14} className="text-gray-500 mt-0.5" />
              <div className="nav-dropdown-menu">
                <Link to="/events">All Events</Link>
                <Link to="/events" hash="stages">Competition Stages</Link>
                <a href="/#timeline">100-Day Timeline</a>
                <a href="/#announcements">Announcements</a>
              </div>
            </div>

            <Link to="/resources" className={`nav-link ${activeNav === "resources" ? "text-primary font-bold" : ""}`}>
              Resources
            </Link>
            <Link to="/faq" className={`nav-link ${activeNav === "faq" ? "text-primary font-bold" : ""}`}>FAQ</Link>
            <Link to="/contact" className={`nav-link ${activeNav === "contact" ? "text-primary font-bold" : ""}`}>Contact Us</Link>
          </nav>

          {/* Right slot: Search & Login button (appears on scroll) */}
          <div className="flex items-center justify-end min-w-[140px] sm:min-w-[185px]">
            <div
              className={`flex items-center gap-2 sm:gap-3 transition-all duration-300 ${isScrolled ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3 pointer-events-none"
                }`}
            >
              {/* Search button in sticky navbar */}
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex items-center justify-center size-8 sm:size-9 rounded-full bg-gray-100/90 hover:bg-red-50 text-gray-700 hover:text-[#ff4d4f] border border-gray-200/80 shadow-2xs hover:border-[#ff4d4f]/40 hover:scale-105 active:scale-95 transition-all cursor-pointer group shrink-0"
                title="Search SEWA portal (Ctrl+K)"
                aria-label="Search portal"
              >
                <Search size={15} className="text-[#ff4d4f] group-hover:scale-110 transition-transform" />
              </button>

              {isSignedIn ? (
                <div className="flex items-center gap-2">
                  <span
                    className="hidden max-w-[110px] truncate text-xs text-muted-foreground sm:inline"
                    title={user?.firstName}
                  >
                    Hi, {user?.firstName}
                  </span>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="button button-outline shrink-0 cursor-pointer text-xs sm:text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center rounded-full bg-[#ff4d4f] px-4 sm:px-5 py-1.5 sm:py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#e03d3f] transition-colors sm:text-sm shrink-0"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Row 3: Live updates ticker - scrolls away with the page */}
      <div className="live-updates-bar flex h-12 overflow-hidden bg-[#e0e0e0] text-sm">
        <a
          href="/#announcements"
          className="live-updates-label flex shrink-0 items-center bg-[#ff5d5d] px-6 font-extrabold text-white text-sm sm:text-base shadow-[2px_0_8px_rgba(0,0,0,0.12)] relative z-10 cursor-pointer hover:bg-[#ef4f4f] transition-colors"
          aria-label="Jump to live announcements"
        >
          Live Updates
        </a>
        <div className="live-updates-ticker-wrap min-w-0 flex-1 overflow-hidden">
          <div className="ticker flex h-full items-center whitespace-nowrap font-bold text-sm sm:text-base text-gray-800">
            <span>
              {latestAnnouncement?.title ?? "Live announcements are loading..."}
            </span>
            <span aria-hidden="true">
              {latestAnnouncement?.title ?? "Live announcements are loading..."}
            </span>
          </div>
        </div>
      </div>

      {/* Spotlight Command Search Modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export function SubscribeSection() {
  return (
    <section aria-label="Subscribe for updates" className="relative z-20 -mb-12 sm:-mb-16">
      <div className="site-shell">
        <div className="rounded-2xl sm:rounded-3xl bg-white border border-gray-100 shadow-[0_16px_45px_rgba(0,0,0,0.07)] px-6 py-6 sm:px-10 sm:py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-2xl sm:text-[28px] font-bold text-gray-900 tracking-tight uppercase">
              Subscribe For Updates
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 font-medium">
              Let&apos;s subscribe with us and find the fun.
            </p>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center rounded-full bg-[#f4f5f7] border border-gray-200/80 pl-4 pr-1.5 py-1.5 w-full sm:w-[300px] md:w-[340px] focus-within:border-primary/50 focus-within:bg-white transition-all shrink-0"
          >
            <input
              type="email"
              placeholder="Enter Email Address"
              className="w-full bg-transparent text-xs sm:text-sm text-gray-800 placeholder-gray-400 font-medium focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Subscribe for updates"
              className="size-8 sm:size-8.5 rounded-full bg-[#ff4d4f] hover:bg-[#ff3535] active:scale-95 text-white flex items-center justify-center shrink-0 shadow-xs transition-all cursor-pointer"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer-texture relative overflow-hidden m-0 border-none pt-20 sm:pt-24 pb-12">
      {/* Top subtle fade gradient that blends with the white section above */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white via-white/70 to-transparent pointer-events-none z-[1]" />

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${footerImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center 62%",
          backgroundRepeat: "no-repeat",
          opacity: 0.24,
          filter: "blur(1.5px)",
          WebkitFilter: "blur(1.5px)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 18%, black 100%)",
        }}
      />

      {/* Bottom subtle light grey gradient overlay */}
      <div className="absolute bottom-0 inset-x-0 h-52 sm:h-72 bg-gradient-to-t from-gray-200/75 via-gray-100/40 to-transparent pointer-events-none z-[1]" />

      <div className="site-shell relative z-10 grid gap-10 md:grid-cols-12 items-start">
        {/* Column 1: DTU – SEWA 2026, description, social icons */}
        <div className="md:col-span-5">
          <h2 className="mb-2.5 text-xl font-bold text-gray-900 tracking-tight">DTU – SEWA 2026</h2>
          <p className="max-w-md text-sm leading-relaxed text-gray-800 font-medium">
            Young India&apos;s Knowledge &amp; Technology Initiative - SEWA Youth Innovation
            Challenge. Empowering youth to create sustainable, prototype-driven solutions for Viksit
            Bharat.
          </p>

          <div className="mt-6 flex items-center gap-2.5 sm:gap-3">
            <a
              className="size-8 rounded-full bg-white border border-gray-200/90 shadow-2xs flex items-center justify-center text-[#ff4d4f] hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
            >
              <Facebook size={14} fill="currentColor" />
            </a>
            <a
              className="size-8 rounded-full bg-white border border-gray-200/90 shadow-2xs flex items-center justify-center text-[#ff4d4f] hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="X"
            >
              <Twitter size={14} fill="currentColor" />
            </a>
            <a
              className="size-8 rounded-full bg-white border border-gray-200/90 shadow-2xs flex items-center justify-center text-[#ff4d4f] hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <Instagram size={14} />
            </a>
          </div>
        </div>

        {/* Column 2: Navigation */}
        <div className="md:col-span-3">
          <h3 className="mb-4 text-base font-bold text-gray-900 tracking-tight">Navigation</h3>

          {/*
            Mirrors the primary navigation in <Header /> — same labels, same
            order, same destinations. Keep the two lists in sync when either
            navigation changes.
          */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-gray-800 footer-options">
            <Link className="footer-nav-link" to="/">
              Home
            </Link>
            <Link className="footer-nav-link" to="/about">
              About
            </Link>
            <Link className="footer-nav-link" to="/guidelines">
              Guidelines
            </Link>
            <Link className="footer-nav-link" to="/problem-statements">
              Problem Statements
            </Link>
            <Link className="footer-nav-link" to="/events">
              Events
            </Link>
            <Link className="footer-nav-link" to="/resources">
              Resources
            </Link>
            <Link className="footer-nav-link" to="/faq">
              FAQ
            </Link>
            <Link className="footer-nav-link" to="/contact">
              Contact Us
            </Link>
          </div>
        </div>

        {/* Column 3: DTU Delhi Interactive Map Card */}
        <div className="md:col-span-4 flex justify-start md:justify-end">
          <div className="relative w-full max-w-[340px] sm:max-w-[360px] h-[225px] sm:h-[235px] rounded-2xl overflow-hidden border border-gray-200 hover:border-[#ff4d4f] shadow-md hover:shadow-xl hover:shadow-red-500/10 bg-slate-100 group transition-all duration-300">
            {/* DTU Delhi location hyperlink directly over map (no background card) */}
            <a
              href="https://www.google.com/maps/search/?api=1&query=Delhi+Technological+University"
              target="_blank"
              rel="noreferrer"
              className="absolute top-3 left-3 z-10 text-left group/dtu hover:opacity-85 transition-opacity"
              title="Open DTU location in Google Maps"
            >
              <div className="text-xs font-bold text-gray-900 leading-none flex items-center gap-1 drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)]">
                DTU
                <svg width="10" height="13" viewBox="0 0 24 32" fill="none" className="inline-block text-[#ff4d4f]">
                  <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 32 12 32C12 32 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="currentColor" />
                </svg>
              </div>
              <div className="text-[11px] font-bold text-gray-900 leading-tight drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)]">
                Delhi
              </div>
            </a>

            {/* Single Directions Button */}
            <a
              href="https://www.google.com/maps/dir//Delhi+Technological+University,+Bawana+Rd,+Shahbad+Daulatpur,+Village+Badli,+Rohini,+Delhi,+110042"
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1.5 bg-[#ff4d4f] hover:bg-[#e03b40] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer group"
              title="Get Directions on Google Maps"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              <span>Directions</span>
            </a>

            <iframe
              title="DTU Delhi Map"
              srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #f8fafc; }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-control-zoom { display: none !important; }
    .custom-red-pin { filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35)); cursor: pointer; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      center: [28.7501, 77.1177],
      zoom: 15,
      zoomControl: false,
      scrollWheelZoom: true
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const redIcon = L.divIcon({
      className: 'custom-red-pin',
      html: '<a href="https://www.google.com/maps/dir//Delhi+Technological+University,+Bawana+Rd,+Shahbad+Daulatpur,+Village+Badli,+Rohini,+Delhi,+110042" target="_blank"><svg width="32" height="42" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 32 12 32C12 32 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="#ff4d4f"/><circle cx="12" cy="11.5" r="4.5" fill="white"/></svg></a>',
      iconSize: [32, 42],
      iconAnchor: [16, 42]
    });

    L.marker([28.7501, 77.1177], { icon: redIcon }).addTo(map);
  </script>
</body>
</html>`}
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        </div>

        {/* Bottom copyright line without top border */}
        <p className="mt-14 sm:mt-20 text-center text-xs text-gray-700 font-medium md:col-span-12">
          Copyright © 2026 Delhi Technological University (DTU). All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}



const LAUNCH_DATE = new Date("2026-09-19T00:00:00+05:30");

export function CountdownTimer() {
  const calculateTime = () => {
    const now = Date.now();
    const diff = Math.max(0, LAUNCH_DATE.getTime() - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return {
      days: String(days).padStart(2, "0"),
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
    };
  };

  const [time, setTime] = useState(calculateTime);

  useEffect(() => {
    setTime(calculateTime());
    const interval = setInterval(() => {
      setTime(calculateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="countdown px-5 sm:px-8 md:px-10 py-3 sm:py-3.5 select-none border border-black/[0.04]"
      role="timer"
      aria-label="Countdown to SEWA 2026 Launch on 19 September 2026"
    >
      {/* Launch Date Card Above Timer */}
      <div className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-white px-3.5 sm:px-5 py-1.5 sm:py-2 shadow-[0_10px_28px_rgba(0,0,0,0.10)] border border-black/[0.04]">
          <Calendar size={13} className="text-primary shrink-0 sm:size-[15px]" />
          <span className="text-[11px] sm:text-xs md:text-sm font-extrabold tracking-tight text-gray-900">
            Launching on 19 September 2026
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4 md:gap-6">
        {/* DAYS */}
        <div className="flex flex-col items-center min-w-[40px] sm:min-w-[48px] md:min-w-[56px]">
          <div className="h-7 sm:h-9 md:h-10 flex items-center justify-center">
            <span className="font-display font-extrabold text-2xl sm:text-3xl md:text-[38px] text-black tracking-tight tabular-nums leading-none">
              {time.days}
            </span>
          </div>
          <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-black tracking-wider uppercase mt-1">
            DAYS
          </span>
        </div>

        {/* COLON */}
        <div className="h-7 sm:h-9 md:h-10 flex items-center justify-center -mt-2.5 sm:-mt-3">
          <span className="text-lg sm:text-2xl md:text-3xl font-extrabold text-black leading-none">
            :
          </span>
        </div>

        {/* HOURS */}
        <div className="flex flex-col items-center min-w-[40px] sm:min-w-[48px] md:min-w-[56px]">
          <div className="h-7 sm:h-9 md:h-10 flex items-center justify-center">
            <span className="font-display font-extrabold text-2xl sm:text-3xl md:text-[38px] text-black tracking-tight tabular-nums leading-none">
              {time.hours}
            </span>
          </div>
          <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-black tracking-wider uppercase mt-1">
            HOURS
          </span>
        </div>

        {/* COLON */}
        <div className="h-7 sm:h-9 md:h-10 flex items-center justify-center -mt-2.5 sm:-mt-3">
          <span className="text-lg sm:text-2xl md:text-3xl font-extrabold text-black leading-none">
            :
          </span>
        </div>

        {/* MINUTES */}
        <div className="flex flex-col items-center min-w-[40px] sm:min-w-[48px] md:min-w-[56px]">
          <div className="h-7 sm:h-9 md:h-10 flex items-center justify-center">
            <span className="font-display font-extrabold text-2xl sm:text-3xl md:text-[38px] text-black tracking-tight tabular-nums leading-none">
              {time.minutes}
            </span>
          </div>
          <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-black tracking-wider uppercase mt-1">
            MINUTES
          </span>
        </div>

        {/* COLON */}
        <div className="h-7 sm:h-9 md:h-10 flex items-center justify-center -mt-2.5 sm:-mt-3">
          <span className="text-lg sm:text-2xl md:text-3xl font-extrabold text-black leading-none">
            :
          </span>
        </div>

        {/* SECONDS */}
        <div className="flex flex-col items-center min-w-[40px] sm:min-w-[48px] md:min-w-[56px]">
          <div className="h-7 sm:h-9 md:h-10 flex items-center justify-center">
            <span className="font-display font-extrabold text-2xl sm:text-3xl md:text-[38px] text-black tracking-tight tabular-nums leading-none">
              {time.seconds}
            </span>
          </div>
          <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-black tracking-wider uppercase mt-1">
            SECONDS
          </span>
        </div>
      </div>
    </div>
  );
}

function getContinuousDiff(idx: number, progress: number, total: number) {
  let diff = ((idx - progress) % total + total) % total;
  if (diff > total / 2) diff -= total;
  return diff;
}

export function VideoShowcaseSection() {
  const [activeIndex, setActiveIndex] = useState(3);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [xStep, setXStep] = useState(195);

  const prevActiveRef = useRef(activeIndex);
  const isAnimatingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const hasDraggedRef = useRef(false);

  useEffect(() => {
    const updateStep = () => {
      if (window.innerWidth < 640) {
        setXStep(130);
      } else if (window.innerWidth < 1024) {
        setXStep(165);
      } else {
        setXStep(195);
      }
    };
    updateStep();
    window.addEventListener("resize", updateStep);
    return () => window.removeEventListener("resize", updateStep);
  }, []);



  const videoCards = [
    {
      id: 1,
      title: "SEWA Youth Innovation Challenge",
      date: "19 Sep",
      source: "DTU Youtube",
      image: studentsImage,
      videoUrl: "https://www.youtube.com/embed/KLuTLF3x9sA?si=Su4A0T5r-7cCGXmK",
    },
    {
      id: 2,
      title: "Green Campus Cleanliness Drive",
      date: "12 Sep",
      source: "DTU Media",
      image: studentsImage,
      videoUrl: "https://www.youtube.com/embed/KLuTLF3x9sA?si=Su4A0T5r-7cCGXmK",
    },
    {
      id: 3,
      title: "Solar Power Village Initiative",
      date: "05 Sep",
      source: "SEWA DTU",
      image: studentsImage,
      videoUrl: "https://www.youtube.com/embed/KLuTLF3x9sA?si=Su4A0T5r-7cCGXmK",
    },
    {
      id: 4,
      title: "Digital Literacy For All",
      date: "28 Aug",
      source: "DTU Outreach",
      image: studentsImage,
      videoUrl: "https://www.youtube.com/embed/KLuTLF3x9sA?si=Su4A0T5r-7cCGXmK",
    },
    {
      id: 5,
      title: "Women Empowerment Workshop",
      date: "22 Aug",
      source: "SEWA DTU",
      image: studentsImage,
      videoUrl: "https://www.youtube.com/embed/KLuTLF3x9sA?si=Su4A0T5r-7cCGXmK",
    },
    {
      id: 6,
      title: "Water Conservation Campaign",
      date: "15 Aug",
      source: "DTU Highlights",
      image: studentsImage,
      videoUrl: "https://www.youtube.com/embed/KLuTLF3x9sA?si=Su4A0T5r-7cCGXmK",
    },
    {
      id: 7,
      title: "Rural Health & Medical Drive",
      date: "08 Aug",
      source: "SEWA DTU",
      image: studentsImage,
      videoUrl: "https://www.youtube.com/embed/KLuTLF3x9sA?si=Su4A0T5r-7cCGXmK",
    },
  ];

  const totalCards = videoCards.length;

  const handleAdvance = (step: number) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 360);

    prevActiveRef.current = activeIndex;
    setActiveIndex((prev) => (prev + step + totalCards * 10) % totalCards);
  };

  const handlePrev = () => handleAdvance(-1);
  const handleNext = () => handleAdvance(1);

  const handleSelect = (newIndex: number) => {
    if (newIndex === activeIndex || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 360);

    prevActiveRef.current = activeIndex;
    setActiveIndex((newIndex + totalCards) % totalCards);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only primary mouse button or touch
    if (e.button !== 0 && e.pointerType === "mouse") return;

    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    dragOffsetRef.current = 0;
    hasDraggedRef.current = false;
    setIsDragging(true);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - startXRef.current;
      const deltaY = moveEvent.clientY - startYRef.current;

      // Allow natural vertical page scroll on touch devices if gesture is vertical
      if (!hasDraggedRef.current && Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
        isDraggingRef.current = false;
        setIsDragging(false);
        setDragOffset(0);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        return;
      }

      if (Math.abs(deltaX) > 6) {
        hasDraggedRef.current = true;
      }
      dragOffsetRef.current = deltaX;
      setDragOffset(deltaX);
    };

    const onPointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);

      const offset = dragOffsetRef.current;
      const threshold = 35;
      const steps = Math.min(2, Math.max(1, Math.round(Math.abs(offset) / xStep)));
      if (offset < -threshold) {
        prevActiveRef.current = activeIndex;
        setActiveIndex((prev) => (prev + steps + totalCards * 10) % totalCards);
      } else if (offset > threshold) {
        prevActiveRef.current = activeIndex;
        setActiveIndex((prev) => (prev - steps + totalCards * 10) % totalCards);
      }
      setDragOffset(0);
      dragOffsetRef.current = 0;

      // Small delay to prevent accidental click triggers right after drag
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 50);

      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  // Continuous progress float: dragging left makes dragOffset < 0, increasing progress smoothly
  const currentProgress = activeIndex - (isDragging ? dragOffset / xStep : 0);

  return (
    <div className="w-full relative z-10 mt-14 sm:mt-20 overflow-hidden select-none pb-8">
      {/* 3D Coverflow Stage */}
      <div
        onPointerDown={handlePointerDown}
        className={`relative w-full h-[375px] sm:h-[415px] md:h-[435px] flex items-center justify-center touch-pan-y ${isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        style={{ touchAction: "pan-y" }}
      >
        {videoCards.map((card, idx) => {
          const diff = getContinuousDiff(idx, currentProgress, totalCards);
          const prevDiff = getContinuousDiff(idx, prevActiveRef.current, totalCards);

          // Card jumping across boundary at back of the circle teleports with no transition
          const isWrapping = !isDragging && Math.abs(diff - prevDiff) > 2;

          const absDiff = Math.abs(diff);

          const x = diff * xStep;

          // Calm, subtle scale: center card at 1.0, neighbors at ~0.945, outer cards at ~0.89
          const scale = Math.max(0.83, 1 - absDiff * 0.055);

          // Soothing opacity: smooth fade for outer cards, 0 at back of circle
          let opacity = 1;
          if (absDiff >= 2.8) {
            opacity = 0;
          } else if (absDiff > 1) {
            opacity = Math.max(0, 0.88 - (absDiff - 1) * 0.48);
          } else {
            opacity = 1 - absDiff * 0.12;
          }

          // Blur: Center: 0px | Immediate neighbors: 0.75px | Outer cards: 1.35px
          let blurVal = 0;
          if (absDiff >= 0.25) {
            blurVal = absDiff <= 1 ? absDiff * 0.75 : Math.min(1.8, 0.75 + (absDiff - 1) * 0.6);
          }

          const zIndex = Math.round(40 - absDiff * 10);
          const isActive = absDiff < 0.5;

          // Calm, soothing cubic-bezier easing with 550ms glide
          const transitionStyle =
            isDragging || isWrapping
              ? "none"
              : "transform 550ms cubic-bezier(0.22, 1, 0.36, 1), opacity 480ms ease, filter 480ms ease, box-shadow 480ms ease";

          return (
            <div
              key={card.id}
              onClick={() => {
                if (hasDraggedRef.current) return;
                handleSelect(idx);
              }}
              style={{
                transform: `translateX(${x}px) scale(${scale})`,
                opacity,
                filter: blurVal > 0 ? `blur(${blurVal}px)` : "none",
                zIndex,
                pointerEvents: absDiff >= 2.8 ? "none" : "auto",
                transition: transitionStyle,
              }}
              className={`absolute w-[260px] sm:w-[295px] md:w-[320px] rounded-[24px] bg-white border border-gray-100/90 p-3.5 sm:p-4 flex flex-col transition-shadow ${isActive
                ? "shadow-[0_20px_45px_rgba(0,0,0,0.12)] ring-1 ring-black/5"
                : "shadow-[0_6px_18px_rgba(0,0,0,0.04)] hover:opacity-95"
                }`}
            >
              {/* Video Thumbnail */}
              <div className="relative w-full h-[150px] sm:h-[172px] md:h-[185px] rounded-[18px] overflow-hidden bg-gray-900 group pointer-events-none">
                <img
                  src={card.image}
                  alt={card.title}
                  draggable={false}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
                />
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                  <div className="size-12 sm:size-13 rounded-full bg-white/40 backdrop-blur-xs flex items-center justify-center text-white shadow-md group-hover:scale-110 group-hover:bg-white/60 transition-all">
                    <Play size={18} fill="white" className="ml-0.5 text-white" />
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="pt-3 pb-1 flex flex-col gap-1 text-left">
                <h4 className="text-[13px] sm:text-[14.5px] font-bold text-gray-900 line-clamp-1">
                  {card.title}
                </h4>
                <div className="flex items-center text-[11.5px] sm:text-xs text-gray-400 font-medium">
                  <span>{card.date}</span>
                  <span className="mx-1.5 text-gray-300">|</span>
                  <span>{card.source}</span>
                </div>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasDraggedRef.current) return;
                    setActiveModal(card.videoUrl);
                  }}
                  className="mt-2.5 w-full py-2.5 rounded-xl bg-[#ff3b30] hover:bg-[#e03126] active:scale-[0.98] text-white text-xs sm:text-[13px] font-bold transition-all shadow-xs cursor-pointer text-center"
                >
                  Watch Now
                </button>
              </div>
            </div>
          );
        })}

        {/* Carousel Navigation Arrows */}
        <button
          type="button"
          aria-label="Previous video"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handlePrev}
          className="absolute left-2 sm:left-6 md:left-12 z-40 size-11 sm:size-12 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-[0_4px_18px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer backdrop-blur-xs"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          aria-label="Next video"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleNext}
          className="absolute right-2 sm:right-6 md:right-12 z-40 size-11 sm:size-12 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-[0_4px_18px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer backdrop-blur-xs"
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center items-center gap-1.5 mt-3 sm:mt-4">
        {videoCards.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => handleSelect(i)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${i === activeIndex ? "w-6 bg-[#ff3b30]" : "w-1.5 bg-gray-300 hover:bg-gray-400"
              }`}
          />
        ))}
      </div>

      {/* Video Modal Popup */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="relative w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-3 right-3 z-10 size-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
            <iframe
              src="https://www.youtube.com/embed/KLuTLF3x9sA?si=Su4A0T5r-7cCGXmK&autoplay=1"
              title="SEWA Video Player"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function StatisticsSection() {
  return (
    <section id="statistics" className="t-section-band bg-white scroll-mt-20">
      <div className="site-shell max-w-6xl">
        {/* Title */}
        <h2 className="t-main-heading uppercase">
          STATISTICS
        </h2>

        {/* 6 Key Metrics Grid: 2 rows x 3 columns */}
        <div className="max-w-4xl mx-auto">
          {/* Row 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 pb-6 sm:pb-8">
            {/* 1. 9000 Entries */}
            <div className="flex items-center gap-3.5 sm:gap-4 sm:pr-8 sm:border-r border-gray-200">
              <div className="size-11 sm:size-12 rounded-full bg-[#fde8e8] flex items-center justify-center text-[#ff3366] shrink-0">
                <User size={20} strokeWidth={2.5} />
              </div>
              <div>
                <div className="t-subheading-2 text-black">9000</div>
                <div className="t-content font-semibold! text-gray-500 tracking-wider uppercase mt-1">
                  ENTRIES
                </div>
              </div>
            </div>

            {/* 2. 30+ Shortlisted */}
            <div className="flex items-center gap-3.5 sm:gap-4 sm:px-8 sm:border-r border-gray-200">
              <div className="size-11 sm:size-12 rounded-full bg-[#fde8e8] flex items-center justify-center text-[#ff3366] shrink-0">
                <MapPin size={20} strokeWidth={2.5} />
              </div>
              <div>
                <div className="t-subheading-2 text-black">30+</div>
                <div className="t-content font-semibold! text-gray-500 tracking-wider uppercase mt-1">
                  SHORTLISTED
                </div>
              </div>
            </div>

            {/* 3. 1 lakh + Mentored */}
            <div className="flex items-center gap-3.5 sm:gap-4 sm:pl-8">
              <div className="size-11 sm:size-12 rounded-full bg-[#fde8e8] flex items-center justify-center text-[#ff3366] shrink-0">
                <Server size={20} strokeWidth={2.5} />
              </div>
              <div>
                <div className="t-subheading-2 text-black">1 lakh +</div>
                <div className="t-content font-semibold! text-gray-500 tracking-wider uppercase mt-1">
                  MENTORED
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 pt-2 sm:pt-4">
            {/* 4. 9000 Prototypes */}
            <div className="flex items-center gap-3.5 sm:gap-4 sm:pr-8 sm:border-r border-gray-200">
              <div className="size-11 sm:size-12 rounded-full bg-[#fde8e8] flex items-center justify-center text-[#ff3366] shrink-0">
                <User size={20} strokeWidth={2.5} />
              </div>
              <div>
                <div className="t-subheading-2 text-black">9000</div>
                <div className="t-content font-semibold! text-gray-500 tracking-wider uppercase mt-1">
                  PROTOTYPES
                </div>
              </div>
            </div>

            {/* 5. 30+ Tested */}
            <div className="flex items-center gap-3.5 sm:gap-4 sm:px-8 sm:border-r border-gray-200">
              <div className="size-11 sm:size-12 rounded-full bg-[#fde8e8] flex items-center justify-center text-[#ff3366] shrink-0">
                <MapPin size={20} strokeWidth={2.5} />
              </div>
              <div>
                <div className="t-subheading-2 text-black">30+</div>
                <div className="t-content font-semibold! text-gray-500 tracking-wider uppercase mt-1">
                  TESTED
                </div>
              </div>
            </div>

            {/* 6. 1 lakh + Validated */}
            <div className="flex items-center gap-3.5 sm:gap-4 sm:pl-8">
              <div className="size-11 sm:size-12 rounded-full bg-[#fde8e8] flex items-center justify-center text-[#ff3366] shrink-0">
                <Server size={20} strokeWidth={2.5} />
              </div>
              <div>
                <div className="t-subheading-2 text-black">1 lakh +</div>
                <div className="t-content font-semibold! text-gray-500 tracking-wider uppercase mt-1">
                  VALIDATED
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Container with light background */}
        <div className="mt-14 sm:mt-18 rounded-2xl p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Card 1: Entries by Level */}
            <div className="rounded-2xl bg-white p-5 sm:p-6 border border-gray-200/90 shadow-2xs flex flex-col justify-between">
              <h3 className="t-subheading-2 text-gray-800">
                Entries by Level
              </h3>
              <div className="py-4 flex flex-col items-center justify-center">
                <div className="relative size-44 sm:size-48 flex items-center justify-center">
                  <svg viewBox="0 0 160 160" className="size-full">
                    {/* Left half - Blue (National) */}
                    <path
                      d="M 80 18 A 62 62 0 0 0 80 142"
                      fill="none"
                      stroke="#2f70f2"
                      strokeWidth="24"
                    />
                    {/* Right half - Pink-Red (Local) */}
                    <path
                      d="M 80 18 A 62 62 0 0 1 80 142"
                      fill="none"
                      stroke="#ff3366"
                      strokeWidth="24"
                    />
                  </svg>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-sm font-bold text-gray-800 leading-tight">50%</span>
                    <span className="text-[11px] text-gray-500 font-medium">National</span>
                  </div>
                </div>
                {/* Legend */}
                <div className="t-content flex items-center justify-center gap-5 text-gray-600 mt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#2f70f2]" />
                    <span>National (50%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#ff3366]" />
                    <span>Local (50%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Entries by Participant Category */}
            <div className="rounded-2xl bg-white p-5 sm:p-6 border border-gray-200/90 shadow-2xs flex flex-col justify-between">
              <h3 className="t-subheading-2 text-gray-800">
                Entries by Participant Category
              </h3>
              <div className="py-4">
                <svg viewBox="0 0 320 200" className="w-full h-auto">
                  {/* Grid lines and Y axis labels */}
                  <text x="18" y="30" fontSize="11" fill="#9ca3af" textAnchor="end">1.5</text>
                  <line x1="28" y1="26" x2="305" y2="26" stroke="#f3f4f6" strokeDasharray="3 3" />

                  <text x="18" y="78" fontSize="11" fill="#9ca3af" textAnchor="end">1.0</text>
                  <line x1="28" y1="74" x2="305" y2="74" stroke="#f3f4f6" strokeDasharray="3 3" />

                  <text x="18" y="126" fontSize="11" fill="#9ca3af" textAnchor="end">0.5</text>
                  <line x1="28" y1="122" x2="305" y2="122" stroke="#f3f4f6" strokeDasharray="3 3" />

                  <text x="18" y="174" fontSize="11" fill="#9ca3af" textAnchor="end">0.0</text>
                  <line x1="28" y1="170" x2="305" y2="170" stroke="#f3f4f6" strokeDasharray="3 3" />

                  {/* Bar 1: School (Blue) */}
                  <text x="85" y="62" fontSize="11" fontWeight="600" fill="#1f2937" textAnchor="middle">1</text>
                  <rect x="67" y="74" width="36" height="96" fill="#2f70f2" rx="2" />
                  <text x="85" y="190" fontSize="11" fill="#6b7280" textAnchor="middle">School</text>

                  {/* Bar 2: HEI (Pink-Red) */}
                  <text x="170" y="62" fontSize="11" fontWeight="600" fill="#1f2937" textAnchor="middle">1</text>
                  <rect x="152" y="74" width="36" height="96" fill="#ff3366" rx="2" />
                  <text x="170" y="190" fontSize="11" fill="#6b7280" textAnchor="middle">HEI</text>

                  {/* Bar 3: Industry (Green) */}
                  <text x="255" y="62" fontSize="11" fontWeight="600" fill="#1f2937" textAnchor="middle">1</text>
                  <rect x="237" y="74" width="36" height="96" fill="#00c48c" rx="2" />
                  <text x="255" y="190" fontSize="11" fill="#6b7280" textAnchor="middle">Industry</text>
                </svg>
              </div>
            </div>

            {/* Card 3: Cumulative Entries */}
            <div className="rounded-2xl bg-white p-5 sm:p-6 border border-gray-200/90 shadow-2xs flex flex-col justify-between">
              <h3 className="t-subheading-2 text-gray-800">
                Cumulative Entries
              </h3>
              <div className="py-4">
                <svg viewBox="0 0 320 200" className="w-full h-auto">
                  <defs>
                    <linearGradient id="redAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff3366" stopOpacity="0.16" />
                      <stop offset="100%" stopColor="#ff3366" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Y Axis Grid & Labels */}
                  <text x="14" y="28" fontSize="11" fill="#9ca3af" textAnchor="end">8</text>
                  <line x1="22" y1="24" x2="305" y2="24" stroke="#f3f4f6" strokeDasharray="3 3" />

                  <text x="14" y="65" fontSize="11" fill="#9ca3af" textAnchor="end">6</text>
                  <line x1="22" y1="61" x2="305" y2="61" stroke="#f3f4f6" strokeDasharray="3 3" />

                  <text x="14" y="102" fontSize="11" fill="#9ca3af" textAnchor="end">4</text>
                  <line x1="22" y1="98" x2="305" y2="98" stroke="#f3f4f6" strokeDasharray="3 3" />

                  <text x="14" y="139" fontSize="11" fill="#9ca3af" textAnchor="end">2</text>
                  <line x1="22" y1="135" x2="305" y2="135" stroke="#f3f4f6" strokeDasharray="3 3" />

                  <text x="14" y="174" fontSize="11" fill="#9ca3af" textAnchor="end">0</text>
                  <line x1="22" y1="170" x2="305" y2="170" stroke="#f3f4f6" strokeDasharray="3 3" />

                  {/* Area fill */}
                  <polygon
                    points="38,152 90,133 142,115 195,96 248,77 300,59 300,170 38,170"
                    fill="url(#redAreaGrad)"
                  />

                  {/* Line */}
                  <polyline
                    points="38,152 90,133 142,115 195,96 248,77 300,59"
                    fill="none"
                    stroke="#ff3366"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Points & Values */}
                  {/* W1: 1 */}
                  <text x="38" y="142" fontSize="11" fontWeight="600" fill="#ff3366" textAnchor="middle">1</text>
                  <circle cx="38" cy="152" r="3.5" fill="#fff" stroke="#ff3366" strokeWidth="2" />
                  <text x="38" y="188" fontSize="11" fill="#6b7280" textAnchor="middle">W1</text>

                  {/* W2: 2 */}
                  <text x="90" y="123" fontSize="11" fontWeight="600" fill="#ff3366" textAnchor="middle">2</text>
                  <circle cx="90" cy="133" r="3.5" fill="#fff" stroke="#ff3366" strokeWidth="2" />
                  <text x="90" y="188" fontSize="11" fill="#6b7280" textAnchor="middle">W2</text>

                  {/* W3: 3 */}
                  <text x="142" y="105" fontSize="11" fontWeight="600" fill="#ff3366" textAnchor="middle">3</text>
                  <circle cx="142" cy="115" r="3.5" fill="#fff" stroke="#ff3366" strokeWidth="2" />
                  <text x="142" y="188" fontSize="11" fill="#6b7280" textAnchor="middle">W3</text>

                  {/* W4: 4 */}
                  <text x="195" y="86" fontSize="11" fontWeight="600" fill="#ff3366" textAnchor="middle">4</text>
                  <circle cx="195" cy="96" r="3.5" fill="#fff" stroke="#ff3366" strokeWidth="2" />
                  <text x="195" y="188" fontSize="11" fill="#6b7280" textAnchor="middle">W4</text>

                  {/* W5: 5 */}
                  <text x="248" y="67" fontSize="11" fontWeight="600" fill="#ff3366" textAnchor="middle">5</text>
                  <circle cx="248" cy="77" r="3.5" fill="#fff" stroke="#ff3366" strokeWidth="2" />
                  <text x="248" y="188" fontSize="11" fill="#6b7280" textAnchor="middle">W5</text>

                  {/* W6: 6 */}
                  <text x="300" y="49" fontSize="11" fontWeight="600" fill="#ff3366" textAnchor="middle">6</text>
                  <circle cx="300" cy="59" r="3.5" fill="#fff" stroke="#ff3366" strokeWidth="2" />
                  <text x="300" y="188" fontSize="11" fill="#6b7280" textAnchor="middle">W6</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Bottom live portal badge */}
          <div className="mt-6 sm:mt-8 flex justify-center">
            <div className="t-content inline-flex items-center px-4 py-2 rounded-lg bg-white border border-gray-200/90 text-gray-500 shadow-2xs text-center">
              Numbers are live portal fields; charts update automatically as entries and stage results are received.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [open, setOpen] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1));
    }, 5500);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === heroImages.length - 1 ? 0 : prev + 1));
  };

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    announcementsApi.list()
      .then(setAnnouncements)
      .catch(() => { }); // fail silently — section just stays empty
  }, []);

  const filtered = useMemo(
    () =>
      announcements
        .filter(
          (n) =>
            (category === "All" || category === "All Categories" || n.category === category) &&
            [n.category, n.title, n.summary, n.detail ?? ""].join(" ").toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    [announcements, query, category],
  );
  return (
    <div>
      <Header />
      <main>
        <section className="hero relative min-h-[580px]">
          <div className="absolute inset-0 overflow-hidden">
            {heroImages.map((image, idx) => (
              <img
                key={idx}
                src={image.src}
                alt={image.alt}
                className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentSlide
                  ? "opacity-100 z-[1]"
                  : "opacity-0 pointer-events-none z-0"
                  }`}
                width={1600}
                height={900}
              />
            ))}
            <div className="absolute inset-0 bg-hero-overlay z-[2]" />
          </div>

          {/* Carousel Arrows */}
          <button
            type="button"
            aria-label="Previous slide"
            onClick={prevSlide}
            className="flex absolute left-3 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer select-none bg-white/20 hover:bg-white/40 backdrop-blur-xs p-1.5 sm:p-2 rounded-full shadow-xs"
          >
            <ChevronLeft size={36} strokeWidth={2.5} className="sm:size-[42px]" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={nextSlide}
            className="flex absolute right-3 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer select-none bg-white/20 hover:bg-white/40 backdrop-blur-xs p-1.5 sm:p-2 rounded-full shadow-xs"
          >
            <ChevronRight size={36} strokeWidth={2.5} className="sm:size-[42px]" />
          </button>

          {/* Hero content - centered */}
          <div className="site-shell relative flex min-h-[580px] items-start justify-center z-10">
            <div className="animate-rise flex flex-col items-center text-center pt-10 pb-20 max-w-3xl w-full">

              {/* SEWA white logo in hero */}
              <div className="mb-6 select-none drop-shadow-xl">
                <img
                  src={sewaWhiteLogo}
                  alt="SEWA First"
                  className="h-28 sm:h-32 md:h-36 w-auto object-contain"
                />
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-extrabold leading-tight text-white drop-shadow-lg whitespace-nowrap uppercase tracking-tight">
                Rashtriya Youth Innovation Challenge 2026
              </h1>

              <p className="mt-4 text-xl sm:text-2xl md:text-3xl font-bold text-white/90 tracking-wider uppercase">
                Observe. Ideate. Innovate. Impact.
              </p>

              <p className="mt-5 max-w-2xl text-base sm:text-lg leading-7 font-semibold text-white/85">
                Young India's Knowledge &amp; Technology Initiative - A 100-Day Innovation Journey empowering students, researchers, and startups to build sustainable working prototypes for Viksit Bharat.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <Link to="/team-register" className="inline-flex items-center gap-2 rounded-md bg-[#e53e3e] hover:bg-[#c53030] px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 shadow-lg">
                  Register Your Team
                </Link>
                <a href="#about" className="inline-flex items-center gap-2 rounded-md bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-sm px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5">
                  Latest Updates
                </a>
              </div>
            </div>
          </div>
          <CountdownTimer />
        </section>
        <section id="about" className="pt-36 sm:pt-[200px] pb-0">
          <div className="site-shell grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-16 items-start">
            {/* Heading */}
            <h2 className="t-subheading-1 uppercase">
              What
              <br />
              <span className="text-primary">is SEWA FIRST</span>
              <br />
              <span className="t-subheading-2 text-muted-foreground block mt-1 uppercase">Rashtriya Youth Innovation Challenge 2026?</span>
            </h2>

            {/* Description spans remaining 3 columns */}
            <div className="lg:col-span-3">
              <p className="t-content text-gray-700 font-medium!">
                <strong className="font-bold text-gray-900">SEWA FIRST – Rashtriya Youth Innovation Challenge (RYIC) 2026</strong> is a national platform that empowers India's youth to identify real problems in their own surroundings and transform them into sustainable, affordable and implementable solutions. Launched at Delhi Technological University on 19 September 2026, the 100-day Challenge brings together students, researchers, educational institutions, industry, government and mentors to take innovations from problem identification and ideation to design, prototyping, validation and implementation. Rooted in the spirit of Sewa First, RYIC seeks to nurture innovation, leadership and entrepreneurship while creating solutions that deliver meaningful impact for communities and the nation.
              </p>
            </div>
          </div>

          {/* Video Showcase Section - hidden for now */}
          {/* <VideoShowcaseSection /> */}
        </section>

        {/* ── Participation Benefits ── */}
        <section id="benefits" className="t-section-band bg-white scroll-mt-20">
          {/* Wider than .site-shell (1200px) so the diagram renders larger.
              Change the 1440px to resize it. */}
          <div className="mx-auto w-[min(100%-2rem,1440px)]">
            <ParticipationBenefits />
          </div>
        </section>

        {/* ── Themes Section ── */}
        <section id="themes" className="t-section-band [--section-gap:140] bg-white scroll-mt-20">
          <div className="site-shell max-w-5xl">
            <h2 className="t-main-heading">
              THEMES
            </h2>

            <p className="t-subheading-2 text-center text-black mb-8 sm:mb-10">
              The Rashtriya Youth Innovation Challenge 2026 focuses on two broad themes:
            </p>

            <div className="t-content-block space-y-7 sm:space-y-8 text-black">
              <p id="national-themes" className="scroll-mt-28">
                <strong className="font-bold text-black">National Level</strong> Innovations addressing critical national priorities in Defence, Space &amp; National Security, Disaster Management, AI, Robotics, Manufacturing, Energy, Environment, Infrastructure and Future Mobility
              </p>

              <p id="community-themes" className="scroll-mt-28">
                <strong className="font-bold text-black">Local Community</strong> Level Innovations addressing grassroots challenges in Agriculture &amp; Rural Development, Education, Healthcare, Urban Problems, Environment, Sports, Employment &amp; Livelihood, Women &amp; Child Safety, Disaster Management, Transport, Energy and Tourism. The themes encourage youth to develop innovative, affordable, sustainable, scalable and implementable solutions that transform real-world problems into meaningful impact.
              </p>
            </div>
          </div>
        </section>

        {/* ── Timeline of 100 Day Journey ── */}
        <section id="timeline" className="t-section-band scroll-mt-20">
          {/* Frame width drives the roadmap's scale: the 1400px stage is
              scaled to fit this box, so a narrower frame both shrinks the
              diagram and widens the page margins. */}
          <div className="mx-auto w-[min(100%-6rem,1180px)]">
            <h2 className="t-main-heading text-center">
              <span className="uppercase">Timeline</span>
              <span className="t-subheading-2 block text-center text-black">OF 100 DAY SEWA FIRST RYIC 2026 JOURNEY</span>
            </h2>
            <TimelineRoadmap />
          </div>
        </section>

        {/* ── Live Announcements ── */}
        <section id="announcements" className="live-announcements t-section-band scroll-mt-20">
          <div className="site-shell">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
              <div>
                <p className="eyebrow !text-base sm:!text-lg mb-2">Important Notices</p>
                <h2 className="t-main-heading !text-left !mb-2">LIVE ANNOUNCEMENTS</h2>
                <p className="t-subheading-2 text-black/60 font-normal">
                  Stay updated with recent circulars, dates, and official notices.
                </p>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200/80 text-red-600 font-bold text-xs shadow-xs self-start sm:self-center select-none shrink-0">
                <span>Live</span>
                <span className="relative flex size-2.5">
                  <span className="animate-ping absolute inline-flex size-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2.5 bg-red-600" />
                </span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
              <label className="flex min-h-[46px] items-center gap-2.5 rounded-xl bg-[#f1f3f5] px-4 text-gray-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#ff5a5f]/20 focus-within:border-[#ff5a5f] border border-transparent transition-all">
                <Search size={18} className="shrink-0 text-gray-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search announcements..." className="t-content-sm w-full bg-transparent text-gray-900 placeholder-gray-400 outline-none" />
              </label>
              <label className="flex min-h-[46px] items-center justify-between rounded-xl bg-[#f1f3f5] px-4 text-gray-700 cursor-pointer focus-within:bg-white focus-within:ring-2 focus-within:ring-[#ff5a5f]/20 focus-within:border-[#ff5a5f] border border-transparent transition-all">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="t-content-sm w-full bg-transparent font-medium outline-none cursor-pointer">
                  <option>All Categories</option>
                  <option>Problem Statements</option>
                  <option>Mentorship</option>
                  <option>Guidelines</option>
                  <option>Evaluation</option>
                  <option>Announcements</option>
                </select>
                <ChevronDown size={18} className="shrink-0 text-gray-500 pointer-events-none" />
              </label>
            </div>
            <div className="relative mt-7">
              <div className="space-y-4 max-h-[540px] overflow-y-auto pb-16 pr-1.5 scrollbar-thin scrollbar-thumb-gray-300">
                {filtered.map((n, i) => (
                  <article key={n.id} className="rounded-2xl bg-[#f4f5f7] p-5 sm:p-6 transition-all duration-200 hover:bg-[#eceef2] hover:shadow-xs">
                    <div className="flex items-start justify-between gap-4">
                      <span className="t-content-sm text-gray-500 font-medium tracking-tight">
                        {n.refNumber ? `Ref: ${n.refNumber} · ` : ""}
                        {new Date(n.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} · {n.category}
                      </span>
                      <button type="button" onClick={() => setOpen(open === i ? null : i)} className="t-content-sm flex items-center gap-1.5 font-bold text-[#ff5a5f] hover:text-[#e03b40] transition-colors cursor-pointer shrink-0 select-none">
                        <span>{open === i ? "Hide Details" : "View Full Details"}</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${open === i ? "rotate-180" : ""}`} />
                      </button>
                    </div>
                    <h3 className="t-subheading-2 mt-2 text-black tracking-tight">{n.title}</h3>
                    <p className="t-content mt-2 text-gray-600 max-w-3xl">{n.summary}</p>
                    {open === i && (
                      <div className="t-content-sm mt-4 pt-3.5 border-t border-gray-200/90 text-gray-700 leading-relaxed animate-fade-in">
                        {n.detail || "Complete circulars, guidelines, and submission links are published through the official DTU SEWA portal."}
                      </div>
                    )}
                  </article>
                ))}
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[26px] sm:h-[34px] bg-gradient-to-t from-gray-400/35 via-gray-300/20 to-transparent backdrop-blur-[2px] rounded-b-2xl" />
            </div>
          </div>
        </section>

        {/* ── Statistics Section ── */}
        <StatisticsSection />
        {/* Join The Challenge - hidden for now */}
        {false && (
          <section id="steps" className="pt-20 sm:pt-[100px] pb-20 sm:pb-[100px] overflow-hidden scroll-mt-20">
            <div className="site-shell grid items-center gap-12 lg:gap-16 lg:grid-cols-2">
              <div>
                <p className="text-xs sm:text-[13px] font-semibold text-gray-500 tracking-normal">
                  Simple &amp; Structured Process
                </p>
                <h2 className="mt-2 text-3xl sm:text-4xl md:text-[42px] font-extrabold text-[#0e1726] tracking-tight leading-[1.15]">
                  Join The Challenge
                  <br />
                  In 3 Simple Steps
                </h2>

                <div className="mt-8 sm:mt-10 space-y-6 sm:space-y-7">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4 sm:gap-4.5">
                    <div className="size-11 sm:size-12 rounded-xl bg-[#e5a000] flex items-center justify-center text-white shrink-0 shadow-xs">
                      <BoxSelect size={20} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-[15px] font-bold text-gray-900 leading-snug">
                        Select Track &amp; Problem Statement
                      </h3>
                      <p className="mt-1 text-xs sm:text-[13px] text-gray-500 leading-relaxed max-w-sm">
                        Choose between the 5 National Themes or identify a local community challenge across 10 grassroots sectors.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4 sm:gap-4.5">
                    <div className="size-11 sm:size-12 rounded-xl bg-[#f04f43] flex items-center justify-center text-white shrink-0 shadow-xs">
                      <FileEdit size={20} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-[15px] font-bold text-gray-900 leading-snug">
                        Register Team &amp; Submit Concept
                      </h3>
                      <p className="mt-1 text-xs sm:text-[13px] text-gray-500 leading-relaxed max-w-sm">
                        Enter team details under your eligibility category and upload your initial solution and implementation plan.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4 sm:gap-4.5">
                    <div className="size-11 sm:size-12 rounded-xl bg-[#08677a] flex items-center justify-center text-white shrink-0 shadow-xs">
                      <Award size={20} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-[15px] font-bold text-gray-900 leading-snug">
                        Confirm &amp; Track Regional Review
                      </h3>
                      <p className="mt-1 text-xs sm:text-[13px] text-gray-500 leading-relaxed max-w-sm">
                        Complete registration through the portal, receive your Team ID, and track regional screening results.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Challenge Card with Soft Ambient Glow */}
              <div className="relative flex items-center justify-center lg:justify-end">
                {/* Soft Rose Ambient Glow behind top-right of the card */}
                <div className="absolute -top-12 -right-6 sm:-top-16 sm:-right-10 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-rose-400/20 blur-3xl pointer-events-none" />

                <article className="relative z-10 w-full max-w-[340px] sm:max-w-[370px] rounded-[24px] sm:rounded-[28px] bg-white p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100/90 transition-all duration-300 hover:shadow-[0_25px_60px_rgba(0,0,0,0.12)] hover:-translate-y-1">
                  <div className="overflow-hidden rounded-2xl aspect-[16/10] w-full bg-gray-100">
                    <img
                      src={studentsImage}
                      alt="Students collaborating on an innovation prototype"
                      loading="lazy"
                      width={800}
                      height={500}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="pt-3.5">
                    <h3 className="text-sm sm:text-[15px] font-bold text-gray-900 tracking-tight">
                      DTU First Youth Innovation Challenge
                    </h3>
                    <p className="mt-1 text-[11px] sm:text-xs text-gray-500 font-medium">
                      19 Sep – 25 Dec <span className="mx-1.5 text-gray-300 font-light">|</span> Coordinated by DTU
                    </p>

                    <div className="mt-3.5 flex items-center gap-2">
                      <div className="size-7 sm:size-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shadow-2xs">
                        <Compass size={14} strokeWidth={2.2} />
                      </div>
                      <div className="size-7 sm:size-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shadow-2xs">
                        <Map size={14} strokeWidth={2.2} />
                      </div>
                      <div className="size-7 sm:size-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 shadow-2xs">
                        <Send size={13} strokeWidth={2.2} />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-2 text-[11px] sm:text-xs text-gray-500 font-medium">
                      <BarChart3 size={14} className="text-gray-400 shrink-0" strokeWidth={2.2} />
                      <span>5 Regional Hubs • 100-Day Journey</span>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </section>
        )}

        {/* ── Organizing Committee ── */}
        <section id="committee" className="t-section-band scroll-mt-20">
          <div className="site-shell">
            <h2 className="t-main-heading t-title-gap-wide uppercase">
              Organizing Committee
            </h2>
            <PeopleGrid rows={2} />
          </div>
        </section>

        {/* ── Mentors ── */}
        <section id="mentors" className="t-section-band scroll-mt-20">
          <div className="site-shell">
            <h2 className="t-main-heading t-title-gap-wide uppercase">
              Mentors
            </h2>
            <PeopleGrid rows={2} />
          </div>
        </section>
      </main>
      <SubscribeSection />
      <Footer />
    </div>
  );
}

/**
 * Grid of circular people cards, four across. Used by both the Organizing
 * Committee and Mentors sections so the two stay visually identical — change
 * the card here and both follow.
 *
 * Still placeholder content: swap the Array.from for the real roster when the
 * names and photos land.
 */
function PeopleGrid({ rows }: { rows: number }) {
  const COLUMNS = 4;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 sm:gap-x-12 md:gap-x-16 gap-y-10 sm:gap-y-12 md:gap-y-16 max-w-4xl mx-auto">
      {Array.from({ length: rows * COLUMNS }).map((_, idx) => (
        <div key={idx} className="flex flex-col items-center text-center">
          <div className="size-20 sm:size-24 md:size-28 rounded-full bg-[#d2d2d2] mb-3 sm:mb-3.5 transition-transform duration-200 hover:scale-105" />
          <h3 className="t-subheading-2 text-gray-900">Name</h3>
          <p className="t-content text-gray-500 mt-1">Designation</p>
        </div>
      ))}
    </div>
  );
}

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Email OTP step (shown after a successful signup POST)
  const [emailOtpStep, setEmailOtpStep] = useState(false);
  const [emailDigits, setEmailDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [emailOtpTimer, setEmailOtpTimer] = useState(60);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!emailOtpStep || emailOtpTimer <= 0) return;
    const id = setInterval(() => setEmailOtpTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [emailOtpStep, emailOtpTimer]);

  const handleResendEmailOtp = async () => {
    if (busy || emailOtpTimer > 0) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await authApi.resendOtp(email);
      setEmailDigits(["", "", "", "", "", ""]);
      // The server enforces its own cooldown; this timer is only UX.
      setEmailOtpTimer(60);
      setMessage("A new code is on its way.");
      setTimeout(() => digitRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not resend the code.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = emailDigits.join("");
    if (code.length < 6 || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      // A successful verify sets the session cookie server-side, so the
      // user is signed in from here - no separate signin call needed.
      await authApi.verifyOtp(email, code);
      await refresh();
      setMessage("Email verified! Welcome to SEWA 2026.");
      navigate({ to: "/team-register" });
    } catch (err) {
      setEmailDigits(["", "", "", "", "", ""]);
      digitRefs.current[0]?.focus();
      setError(err instanceof ApiError ? err.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDigitInput = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...emailDigits];
    next[idx] = digit;
    setEmailDigits(next);
    if (digit && idx < 5) digitRefs.current[idx + 1]?.focus();
  };

  const handleDigitKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !emailDigits[idx] && idx > 0) {
      digitRefs.current[idx - 1]?.focus();
    }
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        await authApi.signin(email, password);
        await refresh();
        navigate({ to: "/team-register" });
      } else {
        await authApi.signup({
          firstName,
          lastName,
          email,
          phone: phone || undefined,
          password,
        });
        // Signup already issued the OTP - this screen only collects it.
        setEmailDigits(["", "", "", "", "", ""]);
        setEmailOtpTimer(60);
        setEmailOtpStep(true);
        setTimeout(() => digitRefs.current[0]?.focus(), 100);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // Prefer the field-level message when Zod rejected the input -
        // "Validation failed" on its own tells the user nothing.
        setError(err.firstFieldError ?? err.message);

        // 403 on signin means the account exists but isn't verified yet;
        // send them straight to the OTP screen instead of a dead end.
        if (mode === "login" && err.status === 403 && /verify/i.test(err.message)) {
          try {
            await authApi.resendOtp(email);
          } catch {
            /* cooldown - the existing code is still valid */
          }
          setEmailDigits(["", "", "", "", "", ""]);
          setEmailOtpTimer(60);
          setEmailOtpStep(true);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (mode === "login") {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header activeNav="signin" />

        <main className="flex-1 w-full max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex items-start justify-center">
          <div className="w-full flex flex-col lg:flex-row items-stretch gap-6">

            {/* Left: Aerial DTU campus photo - same layout as the signup card */}
            <div className="flex-1 min-h-[440px] sm:min-h-[600px] lg:min-h-[660px] rounded-[18px] overflow-hidden shadow-[0_8px_28px_rgba(0,0,0,0.10)]">
              <img
                src={campusImage}
                alt="Delhi Technological University campus aerial view"
                className="size-full object-cover object-[48%_center]"
              />
            </div>

            {/* Right: Form card */}
            <div className="w-full lg:w-[480px] shrink-0 rounded-[18px] border border-[#ff5a5f]/70 bg-white px-8 py-9 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col">
              {/* Brand header */}
              <div className="mb-6">
                <Brand />
              </div>

              <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-900">Welcome back</h2>
                <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                  Sign in to access your challenge workspace and submissions.
                </p>
              </div>

              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-md bg-[#f2f2f2] border-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/25 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      required
                      type={visible ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-10 pl-3.5 pr-10 rounded-md bg-[#f2f2f2] border-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/25 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setVisible(!visible)}
                      aria-label={visible ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5 select-none">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={rememberMe}
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`relative inline-flex h-[18px] w-[32px] shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${rememberMe ? "bg-[#ff4d4f]" : "bg-[#d9d9d9]"
                        }`}
                    >
                      <span
                        className={`inline-block size-3.5 transform rounded-full bg-white shadow-sm transition-transform ${rememberMe ? "translate-x-[14px]" : "translate-x-[2px]"
                          }`}
                      />
                    </button>
                    <span className="text-xs text-gray-700">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-xs text-[#1890ff] hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-10 rounded-md bg-[#ff5a5f] text-white font-semibold text-sm hover:bg-[#ff3f45] active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy ? "Signing in…" : "Sign in"}
                </button>

                {error && (
                  <p role="alert" className="text-center text-xs font-semibold text-[#ff4d4f]">
                    {error}
                  </p>
                )}
                {message && (
                  <p role="status" className="text-center text-xs font-semibold text-emerald-600">
                    {message}
                  </p>
                )}

                <p className="pt-1 text-center text-xs text-gray-600">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-[#1890ff] hover:underline font-medium">
                    Sign up
                  </Link>
                </p>
              </form>
            </div>

          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // ─── SIGN UP (register) ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header activeNav="signup" />

      <main className="flex-1 w-full max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex items-start justify-center">
        <div className="w-full flex flex-col lg:flex-row items-stretch gap-6">

          {/* Left: Aerial DTU campus photo */}
          <div className="flex-1 min-h-[440px] sm:min-h-[600px] lg:min-h-[660px] rounded-[18px] overflow-hidden shadow-[0_8px_28px_rgba(0,0,0,0.10)]">
            <img
              src={campusImage}
              alt="Delhi Technological University campus aerial view"
              className="size-full object-cover object-[48%_center]"
            />
          </div>

          {/* Right: Form card - switches between signup form and OTP verification */}
          <div className="w-full lg:w-[480px] shrink-0 rounded-[18px] border border-[#ff5a5f]/70 bg-white px-8 py-9 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-center">
            {/* Brand header */}
            <div className="mb-6">
              <Brand />
            </div>

            {emailOtpStep ? (
              /* ── EMAIL OTP VERIFICATION SCREEN ── */
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Two-Step Verification</h2>
                  <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                    We've sent a 6-digit verification code to your registered email/phone number{" "}
                    <span className="font-semibold text-gray-700">
                      {email ? `${email[0]}***@${email.split("@")[1] ?? "dtu.ac.in"}` : "e***@dtu.ac.in"}
                    </span>
                    . Please enter it below to proceed.
                  </p>
                </div>

                {/* 6 digit boxes */}
                <div className="flex gap-2.5 justify-between">
                  {emailDigits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { digitRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleDigitInput(i, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(i, e)}
                      onFocus={(e) => e.target.select()}
                      className={`w-11 h-12 rounded-lg border text-center text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/40 transition-all
                        ${d ? "border-[#ff4d4f] bg-[#fff5f5]" : "border-gray-200 bg-[#f7f7f7]"}`}
                    />
                  ))}
                </div>

                {/* Timer + Resend row */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Resend code in{" "}
                    <span className={`font-semibold ${emailOtpTimer > 0 ? "text-gray-700" : "text-[#ff4d4f]"}`}>
                      {formatTime(emailOtpTimer)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResendEmailOtp}
                    disabled={busy || emailOtpTimer > 0}
                    className="font-semibold text-[#ff4d4f] hover:underline disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Resend OTP
                  </button>
                </div>

                {/* Verify button */}
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={busy || emailDigits.join("").length < 6}
                  className="w-full h-11 rounded-md bg-[#ff5a5f] text-white font-semibold text-sm hover:bg-[#ff3f45] active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy ? "Verifying…" : "Verify & Proceed"}
                </button>

                {error && (
                  <p role="alert" className="text-center text-xs font-semibold text-[#ff4d4f]">
                    {error}
                  </p>
                )}

                {message && (
                  <p role="status" className="text-center text-xs font-semibold text-emerald-600">
                    {message}
                  </p>
                )}

                {/* Bottom links */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <Link
                    to="/signin"
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <ChevronLeft size={13} />
                    Back to Login
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEmailOtpStep(false)}
                    className="text-[#ff4d4f] hover:underline font-medium cursor-pointer"
                  >
                    Change email address
                  </button>
                </div>
              </div>
            ) : (

              <form onSubmit={submit} className="space-y-3">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-md bg-[#f2f2f2] border-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/25 transition-all mb-2"
                  />
                  <input
                    required
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-md bg-[#f2f2f2] border-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/25 transition-all"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Phone
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="Telephone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-md bg-[#f2f2f2] border-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/25 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-md bg-[#f2f2f2] border-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/25 transition-all"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      required
                      type={visible ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-10 pl-3.5 pr-10 rounded-md bg-[#f2f2f2] border-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/25 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setVisible(!visible)}
                      aria-label={visible ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember me / Forgot password */}
                <div className="flex items-center justify-between pt-0.5 select-none">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={rememberMe}
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`relative inline-flex h-[18px] w-[32px] shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${rememberMe ? "bg-[#ff4d4f]" : "bg-[#d9d9d9]"
                        }`}
                    >
                      <span
                        className={`inline-block size-3.5 transform rounded-full bg-white shadow-sm transition-transform ${rememberMe ? "translate-x-[14px]" : "translate-x-[2px]"
                          }`}
                      />
                    </button>
                    <span className="text-xs text-gray-700">Remember me</span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-10 rounded-md bg-[#ff5a5f] text-white font-semibold text-sm hover:bg-[#ff3f45] active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy ? "Creating account…" : "Create account"}
                </button>

                {error && (
                  <p role="alert" className="text-center text-xs font-semibold text-[#ff4d4f]">
                    {error}
                  </p>
                )}

                {message && (
                  <p role="status" className="text-center text-xs font-semibold text-emerald-600">
                    {message}
                  </p>
                )}

                {/* Footer link */}
                <p className="pt-1 text-center text-xs text-gray-600">
                  Have an account.{" "}
                  <Link to="/signin" className="text-[#1890ff] hover:underline font-medium">
                    Login
                  </Link>
                </p>
              </form>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input required type={type} placeholder={placeholder} />
    </label>
  );
}

type EventStage = {
  number: string;
  name: string;
  period: string;
  days: string;
  activity: string;
  badgeBg: string;
  badgeText: string;
};

/** Same 6-colour cycle used for the TRL badges on the Resources page. */
const STAGE_BADGE_STYLES = [
  { bg: "bg-[#eaf3fd]", text: "text-[#2e6fbf]" },
  { bg: "bg-[#eafaf1]", text: "text-[#1f9e63]" },
  { bg: "bg-[#fff6e0]", text: "text-[#c8930b]" },
  { bg: "bg-[#ffe9de]", text: "text-[#d6602c]" },
  { bg: "bg-[#ffe6e8]", text: "text-[#e0435a]" },
  { bg: "bg-[#f0eefb]", text: "text-[#6f5fc9]" },
];

const eventStages: EventStage[] = [
  {
    number: "1",
    name: "Stage-I (Ideate)",
    period: "19 Sep – 1 Oct 2026",
    days: "Day 1–15",
    activity:
      "Launch of 5 National Level Problem Statements and 10 areas of challenge for local level innovations for registration; awareness campaign; idea submission; local problem identification; online orientation sessions.",
  },
  {
    number: "2",
    name: "Stage-II (Screening)",
    period: "2 Oct – 16 Oct 2026",
    days: "Day 16–30",
    activity:
      "Announcement of Jury (02 Oct 26). Preliminary scrutiny; eligibility check; technical and innovation assessment; shortlisting of promising ideas; announcement of selected teams.",
  },
  {
    number: "3",
    name: "Stage-III (Build)",
    period: "17 Oct – 15 Nov 2026",
    days: "Day 31–60",
    activity:
      "Online mentoring; expert consultations; design development; engineering analysis; workshops/boot camps; access to laboratories/fabrication facilities; prototype development; interim design review.",
  },
  {
    number: "4",
    name: "Stage-IV (Validate)",
    period: "16 Nov – 5 Dec 2026",
    days: "Day 61–80",
    activity:
      "Prototype testing; technical evaluation; performance measurement; safety/reliability assessment; refinement of prototypes; validation against defined challenge parameters.",
  },
  {
    number: "5",
    name: "Stage-V (Test)",
    period: "6 Dec – 20 Dec 2026",
    days: "Day 81–95",
    activity:
      "Field trials; demonstrations in actual/relevant environments; user feedback; assessment of usability, cost, sustainability and scalability; final prototype refinement.",
  },
  {
    number: "6",
    name: "Stage-VI (Evaluation cum Winner Selection)",
    period: "21 Dec – 25 Dec 2026",
    days: "Day 95–100",
    activity:
      "Submission of final reports; final prototype demonstration; National Jury evaluation; selection of finalists/winners; preparation for Grand Finale.",
  },
  {
    number: "7",
    name: "Stage-VII Grand Finale",
    period: "To be announced",
    days: "",
    activity:
      "National Innovation Exhibition; finalist demonstrations; presentations before National Jury; interaction with industry/government; awards; recognition of outstanding innovations; identification of solutions for adoption/deployment.",
  },
].map((stage, i) => ({
  ...stage,
  badgeBg: STAGE_BADGE_STYLES[i % STAGE_BADGE_STYLES.length]!.bg,
  badgeText: STAGE_BADGE_STYLES[i % STAGE_BADGE_STYLES.length]!.text,
}));

/**
 * Timeline & Stages table. Built on the same shape as the eligibility table
 * on the Guidelines page (light header bar, rounded rows, numbered circle
 * badge, t-content throughout) so the two tables read as one system.
 */
function StagesTable() {
  return (
    <div className="mt-10 sm:mt-12 w-full max-w-[1180px] mx-auto flex flex-col gap-[14px]">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="min-w-[1160px] md:min-w-0 flex flex-col gap-[14px]">
          {/* Column headers */}
          <div className="w-full min-h-[58px] bg-[#EBF1F8] rounded-[16px] grid grid-cols-[80px_220px_380px_1fr] items-center py-2">
            <div className="t-content flex items-center justify-center font-bold! text-[#334155]">#</div>
            <div className="t-content pl-[24px] font-bold! text-[#1F2D48]">Stage</div>
            <div className="t-content pl-[24px] font-bold! text-[#1F2D48]">Period</div>
            <div className="t-content pl-[32px] pr-5 font-bold! text-[#1F2D48]">Activity</div>
          </div>

          {/* Rows */}
          {eventStages.map((stage, i) => (
            <article
              key={stage.number}
              className={`w-full min-h-[96px] ${i % 2 === 0 ? "bg-white" : "bg-[#fafbfc]"} rounded-[16px] border border-[#eaecf0] grid grid-cols-[80px_220px_380px_1fr] items-center py-4`}
            >
              <div className="flex items-center justify-center">
                <div
                  className={`t-content inline-flex size-[40px] items-center justify-center rounded-full font-bold! ${stage.badgeBg} ${stage.badgeText}`}
                >
                  {stage.number}
                </div>
              </div>
              <div className="pl-[24px] pr-4 h-full flex items-center border-r border-black/[0.04]">
                <h3 className="t-content font-bold! text-[#112347]">{stage.name}</h3>
              </div>
              <div className="pl-[24px] pr-4 h-full flex items-center border-r border-black/[0.04]">
                <p className="t-content whitespace-nowrap font-bold! text-[#14234B]">
                  {stage.period}
                  {stage.days && <span className="ml-1 font-normal! text-gray-500">({stage.days})</span>}
                </p>
              </div>
              <div className="pl-[32px] pr-5 flex items-center">
                <p className="t-content text-[#475569]">{stage.activity}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EventsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header activeNav="events" />

      <main className="t-section-stack flex-1 site-shell max-w-5xl py-12 sm:py-16">
        {/* National Launch Event */}
        <section id="launch-event" className="scroll-mt-16 text-center">
          <h1 className="t-main-heading uppercase">
            National
            <br />
            Launch Event
          </h1>
          <p className="t-subheading-2 mt-3 text-center text-gray-700">
            SEWA FIRST 2026 National Launch Event at Delhi Technological University
          </p>
          <p className="t-content mx-auto mt-6 max-w-3xl text-gray-700">
            Join us on 17 September 2026 for the grand inaugural ceremony and National Innovation
            Festival at DTU. The launch brings together leadership from ministries, academia, and
            industry to unveil the national innovation portal, release the 50 flagship problem
            statements, and kick off the nationwide 100-day innovation journey toward Viksit Bharat.
          </p>
        </section>

        {/* Competition Roadmap */}
        <section id="roadmap" className="scroll-mt-16 text-center">
          <h2 className="t-main-heading uppercase">
            Competition
            <br />
            Roadmap
          </h2>
          <p className="t-subheading-2 mt-3 text-center text-gray-700">The 100-Day Innovation Journey</p>
          <p className="t-content mx-auto mt-6 max-w-3xl text-gray-700">
            Following the national launch, participants embark on a rigorous, milestone-driven
            pathway from September to December 2026. Moving from initial problem identification
            through regional mentoring, prototyping, and rigorous field testing, the challenge
            culminates in proven, deployable solutions ready for national impact.
          </p>
        </section>

        {/* Timeline & Stages */}
        <section id="stages" className="scroll-mt-16">
          <h2 className="t-main-heading text-center uppercase">Timeline &amp; Stages</h2>
          <p className="t-subheading-2 mt-3 text-center text-gray-700">
            Key phases, dates and activities for the national challenge.
          </p>

          <StagesTable />
        </section>

        {/* Result Announcement */}
        <section id="results" className="scroll-mt-16 text-center">
          <h2 className="t-main-heading uppercase">Result Announcement</h2>
          <p className="t-subheading-2 mt-3 text-gray-700">
            Results and winner felicitation of all problem statements will be announced.
          </p>
          <p className="mt-6 text-[#ff3b30]" style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1 }}>
            Coming Soon
          </p>
        </section>
      </main>

      {/* Floating Subscribe Card */}
      <SubscribeSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export function ForgotPasswordPage() {
  // "request" collects the email; "reset" collects the code + new password.
  const [stage, setStage] = useState<"request" | "reset" | "done">("request");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await authApi.forgotPassword(contact);
      // Always advances, even for an unregistered email - the backend
      // answers identically either way so this page can't be used to
      // check whether an address has an account.
      setStage("reset");
    } catch (err) {
      setError(err instanceof ApiError ? (err.firstFieldError ?? err.message) : "Request failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await authApi.resetPassword({ email: contact, code, password: newPassword });
      setStage("done");
    } catch (err) {
      setError(err instanceof ApiError ? (err.firstFieldError ?? err.message) : "Reset failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header activeNav="signin" />

      <main className="flex-1 w-full max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex items-start justify-center">
        <div className="w-full flex flex-col lg:flex-row items-stretch gap-6">

          {/* Left: Aerial DTU campus photo */}
          <div className="flex-1 min-h-[440px] sm:min-h-[600px] lg:min-h-[660px] rounded-[18px] overflow-hidden shadow-[0_8px_28px_rgba(0,0,0,0.10)]">
            <img
              src={campusImage}
              alt="Delhi Technological University campus aerial view"
              className="size-full object-cover object-[48%_center]"
            />
          </div>

          {/* Right: Card */}
          <div className="w-full lg:w-[480px] shrink-0 rounded-[18px] border border-[#ff5a5f]/70 bg-white px-8 py-9 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-center">
            {/* Brand */}
            <div className="mb-8 select-none">
              <div className="text-[22px] font-extrabold tracking-tight leading-none">
                <span className="text-[#ff4d4f]">SEWA</span>{" "}
                <span className="text-gray-900">2026</span>
              </div>
              <div className="text-[13px] font-semibold text-gray-700 mt-0.5">
                DTU Youth Innovation
              </div>
            </div>

            {stage === "done" ? (
              <div className="space-y-4 text-center">
                <div className="size-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                  <svg className="size-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">Password Updated</h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  You can now sign in with your new password.
                </p>
                <Link to="/signin" className="inline-flex items-center gap-1.5 text-xs text-[#ff4d4f] hover:underline font-medium">
                  <ChevronLeft size={13} />
                  Back to Sign In
                </Link>
              </div>
            ) : stage === "reset" ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Enter Reset Code</h2>
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                    If <span className="font-semibold text-gray-700">{contact}</span> is registered,
                    a 6-digit code is on its way. Enter it below along with your new password.
                  </p>
                </div>

                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Reset code
                    </label>
                    <input
                      required
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full h-10 px-3.5 rounded-md bg-[#f2f2f2] border-0 text-sm tracking-[0.3em] text-gray-800 placeholder-gray-400 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/25 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        required
                        type={visible ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-10 pl-3.5 pr-10 rounded-md bg-[#f2f2f2] border-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/25 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setVisible(!visible)}
                        aria-label={visible ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                      >
                        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-gray-400">
                      At least 8 characters, with upper and lower case, a number, and a symbol.
                    </p>
                  </div>

                  {error && (
                    <p role="alert" className="text-xs font-semibold text-[#ff4d4f]">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full h-10 rounded-md bg-[#ff5a5f] text-white font-semibold text-sm hover:bg-[#ff3f45] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? "Updating…" : "Update Password"}
                  </button>
                </form>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setStage("request"); setError(""); }}
                    className="text-xs text-[#ff4d4f] hover:underline font-medium cursor-pointer"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Forgot Password?</h2>
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                    Enter your registered email address. We'll send you a 6-digit code to
                    confirm it's you before you set a new password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Email address
                    </label>
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      placeholder="e.g. you@dtu.ac.in"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-md bg-[#f2f2f2] border-0 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d4f]/25 transition-all"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="text-xs font-semibold text-[#ff4d4f]">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full h-10 rounded-md bg-[#ff5a5f] text-white font-semibold text-sm hover:bg-[#ff3f45] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? "Sending…" : "Send Reset Code"}
                    <ArrowRight size={15} />
                  </button>
                </form>

                <div className="text-center">
                  <Link to="/signin" className="inline-flex items-center gap-1 text-xs text-[#ff4d4f] hover:underline font-medium">
                    <ChevronLeft size={13} />
                    Remember your password? Back to Login
                  </Link>
                </div>

                <p className="pt-2 text-center text-[11px] text-gray-400 border-t border-gray-100">
                  Facing issues receiving recovery credentials?{" "}
                  <a href="mailto:helpdesk@dtu.ac.in" className="text-[#ff4d4f] hover:underline">
                    Contact DTU IT Helpdesk
                  </a>
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export function ContactPage() {
  const [category, setCategory] = useState<ContactCategory>(CONTACT_CATEGORIES[0]);
  const [fullName, setFullName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      await contactApi.submit({
        category,
        fullName,
        teamOrAffiliationId: teamId || undefined,
        email,
        phone,
        subject,
        message,
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.firstFieldError ?? err.message)
          : "Could not send your message. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <Header activeNav="contact" />
        <main className="pt-10 sm:pt-14 pb-16 sm:pb-20">
          <div className="site-shell max-w-4xl">
            <h1 className="t-main-heading uppercase">
              CONTACT US
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6 sm:gap-7 items-start">
              {/* Left Info Card */}
              <div className="rounded-[20px] bg-white border border-gray-200/80 p-5 sm:p-6 space-y-6">
                {/* Norther Region Coordinator */}
                <div className="flex items-start gap-3">
                  <MapPin size={17} className="text-[#ff4d4f] shrink-0 mt-0.5" strokeWidth={1.8} />
                  <div>
                    <h3 className="text-[18px] font-bold leading-snug text-gray-900">
                      Norther Region Coordinator
                    </h3>
                    <p className="mt-1 text-left text-[16px] leading-relaxed text-gray-500">
                      Delhi Technological University, Shahbad Daulatpur, Bawana Road, Rohini, Delhi-110042, India
                    </p>
                  </div>
                </div>

                {/* Queries Email */}
                <div className="flex items-start gap-3">
                  <Mail size={17} className="text-[#ff4d4f] shrink-0 mt-0.5" strokeWidth={1.8} />
                  <div>
                    <h3 className="text-[18px] font-bold leading-snug text-gray-900">
                      For any queries, write to:
                    </h3>
                    <a
                      href="mailto:sewa2026@dtu.ac.in"
                      className="mt-0.5 block text-[16px] font-medium text-[#ff4d4f] hover:underline"
                    >
                      sewa2026@dtu.ac.in
                    </a>
                  </div>
                </div>

                {/* Phone Lines */}
                <div className="flex items-start gap-3">
                  <Phone size={17} className="text-[#ff4d4f] shrink-0 mt-0.5" strokeWidth={1.8} />
                  <div>
                    <h3 className="text-[18px] font-bold leading-snug text-gray-900">
                      Phone Lines:
                    </h3>
                    <p className="mt-0.5 text-left text-[16px] leading-relaxed text-gray-500">
                      +91 11 27871018 (Ext: 442) / +91 11 27871020
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Form Card */}
              <div className="rounded-[20px] bg-white border border-gray-200/80 p-6 sm:p-8">
                {submitted ? (
                  <div className="py-12 text-center">
                    <div className="size-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck size={32} />
                    </div>
                    <h3 className="t-subheading-2 font-bold! text-gray-900">Message Received</h3>
                    <p className="t-content text-gray-600 mt-2 max-w-md mx-auto">
                      Thank you for contacting SEWA 2026. An automated receipt has been registered and our team will review your query within 24–48 hours.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setCategory(CONTACT_CATEGORIES[0]);
                        setFullName("");
                        setTeamId("");
                        setEmail("");
                        setPhone("");
                        setSubject("");
                        setMessage("");
                        setFileName("");
                        setError("");
                      }}
                      className="t-content mt-6 inline-flex items-center px-5 py-2.5 rounded-xl bg-primary text-white font-bold! hover:bg-primary/90 transition-colors"
                    >
                      Submit Another Query
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* SELECT QUERY CATEGORY */}
                    <div>
                      <label className="t-content block font-bold! uppercase tracking-wider text-gray-600 mb-1.5">
                        SELECT QUERY CATEGORY
                      </label>
                      <div className="relative">
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as ContactCategory)}
                          className="t-content w-full h-12 px-3.5 pr-9 rounded-lg bg-[#f8f9fa] border border-gray-200 font-medium! text-gray-800 focus:bg-white focus:border-red-400 outline-none appearance-none cursor-pointer transition-all"
                        >
                          {CONTACT_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/*
                      Full Name & Team ID. Team ID's label runs two lines
                      ("(Optional)" on its own line below), Full Name's runs
                      one — so with plain top-aligned columns the inputs would
                      sit at different heights. Each column is a flex-col
                      stretched to the row's full height (grid's default
                      items-stretch) with mt-auto on the input, so both inputs
                      pin to the bottom of the row and line up regardless of
                      how tall either label is.
                    */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                      <div className="flex flex-col">
                        <label className="t-content block font-semibold! text-gray-600 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Aarav Sharma"
                          className="t-content mt-auto w-full h-12 px-3.5 rounded-lg bg-[#f8f9fa] border border-gray-200 placeholder:text-gray-400 focus:bg-white focus:border-red-400 outline-none transition-all"
                        />
                      </div>

                      <div className="flex flex-col">
                        <label className="t-content block font-semibold! text-gray-600 mb-1">
                          Team ID / Affiliation ID
                          <span className="mt-0.5 block text-[14px] font-normal! normal-case tracking-normal text-gray-400">
                            (Optional)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={teamId}
                          onChange={(e) => setTeamId(e.target.value)}
                          placeholder="e.g. 2K23/CO/145"
                          className="t-content mt-auto w-full h-12 px-3.5 rounded-lg bg-[#f8f9fa] border border-gray-200 placeholder:text-gray-400 focus:bg-white focus:border-red-400 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                      <div>
                        <label className="t-content block font-semibold! text-gray-600 mb-1">
                          Registered Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="SEWA@dtu.ac.in"
                          className="t-content w-full h-12 px-3.5 rounded-lg bg-[#f8f9fa] border border-gray-200 placeholder:text-gray-400 focus:bg-white focus:border-red-400 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="t-content block font-semibold! text-gray-600 mb-1">
                          Contact Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="t-content w-full h-12 px-3.5 rounded-lg bg-[#f8f9fa] border border-gray-200 placeholder:text-gray-400 focus:bg-white focus:border-red-400 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Subject / Matter */}
                    <div>
                      <label className="t-content block font-semibold! text-gray-600 mb-1">
                        Subject / Matter *
                      </label>
                      <input
                        type="text"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief summary of your query or grievance"
                        className="t-content w-full h-12 px-3.5 rounded-lg bg-[#f8f9fa] border border-gray-200 placeholder:text-gray-400 focus:bg-white focus:border-red-400 outline-none transition-all"
                      />
                    </div>

                    {/* Message / Grievance Description */}
                    <div>
                      <label className="t-content block font-semibold! text-gray-600 mb-1">
                        Message / Grievance Description *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please provide detailed context regarding your question, prototype issue, or formal grievance..."
                        className="t-content w-full p-3.5 rounded-lg bg-[#f8f9fa] border border-gray-200 placeholder:text-gray-400 focus:bg-white focus:border-red-400 outline-none transition-all resize-y"
                      />
                    </div>
                    {error && (
                      <p role="alert" className="t-content font-semibold! text-[#ff4d4f]">
                        {error}
                      </p>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={busy}
                        className="t-content w-full py-3.5 rounded-xl bg-[#ff4d4f] hover:bg-[#e03b40] text-white font-bold! transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {busy ? "Sending…" : "Submit Message / Grievance →"}
                      </button>

                      <p className="t-content mt-2 text-center text-gray-400 font-normal!">
                        Turnaround time: Official automated receipt within 5 minutes, review within 24–48 hours.
                      </p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

const resourcePages = [
  {
    title: "About the Challenge",
    description: "What SEWA 2026 is, who runs it, and the 5 national themes.",
    href: "/#about",
  },
  {
    title: "Guidelines & Benefits",
    description: "Eligibility, team composition, and what shortlisted teams receive.",
    href: "/#benefits",
  },
  {
    title: "Problem Statements",
    description: "Category-wise problem statements across both national and community themes.",
    href: "/problem-statements",
  },
  {
    title: "100-Day Timeline",
    description: "Key dates from registration through the Grand Finale.",
    href: "/#steps",
  },
];

const resourceLinks = [
  {
    title: "Delhi Technological University",
    description: "Official university website - campus, academics, and admissions.",
    href: "https://dtu.ac.in",
  },
  {
    title: "Ministry of Education, Government of India",
    description: "National policy context for youth innovation and skill-development initiatives.",
    href: "https://education.gov.in",
  },
  {
    title: "Startup India",
    description: "Support schemes and resources for early-stage innovators and founders.",
    href: "https://www.startupindia.gov.in",
  },
];

export function ResourcesPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <Header activeNav="resources" />
        <main className="pt-10 sm:pt-14 pb-20 sm:pb-24">
          <div className="site-shell max-w-4xl">
            <h1 className="text-2xl sm:text-3xl md:text-[32px] font-black text-center text-gray-950 tracking-tight mb-3 uppercase">
              Additional Resources
            </h1>
            <p className="t-content text-center text-gray-500 max-w-lg mx-auto mb-10 sm:mb-12">
              Reference documents and external links for SEWA 2026 participants.
            </p>

            <section className="mb-12">
              <h2 className="mb-4 text-base font-bold text-gray-900 tracking-tight">
                On This Site
              </h2>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {resourcePages.map((page) => (
                  <a
                    key={page.title}
                    href={page.href}
                    className="flex items-start gap-3 rounded-[18px] border border-[#eaecf0] bg-[#fbfbfb] px-5 py-4 transition-all hover:border-gray-300 hover:shadow-2xs"
                  >
                    <FileText size={18} className="mt-0.5 shrink-0 text-primary" strokeWidth={1.8} />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 leading-snug">{page.title}</h3>
                      <p className="mt-1 text-xs text-gray-500 leading-relaxed">{page.description}</p>
                    </div>
                    <ChevronRight size={16} className="ml-auto mt-0.5 shrink-0 text-gray-300" strokeWidth={1.8} />
                  </a>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-base font-bold text-gray-900 tracking-tight">
                External Links
              </h2>
              <div className="space-y-3">
                {resourceLinks.map((link) => (
                  <a
                    key={link.title}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-3 rounded-[18px] border border-[#eaecf0] bg-[#fbfbfb] px-5 py-4 transition-all hover:border-gray-300 hover:shadow-2xs"
                  >
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 leading-snug">{link.title}</h3>
                      <p className="mt-1 text-xs text-gray-500 leading-relaxed">{link.description}</p>
                    </div>
                    <ExternalLink size={16} className="ml-auto mt-0.5 shrink-0 text-gray-300" strokeWidth={1.8} />
                  </a>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

const faqData = [
  {
    q: "What is SEWA FIRST – Rashtriya Youth Innovation Challenge 2026?",
    a: "SEWA FIRST is a national youth innovation initiative that encourages young minds to identify real-world challenges and develop affordable, sustainable and implementable solutions for society and the nation.",
  },
  {
    q: "Who can participate in the Challenge?",
    a: "Students, young innovators, researchers, technology teams, startups and eligible institutions can participate, subject to the eligibility criteria specified in the Challenge guidelines.",
  },
  {
    q: "Who is the Regional Coordinator for the Northern Region?",
    a: "Delhi Technological University (DTU) is the Regional Coordinator for the Northern Region. The region includes J&K, Ladakh, Himachal Pradesh, Uttarakhand, Chandigarh, Delhi, Punjab, Haryana and Uttar Pradesh.",
  },
  {
    q: "Do I need a fully developed product to participate?",
    a: "No. Participants can begin with an early-stage idea (TRL 1-3) for local/regional/state and TRL (4-6) for national level may participate and progressively develop it through the Challenge towards a functional prototype.",
  },
  {
    q: "Can I propose a solution to a local problem?",
    a: "Yes. Local and community-level problems are strongly encouraged. Solutions should be affordable, sustainable, practical and capable of being replicated or scaled. Broad area categories may be referred to in the Problem Statements page",
  },
  {
    q: "How will the innovations be evaluated?",
    a: "Evaluation will be done in stages by eminent jury members on the basis of rubrics.",
  },
  {
    q: "Can interdisciplinary teams participate?",
    a: "Yes. Interdisciplinary teams are encouraged to combine expertise through team members across from technology, engineering, design, entrepreneurship and other relevant domains to create stronger solutions.",
  },
  {
    q: "Will participants receive mentorship?",
    a: "Participants will get opportunities to interact with mentors, innovators, academia, industry, startups and government stakeholders for technical guidance and further development of their innovations.",
  },
  {
    q: "Can outside college students and inter-college teams register?",
    a: "Yes. Students from different colleges can form an inter-college team, subject to the eligibility criteria and submission requirements specified in the Challenge guidelines. Teams should nominate one member as the designated team representative for communication and coordination.",
  },
  {
    q: "How can teams submit complaints or technical grievances regarding evaluation?",
    a: "Teams can submit their complaints or technical grievances through the \"Contact Us\" form on the official Challenge website or by emailing the designated grievance email address. All grievances should include the team details, issue description and relevant supporting information.",
  },
  {
    q: "How can I register for the Challenge?",
    a: "Participants can register through the SEWA FIRST registration portal during the specified registration period. Applicants should provide the required participant, team and innovation details and complete the submission process.",
  },
  {
    q: "How will I be notified about various updates?",
    a: "Registered participants will receive important updates through their registered email address and official SEWA FIRST communication channels. Participants are advised to regularly check the official website and their email for announcements, deadlines and other updates.",
  },
  {
    q: "What is SEWA FIRST – Rashtriya Youth Innovation Challenge 2026?",
    a: "SEWA FIRST is a national youth innovation initiative that encourages young minds to identify real-world challenges and develop affordable, sustainable and implementable solutions for society and the nation.",
  },
  {
    q: "Who can participate in the Challenge?",
    a: "Students, young innovators, researchers, technology teams, startups and eligible institutions can participate, subject to the eligibility criteria specified in the Challenge guidelines.",
  },
  {
    q: "Who is the Regional Coordinator for the Northern Region?",
    a: "Delhi Technological University (DTU) is the Regional Coordinator for the Northern Region. The region includes J&K, Ladakh, Himachal Pradesh, Uttarakhand, Chandigarh, Delhi, Punjab, Haryana and Uttar Pradesh.",
  },
  {
    q: "Do I need a fully developed product to participate?",
    a: "No. Participants can begin with an early-stage idea (TRL 1-3) for local/regional/state and TRL (4-6) for national level may participate and progressively develop it through the Challenge towards a functional prototype.",
  },
  {
    q: "Can I propose a solution to a local problem?",
    a: "Yes. Local and community-level problems are strongly encouraged. Solutions should be affordable, sustainable, practical and capable of being replicated or scaled. Broad area categories may be referred to in the Problem Statements page.",
  },
  {
    q: "How will the innovations be evaluated?",
    a: "Evaluation will be done in stages by eminent jury members on the basis of rubrics.",
  },
  {
    q: "Can interdisciplinary teams participate?",
    a: "Yes. Interdisciplinary teams are encouraged to combine expertise from technology, engineering, design, entrepreneurship and other relevant domains to create stronger solutions.",
  },
  {
    q: "Will participants receive mentorship?",
    a: "Participants will get opportunities to interact with mentors, innovators, academia, industry, startups and government stakeholders for technical guidance and further development of their innovations.",
  },
  {
    q: "How can I register for the Challenge?",
    a: "Participants can register through the SEWA FIRST registration portal during the specified registration period. Applicants should provide the required participant, team and innovation details and complete the submission process.",
  },
  {
    q: "How will I be notified about various updates?",
    a: "Registered participants will receive important updates through their registered email address and official SEWA FIRST communication channels. Participants are advised to regularly check the official website and their email for announcements, deadlines and other updates.",
  },
];

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex((curr) => (curr === idx ? null : idx));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <Header activeNav="faq" />
        <main className="pt-10 sm:pt-14 pb-20 sm:pb-24">
          <div className="site-shell max-w-[760px]">
            <h1 className="t-main-heading uppercase">
              Frequently Asked Questions
            </h1>
            <p className="t-content text-center text-gray-500 max-w-lg mx-auto mb-10 sm:mb-12">
              Everything you need to know about participating, campus visits, support, and evaluation criteria.
            </p>

            <div className="space-y-3.5 sm:space-y-4">
              {faqData.map((item, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => toggle(idx)}
                    className="rounded-[18px] bg-[#fbfbfb] border border-[#eaecf0] px-6 sm:px-7 py-4 sm:py-4.5 transition-all cursor-pointer hover:border-gray-300 hover:shadow-2xs select-none"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="t-content font-bold! text-[#0e1726]">
                        {item.q}
                      </h3>
                      <ChevronDown
                        size={18}
                        strokeWidth={2}
                        className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""
                          }`}
                      />
                    </div>

                    {isOpen && (
                      <div className="t-content mt-3.5 pt-3.5 border-t border-gray-200/60 text-gray-600 animate-fade-in">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

export function AboutPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <Header activeNav="about" />
        <main className="pt-10 sm:pt-14 pb-20 sm:pb-28">
          <div className="t-section-stack site-shell max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 1. VISION */}
            <section aria-labelledby="vision-heading">
              <h1
                id="vision-heading"
                className="t-main-heading uppercase"
              >
                VISION
              </h1>
              <p className="t-content text-gray-900 font-medium!">
                Create a national culture in which young Indians transform real-world problems into practical innovations contributing to Viksit Bharat.
              </p>
            </section>

            {/* 2. MISSION */}
            <section aria-labelledby="mission-heading">
              <h2
                id="mission-heading"
                className="t-main-heading uppercase"
              >
                MISSION
              </h2>
              <p className="t-content text-gray-900 font-medium!">
                Provide a structured 100-day pathway from problem identification to concept, design, prototype, validation, deployment and impact.
              </p>
            </section>

            {/* 3. PHILOSOPHY */}
            <section aria-labelledby="philosophy-heading">
              <h2
                id="philosophy-heading"
                className="t-main-heading uppercase"
              >
                PHILOSOPHY
              </h2>
              <div className="t-content-block space-y-6 sm:space-y-7">
                <p className="font-semibold! text-gray-900">
                  &ldquo;The Challenge begins not with an idea, but with a problem observed by a young Indian in his or her own surroundings; and it does not end with an award, but with a solution that can reach the beneficiary.&rdquo;
                </p>
                <p className="text-gray-800 font-normal">
                  The philosophy of SEWA FIRST – Rashtriya Youth Innovation Challenge 2026 is rooted in the belief that innovation should begin with service and end with impact. It encourages young Indians to observe real problems around them, understand the needs of people and communities, and transform these challenges into practical, affordable, sustainable and implementable solutions.
                </p>
              </div>
              {/* Breaks out of the About page's max-w-5xl column so the eight
                  step columns get room to breathe. */}
              <div className="relative left-1/2 mt-8 w-[min(100vw-2rem,1280px)] -translate-x-1/2 sm:mt-12">
                <InnovationJourney />
              </div>
            </section>

            {/* 4. AIM */}
            <section aria-labelledby="aim-heading">
              <h2
                id="aim-heading"
                className="t-main-heading uppercase"
              >
                AIM
              </h2>
              <div className="t-content-block space-y-6 sm:space-y-7">
                <p className="text-gray-800 font-normal">
                  To encourage the youth of India to observe and identify real problems in their own surroundings in their villages, towns, cities, districts and communities and to transform these problems into opportunities for innovation by developing sustainable, affordable and implementable solutions, culminating in the creation and demonstration of working prototypes.
                </p>
                <p className="font-semibold! text-gray-900">
                  &ldquo;The Challenge begins not with an idea, but with a problem observed by a young Indian in his or her own surroundings; and it does not end with an award, but with a solution that can reach the beneficiary.&rdquo;
                </p>
              </div>
            </section>

            {/* 5. OBJECTIVES */}
            <section aria-labelledby="objectives-heading">
              <h2
                id="objectives-heading"
                className="t-main-heading uppercase"
              >
                OBJECTIVES
              </h2>
              {/* Breaks out of the About page's max-w-5xl column. 1360px is
                  the narrowest frame that still lets the longest objective
                  description sit on one line at content size. */}
              <div className="relative left-1/2 w-[min(100vw-2rem,1360px)] -translate-x-1/2">
                <ObjectivesRoadmap />
              </div>
            </section>

            {/* 6. UNIQUE FEATURES */}
            <section aria-labelledby="unique-features-heading">
              <h2
                id="unique-features-heading"
                className="t-main-heading uppercase"
              >
                UNIQUE FEATURES
              </h2>
              <div className="t-content-block space-y-5 sm:space-y-6 text-gray-800">
                <p>
                  The Challenge focuses on converting real, locally identified problems into sustainable, affordable and implementable solutions, rather than merely generating ideas or concepts. Its unique feature is the emphasis on taking an innovation from the problem stage to real-world impact: participants are expected to understand the identified problem, develop an appropriate solution, build a working prototype and validate it in a relevant environment.
                </p>
                <p>
                  The Challenge further emphasizes affordability, sustainability, field validation, user feedback and scalability, ensuring that successful innovations are not limited to prototypes but have a clear pathway towards adoption, replication and deployment for the intended beneficiaries.
                </p>
              </div>
              <div className="mt-10 sm:mt-14 flex flex-col items-center">
                <img
                  src={uniqueFeaturesSvg}
                  alt="Unique Features - Complete Innovation Pathway"
                  className="w-full max-w-3xl h-auto object-contain select-none"
                />
                <p className="text-center text-gray-800 font-medium text-base sm:text-lg mt-6">
                  Every solution must demonstrate a complete pathway
                </p>
              </div>
            </section>

            {/* 7. PURPOSE & BENEFITS */}
            <section aria-labelledby="purpose-benefits-heading" className="min-h-[200px] sm:min-h-[280px]">
              <h2
                id="purpose-benefits-heading"
                className="t-main-heading uppercase"
              >
                PURPOSE &amp; BENEFITS
              </h2>
              {/* Space reserved for content */}
              <div className="py-8 sm:py-14" />
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}