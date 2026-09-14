import { useEffect } from "react";
import { Download, ExternalLink } from "lucide-react";
import { Header, Footer } from "./SewaSite";

type TrlRow = {
  level: string;
  title: string;
  description: string;
};

const TRL_ROWS: TrlRow[] = [
  {
    level: "TRL 1",
    title: "Basic Principles Observed",
    description: "Basic scientific principles are identified and observed.",
  },
  {
    level: "TRL 2",
    title: "Technology Concept Formulated",
    description: "The basic concept and potential application of the technology are defined.",
  },
  {
    level: "TRL 3",
    title: "Experimental Proof of Concept",
    description:
      "Critical functions are demonstrated through experiments or initial proof-of-concept studies.",
  },
  {
    level: "TRL 4",
    title: "Technology Validated in Laboratory",
    description: "Components or systems are integrated and validated in a controlled laboratory environment.",
  },
  {
    level: "TRL 5",
    title: "Technology Validated in Relevant Environment",
    description: "The technology is tested and validated under conditions representative of the intended application.",
  },
  {
    level: "TRL 6",
    title: "Technology Demonstrated in Relevant Environment",
    description: "A representative prototype or system is demonstrated in a relevant environment.",
  },
  {
    level: "TRL 7",
    title: "System Prototype Demonstrated in Operational Environment",
    description: "A near-complete or fully functional prototype is demonstrated under actual or operational conditions.",
  },
  {
    level: "TRL 8",
    title: "System Complete and Qualified",
    description:
      "The technology is fully developed, tested and qualified, with the complete system demonstrated and ready for deployment.",
  },
  {
    level: "TRL 9",
    title: "Actual System Proven in Operational Environment",
    description: "The technology has been successfully deployed and proven through actual operation and real-world use.",
  },
];

/** Six-colour badge cycle, matching the reference design (repeats after TRL 6). */
const BADGE_STYLES = [
  { bg: "bg-[#eaf3fd]", text: "text-[#2e6fbf]" },
  { bg: "bg-[#eafaf1]", text: "text-[#1f9e63]" },
  { bg: "bg-[#fff6e0]", text: "text-[#c8930b]" },
  { bg: "bg-[#ffe9de]", text: "text-[#d6602c]" },
  { bg: "bg-[#ffe6e8]", text: "text-[#e0435a]" },
  { bg: "bg-[#f0eefb]", text: "text-[#6f5fc9]" },
];


const externalLinks = [
  {
    title: "Delhi Technological University",
    description: "Official university website — campus, academics, and admissions.",
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

const sectionHeadingClass =
  "t-main-heading uppercase";

export function AdditionalResourcesPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <Header activeNav="resources" />

        <main className="pt-10 sm:pt-16 pb-20 sm:pb-28">
          <div className="t-section-stack site-shell max-w-5xl">
            {/* ── Resources ── */}
            <section aria-labelledby="resources-heading">
              <h1 id="resources-heading" className={sectionHeadingClass}>
                Resources:
              </h1>

              <div className="mt-10 sm:mt-12">
                <h2 className="t-subheading-1 font-bold! mb-4 text-gray-900 tracking-tight">
                  External Links
                </h2>
                <div className="space-y-3">
                  {externalLinks.map((link) => (
                    <a
                      key={link.title}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-3 rounded-[18px] border border-[#eaecf0] bg-[#fbfbfb] px-5 py-4 transition-all hover:border-gray-300 hover:shadow-2xs"
                    >
                      <div className="min-w-0">
                        <h3 className="t-content font-bold! text-gray-900">{link.title}</h3>
                        <p className="t-content mt-1 text-gray-500">{link.description}</p>
                      </div>
                      <ExternalLink size={16} className="ml-auto mt-0.5 shrink-0 text-gray-300" strokeWidth={1.8} />
                    </a>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Innovation Playbook ── */}
            <section id="innovation-playbook" aria-labelledby="playbook-heading" className="scroll-mt-28">
              <h2 id="playbook-heading" className={sectionHeadingClass}>
                Innovation Playbook
              </h2>
              <p className="t-content mt-6 max-w-2xl text-gray-700">
                A step-by-step field guide for teams moving from problem observation through
                ideation, prototyping and validation — structured around the same 100-day journey
                as the Challenge itself.
              </p>

              {/*
                Matches the submission-format download card on the Guidelines
                page exactly (file badge + title on the left, pill button on
                the right) so the two download affordances look identical.
                Only a PDF exists here, so there's one pill instead of two.
              */}
              <div className="mt-8 flex w-full flex-col items-start justify-between gap-4 rounded-[16px] border border-[#F1F5F9] bg-white p-4 shadow-[0px_2px_8px_rgba(0,0,0,0.02)] sm:flex-row sm:items-center sm:px-6 sm:py-5">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="relative flex h-14 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-[#EA4335] text-white shadow-sm">
                    <div className="absolute right-0 top-0 h-3 w-3 rounded-bl bg-[#D93025]" />
                    <span className="mt-1 text-[10px] font-black tracking-wider">PDF</span>
                  </div>
                  <div>
                    <h3 className="t-content font-bold! text-[#112347]">Innovation Playbook</h3>
                    <p className="t-content text-gray-500">Coming soon</p>
                  </div>
                </div>

                <a
                  href="#"
                  className="t-content inline-flex shrink-0 items-center gap-2 self-end rounded-full bg-[#FFF1F2] px-5 py-2.5 font-semibold! text-[#E11D48] transition-colors hover:bg-[#FFE4E6] sm:self-auto"
                >
                  <Download className="size-5" strokeWidth={2.2} />
                  <span>PDF</span>
                </a>
              </div>
            </section>

            {/* ── Technology Readiness Level (TRL) ── */}
            <section id="trl" aria-labelledby="trl-heading" className="scroll-mt-28">
              <h2 id="trl-heading" className={sectionHeadingClass}>
                Technology Readiness
                <br />
                Level (TRL)
              </h2>

              <div className="mt-10 sm:mt-12 overflow-hidden rounded-2xl border border-[#eaecf0]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] text-left">
                    <thead className="bg-[#1c2b40] text-white">
                      <tr>
                        <th className="t-content w-36 px-5 py-4 font-bold! uppercase tracking-wide">TRL</th>
                        <th className="t-content w-[30%] px-5 py-4 font-bold! uppercase tracking-wide">Level</th>
                        <th className="t-content px-5 py-4 font-bold! uppercase tracking-wide">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TRL_ROWS.map((row, index) => {
                        const badge = BADGE_STYLES[index % BADGE_STYLES.length] ?? { bg: "bg-slate-100", text: "text-slate-700" };
                        return (
                          <tr
                            key={row.level}
                            className={index % 2 === 0 ? "bg-white" : "bg-[#fafbfc]"}
                          >
                            <td className="px-5 py-4 align-top">
                              <span
                                className={`t-content inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 font-bold! ${badge.bg} ${badge.text}`}
                              >
                                {row.level}
                              </span>
                            </td>
                            <th scope="row" className="t-content px-5 py-4 align-top font-bold! text-gray-900">
                              {row.title}
                            </th>
                            <td className="t-content px-5 py-4 align-top text-gray-600">
                              {row.description}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
