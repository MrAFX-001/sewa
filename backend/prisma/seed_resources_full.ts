import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding comprehensive live resources into PostgreSQL...");

  // 1. Hero Slides (Real DTU Campus & Event Slides)
  await prisma.heroSlide.deleteMany();
  await prisma.heroSlide.createMany({
    data: [
      {
        title: "DTU Main Campus Aerial Panorama",
        subtitle: "Rashtriya Youth Innovation Challenge 2026 - Central Hub & Arena",
        imageUrl: "/uploads/resources/dtu-campus-aerial.jpeg",
        displayOrder: 1,
        active: true,
      },
      {
        title: "Academic & Research Innovation Blocks",
        subtitle: "Interdisciplinary Research Laboratories and Incubation Center",
        imageUrl: "/uploads/resources/campus2.jpeg",
        displayOrder: 2,
        active: true,
      },
      {
        title: "Advanced Fabrication & Robotics Labs",
        subtitle: "State-of-the-Art Prototyping Infrastructure for Innovators",
        imageUrl: "/uploads/resources/campus3.jpg",
        displayOrder: 3,
        active: true,
      },
      {
        title: "Central Library & Green Campus Commons",
        subtitle: "Collaborative Study and Hardware Exhibition Spaces",
        imageUrl: "/uploads/resources/campus4.jpeg",
        displayOrder: 4,
        active: true,
      },
    ],
  });

  // 2. Real Challenge FAQs (All 12 Official FAQs)
  await prisma.faqItem.deleteMany();
  await prisma.faqItem.createMany({
    data: [
      {
        question: "What is SEVA FIRST – Rashtriya Youth Innovation Challenge 2026?",
        answer: "SEVA FIRST is a national youth innovation initiative that encourages young minds to identify real-world challenges and develop affordable, sustainable and implementable solutions for society and the nation.",
        category: "general",
        displayOrder: 1,
        active: true,
      },
      {
        question: "Who can participate in the Challenge?",
        answer: "Students, young innovators, researchers, technology teams, startups and eligible institutions can participate, subject to the eligibility criteria specified in the Challenge guidelines.",
        category: "eligibility",
        displayOrder: 2,
        active: true,
      },
      {
        question: "Who is the Regional Coordinator for the Northern Region?",
        answer: "Delhi Technological University (DTU) is the Regional Coordinator for the Northern Region. The region includes J&K, Ladakh, Himachal Pradesh, Uttarakhand, Chandigarh, Delhi, Punjab, Haryana and Uttar Pradesh.",
        category: "general",
        displayOrder: 3,
        active: true,
      },
      {
        question: "Do I need a fully developed product to participate?",
        answer: "No. Participants can begin with an early-stage idea (TRL 1-3) for local/regional/state and TRL (4-6) for national level may participate and progressively develop it through the Challenge towards a functional prototype.",
        category: "eligibility",
        displayOrder: 4,
        active: true,
      },
      {
        question: "Can I propose a solution to a local problem?",
        answer: "Yes. Local and community-level problems are strongly encouraged. Solutions should be affordable, sustainable, practical and capable of being replicated or scaled. Broad area categories may be referred to in the Problem Statements page.",
        category: "general",
        displayOrder: 5,
        active: true,
      },
      {
        question: "How will the innovations be evaluated?",
        answer: "Evaluation will be done in stages by eminent jury members on the basis of rubrics assessing problem-solution fit, technical novelty, feasibility, and grassroots deployment impact.",
        category: "evaluation",
        displayOrder: 6,
        active: true,
      },
      {
        question: "Can interdisciplinary teams participate?",
        answer: "Yes. Interdisciplinary teams are encouraged to combine expertise from technology, engineering, design, entrepreneurship and other relevant domains to create stronger solutions.",
        category: "eligibility",
        displayOrder: 7,
        active: true,
      },
      {
        question: "Will participants receive mentorship?",
        answer: "Participants will get opportunities to interact with mentors, innovators, academia, industry, startups and government stakeholders for technical guidance and further development of their innovations.",
        category: "general",
        displayOrder: 8,
        active: true,
      },
      {
        question: "Can outside college students and inter-college teams register?",
        answer: "Yes. Students from different colleges can form an inter-college team, subject to the eligibility criteria and submission requirements specified in the Challenge guidelines. Teams should nominate one member as the designated team representative for communication and coordination.",
        category: "registration",
        displayOrder: 9,
        active: true,
      },
      {
        question: "Can I participate in more than one challenge?",
        answer: "Yes, the participants are welcome to submit proposals in various challenges.",
        category: "eligibility",
        displayOrder: 10,
        active: true,
      },
      {
        question: "How can teams submit complaints or technical grievances regarding evaluation?",
        answer: "Teams can submit their complaints or technical grievances through the 'Contact Us' form on the official Challenge website or by emailing the designated grievance email address. All grievances should include the team details, issue description and relevant supporting information.",
        category: "support",
        displayOrder: 11,
        active: true,
      },
      {
        question: "How can I register for the Challenge?",
        answer: "Participants can register through the SEVA FIRST registration portal during the specified registration period. Applicants should provide the required participant, team and innovation details and complete the submission process.",
        category: "registration",
        displayOrder: 12,
        active: true,
      },
      {
        question: "How will I be notified about various updates?",
        answer: "Registered participants will receive important updates through their registered email address and official SEVA FIRST communication channels. Participants are advised to regularly check the official website and their email for announcements, deadlines and other updates.",
        category: "support",
        displayOrder: 13,
        active: true,
      },
    ],
  });

  // 3. Complete Committee & Mentors Roster with Photos
  await prisma.committeeMember.deleteMany();
  await prisma.committeeMember.createMany({
    data: [
      {
        name: "Prof. Prateek Kumar",
        designation: "Patron & Vice Chancellor",
        category: "organizing",
        affiliation: "Delhi Technological University",
        imageUrl: "/uploads/resources/mrvc.jpeg",
        displayOrder: 1,
      },
      {
        name: "Prof. K.C. Tiwari",
        designation: "Coordinator-1",
        category: "organizing",
        affiliation: "Delhi Technological University",
        imageUrl: "/uploads/resources/mrkctiwari.jpeg",
        displayOrder: 2,
      },
      {
        name: "Prof. Girish Kumar",
        designation: "Coordinator-2",
        category: "organizing",
        affiliation: "Delhi Technological University",
        imageUrl: "/uploads/resources/mrgirish.png",
        displayOrder: 3,
      },
      {
        name: "Kaustubh Ranjan Singh",
        designation: "Design and Development Head",
        category: "dev_team",
        affiliation: "DTU Delhi",
        imageUrl: "/uploads/resources/mrkaustubh.jpeg",
        displayOrder: 1,
      },
      {
        name: "Prof. Shailender Kumar",
        designation: "Head, Computer Center",
        category: "dev_team",
        affiliation: "DTU Delhi",
        imageUrl: "/uploads/resources/mrshailendra.jpeg",
        displayOrder: 2,
      },
      {
        name: "Dr. Anamika Chauhan",
        designation: "Co-Coordinator",
        category: "dev_team",
        affiliation: "DTU Delhi",
        imageUrl: "/uploads/resources/msanamika.jpeg",
        displayOrder: 3,
      },
      {
        name: "Dr. Trasha Gupta",
        designation: "Co-Coordinator",
        category: "dev_team",
        affiliation: "DTU Delhi",
        imageUrl: "/uploads/resources/mstrasha.jpeg",
        displayOrder: 4,
      },
      {
        name: "Dr. Anshul Arora",
        designation: "Co-Coordinator",
        category: "dev_team",
        affiliation: "DTU Delhi",
        imageUrl: "/uploads/resources/mranshul.jpeg",
        displayOrder: 5,
      },
      {
        name: "Mr. Vikas",
        designation: "System Manager, Computer Center",
        category: "dev_team",
        affiliation: "DTU Delhi",
        imageUrl: "/uploads/resources/mrvikas.jpeg",
        displayOrder: 6,
      },
      {
        name: "Narayan Mishra",
        designation: "Lead Systems Architect",
        category: "dev_team",
        affiliation: "DTU",
        imageUrl: "/uploads/resources/mrnarayan.jpeg",
        displayOrder: 7,
      },
      {
        name: "Ankit Kumar Roy",
        designation: "Fullstack Platform Engineer & Super Admin",
        category: "dev_team",
        affiliation: "DTU",
        imageUrl: "/uploads/resources/mrankit.png",
        displayOrder: 8,
      },
      {
        name: "Daksh Panchal",
        designation: "Robotics & Hardware Systems",
        category: "dev_team",
        affiliation: "DTU",
        imageUrl: "/uploads/resources/mrdaksh.JPG",
        displayOrder: 9,
      },
      {
        name: "Vedant Singh",
        designation: "Embedded Systems Specialist",
        category: "dev_team",
        affiliation: "DTU",
        imageUrl: "/uploads/resources/mrvedant.jpeg",
        displayOrder: 10,
      },
      {
        name: "Afroz Hadil Pookkodan",
        designation: "Machine Learning & AI Lead",
        category: "dev_team",
        affiliation: "DTU",
        imageUrl: "/uploads/resources/mrafroz.jpeg",
        displayOrder: 11,
      },
      {
        name: "Ilisha Dabas",
        designation: "Product Design & Frontend Lead",
        category: "dev_team",
        affiliation: "DTU",
        imageUrl: "/uploads/resources/msilisha.jpeg",
        displayOrder: 12,
      },
      {
        name: "Suraj Jaiswal",
        designation: "Fullstack Developer",
        category: "dev_team",
        affiliation: "DTU",
        imageUrl: "/uploads/resources/mrsuraj.jpeg",
        displayOrder: 13,
      },
      {
        name: "Prakhar Awasthi",
        designation: "DevOps & Cloud Infrastructure",
        category: "dev_team",
        affiliation: "DTU",
        imageUrl: "/uploads/resources/mrprakhar.jpeg",
        displayOrder: 14,
      },
      {
        name: "Soumya Saurav Das",
        designation: "Backend & Database Engineer",
        category: "dev_team",
        affiliation: "DTU",
        imageUrl: "/uploads/resources/mrsoumya.jpeg",
        displayOrder: 15,
      },
      {
        name: "Sudhanshu Shekhar",
        designation: "Security & Testing Engineer",
        category: "dev_team",
        affiliation: "DTU",
        imageUrl: "/uploads/resources/mrsudhanshu.jpeg",
        displayOrder: 16,
      },
      {
        name: "John",
        designation: "PM",
        category: "dev_team",
        affiliation: "Delhi Technological University",
        imageUrl: "/uploads/resources/99b25641-4725-41cd-b9d7-895b7a1e8601.svg",
        displayOrder: 20,
      },
      {
        name: "Dr. Ananya Ray",
        designation: "Chief Mentor, Healthcare Track",
        category: "mentor",
        affiliation: "AIIMS New Delhi",
        imageUrl: null,
        displayOrder: 1,
      },
      {
        name: "Dr. Sandeep Singh",
        designation: "Senior Advisor, AgriTech Innovation",
        category: "mentor",
        affiliation: "ICAR New Delhi",
        imageUrl: null,
        displayOrder: 2,
      },
    ],
  });

  // 4. Media Gallery
  await prisma.galleryImage.deleteMany();
  await prisma.galleryImage.createMany({
    data: [
      {
        title: "DTU Central Campus Panorama",
        url: "/uploads/resources/dtu-campus-aerial.jpeg",
        active: true,
        displayOrder: 1,
      },
      {
        title: "Academic Complex & Research Facilities",
        url: "/uploads/resources/campus2.jpeg",
        active: true,
        displayOrder: 2,
      },
      {
        title: "Robotics & Rapid Prototyping Workshop",
        url: "/uploads/resources/campus3.jpg",
        active: true,
        displayOrder: 3,
      },
      {
        title: "Central Library Amphitheatre Grounds",
        url: "/uploads/resources/campus4.jpeg",
        active: true,
        displayOrder: 4,
      },
      {
        title: "Student Innovators Working on Hardware Prototypes",
        url: "/uploads/resources/sewa-students.jpg",
        active: true,
        displayOrder: 5,
      },
    ],
  });

  // 5. Official Announcements & Circular Bulletins
  await prisma.announcement.deleteMany();
  await prisma.announcement.createMany({
    data: [
      {
        refNumber: "DTU/SEVA/2026/CIR-08",
        category: "Announcements",
        title: "The portal launch event to be graced by Hon'ble Chief Minister of Delhi Smt. Rekha Gupta on 19th Sept",
        summary: "The official portal launch event of SEVA FIRST 2026 will be graced by the Hon'ble Chief Minister of Delhi, Smt. Rekha Gupta, on 19th September 2026.",
        detail: "The launch event marks the official unveiling of the problem statements, opening of registrations, and introduction of the innovation roadmap.",
        publishedAt: new Date("2026-09-17T12:00:00.000Z"),
      },
      {
        refNumber: "SEVA-CIR-01",
        category: "Problem Statements",
        title: "Release of UDAN Phase 1 Problem Statements & Evaluation Rubrics",
        summary: "Detailed problem statements across five national themes are now available. Registered teams should review the official submission template and evaluation rubrics.",
        detail: "Problem statements span AgriTech, Clean Energy, Healthcare & Biomedical, Smart Mobility, and Industry 4.0. Teams can download the Phase 1 submission dossier from their dashboard.",
        publishedAt: new Date("2026-09-14T05:00:13.988Z"),
      },
      {
        refNumber: "SEVA-CIR-02",
        category: "Mentorship",
        title: "DTU Central Innovation Labs & Prototyping Workshop Schedule",
        summary: "Shortlisted teams receive access to prototyping machinery, testing facilities and dedicated faculty mentors across engineering departments.",
        detail: "Hands-on sessions will be held at DTU Central Fabrication Facilities including 5-axis CNC machining, laser cutting, PCB fabrication, and high-performance computing clusters.",
        publishedAt: new Date("2026-09-14T05:00:13.998Z"),
      },
      {
        refNumber: "SEVA-CIR-03",
        category: "Guidelines",
        title: "Inter-Disciplinary Team Registration & Eligibility Norms",
        summary: "Teams may comprise two to five members from accredited universities, polytechnics or eligible early-stage student startups.",
        detail: "Cross-departmental collaboration is strongly prioritized. Teams must submit institutional verification letters by 20 September 2026.",
        publishedAt: new Date("2026-09-14T05:00:14.001Z"),
      },
      {
        refNumber: "SEVA-CIR-04",
        category: "Mentorship",
        title: "Technical Webinar on Patent Filing & IP Protection for Innovators",
        summary: "Join leading patent attorneys and incubator directors for a practical masterclass on protecting your innovation prior to public exhibitions.",
        detail: "Key topics include patent prior-art searches, provisional patent filing procedures, copyright for embedded firmware, and commercialization licensing strategies.",
        publishedAt: new Date("2026-09-14T05:00:14.005Z"),
      },
      {
        refNumber: "SEVA-CIR-05",
        category: "Evaluation",
        title: "Regional Hub Screening Criteria & UDAN Milestone 1 Deliverables",
        summary: "Screening committees across five regional hubs will evaluate entries on technical novelty, feasibility, and grassroots deployment impact.",
        detail: "Evaluations follow a standardized 100-point rubric assessing problem-solution fit (30%), engineering feasibility (30%), scalability (20%), and execution roadmap (20%).",
        publishedAt: new Date("2026-09-14T05:00:14.008Z"),
      },
      {
        refNumber: "SEVA-CIR-06",
        category: "Announcements",
        title: "Seed Grant Allocation & Incubation Fast-Track for Top Finalists",
        summary: "Top 25 validated prototypes receive direct equity-free prototype grants and incubation opportunities at DTU IIF.",
        detail: "Grants up to ₹5,00,000 per team alongside dedicated co-working spaces, cloud credits, and pilot deployment testing with institutional partners.",
        publishedAt: new Date("2026-09-14T05:00:14.012Z"),
      },
      {
        refNumber: "DTU/SEVA/2026/CIR-07",
        category: "circular",
        title: "Official Guidelines for Prototype Demonstration Released",
        summary: "All shortlisted regional teams are invited to review the prototype validation rubrics ahead of Stage 2.",
        detail: "Stage 2 evaluations will feature physical and live digital prototype demonstrations before an expert jury from industry and academia.",
        publishedAt: new Date("2026-09-16T13:55:09.775Z"),
      },
    ],
  });

  const heroCount = await prisma.heroSlide.count();
  const faqCount = await prisma.faqItem.count();
  const commCount = await prisma.committeeMember.count();
  const galleryCount = await prisma.galleryImage.count();
  const annCount = await prisma.announcement.count();

  console.log("Database seeded successfully with live resources:", {
    heroSlides: heroCount,
    faqs: faqCount,
    committeeMembers: commCount,
    galleryImages: galleryCount,
    announcements: annCount,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
