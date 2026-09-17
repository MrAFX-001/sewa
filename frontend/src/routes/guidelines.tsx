import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, MapPin, UsersRound } from "lucide-react";
import { Footer, Header } from "../components/SewaSite";
import { ParticipationSteps } from "../components/ParticipationSteps";
import nationalPptx from "../assets/NATIONAL LEVEL PPT.pptx";
import nationalPdf from "../assets/NATIONAL LEVEL PPT.pdf";
import regionalPptx from "../assets/REGIONAL LEVEL PPT.pptx";
import regionalPdf from "../assets/REGIONAL LEVEL PPT.pdf";

export const Route = createFileRoute("/guidelines")({
  head: () => ({
    meta: [
      { title: "Guidelines | SEWA 2026" },
      {
        name: "description",
        content: "Eligibility, registration, submission, and regional coordination guidelines for SEWA 2026.",
      },
    ],
  }),
  component: GuidelinesPage,
});

const submissionFormats = [
  {
    key: "national",
    title: "National Theme Submission Format",
    fileName: "NATIONAL LEVEL PPT",
    pptx: nationalPptx,
    pdf: nationalPdf,
  },
  {
    key: "regional",
    title: "Regional Theme Submission Format",
    fileName: "REGIONAL LEVEL PPT",
    pptx: regionalPptx,
    pdf: regionalPdf,
  },
];

const eligibilityRows = [
  {
    number: "I",
    category: "School & Vocational",
    participants: (
      <>
        Students from <strong className="font-bold text-[#14234B]">Class X onwards up to ITI level</strong>, participating individually or in teams, with appropriate institutional support.
      </>
    ),
    badgeBg: "bg-[#5294E2]",
    rowBg: "bg-[#F0F7FF]",
    boldDesc: false,
  },
  {
    number: "II",
    category: "Diploma & Higher Education",
    participants: (
      <>
        Students/teams from <strong className="font-bold text-[#14234B]">Diploma, Undergraduate, Postgraduate and Ph.D. programmes</strong>, including technical and non-technical institutions.
      </>
    ),
    badgeBg: "bg-[#52AB77]",
    rowBg: "bg-[#EFF9F3]",
    boldDesc: false,
  },
  {
    number: "III",
    category: "Industry & Government",
    participants: (
      <>
        Urban/Rural industries, MSMEs, startups, R&amp;D organisations and Government laboratories, participating individually or through collaborative teams.
      </>
    ),
    badgeBg: "bg-[#F39C42]",
    rowBg: "bg-[#FFF8EE]",
    boldDesc: true,
  },
];

const eligibilityCards = [
  {
    key: "participation",
    category: "Participation",
    text: "Individuals, groups/teams and eligible organisations may participate, subject to the specific requirements of each challenge.",
    cardBg: "bg-[#F3F4FE]",
    badgeBg: "bg-[#ECEFFD]",
    titleColor: "text-[#14234B]",
    icon: <UsersRound className="size-6 text-[#5861B5]" strokeWidth={2.2} />,
  },
  {
    key: "applicability",
    category: "Applicability",
    text: (
      <>
        In general, the same three participant categories will be applicable to both <strong className="font-bold text-[#14234B]">National-Level</strong> and <strong className="font-bold text-[#14234B]">Local-Level Challenges</strong>, however, may vary depending upon the problem statement.
      </>
    ),
    cardBg: "bg-[#EFF9F4]",
    badgeBg: "bg-[#DCF2E4]",
    titleColor: "text-[#10653D]",
    icon: <FileText className="size-6 text-[#147A46]" strokeWidth={2.2} />,
  },
  {
    key: "northern-region",
    category: "Northern Region COORDINATION",
    text: "Participants from Jammu & Kashmir, Ladakh, Himachal Pradesh, Uttarakhand, Chandigarh, NCT of Delhi, Punjab and Haryana are eligible to participate under the Northern Region coordinated by DTU.",
    cardBg: "bg-[#FFF4F4]",
    badgeBg: "bg-[#F2DCDC]",
    titleColor: "text-[#F53838]",
    icon: <MapPin className="size-6 text-[#7A1414]" strokeWidth={2.2} />,
  },
];

const sectionHeadingClass = "t-main-heading uppercase";

function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Header activeNav="guidelines" />

      <main className="t-section-stack site-shell max-w-[1200px] py-10 sm:py-16">
        <section aria-labelledby="eligibility-heading" className="w-full">
          <h1 id="eligibility-heading" className={`${sectionHeadingClass} text-center`}>
            ELIGIBILITY
          </h1>
          <div className="w-full max-w-[1180px] mx-auto flex flex-col gap-[14px]">
            {/* Mobile Category Cards (< md): Native stacked cards matching the info cards below */}
            <div className="flex flex-col gap-3.5 md:hidden">
              {eligibilityRows.map((row) => (
                <article
                  key={row.number}
                  className={`w-full ${row.rowBg} rounded-[16px] p-4.5 sm:p-5 flex items-start gap-3.5 sm:gap-4 shadow-xs`}
                >
                  <div
                    className={`size-11 sm:size-12 ${row.badgeBg} rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-xs mt-0.5`}
                  >
                    {row.number}
                  </div>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-black/40">
                      Category {row.number}
                    </span>
                    <h3 className="t-content font-bold! text-[#112347] text-[15px] sm:text-base leading-snug">
                      {row.category}
                    </h3>
                    <div className="mt-1 pt-1.5 border-t border-black/[0.05]">
                      <span className="text-xs font-semibold text-black/60 block mb-0.5">
                        Eligible Participants:
                      </span>
                      <p
                        className={`t-content text-sm sm:text-base ${
                          row.boldDesc ? "font-semibold! text-[#14234B]" : "text-[#475569]"
                        }`}
                      >
                        {row.participants}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop Table (md: and up): 3-column structured grid */}
            <div className="hidden md:flex md:flex-col gap-[14px]">
              {/* Table Column Headers */}
              <div className="w-full min-h-[58px] bg-[#EBF1F8] rounded-[16px] grid grid-cols-[115px_330px_1fr] items-center py-2">
                <div className="t-content flex items-center justify-center font-bold! text-[#334155]">
                  #
                </div>
                <div className="t-content pl-[24px] font-bold! text-[#1F2D48]">
                  Category
                </div>
                <div className="t-content pl-[32px] pr-5 font-bold! text-[#1F2D48]">
                  Eligible Participants
                </div>
              </div>

              {/* Category Rows */}
              {eligibilityRows.map((row) => (
                <article
                  key={row.number}
                  className={`w-full min-h-[88px] ${row.rowBg} rounded-[16px] grid grid-cols-[115px_330px_1fr] items-center py-4`}
                >
                  <div className="flex items-center pl-[20px]">
                    <div
                      className={`size-[52px] ${row.badgeBg} rounded-full flex items-center justify-center text-white font-bold text-[20px] leading-none shadow-[0px_1px_2px_rgba(0,0,0,0.05)]`}
                    >
                      {row.number}
                    </div>
                  </div>
                  <div className="pl-[24px] pr-4 h-full flex items-center border-r border-black/[0.04]">
                    <h3 className="t-content font-bold! text-[#112347]">
                      {row.category}
                    </h3>
                  </div>
                  <div className="pl-[32px] pr-5 flex items-center">
                    <p
                      className={`t-content ${row.boldDesc ? "font-bold! text-[#14234B]" : "text-[#475569]"}`}
                    >
                      {row.participants}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            {/* Info Cards */}
            {eligibilityCards.map((card) => (
              <article
                key={card.key}
                className={`w-full ${card.cardBg} min-h-[112px] rounded-[16px] p-4 sm:p-6 flex flex-row items-start sm:items-center gap-4 sm:gap-6 shadow-xs`}
              >
                <div
                  className={`size-[48px] sm:size-[56px] ${card.badgeBg} rounded-full flex items-center justify-center shrink-0 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] mt-0.5 sm:mt-0`}
                >
                  {card.icon}
                </div>
                <div className="w-[1px] self-stretch bg-[#E2E8F0] shrink-0" aria-hidden="true" />
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <h3 className={`t-content font-bold! ${card.titleColor}`}>
                    {card.category}
                  </h3>
                  <div className="t-content text-[#475569]">
                    {card.text}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="participate-heading" className="w-full">
          <h2 id="participate-heading" className={sectionHeadingClass}>
            How to participate
          </h2>
          <p className="t-content w-full text-justify text-black mb-8">
            Eligible participants can take part in the SEWA First RYIC 2026 through the structured registration journey, designed to guide them from identifying a challenge to presenting their innovation.
            <br />
            The registration process and key steps are outlined below:
          </p>

          <ParticipationSteps />
        </section>

        <section aria-labelledby="submission-heading" className="w-full">
          <h2 id="submission-heading" className={sectionHeadingClass}>
            Submission format
          </h2>
          <p className="t-content w-full text-justify text-black mb-8">
            Participants are required to submit their innovation proposal in the prescribed 15-slide presentation format. The presentation should be concise, structured and focused on demonstrating the journey from problem identification to innovation, prototype development and potential impact. The prescribed slide format is appended for reference
          </p>

          <div className="w-full max-w-[1180px] mx-auto flex flex-col gap-4">
            {submissionFormats.map((format) => (
              <div
                key={format.key}
                className="w-full bg-white border border-[#F1F5F9] rounded-[16px] p-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0px_2px_8px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-11 h-14 bg-[#EA4335] rounded-lg flex flex-col items-center justify-center text-white shadow-sm shrink-0">
                    <div className="absolute top-0 right-0 w-3 h-3 bg-[#D93025] rounded-bl" />
                    <span className="text-[10px] font-black tracking-wider mt-1">PPT</span>
                  </div>
                  <h3 className="t-content font-bold! text-[#112347]">{format.title}</h3>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  {/*
                    `download` with an explicit filename keeps the original name
                    rather than the hashed one Vite emits at build time.
                  */}
                  <a
                    href={format.pptx}
                    download={`${format.fileName}.pptx`}
                    className="t-content inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFF1F2] text-[#E11D48] hover:bg-[#FFE4E6] font-semibold! transition-colors"
                  >
                    <Download className="size-5" strokeWidth={2.2} />
                    <span>PPT</span>
                  </a>
                  <a
                    href={format.pdf}
                    download={`${format.fileName}.pdf`}
                    className="t-content inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE] font-semibold! transition-colors"
                  >
                    <Download className="size-5" strokeWidth={2.2} />
                    <span>PDF</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}