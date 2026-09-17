import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const COMMITTEE_DATA = [
  {
    "id": "11111111-1111-4111-a111-111111111101",
    "name": "Shri Narendra Modi",
    "designation": "Hon'ble Prime Minister of India",
    "category": "organizing",
    "affiliation": "Government of India",
    "imageUrl": "/uploads/resources/pm-modi.webp",
    "rowNumber": 1,
    "rowTitle": "chief_patron",
    "displayOrder": 1
  },
  {
    "id": "11111111-1111-4111-a111-111111111102",
    "name": "Smt. Atishi",
    "designation": "Hon'ble Chief Minister of Delhi",
    "category": "organizing",
    "affiliation": "Govt. of NCT of Delhi",
    "imageUrl": "/uploads/resources/cm-delhi.webp",
    "rowNumber": 1,
    "rowTitle": "chief_patron",
    "displayOrder": 2
  },
  {
    "id": "11111111-1111-4111-a111-111111111103",
    "name": "Shri Dharmendra Pradhan",
    "designation": "Hon'ble Minister of Education, Govt. of India",
    "category": "organizing",
    "affiliation": "Ministry of Education, Govt. of India",
    "imageUrl": "/uploads/resources/education-minister.webp",
    "rowNumber": 1,
    "rowTitle": "chief_patron",
    "displayOrder": 3
  },
  {
    "id": "41cd0447-e4f8-4f70-bde3-f578cf98d001",
    "name": "Prof. Prateek Kumar",
    "designation": "Patron & Vice Chancellor",
    "category": "organizing",
    "affiliation": "Delhi Technological University",
    "imageUrl": "/uploads/resources/mrvc.jpeg",
    "rowNumber": 2,
    "rowTitle": "patron",
    "displayOrder": 1
  },
  {
    "id": "85613a93-f652-4be8-a91d-70c215e4f05f",
    "name": "Narayan Mishra",
    "designation": "Lead Systems Architect",
    "category": "dev_team",
    "affiliation": "DTU",
    "imageUrl": "/uploads/resources/mrnarayan.jpeg",
    "rowNumber": 5,
    "rowTitle": "student",
    "displayOrder": 1
  },
  {
    "id": "bcf47b81-8927-43ff-8760-a6988fbcbfaf",
    "name": "Daksh Panchal",
    "designation": "Robotics & Hardware Systems",
    "category": "dev_team",
    "affiliation": "DTU",
    "imageUrl": "/uploads/resources/mrdaksh.JPG",
    "rowNumber": 5,
    "rowTitle": "student",
    "displayOrder": 2
  },
  {
    "id": "400c967e-f913-45a3-80f9-9ae540056e90",
    "name": "Ankit Kumar Roy",
    "designation": "Fullstack Platform Engineer & Super Admin",
    "category": "dev_team",
    "affiliation": "DTU",
    "imageUrl": "/uploads/resources/mrankit.png",
    "rowNumber": 5,
    "rowTitle": "student",
    "displayOrder": 3
  },
  {
    "id": "3b0cc7f7-8537-41a8-8ccc-48ea5e1b5059",
    "name": "Vedant Singh",
    "designation": "Embedded Systems Specialist",
    "category": "dev_team",
    "affiliation": "DTU",
    "imageUrl": "/uploads/resources/mrvedant.jpeg",
    "rowNumber": 5,
    "rowTitle": "student",
    "displayOrder": 4
  },
  {
    "id": "d3e25695-a236-4618-a345-147530f164f3",
    "name": "Afroz Hadil Pookkodan",
    "designation": "Machine Learning & AI Lead",
    "category": "dev_team",
    "affiliation": "DTU",
    "imageUrl": "/uploads/resources/mrafroz.jpeg",
    "rowNumber": 5,
    "rowTitle": "student",
    "displayOrder": 5
  },
  {
    "id": "1eb6d682-3371-4b89-b6d7-0901e990e2c3",
    "name": "Ilisha Dabas",
    "designation": "Product Design & Frontend Lead",
    "category": "dev_team",
    "affiliation": "DTU",
    "imageUrl": "/uploads/resources/msilisha.jpeg",
    "rowNumber": 5,
    "rowTitle": "student",
    "displayOrder": 6
  },
  {
    "id": "31e60375-3552-423f-b90e-a73a82e6afa2",
    "name": "Prakhar Awasthi",
    "designation": "DevOps & Cloud Infrastructure",
    "category": "dev_team",
    "affiliation": "DTU",
    "imageUrl": "/uploads/resources/mrprakhar.jpeg",
    "rowNumber": 5,
    "rowTitle": "student",
    "displayOrder": 7
  },
  {
    "id": "2550fced-ef6e-45ea-b049-3c99aa02c970",
    "name": "Prof. K.C. Tiwari",
    "designation": "Coordinator-1",
    "category": "organizing",
    "affiliation": "Delhi Technological University",
    "imageUrl": "/uploads/resources/mrkctiwari.jpeg",
    "rowNumber": 3,
    "rowTitle": "coordinator",
    "displayOrder": 1
  },
  {
    "id": "5ff3fe9d-f2ad-487d-a12d-51d4955f4bc4",
    "name": "Prof. Girish Kumar",
    "designation": "Coordinator-2",
    "category": "organizing",
    "affiliation": "Delhi Technological University",
    "imageUrl": "/uploads/resources/mrgirish.png",
    "rowNumber": 3,
    "rowTitle": "coordinator",
    "displayOrder": 2
  },
  {
    "id": "04cf4f40-dba8-481f-9fa5-8085c906d265",
    "name": "Kaustubh Ranjan Singh",
    "designation": "Design and Development Head",
    "category": "dev_team",
    "affiliation": "DTU Delhi",
    "imageUrl": "/uploads/resources/mrkaustubh.jpeg",
    "rowNumber": 4,
    "rowTitle": "faculty",
    "displayOrder": 1
  },
  {
    "id": "3d642cf4-1587-4701-84a4-ecdc55108bf5",
    "name": "Prof. Shailender Kumar",
    "designation": "Head, Computer Center",
    "category": "dev_team",
    "affiliation": "DTU Delhi",
    "imageUrl": "/uploads/resources/mrshailendra.jpeg",
    "rowNumber": 4,
    "rowTitle": "faculty",
    "displayOrder": 2
  },
  {
    "id": "59f49002-c571-4225-8a34-d7905a8d663a",
    "name": "Dr. Anamika Chauhan",
    "designation": "Co-Coordinator",
    "category": "dev_team",
    "affiliation": "DTU Delhi",
    "imageUrl": "/uploads/resources/msanamika.jpeg",
    "rowNumber": 4,
    "rowTitle": "faculty",
    "displayOrder": 3
  },
  {
    "id": "cc584cb5-0c5e-4073-8268-4a4aa94af9d5",
    "name": "Dr. Trasha Gupta",
    "designation": "Co-Coordinator",
    "category": "dev_team",
    "affiliation": "DTU Delhi",
    "imageUrl": "/uploads/resources/mstrasha.jpeg",
    "rowNumber": 4,
    "rowTitle": "faculty",
    "displayOrder": 4
  },
  {
    "id": "b3d34580-29c6-4714-be1a-9eb180c5df8b",
    "name": "Dr. Anshul Arora",
    "designation": "Co-Coordinator",
    "category": "dev_team",
    "affiliation": "DTU Delhi",
    "imageUrl": "/uploads/resources/mranshul.jpeg",
    "rowNumber": 4,
    "rowTitle": "faculty",
    "displayOrder": 5
  },
  {
    "id": "699edefb-db00-47c1-a4f2-b82325c43d7c",
    "name": "Mr. Vikas",
    "designation": "System Manager, Computer Center",
    "category": "dev_team",
    "affiliation": "DTU Delhi",
    "imageUrl": "/uploads/resources/mrvikas.jpeg",
    "rowNumber": 4,
    "rowTitle": "faculty",
    "displayOrder": 6
  },
  {
    "id": "aba8249f-b4dd-4c6f-ace6-736ad9f5dcc8",
    "name": "Name",
    "designation": "Designation",
    "category": "mentor",
    "affiliation": "Delhi Technological University",
    "imageUrl": null,
    "rowNumber": 3,
    "rowTitle": "mentor",
    "displayOrder": 1
  },
  {
    "id": "32e0a5a7-9581-4e17-bd22-1213524eb849",
    "name": "Name",
    "designation": "Designation",
    "category": "mentor",
    "affiliation": "Delhi Technological University",
    "imageUrl": null,
    "rowNumber": 3,
    "rowTitle": "mentor",
    "displayOrder": 2
  },
  {
    "id": "4ab1dead-a09c-4c4c-9021-d7f2547f8a92",
    "name": "Name",
    "designation": "Designation",
    "category": "mentor",
    "affiliation": "Delhi Technological University",
    "imageUrl": null,
    "rowNumber": 3,
    "rowTitle": "mentor",
    "displayOrder": 3
  },
  {
    "id": "adaa49d1-44b1-4f80-bae0-f86264643597",
    "name": "Name",
    "designation": "Designation",
    "category": "mentor",
    "affiliation": "Delhi Technological University",
    "imageUrl": null,
    "rowNumber": 3,
    "rowTitle": "mentor",
    "displayOrder": 4
  },
  {
    "id": "aca9de45-8cba-4141-ab0e-393a7755be9c",
    "name": "Name",
    "designation": "Designation",
    "category": "mentor",
    "affiliation": "Delhi Technological University",
    "imageUrl": null,
    "rowNumber": 3,
    "rowTitle": "mentor",
    "displayOrder": 5
  },
  {
    "id": "e3220d5f-3329-428e-88f1-c5e13f20e08a",
    "name": "Name",
    "designation": "Designation",
    "category": "mentor",
    "affiliation": "Delhi Technological University",
    "imageUrl": null,
    "rowNumber": 3,
    "rowTitle": "mentor",
    "displayOrder": 6
  },
  {
    "id": "896ecf0a-b0ba-463e-8c5f-701337abe2ce",
    "name": "Name",
    "designation": "Designation",
    "category": "mentor",
    "affiliation": "Delhi Technological University",
    "imageUrl": null,
    "rowNumber": 3,
    "rowTitle": "mentor",
    "displayOrder": 7
  },
  {
    "id": "394959f4-993b-475c-b9e4-f97f9b96e2a5",
    "name": "Name",
    "designation": "Designation",
    "category": "mentor",
    "affiliation": "Delhi Technological University",
    "imageUrl": null,
    "rowNumber": 3,
    "rowTitle": "mentor",
    "displayOrder": 8
  },
  {
    "id": "c7cd81bf-7d07-4270-8787-e727b737f9ac",
    "name": "Suraj Jaiswal",
    "designation": "Fullstack Developer",
    "category": "dev_team",
    "affiliation": "DTU",
    "imageUrl": "/uploads/resources/mrsuraj.jpeg",
    "rowNumber": 5,
    "rowTitle": "student",
    "displayOrder": 8
  },
  {
    "id": "e3f2484a-436f-46e7-a233-8bb10d4ee4d6",
    "name": "Sudhanshu Shekhar",
    "designation": "Security & Testing Engineer",
    "category": "dev_team",
    "affiliation": "DTU",
    "imageUrl": "/uploads/resources/mrsudhanshu.jpeg",
    "rowNumber": 5,
    "rowTitle": "student",
    "displayOrder": 9
  },
  {
    "id": "663839cc-923d-4d2c-a234-ab3b8cb9936f",
    "name": "Soumya Saurav Das",
    "designation": "Backend & Database Engineer",
    "category": "dev_team",
    "affiliation": "DTU",
    "imageUrl": "/uploads/resources/mrsoumya.jpeg",
    "rowNumber": 5,
    "rowTitle": "student",
    "displayOrder": 10
  }
];

const THEMES_DATA = [
  {
    "id": "7b8805aa-fff6-4c8c-ac7e-922fdb042a76",
    "code": "NAT-001",
    "theme": "NATIONAL",
    "label": "Defence, Intelligence, Space & National Security",
    "psTitle": "PS1 TITLE",
    "psUrl": null,
    "psId": "NAT-001-PS",
    "openId": "NAT-001-OP",
    "badgeBg": "#FDE8E8",
    "badgeText": "#E03137",
    "displayOrder": 1,
    "active": true
  },
  {
    "id": "79a6fceb-be60-4f26-9395-b7de54270890",
    "code": "NAT-002",
    "theme": "NATIONAL",
    "label": "Disaster Management & Resilience",
    "psTitle": "PS2 TITLE",
    "psUrl": null,
    "psId": "NAT-002-PS",
    "openId": "NAT-002-OP",
    "badgeBg": "#DBEAFE",
    "badgeText": "#0284C7",
    "displayOrder": 2,
    "active": true
  },
  {
    "id": "60c19eb7-a906-43ac-b46a-f37697648318",
    "code": "NAT-003",
    "theme": "NATIONAL",
    "label": "Manufacturing & Electronics, AI, Robotics & Autonomous Systems",
    "psTitle": "PS3 TITLE",
    "psUrl": null,
    "psId": "NAT-003-PS",
    "openId": "NAT-003-OP",
    "badgeBg": "#DCFCE7",
    "badgeText": "#16A34A",
    "displayOrder": 3,
    "active": true
  },
  {
    "id": "6d8c70b0-cc83-41c7-8dcd-fd9538941736",
    "code": "NAT-004",
    "theme": "NATIONAL",
    "label": "Energy & Sustainable Technology & Environment",
    "psTitle": "PS4 TITLE",
    "psUrl": null,
    "psId": "NAT-004-PS",
    "openId": "NAT-004-OP",
    "badgeBg": "#FEF3C7",
    "badgeText": "#D97706",
    "displayOrder": 4,
    "active": true
  },
  {
    "id": "54e1363b-615e-46ab-afb3-fbd8a0134858",
    "code": "NAT-005",
    "theme": "NATIONAL",
    "label": "Advanced Engineering, Infrastructure, Future Mobility & Transportation",
    "psTitle": "PS5 TITLE",
    "psUrl": null,
    "psId": "NAT-005-PS",
    "openId": "NAT-005-OP",
    "badgeBg": "#EDE9FE",
    "badgeText": "#7C3AED",
    "displayOrder": 5,
    "active": true
  },
  {
    "id": "7178e3fe-4fd2-45e3-9408-eaf7c17e5a97",
    "code": "REG-001",
    "theme": "REGIONAL",
    "label": "Village & Panchayat Development, Agriculture & Rural Economy",
    "psTitle": null,
    "psUrl": null,
    "psId": null,
    "openId": "REG-001-OP",
    "badgeBg": "#FDE8E8",
    "badgeText": "#E03137",
    "displayOrder": 1,
    "active": true
  },
  {
    "id": "7df4e9bf-017e-4d22-8d7d-79897063a535",
    "code": "REG-002",
    "theme": "REGIONAL",
    "label": "Education & Skill Development",
    "psTitle": null,
    "psUrl": null,
    "psId": null,
    "openId": "REG-002-OP",
    "badgeBg": "#DBEAFE",
    "badgeText": "#0284C7",
    "displayOrder": 2,
    "active": true
  },
  {
    "id": "1ac4b3e3-5296-44e6-aaa1-2bc6e5c4dd7f",
    "code": "REG-003",
    "theme": "REGIONAL",
    "label": "Healthcare & Community Well-being",
    "psTitle": null,
    "psUrl": null,
    "psId": null,
    "openId": "REG-003-OP",
    "badgeBg": "#DCFCE7",
    "badgeText": "#16A34A",
    "displayOrder": 3,
    "active": true
  },
  {
    "id": "a9e3825c-4f92-4bee-9c97-bdd8c6b2ebbc",
    "code": "REG-004",
    "theme": "REGIONAL",
    "label": "City & Urban Problems",
    "psTitle": null,
    "psUrl": null,
    "psId": null,
    "openId": "REG-004-OP",
    "badgeBg": "#FEF3C7",
    "badgeText": "#D97706",
    "displayOrder": 4,
    "active": true
  },
  {
    "id": "b4cb89fa-8100-4b2a-9864-d93be49e670d",
    "code": "REG-005",
    "theme": "REGIONAL",
    "label": "Environment & Natural Resources",
    "psTitle": null,
    "psUrl": null,
    "psId": null,
    "openId": "REG-005-OP",
    "badgeBg": "#EDE9FE",
    "badgeText": "#7C3AED",
    "displayOrder": 5,
    "active": true
  },
  {
    "id": "4b7cb8e7-8e35-4969-a411-355648c3b205",
    "code": "REG-006",
    "theme": "REGIONAL",
    "label": "Sports (Khelo India)",
    "psTitle": null,
    "psUrl": null,
    "psId": null,
    "openId": "REG-006-OP",
    "badgeBg": "#FDE8E8",
    "badgeText": "#E03137",
    "displayOrder": 6,
    "active": true
  },
  {
    "id": "bdccc0d8-c191-4d2b-935a-acf3bb7c10e2",
    "code": "REG-007",
    "theme": "REGIONAL",
    "label": "Employment & Livelihood",
    "psTitle": null,
    "psUrl": null,
    "psId": null,
    "openId": "REG-007-OP",
    "badgeBg": "#DBEAFE",
    "badgeText": "#0284C7",
    "displayOrder": 7,
    "active": true
  },
  {
    "id": "678597de-d209-4d2b-b2d6-a3eceddd3fba",
    "code": "REG-008",
    "theme": "REGIONAL",
    "label": "Women & Child Safety and Development",
    "psTitle": null,
    "psUrl": null,
    "psId": null,
    "openId": "REG-008-OP",
    "badgeBg": "#DCFCE7",
    "badgeText": "#16A34A",
    "displayOrder": 8,
    "active": true
  },
  {
    "id": "8c3bec4a-1e91-4d32-9976-af70850b9fe5",
    "code": "REG-009",
    "theme": "REGIONAL",
    "label": "Safety & Disaster Management",
    "psTitle": null,
    "psUrl": null,
    "psId": null,
    "openId": "REG-009-OP",
    "badgeBg": "#FEF3C7",
    "badgeText": "#D97706",
    "displayOrder": 9,
    "active": true
  },
  {
    "id": "14f78ebf-0f74-4cde-b434-ae8b7d7c2b18",
    "code": "REG-010",
    "theme": "REGIONAL",
    "label": "Transport, Energy & Tourism",
    "psTitle": null,
    "psUrl": null,
    "psId": null,
    "openId": "REG-010-OP",
    "badgeBg": "#EDE9FE",
    "badgeText": "#7C3AED",
    "displayOrder": 10,
    "active": true
  },
  {
    "id": "12259785-809c-4cd5-b523-cb2ae115085e",
    "code": "REG-011",
    "theme": "REGIONAL",
    "label": "Miscellaneous",
    "psTitle": null,
    "psUrl": null,
    "psId": null,
    "openId": "REG-011-OP",
    "badgeBg": "#FDE8E8",
    "badgeText": "#E03137",
    "displayOrder": 11,
    "active": true
  }
];

const HERO_SLIDES_DATA = [
  {
    "id": "12d8d2b0-d81c-4080-ae89-d0ea0264fb9f",
    "title": "Central Library & Green Campus Commons",
    "subtitle": "Collaborative Study and Hardware Exhibition Spaces",
    "imageUrl": "/uploads/resources/campus4.jpeg",
    "active": true,
    "displayOrder": 4
  },
  {
    "id": "4a0f11a4-8855-45a2-be6d-66a2d784f439",
    "title": "Academic & Research Innovation Blocks",
    "subtitle": "Interdisciplinary Research Laboratories and Incubation Center",
    "imageUrl": "/uploads/resources/campus2.jpeg",
    "active": true,
    "displayOrder": 2
  },
  {
    "id": "2eb51624-f81f-4a2e-bbdf-4b9d4986e0c4",
    "title": "Advanced Fabrication & Robotics Labs",
    "subtitle": "State-of-the-Art Prototyping Infrastructure for Innovators",
    "imageUrl": "/uploads/resources/campus3.jpg",
    "active": true,
    "displayOrder": 3
  },
  {
    "id": "cc9ecda8-94f3-40fc-a7f5-02c434d3b168",
    "title": "uyghj",
    "subtitle": "gyuhjbm",
    "imageUrl": "/uploads/resources/6c232c98-99f6-48ec-86ce-b5724d83cae9.jpeg",
    "active": true,
    "displayOrder": 5
  },
  {
    "id": "ab288b04-79fd-4c22-b7d1-9d9383c77a94",
    "title": "DTU Main Campus Aerial Panorama",
    "subtitle": "Rashtriya Youth Innovation Challenge 2026 - Central Hub & Arena",
    "imageUrl": "/uploads/resources/dtu-campus-aerial.jpeg",
    "active": true,
    "displayOrder": 1
  }
];

const FAQ_DATA = [
  {
    "id": "3ad119bf-51d8-4c05-aa58-c08361892c89",
    "question": "Can interdisciplinary teams participate?",
    "answer": "Yes. Interdisciplinary teams are encouraged to combine expertise from technology, engineering, design, entrepreneurship and other relevant domains to create stronger solutions.",
    "category": "eligibility",
    "displayOrder": 7,
    "active": false
  },
  {
    "id": "79a9e075-c89d-4314-8ff7-327a7d55b457",
    "question": "How will the innovations be evaluated?",
    "answer": "Evaluation will be done in stages by eminent jury members on the basis of rubrics assessing problem-solution fit, technical novelty, feasibility, and grassroots deployment impact.",
    "category": "evaluation",
    "displayOrder": 6,
    "active": false
  },
  {
    "id": "0c134044-a536-4458-a94b-c9fb2f864512",
    "question": "What is SEWA FIRST – Rashtriya Youth Innovation Challenge 2026?",
    "answer": "SEWA FIRST is a national youth innovation initiative that encourages young minds to identify real-world challenges and develop affordable, sustainable and implementable solutions for society and the nation.",
    "category": "general",
    "displayOrder": 1,
    "active": false
  },
  {
    "id": "7cc60608-c30c-4219-8d72-3284e09d7cf0",
    "question": "Who is the Regional Coordinator for the Northern Region?",
    "answer": "Delhi Technological University (DTU) is the Regional Coordinator for the Northern Region. The region includes J&K, Ladakh, Himachal Pradesh, Uttarakhand, Chandigarh, Delhi, Punjab, Haryana and Uttar Pradesh.",
    "category": "general",
    "displayOrder": 3,
    "active": false
  },
  {
    "id": "07f6e692-db4f-4550-88bb-37b4440a084a",
    "question": "Can I propose a solution to a local problem?",
    "answer": "Yes. Local and community-level problems are strongly encouraged. Solutions should be affordable, sustainable, practical and capable of being replicated or scaled. Broad area categories may be referred to in the Problem Statements page.",
    "category": "general",
    "displayOrder": 5,
    "active": false
  },
  {
    "id": "04b414be-226b-4946-a956-2a8e153e9cf0",
    "question": "Will participants receive mentorship?",
    "answer": "Participants will get opportunities to interact with mentors, innovators, academia, industry, startups and government stakeholders for technical guidance and further development of their innovations.",
    "category": "general",
    "displayOrder": 8,
    "active": false
  },
  {
    "id": "b681714f-f5d4-4c60-9ed8-f5f27e24e6a1",
    "question": "Can outside college students and inter-college teams register?",
    "answer": "Yes. Students from different colleges can form an inter-college team, subject to the eligibility criteria and submission requirements specified in the Challenge guidelines. Teams should nominate one member as the designated team representative for communication and coordination.",
    "category": "registration",
    "displayOrder": 9,
    "active": false
  },
  {
    "id": "e79b14ab-6848-4eec-93fc-8a3ab5437a6f",
    "question": "Who can participate in the Challenge?",
    "answer": "Students, young innovators, researchers, technology teams, startups and eligible institutions can participate, subject to the eligibility criteria specified in the Challenge guidelines.",
    "category": "eligibility",
    "displayOrder": 2,
    "active": true
  },
  {
    "id": "e5c04bb9-2097-4867-b78c-d4b1281e7358",
    "question": "Do I need a fully developed product to participate?",
    "answer": "No. Participants can begin with an early-stage idea (TRL 1-3) for local/regional/state and TRL (4-6) for national level may participate and progressively develop it through the Challenge towards a functional prototype.",
    "category": "eligibility",
    "displayOrder": 4,
    "active": true
  },
  {
    "id": "3a0b2387-1b0d-4ca3-b1fb-9b6cb212cb92",
    "question": "How will I be notified about various updates?",
    "answer": "Registered participants will receive important updates through their registered email address and official SEWA FIRST communication channels. Participants are advised to regularly check the official website and their email for announcements, deadlines and other updates.",
    "category": "support",
    "displayOrder": 12,
    "active": true
  },
  {
    "id": "2db9c573-ce10-41c8-b5d8-00b4c5486e87",
    "question": "How can I register for the Challenge?",
    "answer": "Participants can register through the SEWA FIRST registration portal during the specified registration period. Applicants should provide the required participant, team and innovation details and complete the submission process.",
    "category": "registration",
    "displayOrder": 11,
    "active": false
  },
  {
    "id": "d6a84ae3-7ee5-416a-ad03-6596815dbfe9",
    "question": "How can teams submit complaints or technical grievances regarding evaluation?",
    "answer": "Teams can submit their complaints or technical grievances through the 'Contact Us' form on the official Challenge website or by emailing the designated grievance email address. All grievances should include the team details, issue description and relevant supporting information.",
    "category": "support",
    "displayOrder": 10,
    "active": false
  }
];

const ANNOUNCEMENTS_DATA = [
  {
    "id": "eef5a614-c8ed-4fc7-90ec-1aa0463a6e21",
    "refNumber": "SEWA-CIR-04",
    "category": "Mentorship",
    "title": "Technical Webinar on Patent Filing & IP Protection for Innovators",
    "summary": "Join leading patent attorneys and incubator directors for a practical masterclass on protecting your innovation prior to public exhibitions.",
    "detail": "Key topics include patent prior-art searches, provisional patent filing procedures, copyright for embedded firmware, and commercialization licensing strategies."
  },
  {
    "id": "26dc7848-eec0-4563-8e9b-0bb9463a10f3",
    "refNumber": "SEWA-CIR-05",
    "category": "Evaluation",
    "title": "Regional Hub Screening Criteria & UDAN Milestone 1 Deliverables",
    "summary": "Screening committees across five regional hubs will evaluate entries on technical novelty, feasibility, and grassroots deployment impact.",
    "detail": "Evaluations follow a standardized 100-point rubric assessing problem-solution fit (30%), engineering feasibility (30%), scalability (20%), and execution roadmap (20%)."
  },
  {
    "id": "b773da6c-8d32-4557-ae57-38521bdb66a6",
    "refNumber": "SEWA-CIR-06",
    "category": "Announcements",
    "title": "Seed Grant Allocation & Incubation Fast-Track for Top Finalists",
    "summary": "Top 25 validated prototypes receive direct equity-free prototype grants and incubation opportunities at DTU IIF.",
    "detail": "Grants up to ₹5,00,000 per team alongside dedicated co-working spaces, cloud credits, and pilot deployment testing with institutional partners."
  },
  {
    "id": "248bcac9-f38b-4e0f-954a-310f6dfd1ccc",
    "refNumber": "DTU/SEWA/2026/CIR-07",
    "category": "newsletter",
    "title": "Official Guidelines for Prototype Demonstration Released",
    "summary": "All shortlisted regional teams are invited to review the prototype validation rubrics ahead of Stage 2.",
    "detail": "Stage 2 evaluations will feature physical and live digital prototype demonstrations before an expert jury from industry and academia. yjshbmnwhsujhwbns"
  },
  {
    "id": "2310a3ed-bf6b-4a4c-87c0-dc500ec5e344",
    "refNumber": "SEWA-CIR-01",
    "category": "Problem Statements",
    "title": "Release of UDAN Phase 1 Problem Statements & Evaluation Rubrics",
    "summary": "Detailed problem statements across five national themes are now available. Registered teams should review the official submission template and evaluation rubrics.",
    "detail": "Problem statements span AgriTech, Clean Energy, Healthcare & Biomedical, Smart Mobility, and Industry 4.0. Teams can download the Phase 1 submission dossier from their dashboard."
  },
  {
    "id": "28482ba7-7441-4e7e-a3a9-599f02a5c1d4",
    "refNumber": "SEWA-CIR-02",
    "category": "Mentorship",
    "title": "DTU Central Innovation Labs & Prototyping Workshop Schedule",
    "summary": "Shortlisted teams receive access to prototyping machinery, testing facilities and dedicated faculty mentors across engineering departments.",
    "detail": "Hands-on sessions will be held at DTU Central Fabrication Facilities including 5-axis CNC machining, laser cutting, PCB fabrication, and high-performance computing clusters."
  },
  {
    "id": "71f1ba1c-f58d-46fd-a72d-8d5f0b9b4e10",
    "refNumber": "SEWA-CIR-03",
    "category": "Guidelines",
    "title": "Inter-Disciplinary Team Registration & Eligibility Norms",
    "summary": "Teams may comprise two to five members from accredited universities, polytechnics or eligible early-stage student startups.",
    "detail": "Cross-departmental collaboration is strongly prioritized. Teams must submit institutional verification letters by 20 September 2026."
  }
];

async function main() {
  console.log("Starting comprehensive database seed...");

  // 1. Seed Super Admin User if none exists
  const adminEmail = "superadmin@dtu.ac.in";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("Admin@123456", 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: "Super",
        lastName: "Admin",
        phone: "9999999999",
        emailVerified: true,
        role: "SUPER_ADMIN",
        status: "active",
      }
    });
    console.log("Seeded Super Admin user:", adminEmail);
  }

  // 2. Seed Committee Members
  for (const item of COMMITTEE_DATA) {
    await prisma.committeeMember.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`✅ Seeded ${COMMITTEE_DATA.length} Committee Members.`);

  // 3. Seed Themes
  for (const item of THEMES_DATA) {
    await prisma.problemCategory.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`✅ Seeded ${THEMES_DATA.length} Themes & Problem Categories.`);

  // 4. Seed Hero Slides
  for (const item of HERO_SLIDES_DATA) {
    await prisma.heroSlide.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`✅ Seeded ${HERO_SLIDES_DATA.length} Hero Slides.`);

  // 5. Seed FAQs
  for (const item of FAQ_DATA) {
    await prisma.faqItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`✅ Seeded ${FAQ_DATA.length} FAQ items.`);

  // 6. Seed Announcements
  for (const item of ANNOUNCEMENTS_DATA) {
    await prisma.announcement.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`Seeded ${ANNOUNCEMENTS_DATA.length} Announcements.`);

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
