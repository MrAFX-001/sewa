import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Users,
  Package,
  TrendingUp,
  Clock,
  ExternalLink,
  Facebook,
  Instagram,
  Search,
  CheckSquare,
  Square,
  Star,
  Trash2,
  Archive,
  Info,
  Edit3,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Shield,
  UploadCloud,
  FileText,
  Mail,
  Send,
  Plus,
  AlertTriangle,
  Layers,
  CheckCircle2,
  Clock3,
  Download,
  Image as ImageIcon,
  Calendar,
  Award,
  BookOpen,
  UserCheck,
  Building,
  Tag,
  Check,
  X,
  Lock,
  RefreshCw,
  UserPlus,
  MessageSquare,
  HelpCircle,
  Radio,
  Newspaper,
  Sparkles,
  Eye,
  EyeOff,
  ArrowUpDown,
  Sliders,
  Globe,
  FileEdit,
} from "lucide-react";
import { Brand } from "./SewaSite";
import { useAuth } from "../lib/auth";
import {
  adminApi,
  resourceApi,
  teamApi,
  profileApi,
  type UserRole,
  type AdminUser,
  type AdminTeam,
  type AdminMailItem,
  type AuditLogItem,
  type AdminStats,
  type CommitteeMemberItem as ApiCommitteeMember,
  type GalleryItem,
  type Team,
  type HeroSlideItem,
  type FaqItem,
  type AnnouncementItem,
  type ThemeCategoryItem,
} from "../lib/api";
import { resolveMediaUrl } from "../lib/utils";
import { getNextAnnouncementId, sortAnnouncementsNewestFirst } from "../lib/announcements";


// ─── Stat Cards Data (for Super Admin & Admin) ──────────────────────────────

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  isUp: boolean;
  timeframe: string;
  icon: React.ReactNode;
  iconBg: string;
}

interface UserAnalyticsRow {
  id: string;
  college: string;
  location: string;
  usersRegistered: number;
  state: string;
  participants: number;
  status: "Delivered" | "Pending" | "Rejected";
}

interface EmailItem {
  id: string;
  sender: string;
  tag: "Primary" | "Work" | "Friends" | "Social";
  subject: string;
  time: string;
  starred?: boolean;
  body?: string;
  folder?: string;
  targetAudience?: string;
}

const INITIAL_EMAILS: EmailItem[] = [];

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "pending" | "suspended" | "Active" | "Pending" | "Suspended";
  joinedDate: string;
  phone?: string | null;
  teamsCount?: number;
}

const INITIAL_USERS: AdminUserRow[] = [];

interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

interface GalleryImageItem {
  id: string;
  title: string;
  url: string;
  active: boolean;
  order: number;
}

const INITIAL_GALLERY: GalleryImageItem[] = [];

interface CommitteeMemberItem {
  id: string;
  name: string;
  designation: string;
  affiliation: string;
  roleType: "Patron" | "Advisory" | "Organizing" | "Technical";
}

const INITIAL_COMMITTEE: CommitteeMemberItem[] = [];

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Active role state - defaults to user role or SUPER_ADMIN
  const [currentRole, setCurrentRole] = useState<UserRole>("MEMBER");

  // Sync role when user profile loads from backend
  useEffect(() => {
    if (user?.role) {
      setCurrentRole(user.role);
    }
  }, [user?.role]);

  // Sidebar navigation tab - role aware
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Filter & Search states
  const [emailSearch, setEmailSearch] = useState("");
  const [selectedMailFolder, setSelectedMailFolder] = useState<
    "Inbox" | "Starred" | "Sent" | "Draft" | "Spam" | "Important" | "Bin"
  >("Inbox");
  const [selectedMailLabel, setSelectedMailLabel] = useState<string | null>(null);
  const [emails, setEmails] = useState<EmailItem[]>(INITIAL_EMAILS);
  const [selectedEmails, setSelectedEmails] = useState<Record<string, boolean>>({});

  // Real Database Statistics
  const [statsData, setStatsData] = useState<AdminStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Interactive Graph Controls
  const [graphMetric, setGraphMetric] = useState<"users" | "teams" | "queries">("users");
  const [graphMode, setGraphMode] = useState<"monthly" | "cumulative">("monthly");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Compose Modal
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTargetAudience, setComposeTargetAudience] = useState("ALL");
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  // Submissions / Team Evaluation State
  const [submissionsList, setSubmissionsList] = useState<AdminTeam[]>([]);
  const [evaluatingTeam, setEvaluatingTeam] = useState<AdminTeam | null>(null);
  const [evalStatus, setEvalStatus] = useState<string>("under_review");
  const [evalScore, setEvalScore] = useState<number>(85);
  const [evalNotes, setEvalNotes] = useState<string>("");

  // Users & Role Management
  const [userList, setUserList] = useState<AdminUserRow[]>(INITIAL_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [roleChangeModal, setRoleChangeModal] = useState<{
    user: AdminUserRow;
    newRole: UserRole;
  } | null>(null);

  // Invite / Add User Modal (Super Admin)
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRoleToAssign, setNewRoleToAssign] = useState<UserRole>("MEMBER");
  const [newPhone, setNewPhone] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Resources & Content State
  const [resourceSubTab, setResourceSubTab] = useState<"hero" | "announcements" | "faqs" | "committee" | "gallery">("hero");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Themes / Problem Categories State
  const [themesList, setThemesList] = useState<ThemeCategoryItem[]>([]);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<ThemeCategoryItem | null>(null);
  const [themeFormCode, setThemeFormCode] = useState("");
  const [themeFormTheme, setThemeFormTheme] = useState<"NATIONAL" | "REGIONAL">("NATIONAL");
  const [themeFormLabel, setThemeFormLabel] = useState("");
  const [themeFormPsTitle, setThemeFormPsTitle] = useState("");
  const [themeFormPsUrl, setThemeFormPsUrl] = useState("");
  const [themeFormOrder, setThemeFormOrder] = useState(1);
  const [themeFormActive, setThemeFormActive] = useState(true);
  const [themeFilterTrack, setThemeFilterTrack] = useState<"ALL" | "NATIONAL" | "REGIONAL">("ALL");
  const [themeSearch, setThemeSearch] = useState("");


  // Hero Slides
  const [heroSlides, setHeroSlides] = useState<HeroSlideItem[]>([]);
  const [heroModalOpen, setHeroModalOpen] = useState(false);
  const [editingHeroSlide, setEditingHeroSlide] = useState<HeroSlideItem | null>(null);
  const [heroFormTitle, setHeroFormTitle] = useState("");
  const [heroFormSubtitle, setHeroFormSubtitle] = useState("");
  const [heroFormImageUrl, setHeroFormImageUrl] = useState("");
  const [heroFormOrder, setHeroFormOrder] = useState(1);
  const [heroFormActive, setHeroFormActive] = useState(true);

  // FAQ Management
  const [faqsList, setFaqsList] = useState<FaqItem[]>([]);
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqFormQuestion, setFaqFormQuestion] = useState("");
  const [faqFormAnswer, setFaqFormAnswer] = useState("");
  const [faqFormCategory, setFaqFormCategory] = useState("general");
  const [faqFormOrder, setFaqFormOrder] = useState(1);
  const [faqFormActive, setFaqFormActive] = useState(true);

  // Announcements & Newsletter
  const [announcementsList, setAnnouncementsList] = useState<AnnouncementItem[]>([]);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [announcementFormTitle, setAnnouncementFormTitle] = useState("");
  const [announcementFormRef, setAnnouncementFormRef] = useState("");
  const [announcementFormCategory, setAnnouncementFormCategory] = useState("general");
  const [announcementFormSummary, setAnnouncementFormSummary] = useState("");
  const [announcementFormDetail, setAnnouncementFormDetail] = useState("");
  const [announcementFormPublishedAt, setAnnouncementFormPublishedAt] = useState("");

  const nextGeneratedAnnouncementId = useMemo(() => {
    return getNextAnnouncementId(announcementsList.map((a) => a.refNumber));
  }, [announcementsList]);

  // Committee Members State
  const [committeeMemberList, setCommitteeMemberList] = useState<ApiCommitteeMember[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMemberItem[]>(INITIAL_COMMITTEE);
  const [committeeModalOpen, setCommitteeModalOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<ApiCommitteeMember | null>(null);
  const [committeeFormName, setCommitteeFormName] = useState("");
  const [committeeFormDesignation, setCommitteeFormDesignation] = useState("");
  const [committeeFormCategory, setCommitteeFormCategory] = useState<"organizing" | "mentor" | "dev_team">("organizing");
  const [committeeFormSubCategory, setCommitteeFormSubCategory] = useState<string>("coordinator");
  const [committeeFormAffiliation, setCommitteeFormAffiliation] = useState("");
  const [committeeFormImageUrl, setCommitteeFormImageUrl] = useState("");
  const [committeeFormOrder, setCommitteeFormOrder] = useState(1);
  const [committeeFilterCategory, setCommitteeFilterCategory] = useState<"all" | "chief_patron" | "organizing" | "mentor" | "dev_team">("all");

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Organizing");
  const [newMemberCategory, setNewMemberCategory] = useState<"organizing" | "mentor" | "dev_team">("organizing");
  const [newMemberAffiliation, setNewMemberAffiliation] = useState("");

  // Resources / Gallery
  const [galleryItems, setGalleryItems] = useState<GalleryImageItem[]>(INITIAL_GALLERY);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  const [galleryFormTitle, setGalleryFormTitle] = useState("");
  const [galleryFormUrl, setGalleryFormUrl] = useState("");
  const [galleryFormOrder, setGalleryFormOrder] = useState(1);

  const [newImageTitle, setNewImageTitle] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  // Real Member Team & Mails from Backend
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [memberMails, setMemberMails] = useState<AdminMailItem[]>([]);
  const [readingMail, setReadingMail] = useState<EmailItem | AdminMailItem | null>(null);

  // ─── Real API Fetchers ───────────────────────────────────────────────────────
  const loadStats = async () => {
    try {
      const res = await adminApi.getStats();
      setStatsData(res);
    } catch (err) {
      console.error("loadStats failed:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await adminApi.getUsers();
      if (res.users) {
        setUserList(res.users);
      }
    } catch (err) {
      console.error("loadUsers failed:", err);
    }
  };

  const loadTeams = async () => {
    try {
      const res = await adminApi.getTeams();
      if (res.teams) {
        setSubmissionsList(res.teams);
      }
    } catch (err) {
      console.error("loadTeams failed:", err);
    }
  };

  const loadMails = async () => {
    try {
      const res = await adminApi.getMail();
      if (res.mails) {
        setEmails(
          res.mails.map((m) => ({
            id: m.id,
            sender: m.sender,
            tag: (m.tag as any) || "Work",
            subject: m.title,
            time: m.time,
            starred: m.starred,
            body: m.body,
            folder: m.folder,
            targetAudience: m.targetAudience,
          })),
        );
      }
    } catch (err) {
      console.error("loadMails failed:", err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await adminApi.getAuditLogs();
      if (res.logs) {
        setAuditLogs(res.logs);
      }
    } catch (err) {
      console.error("loadAuditLogs failed:", err);
    }
  };

  const loadGallery = async () => {
    try {
      const res = await resourceApi.getGalleryImages();
      if (res.items) {
        setGalleryItems(
          res.items.map((g) => ({
            id: g.id,
            title: g.title,
            url: g.url,
            active: g.active,
            order: g.displayOrder,
          })),
        );
      }
    } catch (err) {
      console.error("loadGallery failed:", err);
    }
  };

  const getMemberSubCategory = (m: ApiCommitteeMember): string => {
    if (m.category === "organizing") {
      if (m.rowTitle === "chief_patron" || m.rowTitle === "patron" || m.rowTitle === "coordinator") {
        return m.rowTitle;
      }
      const d = (m.designation || "").toLowerCase();
      if (d.includes("chief patron") || d.includes("patron-in-chief") || d.includes("patron in chief")) {
        return "chief_patron";
      }
      if (d.includes("patron") || d.includes("vice chancellor")) {
        return "patron";
      }
      return "coordinator";
    }
    if (m.category === "dev_team") {
      if (m.rowTitle === "faculty" || m.rowTitle === "student") return m.rowTitle;
      const d = (m.designation || "").toLowerCase();
      const isFaculty =
        d.includes("head") ||
        d.includes("coordinator") ||
        d.includes("manager") ||
        d.includes("prof") ||
        d.includes("dr.");
      return isFaculty ? "faculty" : "student";
    }
    return "mentor";
  };

  const getRowNumberForCategoryAndSub = (category: string, subCategory: string): number => {
    if (category === "organizing") {
      if (subCategory === "chief_patron") return 1;
      if (subCategory === "patron") return 2;
      return 3;
    }
    if (category === "mentor") {
      return 4;
    }
    if (category === "dev_team") {
      return subCategory === "faculty" ? 5 : 6;
    }
    return 1;
  };

  const getGroupMembers = (cat: string, sub: string, excludeId?: string) => {
    return committeeMemberList.filter((m) => {
      if (excludeId && m.id === excludeId) return false;
      if (m.category !== cat) return false;
      return getMemberSubCategory(m) === sub;
    });
  };

  const getNextDisplayOrder = (cat: string, sub: string, excludeId?: string) => {
    const groupMembers = getGroupMembers(cat, sub, excludeId);
    const maxOrder = groupMembers.reduce((max, m) => Math.max(max, m.displayOrder ?? 0), 0);
    return maxOrder + 1;
  };

  /**
   * Computes layout updates so inserting/moving a member to a target order
   * cascades existing members (e.g. order 10 -> 2 shifts 2..9 to 3..10).
   */
  const computeReorderLayout = (
    memberId: string | null,
    targetCat: string,
    targetSub: string,
    targetOrder: number,
    oldCat?: string,
    oldSub?: string,
  ) => {
    const updates: Array<{ id: string; rowNumber: number; displayOrder: number; rowTitle?: string | null }> = [];
    const targetRowNumber = getRowNumberForCategoryAndSub(targetCat, targetSub);

    const targetOthers = committeeMemberList
      .filter((m) => m.id !== memberId && m.category === targetCat && getMemberSubCategory(m) === targetSub)
      .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

    const targetIndex = Math.max(0, Math.min(Math.floor(targetOrder) - 1, targetOthers.length));

    let slot = 1;
    for (let i = 0; i <= targetOthers.length; i++) {
      if (i === targetIndex) {
        if (memberId) {
          updates.push({
            id: memberId,
            rowNumber: targetRowNumber,
            displayOrder: slot,
            rowTitle: targetSub,
          });
        }
        slot++;
      }
      if (i < targetOthers.length) {
        updates.push({
          id: targetOthers[i].id,
          rowNumber: targetRowNumber,
          displayOrder: slot,
          rowTitle: targetSub,
        });
        slot++;
      }
    }

    if (memberId && oldCat && oldSub && (oldCat !== targetCat || oldSub !== targetSub)) {
      const oldRowNumber = getRowNumberForCategoryAndSub(oldCat, oldSub);
      const oldOthers = committeeMemberList
        .filter((m) => m.id !== memberId && m.category === oldCat && getMemberSubCategory(m) === oldSub)
        .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

      oldOthers.forEach((m, idx) => {
        updates.push({
          id: m.id,
          rowNumber: oldRowNumber,
          displayOrder: idx + 1,
          rowTitle: oldSub,
        });
      });
    }

    return {
      updates,
      finalOrder: targetIndex + 1,
    };
  };

  const sortCommitteeMembersByCategory = (list: ApiCommitteeMember[]) => {
    const getCategoryWeight = (cat: string) => {
      if (cat === "organizing") return 1;
      if (cat === "mentor") return 2;
      if (cat === "dev_team") return 3;
      return 4;
    };

    const getSubCategoryWeight = (m: ApiCommitteeMember) => {
      const sub = getMemberSubCategory(m);
      if (m.category === "organizing") {
        if (sub === "chief_patron") return 1;
        if (sub === "patron") return 2;
        return 3;
      }
      if (m.category === "dev_team") return sub === "faculty" ? 1 : 2;
      return 1;
    };

    return [...list].sort((a, b) => {
      // 1. Sort by Category
      const catDiff = getCategoryWeight(a.category) - getCategoryWeight(b.category);
      if (catDiff !== 0) return catDiff;

      // 2. Sort by Subcategory
      const subDiff = getSubCategoryWeight(a) - getSubCategoryWeight(b);
      if (subDiff !== 0) return subDiff;

      // 3. Sort by displayOrder
      const orderA = a.displayOrder ?? 999;
      const orderB = b.displayOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;

      return 0;
    });
  };

  const loadCommittee = async () => {
    try {
      const res = await resourceApi.getCommittee();
      if (res.members) {
        const sorted = sortCommitteeMembersByCategory(res.members);
        setCommitteeMemberList(sorted);
        setCommitteeMembers(
          sorted.map((m) => ({
            id: m.id,
            name: m.name,
            designation: m.designation,
            affiliation: m.affiliation || "DTU",
            roleType: (m.category === "mentor" ? "Advisory" : m.category === "dev_team" ? "Technical" : "Organizing") as any,
          })),
        );
      }
    } catch (err) {
      console.error("loadCommittee failed:", err);
    }
  };

  const loadHeroSlides = async () => {
    try {
      const res = await resourceApi.getHeroSlides(true);
      if (res.slides) {
        setHeroSlides(res.slides);
      }
    } catch (err) {
      console.error("loadHeroSlides failed:", err);
    }
  };

  const loadFaqs = async () => {
    try {
      const res = await resourceApi.getFaqs(true);
      if (res.faqs) {
        setFaqsList(res.faqs);
      }
    } catch (err) {
      console.error("loadFaqs failed:", err);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const res = await resourceApi.getAdminAnnouncements();
      if (res.announcements) {
        setAnnouncementsList(sortAnnouncementsNewestFirst(res.announcements));
      }
    } catch (err) {
      console.error("loadAnnouncements failed:", err);
    }
  };

  const loadThemes = async () => {
    try {
      const res = await resourceApi.getThemes(true);
      if (res.items) {
        setThemesList(res.items);
      }
    } catch (err) {
      console.error("loadThemes failed:", err);
    }
  };

  const loadMyTeam = async () => {
    try {
      const res = await teamApi.getMine();
      setMyTeam(res.team);
    } catch (err) {
      console.error("loadMyTeam failed:", err);
    }
  };

  const loadMemberMails = async () => {
    try {
      const res = await profileApi.getMail();
      if (res.mails) {
        setMemberMails(res.mails);
      }
    } catch (err) {
      console.error("loadMemberMails failed:", err);
    }
  };

  const loadAll = async () => {
    const role = user?.role;

    if (!role) return;

    setIsRefreshing(true);

    const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
    const isResource = role === "SUPER_ADMIN" || role === "RESOURCE";

    const requests: Promise<unknown>[] = [
      loadCommittee(),
      loadHeroSlides(),
      loadFaqs(),
      loadAnnouncements(),
      loadThemes(),
      loadMyTeam(),
      loadMemberMails(),
    ];

    if (isAdmin) {
      requests.push(
        loadStats(),
        loadUsers(),
        loadTeams(),
        loadMails(),
        loadAuditLogs(),
      );
    }

    if (isResource) {
      requests.push(loadGallery());
    }

    await Promise.allSettled(requests);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!user?.role) return;
    loadAll();
  }, [user?.role]);

  // 100% Dynamic Member Data derived directly from the PostgreSQL database
  const memberData = useMemo(() => {
    const isShortlisted = myTeam?.status === "shortlisted";
    const isSubmitted = myTeam?.status && myTeam.status !== "draft";
    const isUnderReview = myTeam?.status === "under_review" || myTeam?.status === "submitted";

    return {
      hasTeam: !!myTeam,
      teamName: myTeam?.name || "No Team Registered",
      teamLead: myTeam ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Team Leader" : "Not Registered",
      theme: myTeam?.theme || "Not Selected",
      problemStatementId: myTeam?.problemStatementId || "N/A",
      problemTitle: myTeam?.problemStatement || myTeam?.proposedProblemStatement || "No problem statement selected",
      status: myTeam?.status || "unregistered",
      statusBadge: isShortlisted
        ? "Shortlisted for Round 2"
        : myTeam?.status === "rejected"
          ? "Not Shortlisted"
          : isUnderReview
            ? "Under Jury Review"
            : isSubmitted
              ? "Submitted"
              : "Draft / Incomplete",
      round1Status: (isShortlisted ? "Cleared" : isUnderReview ? "Pending" : myTeam?.status === "rejected" ? "Not Cleared" : "Pending") as "Cleared" | "Pending" | "Not Cleared",
      round2Date: "12 Oct 2026",
      score: myTeam?.score !== null && myTeam?.score !== undefined ? `${myTeam.score} / 100` : "Pending Evaluation",
      institution: myTeam?.institute || "Not Registered",
      dossierId: myTeam?.problemStatementId ? `SEWA-2026-${myTeam.problemStatementId}` : "SEWA-2026-PENDING",
      evaluatorNotes: myTeam?.evaluatorNotes || "Evaluation notes will appear here once the Technical Jury Committee completes their review.",
      timelineMilestones: [
        {
          title: "Team Registration & Problem Statement Selection",
          date: myTeam?.createdAt ? new Date(myTeam.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Pending",
          done: !!myTeam,
        },
        {
          title: "Dossier Submission & Verification",
          date: myTeam?.submittedAt ? new Date(myTeam.submittedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Pending Submission",
          done: isSubmitted,
        },
        {
          title: "Round 1 Technical Screening",
          date: isShortlisted || (myTeam?.score !== null && myTeam?.score !== undefined) ? "Completed" : "In Progress",
          done: isShortlisted || (myTeam?.score !== null && myTeam?.score !== undefined),
        },
        {
          title: "Round 2 Grand Finale & Live Jury",
          date: "12 Oct 2026",
          done: false,
        },
        {
          title: "National Award Felicitation",
          date: "15 Oct 2026",
          done: false,
        },
      ],
      memberEmails: memberMails.map((m) => ({
        id: m.id,
        subject: m.title,
        sender: m.sender,
        time: m.time,
        preview: m.snippet || m.body,
        body: m.body,
      })),
    };
  }, [myTeam, user, memberMails]);

  // Handle switching roles and resetting default tab safely
  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === "MEMBER") {
      setActiveTab("my-registration");
    } else if (newRole === "RESOURCE") {
      setActiveTab("resources");
    } else {
      setActiveTab("dashboard");
    }
  };

  // Email filtering
  const filteredEmails = useMemo(() => {
    return emails.filter((item) => {
      const matchSearch =
        item.sender.toLowerCase().includes(emailSearch.toLowerCase()) ||
        item.subject.toLowerCase().includes(emailSearch.toLowerCase());
      if (!matchSearch) return false;
      if (selectedMailFolder === "Starred") return item.starred;
      if (selectedMailLabel) return item.tag === selectedMailLabel;
      return true;
    });
  }, [emails, emailSearch, selectedMailFolder, selectedMailLabel]);

  const toggleEmailStar = async (id: string) => {
    const target = emails.find((e) => e.id === id);
    const nextVal = !target?.starred;
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, starred: nextVal } : e)));
    try {
      await adminApi.updateMail(id, { starred: nextVal });
    } catch (err) {
      console.error("toggleEmailStar failed:", err);
    }
  };

  const handleEmailDelete = async (id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id));
    try {
      await adminApi.deleteMail(id);
      await loadAuditLogs();
    } catch (err) {
      console.error("deleteMail failed:", err);
    }
  };

  const toggleEmailSelect = (id: string) => {
    setSelectedEmails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeSubject || !composeBody) return;
    try {
      await adminApi.sendMail({
        targetAudience: composeTargetAudience,
        targetEmail: composeTo || undefined,
        subject: composeSubject,
        content: composeBody,
      });
      await loadMails();
      await loadAuditLogs();
      setComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setComposeTargetAudience("ALL");
    } catch (err: any) {
      alert("Failed to dispatch broadcast: " + (err.message || "Unknown error"));
    }
  };

  const openEvaluationModal = (team: AdminTeam) => {
    setEvaluatingTeam(team);
    setEvalStatus(team.status);
    setEvalScore(team.score || 80);
    setEvalNotes(team.evaluatorNotes || "");
  };

  const handleSaveEvaluation = async () => {
    if (!evaluatingTeam) return;
    try {
      await adminApi.evaluateTeam(evaluatingTeam.id, {
        status: evalStatus,
        score: evalScore,
        evaluatorNotes: evalNotes,
      });
      await loadTeams();
      await loadStats();
      await loadAuditLogs();
      setEvaluatingTeam(null);
    } catch (err: any) {
      alert("Failed to save evaluation: " + (err.message || "Unknown error"));
    }
  };

  const confirmRoleAssignment = async () => {
    if (!roleChangeModal) return;
    const { user: targetUser, newRole } = roleChangeModal;
    if (targetUser.id === user?.id || targetUser.email === user?.email) {
      alert("You cannot change your own role.");
      setRoleChangeModal(null);
      return;
    }
    try {
      await adminApi.assignRole(targetUser.id, newRole);
      await loadUsers();
      await loadAuditLogs();
    } catch (err: any) {
      alert("Failed to assign role: " + (err.message || "Unknown error"));
    } finally {
      setRoleChangeModal(null);
    }
  };

  const handleToggleUserStatus = async (usr: AdminUserRow) => {
    if (usr.id === user?.id || usr.email === user?.email) {
      alert("You cannot change your own status.");
      return;
    }
    const nextStatus = usr.status === "Active" ? "suspended" : "active";
    try {
      await adminApi.updateStatus(usr.id, nextStatus);
      await loadUsers();
      await loadAuditLogs();
    } catch (err: any) {
      alert("Failed to update user status: " + (err.message || "Unknown error"));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName || !newEmail) return;
    try {
      setIsCreatingUser(true);
      await adminApi.inviteUser({
        firstName: newFirstName,
        lastName: newLastName || undefined,
        email: newEmail,
        phone: newPhone || undefined,
        role: newRoleToAssign,
      });
      await loadUsers();
      await loadAuditLogs();
      setAddUserModalOpen(false);
      setNewFirstName("");
      setNewLastName("");
      setNewEmail("");
      setNewPhone("");
      setNewRoleToAssign("MEMBER");
    } catch (err: any) {
      alert("Failed to create user: " + (err.message || "Unknown error"));
    } finally {
      setIsCreatingUser(false);
    }
  };

  // ─── Image File Upload Helper ────────────────────────────────────────────────
  const handleUploadImageFile = async (file: File): Promise<string | null> => {
    try {
      setIsUploadingImage(true);
      const res = await resourceApi.uploadImage(file);
      return res.url;
    } catch (err: any) {
      alert("Image upload failed: " + (err.message || "Unknown error"));
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // ─── Hero Slides Handlers ───────────────────────────────────────────────────
  const handleSaveHeroSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroFormTitle || !heroFormImageUrl) {
      alert("Title and image URL are required.");
      return;
    }
    try {
      if (editingHeroSlide) {
        await resourceApi.updateHeroSlide(editingHeroSlide.id, {
          title: heroFormTitle,
          subtitle: heroFormSubtitle || null,
          imageUrl: heroFormImageUrl,
          displayOrder: Number(heroFormOrder) || 1,
          active: heroFormActive,
        });
      } else {
        await resourceApi.createHeroSlide({
          title: heroFormTitle,
          subtitle: heroFormSubtitle || undefined,
          imageUrl: heroFormImageUrl,
          displayOrder: Number(heroFormOrder) || heroSlides.length + 1,
          active: heroFormActive,
        });
      }
      await loadHeroSlides();
      setHeroModalOpen(false);
      setEditingHeroSlide(null);
      setHeroFormTitle("");
      setHeroFormSubtitle("");
      setHeroFormImageUrl("");
      setHeroFormOrder(heroSlides.length + 2);
      setHeroFormActive(true);
    } catch (err: any) {
      alert("Failed to save hero slide: " + (err.message || "Unknown error"));
    }
  };

  const openHeroEditModal = (slide: HeroSlideItem) => {
    setEditingHeroSlide(slide);
    setHeroFormTitle(slide.title);
    setHeroFormSubtitle(slide.subtitle || "");
    setHeroFormImageUrl(slide.imageUrl);
    setHeroFormOrder(slide.displayOrder);
    setHeroFormActive(slide.active);
    setHeroModalOpen(true);
  };

  const handleToggleHeroActive = async (id: string, current: boolean) => {
    const nextVal = !current;
    setHeroSlides((prev) => prev.map((s) => (s.id === id ? { ...s, active: nextVal } : s)));
    try {
      await resourceApi.updateHeroSlide(id, { active: nextVal });
    } catch (err) {
      console.error("handleToggleHeroActive failed:", err);
      await loadHeroSlides();
    }
  };

  const handleDeleteHeroSlide = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hero slide?")) return;
    setHeroSlides((prev) => prev.filter((s) => s.id !== id));
    try {
      await resourceApi.deleteHeroSlide(id);
    } catch (err) {
      console.error("handleDeleteHeroSlide failed:", err);
      await loadHeroSlides();
    }
  };

  const handleQuickUpdateHeroImage = async (id: string, file: File) => {
    const url = await handleUploadImageFile(file);
    if (!url) return;
    try {
      await resourceApi.updateHeroSlide(id, { imageUrl: url });
      setHeroSlides((prev) => prev.map((s) => (s.id === id ? { ...s, imageUrl: url } : s)));
      await loadHeroSlides();
    } catch (err: any) {
      alert("Failed to update slide image: " + (err.message || "Unknown error"));
    }
  };

  const handleQuickUpdateCommitteePhoto = async (id: string, file: File) => {
    const url = await handleUploadImageFile(file);
    if (!url) return;
    try {
      await resourceApi.updateCommitteeMember(id, { imageUrl: url });
      setCommitteeMemberList((prev) => prev.map((m) => (m.id === id ? { ...m, imageUrl: url } : m)));
      await loadCommittee();
    } catch (err: any) {
      alert("Failed to update member photo: " + (err.message || "Unknown error"));
    }
  };


  // ─── FAQ Handlers ───────────────────────────────────────────────────────────
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqFormQuestion || !faqFormAnswer) {
      alert("Question and answer are required.");
      return;
    }
    try {
      if (editingFaq) {
        await resourceApi.updateFaq(editingFaq.id, {
          question: faqFormQuestion,
          answer: faqFormAnswer,
          category: faqFormCategory,
          displayOrder: Number(faqFormOrder) || 1,
          active: faqFormActive,
        });
      } else {
        await resourceApi.createFaq({
          question: faqFormQuestion,
          answer: faqFormAnswer,
          category: faqFormCategory,
          displayOrder: Number(faqFormOrder) || faqsList.length + 1,
          active: faqFormActive,
        });
      }
      await loadFaqs();
      setFaqModalOpen(false);
      setEditingFaq(null);
      setFaqFormQuestion("");
      setFaqFormAnswer("");
      setFaqFormCategory("general");
      setFaqFormOrder(faqsList.length + 2);
      setFaqFormActive(true);
    } catch (err: any) {
      alert("Failed to save FAQ: " + (err.message || "Unknown error"));
    }
  };

  const openFaqEditModal = (faq: FaqItem) => {
    setEditingFaq(faq);
    setFaqFormQuestion(faq.question);
    setFaqFormAnswer(faq.answer);
    setFaqFormCategory(faq.category || "general");
    setFaqFormOrder(faq.displayOrder);
    setFaqFormActive(faq.active);
    setFaqModalOpen(true);
  };

  const handleToggleFaqActive = async (id: string, current: boolean) => {
    const nextVal = !current;
    setFaqsList((prev) => prev.map((f) => (f.id === id ? { ...f, active: nextVal } : f)));
    try {
      await resourceApi.updateFaq(id, { active: nextVal });
    } catch (err) {
      console.error("handleToggleFaqActive failed:", err);
      await loadFaqs();
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    setFaqsList((prev) => prev.filter((f) => f.id !== id));
    try {
      await resourceApi.deleteFaq(id);
    } catch (err) {
      console.error("handleDeleteFaq failed:", err);
      await loadFaqs();
    }
  };

  // ─── Announcements Handlers ─────────────────────────────────────────────────
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementFormTitle || !announcementFormSummary) {
      alert("Title and summary are required.");
      return;
    }
    try {
      const assignedRef = editingAnnouncement
        ? (editingAnnouncement.refNumber || announcementFormRef || null)
        : nextGeneratedAnnouncementId;

      if (editingAnnouncement) {
        await resourceApi.updateAnnouncement(editingAnnouncement.id, {
          title: announcementFormTitle,
          summary: announcementFormSummary,
          detail: announcementFormDetail || null,
          category: announcementFormCategory,
          refNumber: assignedRef,
          publishedAt: announcementFormPublishedAt || new Date().toISOString(),
        });
      } else {
        await resourceApi.createAnnouncement({
          title: announcementFormTitle,
          summary: announcementFormSummary,
          detail: announcementFormDetail || undefined,
          category: announcementFormCategory,
          refNumber: assignedRef,
          publishedAt: announcementFormPublishedAt || new Date().toISOString(),
        });
      }
      await loadAnnouncements();
      setAnnouncementModalOpen(false);
      setEditingAnnouncement(null);
      setAnnouncementFormTitle("");
      setAnnouncementFormRef("");
      setAnnouncementFormCategory("general");
      setAnnouncementFormSummary("");
      setAnnouncementFormDetail("");
      setAnnouncementFormPublishedAt("");
    } catch (err: any) {
      alert("Failed to save announcement: " + (err.message || "Unknown error"));
    }
  };

  const openAnnouncementEditModal = (ann: AnnouncementItem) => {
    setEditingAnnouncement(ann);
    setAnnouncementFormTitle(ann.title);
    setAnnouncementFormRef(ann.refNumber || "");
    setAnnouncementFormCategory(ann.category || "general");
    setAnnouncementFormSummary(ann.summary);
    setAnnouncementFormDetail(ann.detail || "");
    setAnnouncementFormPublishedAt(ann.publishedAt || "");
    setAnnouncementModalOpen(true);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    setAnnouncementsList((prev) => prev.filter((a) => a.id !== id));
    try {
      await resourceApi.deleteAnnouncement(id);
    } catch (err) {
      console.error("handleDeleteAnnouncement failed:", err);
      await loadAnnouncements();
    }
  };

  // ─── Committee Handlers ─────────────────────────────────────────────────────
  const handleReorderCommitteeMember = async (member: ApiCommitteeMember, newOrder: number) => {
    if (newOrder < 1) newOrder = 1;
    const sub = getMemberSubCategory(member);
    const { updates } = computeReorderLayout(member.id, member.category, sub, newOrder, member.category, sub);

    try {
      if (updates.length > 0) {
        await resourceApi.updateCommitteeLayout(updates);
      }
      await loadCommittee();
    } catch (err: any) {
      alert("Failed to reorder committee member: " + (err.message || "Unknown error"));
      await loadCommittee();
    }
  };

  const handleSaveCommitteeMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committeeFormName || !committeeFormDesignation) {
      alert("Name and designation are required.");
      return;
    }

    const orderNum = Math.max(1, Number(committeeFormOrder) || 1);
    const oldCat = editingCommittee ? editingCommittee.category : undefined;
    const oldSub = editingCommittee ? getMemberSubCategory(editingCommittee) : undefined;

    const { updates, finalOrder } = computeReorderLayout(
      editingCommittee ? editingCommittee.id : null,
      committeeFormCategory,
      committeeFormSubCategory,
      orderNum,
      oldCat,
      oldSub,
    );

    const targetRowNumber = getRowNumberForCategoryAndSub(committeeFormCategory, committeeFormSubCategory);

    try {
      if (updates.length > 0) {
        await resourceApi.updateCommitteeLayout(updates);
      }

      if (editingCommittee) {
        await resourceApi.updateCommitteeMember(editingCommittee.id, {
          name: committeeFormName,
          designation: committeeFormDesignation,
          category: committeeFormCategory,
          rowNumber: targetRowNumber,
          rowTitle: committeeFormSubCategory || null,
          affiliation: committeeFormAffiliation || null,
          imageUrl: committeeFormImageUrl || null,
          displayOrder: finalOrder,
        });
      } else {
        await resourceApi.createCommitteeMember({
          name: committeeFormName,
          designation: committeeFormDesignation,
          category: committeeFormCategory,
          rowNumber: targetRowNumber,
          rowTitle: committeeFormSubCategory || undefined,
          affiliation: committeeFormAffiliation || undefined,
          imageUrl: committeeFormImageUrl || undefined,
          displayOrder: finalOrder,
        });
      }

      await loadCommittee();
      setCommitteeModalOpen(false);
      setEditingCommittee(null);
      setCommitteeFormName("");
      setCommitteeFormDesignation("");
      setCommitteeFormCategory("organizing");
      setCommitteeFormSubCategory("coordinator");
      setCommitteeFormAffiliation("");
      setCommitteeFormImageUrl("");
      setCommitteeFormOrder(1);
    } catch (err: any) {
      alert("Failed to save committee member: " + (err.message || "Unknown error"));
    }
  };

  const openCommitteeEditModal = (member: ApiCommitteeMember) => {
    setEditingCommittee(member);
    setCommitteeFormName(member.name);
    setCommitteeFormDesignation(member.designation);
    setCommitteeFormCategory(member.category);
    const sub = getMemberSubCategory(member);
    setCommitteeFormSubCategory(sub);
    setCommitteeFormAffiliation(member.affiliation || "");
    setCommitteeFormImageUrl(member.imageUrl || "");
    setCommitteeFormOrder(member.displayOrder || 1);
    setCommitteeModalOpen(true);
  };

  const handleDeleteCommitteeMember = async (id: string) => {
    if (!confirm("Are you sure you want to remove this committee member?")) return;
    setCommitteeMemberList((prev) => prev.filter((c) => c.id !== id));
    try {
      await resourceApi.deleteCommitteeMember(id);
      await loadCommittee();
    } catch (err) {
      console.error("handleDeleteCommitteeMember failed:", err);
      await loadCommittee();
    }
  };

  // ─── Gallery Handlers ───────────────────────────────────────────────────────
  const handleAddGalleryImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageTitle || !newImageUrl) return;
    try {
      await resourceApi.createGalleryImage({
        title: newImageTitle,
        url: newImageUrl,
        displayOrder: galleryItems.length + 1,
      });
      await loadGallery();
      setNewImageTitle("");
      setNewImageUrl("");
    } catch (err: any) {
      alert("Failed to add gallery image: " + (err.message || "Unknown error"));
    }
  };

  const toggleGalleryActive = async (id: string) => {
    const current = galleryItems.find((g) => g.id === id);
    const nextVal = !current?.active;
    setGalleryItems((prev) =>
      prev.map((g) => (g.id === id ? { ...g, active: nextVal } : g)),
    );
    try {
      await resourceApi.updateGalleryItem(id, { active: nextVal });
    } catch (err) {
      console.error("toggleGalleryActive failed:", err);
    }
  };

  const removeGalleryItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gallery image?")) return;
    setGalleryItems((prev) => prev.filter((g) => g.id !== id));
    try {
      await resourceApi.deleteGalleryItem(id);
    } catch (err) {
      console.error("removeGalleryItem failed:", err);
    }
  };

  // ─── Theme Handlers ──────────────────────────────────────────────────────────
  const openThemeEditModal = (theme: ThemeCategoryItem) => {
    setEditingTheme(theme);
    setThemeFormCode(theme.code);
    setThemeFormTheme(theme.theme);
    setThemeFormLabel(theme.label);
    setThemeFormPsTitle(theme.psTitle || "");
    setThemeFormPsUrl(theme.psUrl || "");
    setThemeFormOrder(theme.displayOrder);
    setThemeFormActive(theme.active);
    setThemeModalOpen(true);
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!themeFormLabel) { alert("Label is required."); return; }
    try {
      if (editingTheme) {
        await resourceApi.updateTheme(editingTheme.id, {
          label: themeFormLabel,
          theme: themeFormTheme,
          psTitle: themeFormPsTitle || null,
          psUrl: themeFormPsUrl || null,
          displayOrder: Number(themeFormOrder) || editingTheme.displayOrder,
          active: themeFormActive,
        });
      } else {
        if (!themeFormCode) { alert("Code is required for new themes."); return; }
        await resourceApi.createTheme({
          code: themeFormCode,
          theme: themeFormTheme,
          label: themeFormLabel,
          psTitle: themeFormPsTitle || undefined,
          psUrl: themeFormPsUrl || undefined,
          displayOrder: Number(themeFormOrder) || undefined,
          active: themeFormActive,
        });
      }
      await loadThemes();
      setThemeModalOpen(false);
      setEditingTheme(null);
      setThemeFormCode(""); setThemeFormLabel(""); setThemeFormPsTitle("");
      setThemeFormPsUrl(""); setThemeFormOrder(1); setThemeFormActive(true);
    } catch (err: any) {
      alert("Failed to save theme: " + (err.message || "Unknown error"));
    }
  };

  const handleToggleThemeActive = async (id: string, current: boolean) => {
    const nextVal = !current;
    setThemesList((prev) => prev.map((t) => (t.id === id ? { ...t, active: nextVal } : t)));
    try {
      await resourceApi.updateTheme(id, { active: nextVal });
    } catch (err) {
      console.error("handleToggleThemeActive failed:", err);
      await loadThemes();
    }
  };

  const handleDeleteTheme = async (id: string, code: string) => {
    if (!confirm(`Delete theme "${code}"? This cannot be undone if no teams are using it.`)) return;
    setThemesList((prev) => prev.filter((t) => t.id !== id));
    try {
      await resourceApi.deleteTheme(id);
    } catch (err: any) {
      alert("Cannot delete: " + (err.message || "This theme may have active team registrations."));
      await loadThemes();
    }
  };

  const handleThemeOrderChange = async (id: string, newOrder: number) => {
    setThemesList((prev) => prev.map((t) => (t.id === id ? { ...t, displayOrder: newOrder } : t)));
  };

  const handleSaveThemeOrder = async (id: string, newOrder: number) => {
    try {
      await resourceApi.updateTheme(id, { displayOrder: newOrder });
      await loadThemes();
    } catch (err: any) {
      alert("Failed to update order: " + (err.message || "Unknown error"));
      await loadThemes();
    }
  };

  // ─── Resource Sub-Panel Renderers ──────────────────────────────────────────
  const renderHeroPanel = () => (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon size={16} className="text-[#ff3355]" />
            <span>Homepage Hero Carousel &amp; Banners</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Configured banners rotate on the main homepage. Inactive slides are hidden from public view.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingHeroSlide(null);
            setHeroFormTitle("");
            setHeroFormSubtitle("");
            setHeroFormImageUrl("");
            setHeroFormOrder(heroSlides.length + 1);
            setHeroFormActive(true);
            setHeroModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus size={14} />
          <span>Add Hero Slide</span>
        </button>
      </div>

      {heroSlides.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200/80 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-rose-50 text-[#ff3355] flex items-center justify-center mx-auto">
            <ImageIcon size={24} />
          </div>
          <h4 className="text-sm font-bold text-gray-900">No Hero Slides in Database</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            The public homepage is currently displaying the default DTU campus aerial banner. Add your first custom hero slide to start customizing the homepage.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingHeroSlide(null);
              setHeroFormTitle("");
              setHeroFormSubtitle("");
              setHeroFormImageUrl("");
              setHeroFormOrder(1);
              setHeroFormActive(true);
              setHeroModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Create First Slide</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {heroSlides.map((slide) => (
            <div
              key={slide.id}
              className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-44 w-full bg-slate-900 relative overflow-hidden group">
                  <img
                    src={resolveMediaUrl(slide.imageUrl)}
                    alt={slide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold bg-black/60 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-full border border-white/20">
                      Order #{slide.displayOrder}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow ${slide.active ? "bg-emerald-500 text-white" : "bg-gray-700/90 text-gray-200"
                        }`}
                    >
                      {slide.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h4 className="text-sm font-bold leading-snug line-clamp-1">{slide.title}</h4>
                    {slide.subtitle && (
                      <p className="text-[11px] text-gray-200 line-clamp-1 mt-0.5">{slide.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                      Banner Image
                    </span>
                    <label className="text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#ff3355] transition-colors">
                      <UploadCloud size={13} />
                      <span>{isUploadingImage ? "Uploading..." : "Upload New Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingImage}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleQuickUpdateHeroImage(slide.id, file);
                        }}
                      />
                    </label>
                  </div>
                  <div className="text-[11px] text-gray-500 truncate font-mono bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                    {slide.imageUrl}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 flex items-center justify-between border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => handleToggleHeroActive(slide.id, slide.active)}
                  className={`text-xs font-bold cursor-pointer inline-flex items-center gap-1 ${slide.active ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"
                    }`}
                >
                  {slide.active ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{slide.active ? "Deactivate" : "Activate"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openHeroEditModal(slide)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                    title="Edit Slide"
                  >
                    <FileEdit size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteHeroSlide(slide.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                    title="Delete Slide"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnnouncementsPanel = () => (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Newspaper size={16} className="text-[#ff3355]" />
            <span>Announcements &amp; Circular Bulletins</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Official circulars and notifications displayed on the homepage bulletin board and sent to participants.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingAnnouncement(null);
            setAnnouncementFormTitle("");
            setAnnouncementFormRef("");
            setAnnouncementFormCategory("general");
            setAnnouncementFormSummary("");
            setAnnouncementFormDetail("");
            setAnnouncementFormPublishedAt(new Date().toISOString().slice(0, 10));
            setAnnouncementModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus size={14} />
          <span>New Announcement</span>
        </button>
      </div>

      {announcementsList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200/80 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-rose-50 text-[#ff3355] flex items-center justify-center mx-auto">
            <Newspaper size={24} />
          </div>
          <h4 className="text-sm font-bold text-gray-900">No Announcements in Database</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Publish official circulars, problem statement updates, registration deadlines, and challenge results.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafc] text-gray-400 font-bold border-b border-gray-100">
                  <th className="py-3 px-4">CIRCULAR ID</th>
                  <th className="py-3 px-4">TITLE &amp; SUMMARY</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4">PUBLISHED DATE</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortAnnouncementsNewestFirst(announcementsList).map((ann) => (
                  <tr key={ann.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-gray-700 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200/80 text-gray-800 font-mono text-[11px] font-bold">
                        {ann.refNumber || "—"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <h5 className="font-bold text-gray-900 leading-snug">{ann.title}</h5>
                      <p className="text-gray-500 text-[11px] line-clamp-2 mt-0.5">{ann.summary}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-[#ff3355]">
                        {ann.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(ann.publishedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openAnnouncementEditModal(ann)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                          title="Edit Announcement"
                        >
                          <FileEdit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                          title="Delete Announcement"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderFaqsPanel = () => (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle size={16} className="text-[#ff3355]" />
            <span>Frequently Asked Questions (FAQ) Desk</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage questions and answers displayed on the public /faq route. Items can be toggled, reordered, and categorized.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingFaq(null);
            setFaqFormQuestion("");
            setFaqFormAnswer("");
            setFaqFormCategory("general");
            setFaqFormOrder(faqsList.length + 1);
            setFaqFormActive(true);
            setFaqModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus size={14} />
          <span>Add New FAQ</span>
        </button>
      </div>

      {faqsList.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-200/80 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-rose-50 text-[#ff3355] flex items-center justify-center mx-auto">
            <HelpCircle size={24} />
          </div>
          <h4 className="text-sm font-bold text-gray-900">No FAQs in Database</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            The public /faq page currently displays standard static fallback items. Add FAQs to PostgreSQL to manage them interactively.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqsList.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:border-gray-300 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {faq.category || "General"}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 font-bold">
                    Order #{faq.displayOrder}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${faq.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}
                  >
                    {faq.active ? "Active" : "Hidden"}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900 leading-snug">{faq.question}</h4>
                <p className="text-xs text-gray-600 leading-relaxed pt-1 whitespace-pre-line">{faq.answer}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleFaqActive(faq.id, faq.active)}
                  className={`text-xs font-bold cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ${faq.active ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                >
                  {faq.active ? "Hide" : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => openFaqEditModal(faq)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  title="Edit FAQ"
                >
                  <FileEdit size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFaq(faq.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                  title="Delete FAQ"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCommitteePanel = () => {
    const rawList =
      committeeFilterCategory === "all"
        ? committeeMemberList
        : committeeFilterCategory === "chief_patron"
          ? committeeMemberList.filter((m) => getMemberSubCategory(m) === "chief_patron")
          : committeeMemberList.filter((m) => m.category === committeeFilterCategory);

    const filtered = sortCommitteeMembersByCategory(rawList);

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <UserCheck size={16} className="text-[#ff3355]" />
              <span>Committee Members &amp; Mentors Roster</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Organizing committee, technical advisory mentors, and student development team profiles.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingCommittee(null);
              setCommitteeFormName("");
              setCommitteeFormDesignation("");
              const defaultCat =
                committeeFilterCategory === "chief_patron"
                  ? "organizing"
                  : committeeFilterCategory !== "all"
                    ? committeeFilterCategory
                    : "organizing";
              const defaultSub =
                committeeFilterCategory === "chief_patron"
                  ? "chief_patron"
                  : defaultCat === "dev_team"
                    ? "student"
                    : defaultCat === "organizing"
                      ? "chief_patron"
                      : "mentor";
              setCommitteeFormCategory(defaultCat);
              setCommitteeFormSubCategory(defaultSub);
              setCommitteeFormAffiliation("Delhi Technological University");
              setCommitteeFormImageUrl("");
              const nextOrder = getNextDisplayOrder(defaultCat, defaultSub);
              setCommitteeFormOrder(nextOrder);
              setCommitteeModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus size={14} />
            <span>Add Member</span>
          </button>
        </div>

        {/* Filter Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: "all", label: "All Roles" },
            { key: "chief_patron", label: "Chief Patron" },
            { key: "organizing", label: "Organizing Committee" },
            { key: "mentor", label: "Mentors & Advisors" },
            { key: "dev_team", label: "Development Team" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setCommitteeFilterCategory(f.key as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${committeeFilterCategory === f.key
                ? "bg-gray-900 text-white shadow-xs"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-200/80 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-rose-50 text-[#ff3355] flex items-center justify-center mx-auto">
              <UserCheck size={24} />
            </div>
            <h4 className="text-sm font-bold text-gray-900">No Committee Members in this Category</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Add committee members or mentors with designations, affiliations, and photos to populate the roster in PostgreSQL.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {m.imageUrl ? (
                      <img
                        src={resolveMediaUrl(m.imageUrl)}
                        alt={m.name}
                        className="size-12 rounded-full object-cover ring-2 ring-gray-100 shrink-0"
                      />
                    ) : (
                      <div className="size-12 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 ${m.category === "mentor"
                          ? "bg-blue-50 text-blue-700"
                          : m.category === "dev_team"
                            ? (getMemberSubCategory(m) === "faculty" ? "bg-purple-50 text-purple-700" : "bg-emerald-50 text-emerald-700")
                            : getMemberSubCategory(m) === "chief_patron"
                              ? "bg-amber-50 text-amber-700 font-black border border-amber-200/60"
                              : getMemberSubCategory(m) === "patron"
                                ? "bg-rose-50 text-[#ff3355]"
                                : "bg-orange-50 text-orange-700"
                          }`}
                      >
                        {m.category === "mentor"
                          ? "Mentor"
                          : m.category === "dev_team"
                            ? (getMemberSubCategory(m) === "faculty"
                              ? "Dev Team • Faculty"
                              : "Dev Team • Student")
                            : (getMemberSubCategory(m) === "chief_patron"
                              ? "Organizing • Chief Patron"
                              : getMemberSubCategory(m) === "patron"
                                ? "Organizing • Patron"
                                : "Organizing • Coordinator")}
                      </span>
                      <h4 className="text-xs font-bold text-gray-900 truncate leading-snug">{m.name}</h4>
                      <p className="text-[11px] font-semibold text-gray-500 truncate mt-0.5">{m.designation}</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-xl border border-gray-100 flex items-center justify-between gap-2">
                    <span className="font-semibold text-gray-600 truncate">{m.affiliation || "DTU"}</span>
                    <div className="flex items-center gap-1 shrink-0" title="Change display order (cascades automatically)">
                      <span className="text-[10px] text-gray-400 font-mono font-bold">Order: #</span>
                      <input
                        type="number"
                        min={1}
                        key={`${m.id}-${m.displayOrder}`}
                        defaultValue={m.displayOrder}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val !== m.displayOrder && val >= 1) {
                            handleReorderCommitteeMember(m, val);
                          } else {
                            e.target.value = String(m.displayOrder);
                          }
                        }}
                        className="w-12 h-6 text-center text-[11px] font-mono font-bold bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-[#ff3355] focus:ring-1 focus:ring-[#ff3355]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-4">
                  <label className="text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 text-gray-600 hover:text-[#ff3355] transition-colors">
                    <UploadCloud size={13} />
                    <span>Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingImage}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleQuickUpdateCommitteePhoto(m.id, file);
                      }}
                    />
                  </label>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openCommitteeEditModal(m)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      title="Edit Member"
                    >
                      <FileEdit size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCommitteeMember(m.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                      title="Remove Member"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };


  const renderGalleryPanel = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="text-[#ff3355]" size={16} />
            <span>Homepage Gallery &amp; Media Assets</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload images directly or paste image URLs, configure display order, and toggle visibility on the landing page carousel.
          </p>
        </div>
      </div>

      {/* Upload Card */}
      <form
        onSubmit={handleAddGalleryImage}
        className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs space-y-4"
      >
        <h3 className="text-sm font-bold text-gray-900">Upload Image / Media Asset</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Image Title / Caption
            </label>
            <input
              type="text"
              placeholder="e.g. DTU Robotics Arena 2026"
              value={newImageTitle}
              onChange={(e) => setNewImageTitle(e.target.value)}
              className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Image URL or Direct Upload
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="https://images.unsplash.com/... or upload"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer shrink-0">
                <UploadCloud size={14} />
                <span>{isUploadingImage ? "..." : "File"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingImage}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await handleUploadImageFile(file);
                      if (url) setNewImageUrl(url);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        {newImageUrl && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <img src={resolveMediaUrl(newImageUrl)} alt="Preview" className="size-12 rounded-lg object-cover border" />
            <span className="text-[11px] text-gray-500 font-mono truncate">{newImageUrl}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UploadCloud size={14} />
            <span>Upload to Gallery</span>
          </button>
        </div>
      </form>

      {/* Gallery Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {galleryItems.map((img) => (
          <div
            key={img.id}
            className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="h-40 w-full overflow-hidden bg-gray-100 relative">
              <img src={resolveMediaUrl(img.url)} alt={img.title} className="w-full h-full object-cover" />
              <span
                className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow ${img.active ? "bg-emerald-500 text-white" : "bg-gray-700/80 text-white"
                  }`}
              >
                {img.active ? "Active in Rotation" : "Inactive"}
              </span>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold text-gray-400">Order: #{img.order}</span>
                <h4 className="text-xs font-bold text-gray-900 line-clamp-2 mt-0.5">{img.title}</h4>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => toggleGalleryActive(img.id)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  {img.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  onClick={() => removeGalleryItem(img.id)}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContactQueriesPanel = () => {
    const queryItems = emails.filter((m) => m.isQuery || (m.subject && m.subject.includes("Query")));
    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare size={16} className="text-[#ff3355]" />
              <span>Contact &amp; Grievance Queries Desk</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Real incoming inquiries and technical grievances submitted by participants and institutions via the Contact Us desk.
            </p>
          </div>
        </div>

        {queryItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-200/80 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-rose-50 text-[#ff3355] flex items-center justify-center mx-auto">
              <MessageSquare size={24} />
            </div>
            <h4 className="text-sm font-bold text-gray-900">No Contact Queries</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Inquiries and grievance tickets submitted through the Contact Us form will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#f8fafc] text-gray-400 font-bold border-b border-gray-100">
                    <th className="py-3 px-4">SENDER</th>
                    <th className="py-3 px-4">SUBJECT &amp; MESSAGE</th>
                    <th className="py-3 px-4">DATE</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {queryItems.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{q.sender}</td>
                      <td className="py-3.5 px-4 max-w-md">
                        <h5 className="font-bold text-gray-900 leading-snug">{q.subject}</h5>
                        <p className="text-gray-500 text-[11px] line-clamp-2 mt-0.5">{q.body}</p>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">{q.time}</td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setReadingMail(q as any);
                            setActiveTab("mail");
                          }}
                          className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold cursor-pointer transition-colors"
                        >
                          View in Mail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderThemesPanel = () => {
    const filtered = themesList.filter((t) => {
      const matchTrack = themeFilterTrack === "ALL" || t.theme === themeFilterTrack;
      const q = themeSearch.trim().toLowerCase();
      const matchSearch = !q || t.label.toLowerCase().includes(q) || t.code.toLowerCase().includes(q);
      return matchTrack && matchSearch;
    });
    const national = filtered.filter((t) => t.theme === "NATIONAL");
    const regional = filtered.filter((t) => t.theme === "REGIONAL");

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Tag size={16} className="text-[#ff3355]" />
              <span>Problem Categories & Themes ({themesList.length})</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Manage problem statement categories. Teams registered under a category prevent its deletion (deactivate instead).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingTheme(null);
              setThemeFormCode(""); setThemeFormLabel("");
              setThemeFormTheme("NATIONAL"); setThemeFormPsTitle("");
              setThemeFormPsUrl(""); setThemeFormOrder(themesList.length + 1); setThemeFormActive(true);
              setThemeModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus size={14} />
            <span>Add Theme</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 p-1 bg-gray-100/90 rounded-xl">
            {(["ALL", "NATIONAL", "REGIONAL"] as const).map((f) => (
              <button key={f} type="button"
                onClick={() => setThemeFilterTrack(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${themeFilterTrack === f ? "bg-white text-[#ff3355] shadow-xs" : "text-gray-600 hover:text-gray-900"}`}
              >
                {f === "ALL" ? `All (${themesList.length})` : f === "NATIONAL" ? `National (${themesList.filter(t => t.theme === "NATIONAL").length})` : `Regional (${themesList.filter(t => t.theme === "REGIONAL").length})`}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search themes..."
              value={themeSearch}
              onChange={(e) => setThemeSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#ff3355]"
            />
          </div>
        </div>

        {/* National Themes */}
        {(themeFilterTrack === "ALL" || themeFilterTrack === "NATIONAL") && national.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Globe size={12} /> Theme 1 — National Level ({national.length})
            </h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {national.map((t) => (
                <div key={t.id} className={`bg-white rounded-2xl p-4 border shadow-xs flex flex-col gap-2.5 ${t.active ? "border-gray-200/80" : "border-orange-200 bg-orange-50/30"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono font-extrabold text-[#ff3355] bg-rose-50 px-2 py-0.5 rounded-full self-start">{t.code}</span>
                      {!t.active && <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full self-start">INACTIVE</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => openThemeEditModal(t)}
                        className="size-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer">
                        <Edit3 size={12} />
                      </button>
                      <button type="button" onClick={() => handleToggleThemeActive(t.id, t.active)}
                        className="size-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-yellow-50 text-gray-500 hover:text-yellow-600 transition-colors cursor-pointer">
                        {t.active ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button type="button" onClick={() => handleDeleteTheme(t.id, t.code)}
                        className="size-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 leading-snug">{t.label}</h4>
                  {t.psTitle && <p className="text-[11px] text-gray-500 line-clamp-1">PS: {t.psTitle}</p>}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                    <div className="flex gap-1.5">
                      {t.psId && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">{t.psId}</span>}
                      {t.openId && <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-mono">{t.openId}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-400">Order:</span>
                      <input
                        type="number" min={1} value={t.displayOrder}
                        onChange={(e) => handleThemeOrderChange(t.id, Number(e.target.value))}
                        onBlur={(e) => handleSaveThemeOrder(t.id, Number(e.target.value))}
                        className="w-12 h-6 border border-gray-200 rounded text-[10px] text-center focus:outline-none focus:border-[#ff3355]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regional Themes */}
        {(themeFilterTrack === "ALL" || themeFilterTrack === "REGIONAL") && regional.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Globe size={12} /> Theme 2 — Regional/Community Level ({regional.length})
            </h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regional.map((t) => (
                <div key={t.id} className={`bg-white rounded-2xl p-4 border shadow-xs flex flex-col gap-2.5 ${t.active ? "border-gray-200/80" : "border-orange-200 bg-orange-50/30"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full self-start">{t.code}</span>
                      {!t.active && <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full self-start">INACTIVE</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => openThemeEditModal(t)}
                        className="size-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer">
                        <Edit3 size={12} />
                      </button>
                      <button type="button" onClick={() => handleToggleThemeActive(t.id, t.active)}
                        className="size-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-yellow-50 text-gray-500 hover:text-yellow-600 transition-colors cursor-pointer">
                        {t.active ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button type="button" onClick={() => handleDeleteTheme(t.id, t.code)}
                        className="size-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 leading-snug">{t.label}</h4>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                    {t.openId && <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-mono">{t.openId}</span>}
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-[10px] text-gray-400">Order:</span>
                      <input
                        type="number" min={1} value={t.displayOrder}
                        onChange={(e) => handleThemeOrderChange(t.id, Number(e.target.value))}
                        onBlur={(e) => handleSaveThemeOrder(t.id, Number(e.target.value))}
                        className="w-12 h-6 border border-gray-200 rounded text-[10px] text-center focus:outline-none focus:border-[#ff3355]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 border border-gray-200/80 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-rose-50 text-[#ff3355] flex items-center justify-center mx-auto"><Tag size={24} /></div>
            <h4 className="text-sm font-bold text-gray-900">No themes found</h4>
            <p className="text-xs text-gray-500">{themeSearch ? "Try a different search term." : "Add your first theme above."}</p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {themeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{editingTheme ? "Edit Theme/Category" : "Add New Theme"}</h3>
                <button type="button" onClick={() => setThemeModalOpen(false)} className="size-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer"><X size={16} /></button>
              </div>
              <form onSubmit={handleSaveTheme} className="space-y-3">
                {!editingTheme && (
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Code <span className="text-red-500">*</span></label>
                    <input value={themeFormCode} onChange={(e) => setThemeFormCode(e.target.value)} required
                      placeholder="e.g. NAT-006 or REG-012"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#ff3355] font-mono uppercase" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Track <span className="text-red-500">*</span></label>
                  <select value={themeFormTheme} onChange={(e) => setThemeFormTheme(e.target.value as any)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#ff3355]">
                    <option value="NATIONAL">National Level (Theme 1)</option>
                    <option value="REGIONAL">Regional/Community Level (Theme 2)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Category Label <span className="text-red-500">*</span></label>
                  <input value={themeFormLabel} onChange={(e) => setThemeFormLabel(e.target.value)} required
                    placeholder="e.g. Defence, Intelligence, Space & National Security"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#ff3355]" />
                </div>
                {themeFormTheme === "NATIONAL" && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Problem Statement Title</label>
                      <input value={themeFormPsTitle} onChange={(e) => setThemeFormPsTitle(e.target.value)}
                        placeholder="Official PS title (National only)"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#ff3355]" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">PS Download URL</label>
                      <input value={themeFormPsUrl} onChange={(e) => setThemeFormPsUrl(e.target.value)} type="url"
                        placeholder="https://... (optional)"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#ff3355]" />
                    </div>
                  </>
                )}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-700 block mb-1">Display Order</label>
                    <input type="number" min={1} value={themeFormOrder} onChange={(e) => setThemeFormOrder(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#ff3355]" />
                  </div>
                  <div className="flex items-end pb-0.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-bold text-gray-700">Active</span>
                      <div onClick={() => setThemeFormActive(!themeFormActive)}
                        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${themeFormActive ? "bg-emerald-500" : "bg-gray-300"}`}>
                        <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform ${themeFormActive ? "translate-x-5" : ""}`} />
                      </div>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setThemeModalOpen(false)}
                    className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2 text-sm font-bold hover:bg-gray-50 cursor-pointer">Cancel</button>
                  <button type="submit"
                    className="flex-1 bg-[#ff3355] hover:bg-[#d62544] text-white rounded-xl py-2 text-sm font-bold transition-colors cursor-pointer">
                    {editingTheme ? "Save Changes" : "Create Theme"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (

    <div className="min-h-screen bg-[#f8fafc] text-gray-800 flex flex-col font-sans selection:bg-[#ff3355] selection:text-white">
      {/* ─── Top Header Bar matching Screenshot ─── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between shadow-2xs">
        <Brand />

        <div className="flex items-center gap-3 sm:gap-5">
          {/* External dtu.ac.in link */}
          <a
            href="https://dtu.ac.in"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[#ff3355] hover:text-[#d62544] font-semibold text-xs sm:text-sm underline underline-offset-2 transition-colors"
          >
            <span>dtu.ac.in</span>
            <ExternalLink size={14} className="stroke-[2.2]" />
          </a>

          {/* Social Icons */}
          <div className="hidden sm:flex items-center gap-2.5 text-[#ff3355]">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="hover:scale-110 transition-transform"
            >
              <Facebook size={15} fill="currentColor" strokeWidth={0} />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              aria-label="X"
              className="hover:scale-110 transition-transform flex items-center"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="hover:scale-110 transition-transform"
            >
              <Instagram size={15} strokeWidth={2} />
            </a>
          </div>

          {/* Real-time DB Sync Button */}
          <button
            type="button"
            onClick={loadAll}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold shadow-2xs hover:border-gray-300 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw size={12} className={isRefreshing ? "animate-spin text-[#ff3355]" : "text-gray-500"} />
            <span className="hidden md:inline">{isRefreshing ? "Syncing..." : "Sync DB"}</span>
          </button>

          {/* Active Red Pill Role Badge as in Screenshot */}
          <div className="inline-flex items-center justify-center rounded-full bg-[#ff3355] text-white px-4 py-1 text-xs sm:text-sm font-bold shadow-xs shrink-0">
            {currentRole === "SUPER_ADMIN"
              ? "Super Admin"
              : currentRole === "ADMIN"
                ? "Admin"
                : currentRole === "RESOURCE"
                  ? "Resource Team"
                  : "Member"}
          </div>

          {/* User Info (Greeting & Email) */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
            <div className="size-8 rounded-full bg-red-50 text-[#ff3355] border border-red-200/80 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {user?.firstName ? user.firstName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex flex-col text-left leading-tight hidden sm:flex">
              <span className="text-xs font-bold text-gray-900 truncate max-w-[150px]">
                Hi, {user?.firstName || "Admin"}
              </span>
              <span className="text-[11px] text-gray-500 font-medium truncate max-w-[150px]" title={user?.email}>
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Application Container: Sidebar + Content ─── */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* ─── Left Sidebar (Dynamic Based on Role) ─── */}
        <aside className="w-full md:w-56 lg:w-64 bg-white border-r border-gray-200/80 p-5 flex flex-col justify-between shrink-0">
          <div>
            {/* Which Portal Header */}
            <div className="mb-6 px-3">
              <h1 className="text-xl font-black tracking-tight text-[#ff3355]">
                {currentRole === "SUPER_ADMIN"
                  ? "Super Admin Portal"
                  : currentRole === "ADMIN"
                    ? "Admin Portal"
                    : currentRole === "RESOURCE"
                      ? "Resource Team Portal"
                      : "Member Portal"}
              </h1>
            </div>

            {/* ── 1. SUPER ADMIN / ADMIN Navigation ── */}
            {(currentRole === "SUPER_ADMIN" || currentRole === "ADMIN") && (
              <>
                <nav className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("dashboard")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "dashboard"
                      ? "bg-[#ff3355] text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 font-semibold"
                      }`}
                  >
                    Dashboard
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("statistics")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "statistics"
                      ? "bg-[#ff3355] text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 font-semibold"
                      }`}
                  >
                    Statistics
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("mail")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "mail"
                      ? "bg-[#ff3355] text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 font-semibold"
                      }`}
                  >
                    Mail
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("submissions")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "submissions"
                      ? "bg-[#ff3355] text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 font-semibold"
                      }`}
                  >
                    Submissions
                  </button>

                  {/* Users tab: Super Admin can edit roles; Admin views read-only */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("users")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "users"
                      ? "bg-[#ff3355] text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 font-semibold"
                      }`}
                  >
                    Users
                  </button>

                  {/* Resources tab - Super Admin has access */}
                  {currentRole === "SUPER_ADMIN" && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("resources")}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "resources"
                        ? "bg-[#ff3355] text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-100 font-semibold"
                        }`}
                    >
                      Resources
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab("announcement")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "announcement"
                      ? "bg-[#ff3355] text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 font-semibold"
                      }`}
                  >
                    Announcement
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("hero")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "hero"
                      ? "bg-[#ff3355] text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 font-semibold"
                      }`}
                  >
                    Hero Section
                  </button>
                </nav>

                <div className="mt-6 mb-2 px-3">
                  <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                    PAGES
                  </span>
                </div>

                <nav className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("themes")}
                    className={`w-full text-left px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === "themes"
                      ? "bg-[#ff3355] text-white font-bold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                  >
                    Themes
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("newsletter")}
                    className={`w-full text-left px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === "newsletter"
                      ? "bg-[#ff3355] text-white font-bold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                  >
                    Newsletter
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("faq")}
                    className={`w-full text-left px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === "faq"
                      ? "bg-[#ff3355] text-white font-bold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                  >
                    FAQ
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("contact")}
                    className={`w-full text-left px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === "contact"
                      ? "bg-[#ff3355] text-white font-bold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                  >
                    Contact Query
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("committee")}
                    className={`w-full text-left px-3.5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === "committee"
                      ? "bg-[#ff3355] text-white font-bold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                  >
                    Committee Members
                  </button>
                </nav>
              </>
            )}

            {/* ── 2. RESOURCE TEAM NAVIGATION (Strictly Limited to Media & Content) ── */}
            {currentRole === "RESOURCE" && (
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("resources")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "resources"
                    ? "bg-[#ff3355] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 font-semibold"
                    }`}
                >
                  Gallery &amp; Images
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("hero")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "hero"
                    ? "bg-[#ff3355] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 font-semibold"
                    }`}
                >
                  Hero Section
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("themes")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "themes"
                    ? "bg-[#ff3355] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 font-semibold"
                    }`}
                >
                  Themes
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("newsletter")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "newsletter"
                    ? "bg-[#ff3355] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 font-semibold"
                    }`}
                >
                  Newsletter
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("faq")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "faq"
                    ? "bg-[#ff3355] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 font-semibold"
                    }`}
                >
                  FAQ
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("committee")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "committee"
                    ? "bg-[#ff3355] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 font-semibold"
                    }`}
                >
                  Committee Members
                </button>
              </nav>
            )}

            {/* ── 3. MEMBER NAVIGATION (Timeline, Results, Mail, PS Details) ── */}
            {currentRole === "MEMBER" && (
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("my-registration")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "my-registration"
                    ? "bg-[#ff3355] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 font-semibold"
                    }`}
                >
                  My Registration
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("timeline")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "timeline"
                    ? "bg-[#ff3355] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 font-semibold"
                    }`}
                >
                  Timeline &amp; Rounds
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("evaluation")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "evaluation"
                    ? "bg-[#ff3355] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 font-semibold"
                    }`}
                >
                  Evaluation &amp; Results
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("member-mail")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "member-mail"
                    ? "bg-[#ff3355] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 font-semibold"
                    }`}
                >
                  Official Mail
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("announcement")}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${activeTab === "announcement"
                    ? "bg-[#ff3355] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 font-semibold"
                    }`}
                >
                  Announcements
                </button>
              </nav>
            )}
          </div>

          {/* Logout button at bottom */}
          <div className="pt-6 border-t border-gray-100 px-3">
            <button
              type="button"
              onClick={() => {
                signOut();
                navigate({ to: "/" });
              }}
              className="text-[#ff3355] hover:text-[#c5213d] text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* ─── Main Content Canvas ─── */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Top 4 Stat Cards: Completely Dynamic from PostgreSQL Database */}
          {(currentRole === "SUPER_ADMIN" || currentRole === "ADMIN") &&
            (activeTab === "dashboard" || activeTab === "statistics" || activeTab === "mail") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Total User */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 block">Total User</span>
                      <span className="text-3xl font-black text-gray-900 mt-1 block">
                        {(statsData?.totalUsers ?? userList.length).toLocaleString()}
                      </span>
                    </div>
                    <div className="size-12 rounded-2xl bg-[#ece8ff] flex items-center justify-center shrink-0">
                      <Users className="size-6 text-[#7c3aed]" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-bold">
                    <span className="inline-flex items-center gap-0.5 text-[#00c58e]">
                      ● Live DB
                    </span>
                    <span className="text-gray-400 font-normal">
                      {statsData?.totalUsers ?? userList.length} verified accounts
                    </span>
                  </div>
                </div>

                {/* Total Registration / Teams */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 block">Total Registration</span>
                      <span className="text-3xl font-black text-gray-900 mt-1 block">
                        {(statsData?.totalTeams ?? submissionsList.length).toLocaleString()}
                      </span>
                    </div>
                    <div className="size-12 rounded-2xl bg-[#fff6d6] flex items-center justify-center shrink-0">
                      <Package className="size-6 text-[#eab308]" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-bold">
                    <span className="inline-flex items-center gap-0.5 text-[#00c58e]">
                      ↗ {statsData?.shortlistedTeams ?? 0} Shortlisted
                    </span>
                    <span className="text-gray-400 font-normal">
                      {statsData?.totalTeams ?? submissionsList.length} teams registered
                    </span>
                  </div>
                </div>

                {/* Total Mail & Query */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 block">Total Mail &amp; Query</span>
                      <span className="text-3xl font-black text-gray-900 mt-1 block">
                        {(statsData?.totalQueries ?? emails.length).toLocaleString()}
                      </span>
                    </div>
                    <div className="size-12 rounded-2xl bg-[#d1fae5] flex items-center justify-center shrink-0">
                      <TrendingUp className="size-6 text-[#10b981]" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-bold">
                    <span className="inline-flex items-center gap-0.5 text-blue-600">
                      ● Active
                    </span>
                    <span className="text-gray-400 font-normal">
                      {statsData?.totalQueries ?? emails.length} inquiries received
                    </span>
                  </div>
                </div>

                {/* Total Submissions Pending */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 block">Total Submissions Pending</span>
                      <span className="text-3xl font-black text-gray-900 mt-1 block">
                        {(statsData?.pendingSubmissions ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="size-12 rounded-2xl bg-[#ffedd5] flex items-center justify-center shrink-0">
                      <Clock className="size-6 text-[#f97316]" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-bold">
                    <span className={`inline-flex items-center gap-0.5 ${(statsData?.pendingSubmissions ?? 0) > 0 ? "text-[#f97316]" : "text-[#00c58e]"}`}>
                      {(statsData?.pendingSubmissions ?? 0) > 0 ? "⏳ Pending Review" : "✓ All Evaluated"}
                    </span>
                    <span className="text-gray-400 font-normal">
                      {statsData?.pendingSubmissions ?? 0} awaiting jury
                    </span>
                  </div>
                </div>
              </div>
            )}

          {/* ═════════════════════════════════════════════════════════════════════
              VIEW: DASHBOARD (Dynamic from DB)
             ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* User Traffic & Registration Velocity Card (Interactive & Fixed Scaling) */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs">
                {/* Header with Title, Controls, & Quick Summary */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900">
                        {graphMetric === "users"
                          ? "User Accounts & Registration Velocity"
                          : graphMetric === "teams"
                            ? "Team Submissions & Dossier Growth"
                            : "Contact Grievances & Inquiry Inflow"}
                      </h2>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${graphMetric === "users"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : graphMetric === "teams"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                      >
                        Live Database Velocity
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Interactive real-time activity metrics tracked across recent periods from PostgreSQL
                    </p>
                  </div>

                  {/* Interactive Control Selectors */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Metric Selector Tabs */}
                    <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => setGraphMetric("users")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${graphMetric === "users"
                          ? "bg-white text-blue-600 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        <Users size={13} />
                        <span>Users ({statsData?.totalUsers ?? userList.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGraphMetric("teams")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${graphMetric === "teams"
                          ? "bg-white text-emerald-600 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        <Award size={13} />
                        <span>Teams ({statsData?.totalTeams ?? submissionsList.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGraphMetric("queries")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${graphMetric === "queries"
                          ? "bg-white text-amber-600 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        <MessageSquare size={13} />
                        <span>Inquiries ({statsData?.totalQueries ?? emails.length})</span>
                      </button>
                    </div>

                    {/* View Mode Toggle: Monthly vs Cumulative */}
                    <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => setGraphMode("monthly")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${graphMode === "monthly"
                          ? "bg-white text-slate-800 shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                          }`}
                      >
                        Monthly New
                      </button>
                      <button
                        type="button"
                        onClick={() => setGraphMode("cumulative")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${graphMode === "cumulative"
                          ? "bg-white text-slate-800 shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                          }`}
                      >
                        Cumulative
                      </button>
                    </div>
                  </div>
                </div>

                {(() => {
                  // Resolve active metric data
                  const labels = statsData?.trafficData?.labels || ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
                  const fullLabels =
                    statsData?.trafficData?.fullLabels || [
                      "Apr 2026",
                      "May 2026",
                      "Jun 2026",
                      "Jul 2026",
                      "Aug 2026",
                      "Sep 2026",
                    ];

                  const counts =
                    graphMetric === "users"
                      ? graphMode === "monthly"
                        ? statsData?.trafficData?.userCounts || [0, 0, 0, 0, 0, statsData?.totalUsers ?? userList.length]
                        : statsData?.trafficData?.cumulativeUserCounts || [0, 0, 0, 0, 0, statsData?.totalUsers ?? userList.length]
                      : graphMetric === "teams"
                        ? graphMode === "monthly"
                          ? statsData?.trafficData?.teamCounts || [0, 0, 0, 0, 0, statsData?.totalTeams ?? submissionsList.length]
                          : statsData?.trafficData?.cumulativeTeamCounts || [0, 0, 0, 0, 0, statsData?.totalTeams ?? submissionsList.length]
                        : graphMode === "monthly"
                          ? statsData?.trafficData?.queryCounts || [0, 0, 0, 0, 0, statsData?.totalQueries ?? emails.length]
                          : statsData?.trafficData?.cumulativeQueryCounts || [0, 0, 0, 0, 0, statsData?.totalQueries ?? emails.length];

                  const rawMax = Math.max(...counts, 0);

                  // Fix Y-Axis scale so labels are ALWAYS distinct, beautiful integers (no 1, 1, 1, 0, 0!)
                  const getNiceScale = (maxVal: number) => {
                    if (maxVal <= 1) return { max: 4, ticks: [4, 3, 2, 1, 0] };
                    if (maxVal <= 4) return { max: 4, ticks: [4, 3, 2, 1, 0] };
                    if (maxVal <= 8) return { max: 8, ticks: [8, 6, 4, 2, 0] };
                    if (maxVal <= 12) return { max: 12, ticks: [12, 9, 6, 3, 0] };
                    if (maxVal <= 20) return { max: 20, ticks: [20, 15, 10, 5, 0] };
                    if (maxVal <= 50) return { max: 50, ticks: [50, 40, 30, 20, 10, 0] };
                    if (maxVal <= 100) return { max: 100, ticks: [100, 75, 50, 25, 0] };
                    const mag = Math.pow(10, Math.floor(Math.log10(maxVal)));
                    const factor = maxVal / mag;
                    let mult = 10;
                    if (factor <= 2) mult = 2;
                    else if (factor <= 5) mult = 5;
                    const niceMax = Math.ceil(maxVal / ((mult * mag) / 4)) * ((mult * mag) / 4);
                    const step = niceMax / 4;
                    return {
                      max: niceMax,
                      ticks: [niceMax, niceMax - step, niceMax - step * 2, niceMax - step * 3, 0],
                    };
                  };

                  const scale = getNiceScale(rawMax);

                  // Colors by metric
                  const themeColor =
                    graphMetric === "users"
                      ? "#2563eb"
                      : graphMetric === "teams"
                        ? "#059669"
                        : "#d97706";
                  const gradientStopColor =
                    graphMetric === "users"
                      ? "#3b82f6"
                      : graphMetric === "teams"
                        ? "#10b981"
                        : "#f59e0b";
                  const metricUnit =
                    graphMetric === "users"
                      ? "User"
                      : graphMetric === "teams"
                        ? "Team"
                        : "Inquiry";

                  // Layout Coordinates
                  const bottomY = 240;
                  const chartHeight = 195;
                  const stepX = 860 / (labels.length - 1 || 1);

                  const points = counts.map((cnt, i) => {
                    const x = 70 + i * stepX;
                    const y = bottomY - (cnt / scale.max) * chartHeight;
                    return {
                      x,
                      y,
                      count: cnt,
                      label: labels[i],
                      fullLabel: fullLabels[i] || labels[i],
                    };
                  });

                  // Cubic Spline Curve
                  let pathD = `M ${points[0].x} ${points[0].y}`;
                  for (let i = 0; i < points.length - 1; i++) {
                    const p0 = points[i];
                    const p1 = points[i + 1];
                    const cp1x = p0.x + (p1.x - p0.x) / 2;
                    const cp2x = cp1x;
                    pathD += ` C ${cp1x} ${p0.y}, ${cp2x} ${p1.y}, ${p1.x} ${p1.y}`;
                  }
                  const areaD = `${pathD} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;

                  // Determine active point for interactivity
                  const activeIdx =
                    hoveredPointIndex !== null
                      ? hoveredPointIndex
                      : counts.some((c) => c > 0)
                        ? counts.findLastIndex((c) => c > 0)
                        : points.length - 1;
                  const activePoint = points[activeIdx] || points[points.length - 1];

                  return (
                    <div
                      className="relative w-full h-[290px] sm:h-[330px] pt-4 select-none"
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    >
                      {/* Floating Rich Tooltip Pill pinned over the active point */}
                      {activePoint && (
                        <div
                          className="absolute z-30 pointer-events-none transition-all duration-150 flex flex-col items-center"
                          style={{
                            left: `${(activePoint.x / 1000) * 100}%`,
                            top: `${Math.max(6, (activePoint.y / 300) * 100 - 19)}%`,
                            transform: "translate(-50%, -100%)",
                          }}
                        >
                          <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-xl shadow-xl border border-slate-700/80 flex flex-col items-center gap-0.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                              <span
                                className="size-2 rounded-full inline-block"
                                style={{ backgroundColor: themeColor }}
                              />
                              <span>{activePoint.fullLabel}</span>
                            </div>
                            <div className="text-base font-black tracking-tight text-white">
                              {activePoint.count}{" "}
                              <span className="text-xs font-semibold text-slate-300">
                                {metricUnit}
                                {activePoint.count === 1 ? "" : "s"}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                              <span>{graphMode === "monthly" ? "New this month" : "Cumulative total"}</span>
                              <span className="text-emerald-400 font-bold">• Verified</span>
                            </div>
                          </div>
                          <div
                            className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px]"
                            style={{ borderTopColor: "#0f172a" }}
                          />
                        </div>
                      )}

                      <svg
                        viewBox="0 0 1000 300"
                        className="w-full h-full overflow-visible"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="interactiveVelocityGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={gradientStopColor} stopOpacity="0.38" />
                            <stop offset="65%" stopColor={gradientStopColor} stopOpacity="0.08" />
                            <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0.00" />
                          </linearGradient>
                        </defs>

                        {/* Y-Axis Grid Lines and Distinct Integer Ticks */}
                        {scale.ticks.map((tickVal, idx) => {
                          const tickY = bottomY - (tickVal / scale.max) * chartHeight;
                          return (
                            <g key={idx}>
                              <text
                                x="20"
                                y={tickY + 4}
                                fill="#94a3b8"
                                fontSize="12"
                                fontWeight="600"
                                fontFamily="sans-serif"
                              >
                                {tickVal}
                              </text>
                              <line
                                x1="50"
                                y1={tickY}
                                x2="980"
                                y2={tickY}
                                stroke="#f1f5f9"
                                strokeDasharray="3 3"
                              />
                            </g>
                          );
                        })}

                        {/* Active Point Vertical Crosshair Guide */}
                        {activePoint && (
                          <line
                            x1={activePoint.x}
                            y1={35}
                            x2={activePoint.x}
                            y2={bottomY}
                            stroke={themeColor}
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                            opacity="0.55"
                          />
                        )}

                        {/* Gradient Area & Cubic Spline Path */}
                        <path d={areaD} fill="url(#interactiveVelocityGrad)" />
                        <path
                          d={pathD}
                          fill="none"
                          stroke={themeColor}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Data Points and X-Axis Labels */}
                        {points.map((pt, i) => {
                          const isHovered = i === activeIdx;
                          return (
                            <g key={i}>
                              {/* Glowing outer halo on hovered/active point */}
                              {isHovered && (
                                <>
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="15"
                                    fill={themeColor}
                                    fillOpacity="0.18"
                                    className="animate-pulse"
                                  />
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="9"
                                    fill={themeColor}
                                    fillOpacity="0.32"
                                  />
                                </>
                              )}

                              {/* Center Point */}
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isHovered ? 6 : 4.5}
                                fill={isHovered ? themeColor : "#ffffff"}
                                stroke={themeColor}
                                strokeWidth="2.5"
                                className="transition-all duration-200"
                              />

                              {/* Month Text Label */}
                              <text
                                x={pt.x}
                                y={275}
                                textAnchor="middle"
                                fill={isHovered ? "#0f172a" : "#64748b"}
                                fontSize="12"
                                fontWeight={isHovered ? "800" : "600"}
                                fontFamily="sans-serif"
                                className="transition-colors duration-150"
                              >
                                {pt.label}
                              </text>

                              {/* Invisible wide column trigger for effortless hover & touch */}
                              <rect
                                x={pt.x - stepX / 2}
                                y={30}
                                width={stepX}
                                height={230}
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredPointIndex(i)}
                                onTouchStart={() => setHoveredPointIndex(i)}
                              />
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  );
                })()}
              </div>

              {/* User Analytics Table: 100% Dynamic from DB teams and institutes */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">User Analytics &amp; Institutional Registrations</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Real institutional breakdown derived directly from registered teams</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1">
                    <span>{statsData?.analyticsRows?.length || 0} Institutions</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#f8fafc] text-gray-500 font-bold border-b border-gray-100">
                        <th className="py-3 px-4 rounded-l-lg">College / Institute</th>
                        <th className="py-3 px-4">Campus / City</th>
                        <th className="py-3 px-4">Registered Members</th>
                        <th className="py-3 px-4">State</th>
                        <th className="py-3 px-4">Participants</th>
                        <th className="py-3 px-4 rounded-r-lg text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {(!statsData?.analyticsRows || statsData.analyticsRows.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-400">
                            <Building className="size-8 mx-auto text-gray-300 mb-2" />
                            <p className="font-semibold text-gray-600">No institutional registrations in database yet</p>
                            <p className="text-xs text-gray-400 mt-0.5">When student teams register with their colleges, real analytics will automatically populate here.</p>
                          </td>
                        </tr>
                      ) : (
                        statsData.analyticsRows.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-gray-900">{row.college}</td>
                            <td className="py-3.5 px-4 text-gray-500">{row.location}</td>
                            <td className="py-3.5 px-4 font-semibold text-gray-800">{row.usersRegistered}</td>
                            <td className="py-3.5 px-4">{row.state}</td>
                            <td className="py-3.5 px-4 font-semibold text-gray-800">{row.participants}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-2xs ${row.status === "Delivered"
                                  ? "bg-[#00c58e]"
                                  : row.status === "Pending"
                                    ? "bg-[#f59e0b]"
                                    : "bg-[#ef4444]"
                                  }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              VIEW: STATISTICS (Real Hackathon Progression & Theme Analytics)
             ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === "statistics" && (
            <div className="space-y-6">
              {/* 3 Real Hackathon Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Team Progression Breakdown */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-gray-900">Submission Progression</h3>
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {statsData?.totalTeams ?? 0} Teams
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Real-time progression status of all submitted team dossiers
                    </p>

                    <div className="space-y-3">
                      {[
                        {
                          label: "Shortlisted Finalists",
                          count: statsData?.shortlistedTeams ?? 0,
                          color: "bg-emerald-500",
                          textColor: "text-emerald-700",
                        },
                        {
                          label: "Pending / Under Review",
                          count: statsData?.pendingSubmissions ?? 0,
                          color: "bg-amber-500",
                          textColor: "text-amber-700",
                        },
                        {
                          label: "Submitted (Draft / Initial)",
                          count: Math.max(
                            0,
                            (statsData?.totalTeams ?? 0) -
                            (statsData?.shortlistedTeams ?? 0) -
                            (statsData?.pendingSubmissions ?? 0),
                          ),
                          color: "bg-blue-500",
                          textColor: "text-blue-700",
                        },
                      ].map((item, idx) => {
                        const total = statsData?.totalTeams || 1;
                        const pct = Math.round((item.count / total) * 100);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-gray-700">{item.label}</span>
                              <span className={item.textColor}>
                                {item.count} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${item.color} rounded-full transition-all duration-500`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Evaluation Completion</span>
                    <span className="font-bold text-gray-900">
                      {(statsData?.totalTeams ?? 0) > 0
                        ? `${Math.round(
                          (((statsData?.totalTeams ?? 0) - (statsData?.pendingSubmissions ?? 0)) /
                            (statsData?.totalTeams || 1)) *
                          100,
                        )}% Evaluated`
                        : "0% Evaluated"}
                    </span>
                  </div>
                </div>

                {/* 2. Hackathon Themes Distribution */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-gray-900">Registrations by Theme</h3>
                      <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                        {statsData?.themeDistribution?.length || 0} Themes
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Proposals categorized under active SEWA 2026 problem themes
                    </p>

                    <div className="space-y-3">
                      {(!statsData?.themeDistribution || statsData.themeDistribution.length === 0) ? (
                        <p className="text-xs text-gray-400 py-4 text-center">
                          No team proposals categorized by theme yet.
                        </p>
                      ) : (
                        statsData.themeDistribution.map((t, idx) => {
                          const total = statsData?.totalTeams || 1;
                          const pct = Math.round((t.count / total) * 100);
                          const colors = ["bg-indigo-500", "bg-rose-500", "bg-emerald-500", "bg-amber-500", "bg-cyan-500"];
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-gray-700 truncate max-w-[180px]">{t.theme}</span>
                                <span className="text-gray-900 font-bold">{t.count} teams ({pct}%)</span>
                              </div>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Leading Theme</span>
                    <span className="font-bold text-gray-900 truncate max-w-[180px]">
                      {statsData?.themeDistribution?.[0]?.theme || "Awaiting Teams"}
                    </span>
                  </div>
                </div>

                {/* 3. Platform Metrics & Role Breakdown */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-bold text-gray-900">Platform Role Directory</h3>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Active Roles
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Breakdown of registered accounts across RBAC roles
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
                        <span className="text-2xl font-black text-purple-700 block">
                          {userList.filter((u) => u.role === "SUPER_ADMIN").length}
                        </span>
                        <span className="text-[11px] font-bold text-purple-600">Super Admins</span>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                        <span className="text-2xl font-black text-blue-700 block">
                          {userList.filter((u) => u.role === "ADMIN").length}
                        </span>
                        <span className="text-[11px] font-bold text-blue-600">Admins</span>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                        <span className="text-2xl font-black text-amber-700 block">
                          {userList.filter((u) => u.role === "RESOURCE").length}
                        </span>
                        <span className="text-[11px] font-bold text-amber-600">Media Resources</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        <span className="text-2xl font-black text-slate-700 block">
                          {userList.filter((u) => u.role === "MEMBER").length}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600">Members</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-medium">Contact Inquiries</span>
                    <span className="font-bold text-emerald-600">
                      {statsData?.totalQueries ?? 0} Received
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              VIEW: MAIL (Screenshot 3)
             ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === "mail" && (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col md:flex-row min-h-[580px]">
              <div className="w-full md:w-56 p-4 border-r border-gray-200 flex flex-col justify-between shrink-0 bg-white">
                <div>
                  <button
                    type="button"
                    onClick={() => setComposeOpen(true)}
                    className="w-full bg-[#ff3355] hover:bg-[#d62544] text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-sm transition-all mb-5 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>Compose</span>
                  </button>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 block mb-1">
                      My Email
                    </span>

                    {[
                      {
                        name: "Inbox",
                        count: emails.filter((e) => e.folder === "Inbox" || !e.folder).length,
                        icon: <Mail size={14} />,
                      },
                      {
                        name: "Starred",
                        count: emails.filter((e) => e.starred).length,
                        icon: <Star size={14} />,
                      },
                      {
                        name: "Sent",
                        count: emails.filter((e) => e.folder === "Sent").length,
                        icon: <Send size={14} />,
                      },
                      {
                        name: "Draft",
                        count: emails.filter((e) => e.folder === "Draft").length,
                        icon: <FileText size={14} />,
                      },
                      {
                        name: "Spam",
                        count: emails.filter((e) => e.folder === "Spam").length,
                        icon: <AlertTriangle size={14} />,
                      },
                      {
                        name: "Important",
                        count: emails.filter((e) => e.tag === "Important").length,
                        icon: <Info size={14} />,
                      },
                      {
                        name: "Bin",
                        count: emails.filter((e) => e.folder === "Bin").length,
                        icon: <Trash2 size={14} />,
                      },
                    ].map((folder) => {
                      const isCurrent = selectedMailFolder === folder.name;
                      return (
                        <button
                          key={folder.name}
                          type="button"
                          onClick={() => {
                            setSelectedMailFolder(folder.name as any);
                            setSelectedMailLabel(null);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${isCurrent
                            ? "bg-rose-50 text-[#ff3355] font-bold"
                            : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            {folder.icon}
                            <span>{folder.name}</span>
                          </div>
                          <span
                            className={`text-[11px] ${isCurrent
                              ? "bg-[#ff3355] text-white px-2 py-0.5 rounded-full"
                              : "text-gray-400"
                              }`}
                          >
                            {folder.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 space-y-1.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 block mb-1">
                      Label
                    </span>

                    {[
                      { name: "Primary", color: "bg-teal-400" },
                      { name: "Social", color: "bg-cyan-400" },
                      { name: "Work", color: "bg-amber-400" },
                      { name: "Friends", color: "bg-purple-400" },
                    ].map((label) => (
                      <button
                        key={label.name}
                        type="button"
                        onClick={() => setSelectedMailLabel(label.name)}
                        className={`w-full flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${selectedMailLabel === label.name
                          ? "bg-gray-100 text-gray-900 font-bold"
                          : "text-gray-600 hover:bg-gray-50"
                          }`}
                      >
                        <span className={`size-2.5 rounded-xs ${label.color}`} />
                        <span>{label.name}</span>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => alert("Create new label dialog...")}
                      className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1 flex items-center gap-1.5 font-medium cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>Create New Label</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-white">
                <div className="p-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search mail..."
                      value={emailSearch}
                      onChange={(e) => setEmailSearch(e.target.value)}
                      className="w-full bg-[#f8fafc] border border-gray-200 rounded-full pl-8 pr-3 py-1.5 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#ff3355]"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-gray-400">
                    <button
                      type="button"
                      className="p-1.5 hover:text-gray-600 rounded cursor-pointer"
                      title="Archive"
                    >
                      <Archive size={15} />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 hover:text-gray-600 rounded cursor-pointer"
                      title="Info"
                    >
                      <Info size={15} />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 hover:text-rose-500 rounded cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 overflow-y-auto max-h-[500px]">
                  {filteredEmails.length === 0 ? (
                    <div className="p-10 text-center text-xs text-gray-400">
                      No emails found in this category.
                    </div>
                  ) : (
                    filteredEmails.map((item) => {
                      const isSelected = !!selectedEmails[item.id];
                      return (
                        <div
                          key={item.id}
                          className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/80 transition-colors text-xs text-gray-700 cursor-pointer group"
                        >
                          <button
                            type="button"
                            onClick={() => toggleEmailSelect(item.id)}
                            className="text-gray-300 hover:text-gray-500 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare size={14} className="text-[#ff3355]" />
                            ) : (
                              <Square size={14} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleEmailStar(item.id)}
                            className={`cursor-pointer ${item.starred ? "text-amber-400" : "text-gray-300 hover:text-gray-400"
                              }`}
                          >
                            <Star size={14} fill={item.starred ? "currentColor" : "none"} />
                          </button>

                          <div className="w-32 font-bold text-gray-900 truncate">
                            {item.sender}
                          </div>

                          <div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.tag === "Primary"
                                ? "bg-teal-100 text-teal-700"
                                : item.tag === "Work"
                                  ? "bg-amber-100 text-amber-700"
                                  : item.tag === "Friends"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-cyan-100 text-cyan-700"
                                }`}
                            >
                              {item.tag}
                            </span>
                          </div>

                          <div className="flex-1 truncate text-gray-600 font-medium">
                            {item.subject}
                          </div>

                          <div className="text-[11px] text-gray-400 font-medium shrink-0">
                            {item.time}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              VIEW: SUBMISSIONS (Submissions & Team Evaluations)
             ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === "submissions" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Package className="text-[#ff3355]" size={22} />
                    <span>Project Submissions &amp; Evaluation</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Review submitted proposals, assign milestone scores, and manage progression status.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl">
                    {submissionsList.length} Teams Registered
                  </span>
                  <button
                    type="button"
                    onClick={loadTeams}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                    title="Refresh teams"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#f8fafc] text-gray-400 font-bold border-b border-gray-100">
                      <th className="py-3.5 px-4">TEAM &amp; INSTITUTION</th>
                      <th className="py-3.5 px-4">THEME &amp; PROPOSAL</th>
                      <th className="py-3.5 px-4">STATUS</th>
                      <th className="py-3.5 px-4">SCORE</th>
                      <th className="py-3.5 px-6 text-right">EVALUATION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {submissionsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400">
                          No team submissions found in database. Click "Sync DB" above to reload.
                        </td>
                      </tr>
                    ) : (
                      submissionsList.map((team) => (
                        <tr key={team.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 text-sm">{team.teamName}</div>
                            <div className="text-gray-500 text-[11px]">{team.institution}</div>
                            <div className="text-gray-400 text-[10px]">Leader: {team.leader.name} ({team.leader.email})</div>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-semibold text-gray-800 line-clamp-1">{team.theme}</div>
                            <div className="text-gray-500 text-[11px] line-clamp-2 mt-0.5">
                              <span className="font-bold text-[#ff3355] mr-1">[{team.problemStatementId}]</span>
                              {team.problemStatement}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${team.status === "shortlisted"
                                ? "bg-emerald-100 text-emerald-700"
                                : team.status === "rejected"
                                  ? "bg-rose-100 text-rose-700"
                                  : team.status === "under_review"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                            >
                              {team.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-black text-gray-900 text-sm">
                            {team.score ? (
                              <span className="text-emerald-600 font-extrabold">{team.score} / 100</span>
                            ) : (
                              <span className="text-gray-400 font-normal italic text-xs">Pending</span>
                            )}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => openEvaluationModal(team)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                            >
                              <Edit3 size={12} />
                              <span>Review &amp; Score</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              VIEW: USERS & RBAC ROLE MANAGEMENT
             ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="text-[#ff3355]" size={20} />
                    <span>User &amp; Role Management</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {currentRole === "SUPER_ADMIN"
                      ? "Super Admin control: Promote, assign, or revoke roles across all accounts."
                      : "Admin operational view: User directory (role changes restricted to Super Admin)."}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  {currentRole === "SUPER_ADMIN" && (
                    <button
                      type="button"
                      onClick={() => setAddUserModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <UserPlus size={14} />
                      <span>Add User / Assign Role</span>
                    </button>
                  )}

                  {currentRole === "ADMIN" && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-2 font-medium">
                      <Lock size={14} className="text-blue-600 shrink-0" />
                      <span>Role modifications are protected and reserved for Super Admin.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#f8fafc] text-gray-400 font-bold border-b border-gray-100">
                      <th className="py-3.5 px-4">NAME</th>
                      <th className="py-3.5 px-4">EMAIL</th>
                      <th className="py-3.5 px-4">CURRENT ROLE</th>
                      <th className="py-3.5 px-4">STATUS</th>
                      <th className="py-3.5 px-6 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {userList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{usr.name}</td>
                        <td className="py-3.5 px-4 text-gray-600">{usr.email}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${usr.role === "SUPER_ADMIN"
                              ? "bg-rose-100 text-[#ff3355]"
                              : usr.role === "ADMIN"
                                ? "bg-blue-100 text-blue-700"
                                : usr.role === "RESOURCE"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                          >
                            {usr.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${usr.status === "Active" ? "text-emerald-600" : "text-rose-600"
                                }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${usr.status === "Active" ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                              />
                              {usr.status}
                            </span>
                            {currentRole === "SUPER_ADMIN" && (
                              usr.id === user?.id || usr.email === user?.email ? (
                                <span className="text-[10px] text-gray-400 font-medium italic">
                                  (You)
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(usr)}
                                  className="text-[10px] text-gray-400 hover:text-gray-700 underline cursor-pointer"
                                  title="Toggle user status"
                                >
                                  {usr.status === "Active" ? "Suspend" : "Activate"}
                                </button>
                              )
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          {currentRole === "SUPER_ADMIN" ? (
                            usr.id === user?.id || usr.email === user?.email ? (
                              <span
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed select-none"
                                title="You cannot change your own role"
                              >
                                {usr.role} (Current)
                              </span>
                            ) : (
                              <select
                                value={usr.role}
                                onChange={(e) => {
                                  const newR = e.target.value as UserRole;
                                  if (newR !== usr.role) {
                                    setRoleChangeModal({ user: usr, newRole: newR });
                                  }
                                }}
                                className="bg-gray-50 border border-gray-200 text-gray-800 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#ff3355] cursor-pointer"
                              >
                                <option value="MEMBER">Assign: MEMBER</option>
                                <option value="RESOURCE">Assign: RESOURCE</option>
                                <option value="ADMIN">Assign: ADMIN</option>
                                <option value="SUPER_ADMIN">Assign: SUPER_ADMIN</option>
                              </select>
                            )
                          ) : (
                            <span className="text-gray-400 text-[11px] font-medium italic">
                              View Only
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Super Admin Audit Trail */}
              {currentRole === "SUPER_ADMIN" && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Clock size={16} className="text-[#ff3355]" />
                      <span>Audit Trail for Privileged Operations</span>
                    </h3>
                    <button
                      type="button"
                      onClick={loadAuditLogs}
                      className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={11} /> Refresh Log
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100 text-xs max-h-64 overflow-y-auto">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{log.actor}</span>
                          <span className="text-gray-500">{log.action}</span>
                          <span className="font-semibold text-blue-600">{log.target}</span>
                        </div>
                        <span className="text-gray-400 text-[11px]">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              VIEW: RESOURCES & CONTENT HUB (Resource Role & Super Admin)
             ═════════════════════════════════════════════════════════════════════ */}
          {activeTab === "resources" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="text-[#ff3355]" size={20} />
                    <span>Resources &amp; Content Management Hub</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Centralized console for homepage banners, bulletins, announcements, FAQs, committee directory, and media gallery.
                  </p>
                </div>

                {/* Sub-tab Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 rounded-2xl overflow-x-auto">
                  {[
                    { id: "hero", label: "Hero Banners", icon: ImageIcon },
                    { id: "announcements", label: "Announcements & News", icon: Radio },
                    { id: "faqs", label: "FAQs", icon: HelpCircle },
                    { id: "committee", label: "Committee & Mentors", icon: UserCheck },
                    { id: "gallery", label: "Media Gallery", icon: Sparkles },
                  ].map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = resourceSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setResourceSubTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${isActive
                          ? "bg-white text-[#ff3355] shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        <TabIcon size={14} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {resourceSubTab === "hero" && renderHeroPanel()}
              {resourceSubTab === "announcements" && renderAnnouncementsPanel()}
              {resourceSubTab === "faqs" && renderFaqsPanel()}
              {resourceSubTab === "committee" && renderCommitteePanel()}
              {resourceSubTab === "gallery" && renderGalleryPanel()}
            </div>
          )}

          {/* Direct Sidebar Page Tabs */}
          {activeTab === "hero" && renderHeroPanel()}
          {(activeTab === "announcement" || activeTab === "newsletter") && renderAnnouncementsPanel()}
          {activeTab === "faq" && renderFaqsPanel()}
          {activeTab === "committee" && renderCommitteePanel()}
          {activeTab === "contact" && renderContactQueriesPanel()}
          {activeTab === "themes" && renderThemesPanel()}

          {/* ═════════════════════════════════════════════════════════════════════
              MEMBER VIEWS: MY REGISTRATION, TIMELINE, RESULTS, MEMBER MAIL
             ═════════════════════════════════════════════════════════════════════ */}

          {/* 1. Member: My Registration & Problem Statement Details */}
          {activeTab === "my-registration" && (
            <div className="space-y-6">
              {!memberData.hasTeam ? (
                <div className="bg-white rounded-2xl p-10 border border-gray-200/80 shadow-xs text-center space-y-4">
                  <div className="size-16 rounded-2xl bg-rose-50 text-[#ff3355] flex items-center justify-center mx-auto">
                    <Package size={32} />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-bold text-gray-900">No Team Registered Yet</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      You have not registered a team for SEWA 2026 yet. Team leaders can register their team, choose an official problem statement, and upload their institutional verification.
                    </p>
                  </div>
                  <div>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors"
                    >
                      <Plus size={14} />
                      <span>Register Your Team Now</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                          Applicant Dossier
                        </span>
                        <h2 className="text-2xl font-bold">
                          Welcome, {user?.firstName || "Innovator"} ({memberData.teamName})
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                          Tracking official dossier #{memberData.dossierId} for SEWA 2026.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Link
                          to="/register"
                          className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/20 transition-colors"
                        >
                          <Edit3 size={14} />
                          <span>Edit / View Team</span>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Problem Statement Card */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen size={18} className="text-[#ff3355]" />
                        <span>Selected Problem Statement &amp; Proposal Details</span>
                      </h3>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                        {memberData.problemStatementId}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 text-xs">
                      <div>
                        <span className="text-gray-400 font-semibold block mb-0.5">National Theme</span>
                        <p className="text-sm font-bold text-gray-900">{memberData.theme}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block mb-0.5">Affiliated Institute</span>
                        <p className="text-sm font-bold text-gray-900">{memberData.institution}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-gray-400 font-semibold block mb-0.5">
                          Problem Statement Title
                        </span>
                        <p className="text-sm font-bold text-gray-900">{memberData.problemTitle}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block mb-0.5">Team Leader</span>
                        <p className="text-sm font-bold text-gray-900">{memberData.teamLead}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-semibold block mb-0.5">Team Status</span>
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${memberData.round1Status === "Cleared"
                            ? "text-emerald-600"
                            : memberData.status === "rejected"
                              ? "text-rose-600"
                              : "text-amber-600"
                            }`}
                        >
                          <CheckCircle2 size={13} />
                          {memberData.statusBadge}
                        </span>
                      </div>
                    </div>

                    {/* Team Members Roster */}
                    {myTeam?.members && myTeam.members.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-gray-700 mb-2">Team Roster ({myTeam.members.length} Members)</h4>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {myTeam.members.map((m: any) => (
                            <div key={m.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-gray-900 block">{m.firstName} {m.lastName}</span>
                                <span className="text-[11px] text-gray-400">{m.email}</span>
                              </div>
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-gray-600 border border-gray-200">
                                {m.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 2. Member: Timeline & 100-Day Milestones */}
          {activeTab === "timeline" && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="text-[#ff3355]" size={20} />
                  <span>100-Day Innovation Challenge Timeline</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Follow your team&apos;s pathway from technical screening to the Grand Finale at DTU.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {memberData.timelineMilestones.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-4 p-4 rounded-xl border ${m.done ? "bg-emerald-50/60 border-emerald-200" : "bg-gray-50 border-gray-200"
                      }`}
                  >
                    <div
                      className={`size-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${m.done ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-600"
                        }`}
                    >
                      {m.done ? <Check size={14} /> : idx + 1}
                    </div>

                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900">{m.title}</h4>
                        <span className="text-xs text-gray-500 font-medium">{m.date}</span>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full shrink-0 ${m.done
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-200 text-gray-700"
                          }`}
                      >
                        {m.done ? "Completed" : "Upcoming"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Member: Evaluation & Results */}
          {activeTab === "evaluation" && (
            <div className="space-y-6">
              {!memberData.hasTeam ? (
                <div className="bg-white rounded-2xl p-10 border border-gray-200/80 shadow-xs text-center space-y-3">
                  <Award className="size-10 text-gray-300 mx-auto" />
                  <h3 className="text-base font-bold text-gray-900">No Evaluation Available</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Evaluation rubrics and jury scores will appear here once you register your team and submit your problem statement proposal.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-5">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase">
                        Round 1 Screening
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${memberData.round1Status === "Cleared"
                          ? "bg-emerald-100 text-emerald-700"
                          : memberData.status === "rejected"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                          }`}
                      >
                        <CheckCircle2 size={13} />
                        {memberData.round1Status}
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="text-3xl font-black text-gray-900">{memberData.score}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        Jury Rubric: {memberData.evaluatorNotes}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase">
                        Round 2 / Grand Finale
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        <Clock3 size={13} />
                        Scheduled
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {memberData.round2Date}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Venue: Dr. B.R. Ambedkar Auditorium, DTU
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase">
                        Award Eligibility
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                        <Award size={13} />
                        National Track
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm font-bold text-gray-900">
                        ₹10 Lakh Cash Prizes + Incubation
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        MoE Innovation Cell Mentorship
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Member: Official Mail */}
          {activeTab === "member-mail" && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Mail className="text-[#ff3355]" size={20} />
                    <span>Official Communications &amp; Instructions</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Direct announcements sent to your registered team email.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadMemberMails}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                  title="Refresh communications"
                >
                  <RefreshCw size={13} />
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {memberData.memberEmails.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400">
                    <Mail className="size-8 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-600">No official communications yet</p>
                    <p className="text-gray-400 mt-0.5">Announcements and broadcast messages will appear here.</p>
                  </div>
                ) : (
                  memberData.memberEmails.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setReadingMail(item as any)}
                      className="py-4 space-y-1 hover:bg-gray-50/80 rounded-xl px-3 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">{item.sender}</span>
                        <span className="text-[11px] text-gray-400">{item.time}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#ff3355]">
                        {item.subject}
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{item.preview}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ─── Super Admin Role Change Confirmation Modal ─── */}
      {roleChangeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-200">
            <div className="flex items-center gap-3 text-rose-600">
              <Shield size={24} />
              <h3 className="text-lg font-bold text-gray-900">Confirm Role Assignment</h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to assign the role{" "}
              <strong className="text-[#ff3355]">{roleChangeModal.newRole}</strong> to{" "}
              <strong>{roleChangeModal.user.email}</strong>?
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              This grants elevated privileges and will immediately be logged to the server audit
              registry.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRoleChangeModal(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRoleAssignment}
                className="px-5 py-2 rounded-xl bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold shadow transition-colors cursor-pointer"
              >
                Confirm &amp; Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Compose Mail Modal (Super Admin & Admin) ─── */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Mail size={18} className="text-[#ff3355]" />
                <span>New Official Communication</span>
              </h3>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Target Audience
                </label>
                <select
                  value={composeTargetAudience}
                  onChange={(e) => setComposeTargetAudience(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#ff3355] cursor-pointer"
                >
                  <option value="ALL">Broadcast to: ALL Users &amp; Teams</option>
                  <option value="MEMBER">Broadcast to: Registered Members &amp; Teams Only</option>
                  <option value="ADMIN">Broadcast to: Evaluation &amp; Admin Staff</option>
                  <option value="RESOURCE">Broadcast to: Media &amp; Resource Team</option>
                  <option value="DIRECT">Direct Single Recipient (Specify Email)</option>
                </select>
              </div>

              {composeTargetAudience === "DIRECT" && (
                <div>
                  <input
                    type="email"
                    placeholder="Recipient email address"
                    required
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
                  />
                </div>
              )}

              <div>
                <input
                  type="text"
                  placeholder="Subject / Notice Header"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 font-medium focus:outline-none focus:border-[#ff3355]"
                />
              </div>

              <div>
                <textarea
                  rows={6}
                  placeholder="Type official communication or announcement body..."
                  required
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setComposeOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} />
                  <span>Dispatch Communication</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Team Review & Evaluation Modal ─── */}
      {evaluatingTeam && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Team Evaluation: {evaluatingTeam.teamName}
                </h3>
                <p className="text-xs text-gray-500">
                  {evaluatingTeam.institution} &bull; Leader: {evaluatingTeam.leader.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEvaluatingTeam(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs space-y-1">
              <div className="font-bold text-gray-900">Theme: {evaluatingTeam.theme}</div>
              <div className="text-gray-600">
                <span className="font-bold text-[#ff3355] mr-1">[{evaluatingTeam.problemStatementId}]</span>
                {evaluatingTeam.problemStatement}
              </div>
              <div className="text-gray-400 text-[11px] pt-1">
                Members: {evaluatingTeam.members.map((m) => m.name).join(", ") || "Leader only"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Progression Status
                </label>
                <select
                  value={evalStatus}
                  onChange={(e) => setEvalStatus(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#ff3355] cursor-pointer"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted (Round 2)</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Evaluation Score (0 - 100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={evalScore}
                  onChange={(e) => setEvalScore(Number(e.target.value))}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs font-black text-gray-900 focus:outline-none focus:border-[#ff3355]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Evaluator Feedback &amp; Jury Notes
              </label>
              <textarea
                rows={4}
                placeholder="Enter jury rubric observations, prototype validation status, and next steps..."
                value={evalNotes}
                onChange={(e) => setEvalNotes(e.target.value)}
                className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEvaluatingTeam(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEvaluation}
                className="px-5 py-2 rounded-xl bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold shadow transition-colors cursor-pointer"
              >
                Commit Evaluation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add User Modal (Super Admin Exclusive) ─── */}
      {addUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-[#ff3355]">
                <UserPlus size={20} />
                <h3 className="text-base font-bold text-gray-900">Provision User &amp; Assign Role</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
                    placeholder="e.g. Ramesh"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
                    placeholder="e.g. Kumar"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
                  placeholder="user@institute.ac.in"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Assign System Role *
                </label>
                <select
                  value={newRoleToAssign}
                  onChange={(e) => setNewRoleToAssign(e.target.value as UserRole)}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#ff3355] cursor-pointer"
                >
                  <option value="MEMBER">MEMBER (Participant / Team Leader)</option>
                  <option value="RESOURCE">RESOURCE (Media, Gallery &amp; FAQ Manager)</option>
                  <option value="ADMIN">ADMIN (Operational &amp; Evaluation Staff)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full System Privileges)</option>
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-800">
                User will be immediately provisioned with verified access and an audit log will be recorded.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-5 py-2 rounded-xl bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold shadow transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus size={13} />
                  <span>{isCreatingUser ? "Provisioning..." : "Provision & Assign"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Read Email / Communication Modal ─── */}
      {readingMail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-rose-50 text-[#ff3355] flex items-center justify-center">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                    {readingMail.title || (readingMail as any).subject}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    From: {readingMail.sender} &bull; {readingMail.time}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReadingMail(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#f8fafc] p-4 rounded-xl border border-gray-200/80 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto font-sans">
              {readingMail.body || (readingMail as any).preview || (readingMail as any).snippet || "No content."}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setReadingMail(null)}
                className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold shadow transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Hero Slide Editor Modal ─── */}
      {heroModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-200 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-[#ff3355]">
                <ImageIcon size={20} />
                <h3 className="text-base font-bold text-gray-900">
                  {editingHeroSlide ? "Edit Hero Banner Slide" : "Create New Hero Banner"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHeroModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHeroSlide} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Main Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEWA FIRST: National Youth Innovation Challenge 2026"
                  value={heroFormTitle}
                  onChange={(e) => setHeroFormTitle(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Subtitle / Supporting Pitch (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Empowering youth to build prototype-driven sustainable solutions"
                  value={heroFormSubtitle}
                  onChange={(e) => setHeroFormSubtitle(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Banner Image *
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="https://... or upload a local image file"
                      value={heroFormImageUrl}
                      onChange={(e) => setHeroFormImageUrl(e.target.value)}
                      className="flex-1 bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0">
                      <UploadCloud size={14} className="text-[#ff3355]" />
                      <span>{isUploadingImage ? "Uploading..." : "Upload File"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingImage}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await handleUploadImageFile(file);
                            if (url) setHeroFormImageUrl(url);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {heroFormImageUrl && (
                    <div className="relative h-32 w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      <img
                        src={resolveMediaUrl(heroFormImageUrl)}
                        alt="Slide Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={heroFormOrder}
                    onChange={(e) => setHeroFormOrder(Number(e.target.value))}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Status
                  </label>
                  <select
                    value={heroFormActive ? "active" : "inactive"}
                    onChange={(e) => setHeroFormActive(e.target.value === "active")}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#ff3355] cursor-pointer"
                  >
                    <option value="active">Active (Visible in Carousel)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setHeroModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold shadow transition-colors cursor-pointer"
                >
                  {editingHeroSlide ? "Save Changes" : "Create Hero Slide"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── FAQ Editor Modal ─── */}
      {faqModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-200 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-[#ff3355]">
                <HelpCircle size={20} />
                <h3 className="text-base font-bold text-gray-900">
                  {editingFaq ? "Edit FAQ Item" : "Create New FAQ Item"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFaqModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Question *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Can interdisciplinary teams participate?"
                  value={faqFormQuestion}
                  onChange={(e) => setFaqFormQuestion(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 font-medium focus:outline-none focus:border-[#ff3355]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Detailed Answer *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide clear, concise clarification and official instructions..."
                  value={faqFormAnswer}
                  onChange={(e) => setFaqFormAnswer(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355] resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={faqFormCategory}
                    onChange={(e) => setFaqFormCategory(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#ff3355] cursor-pointer"
                  >
                    <option value="general">General</option>
                    <option value="registration">Registration</option>
                    <option value="eligibility">Eligibility</option>
                    <option value="evaluation">Evaluation</option>
                    <option value="submission">Submission</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={faqFormOrder}
                    onChange={(e) => setFaqFormOrder(Number(e.target.value))}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Status
                  </label>
                  <select
                    value={faqFormActive ? "active" : "inactive"}
                    onChange={(e) => setFaqFormActive(e.target.value === "active")}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#ff3355] cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setFaqModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold shadow transition-colors cursor-pointer"
                >
                  {editingFaq ? "Save Changes" : "Save FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Announcement & Newsletter Editor Modal ─── */}
      {announcementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-200 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-[#ff3355]">
                <Radio size={20} />
                <h3 className="text-base font-bold text-gray-900">
                  {editingAnnouncement ? "Edit Announcement" : "Publish Official Announcement"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAnnouncementModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Circular / Bulletin Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule for Phase-1 Preliminary PPT Review"
                  value={announcementFormTitle}
                  onChange={(e) => setAnnouncementFormTitle(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#ff3355]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Circular ID
                  </label>
                  <div className="w-full h-[38px] bg-[#f1f5f9] border border-gray-200 rounded-xl px-3 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-gray-800">
                      {editingAnnouncement ? (editingAnnouncement.refNumber || "—") : nextGeneratedAnnouncementId}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-[#ff3355] uppercase tracking-wider border border-rose-100">
                      {editingAnnouncement ? "Assigned" : "Auto-Generated"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Category Tag
                  </label>
                  <select
                    value={announcementFormCategory}
                    onChange={(e) => setAnnouncementFormCategory(e.target.value)}
                    className="w-full h-[38px] bg-[#f8fafc] border border-gray-200 rounded-xl px-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#ff3355] cursor-pointer"
                  >
                    <option value="general">General Notice</option>
                    <option value="circular">Official Circular</option>
                    <option value="deadlines">Important Deadlines</option>
                    <option value="results">Results &amp; Shortlists</option>
                    <option value="newsletter">Newsletter Bulletin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Summary / Overview *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Brief 1-2 sentence summary displayed on the card..."
                  value={announcementFormSummary}
                  onChange={(e) => setAnnouncementFormSummary(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355] resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Detailed Notice / Instructions (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Full text of instructions, evaluation guidelines, venue details, or criteria..."
                  value={announcementFormDetail}
                  onChange={(e) => setAnnouncementFormDetail(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355] resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Published Date (Optional, defaults to now)
                </label>
                <input
                  type="date"
                  value={announcementFormPublishedAt ? announcementFormPublishedAt.split("T")[0] : ""}
                  onChange={(e) => setAnnouncementFormPublishedAt(e.target.value ? new Date(e.target.value).toISOString() : "")}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setAnnouncementModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold shadow transition-colors cursor-pointer"
                >
                  {editingAnnouncement ? "Save Changes" : "Publish Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Committee Member Editor Modal ─── */}
      {committeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-200 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-[#ff3355]">
                <UserCheck size={20} />
                <h3 className="text-base font-bold text-gray-900">
                  {editingCommittee ? "Edit Committee Profile" : "Add Committee / Mentor Profile"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCommitteeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCommitteeMember} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Full Name &amp; Salutation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Prateek Sharma"
                  value={committeeFormName}
                  onChange={(e) => setCommitteeFormName(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#ff3355]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Committee Category *
                  </label>
                  <select
                    value={committeeFormCategory}
                    onChange={(e) => {
                      const cat = e.target.value as any;
                      setCommitteeFormCategory(cat);
                      let sub = "coordinator";
                      if (cat === "dev_team") sub = "student";
                      else if (cat === "organizing") sub = "chief_patron";
                      else sub = "mentor";
                      setCommitteeFormSubCategory(sub);
                      const nextOrder = getNextDisplayOrder(cat, sub, editingCommittee?.id);
                      setCommitteeFormOrder(nextOrder);
                    }}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#ff3355] cursor-pointer"
                  >
                    <option value="organizing">Organizing Committee</option>
                    <option value="mentor">Mentors &amp; Advisors</option>
                    <option value="dev_team">Core Tech &amp; Dev Team</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Section / Subcategory *
                  </label>
                  <select
                    value={committeeFormSubCategory}
                    onChange={(e) => {
                      const sub = e.target.value;
                      setCommitteeFormSubCategory(sub);
                      const nextOrder = getNextDisplayOrder(committeeFormCategory, sub, editingCommittee?.id);
                      setCommitteeFormOrder(nextOrder);
                    }}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#ff3355] cursor-pointer"
                  >
                    {committeeFormCategory === "dev_team" && (
                      <>
                        <option value="faculty">Faculty &amp; Leadership</option>
                        <option value="student">Student &amp; Core Tech Team</option>
                      </>
                    )}
                    {committeeFormCategory === "organizing" && (
                      <>
                        <option value="chief_patron">Chief Patron (Leadership)</option>
                        <option value="patron">Patron (Leadership)</option>
                        <option value="coordinator">Coordinator / Organizing Member</option>
                      </>
                    )}
                    {committeeFormCategory === "mentor" && (
                      <>
                        <option value="mentor">Mentors &amp; Advisors</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Role / Official Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Patron / Vice Chancellor"
                    value={committeeFormDesignation}
                    onChange={(e) => setCommitteeFormDesignation(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Affiliation / Institute
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi Technological University"
                    value={committeeFormAffiliation}
                    onChange={(e) => setCommitteeFormAffiliation(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Profile Photo / Avatar
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Image URL or upload local photo file..."
                      value={committeeFormImageUrl}
                      onChange={(e) => setCommitteeFormImageUrl(e.target.value)}
                      className="flex-1 bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0">
                      <UploadCloud size={14} className="text-[#ff3355]" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingImage}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await handleUploadImageFile(file);
                            if (url) setCommitteeFormImageUrl(url);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {committeeFormImageUrl && (
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-200">
                      <img
                        src={resolveMediaUrl(committeeFormImageUrl)}
                        alt="Member Preview"
                        className="size-12 rounded-full object-cover ring-2 ring-[#ff3355]/30"
                        onError={(e) => {
                          (e.target as any).style.display = "none";
                        }}
                      />
                      <span className="text-[11px] text-gray-500 font-mono truncate">
                        {committeeFormImageUrl}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min={1}
                  value={committeeFormOrder}
                  onChange={(e) => setCommitteeFormOrder(Number(e.target.value))}
                  className="w-full bg-[#f8fafc] border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#ff3355]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCommitteeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#ff3355] hover:bg-[#d62544] text-white text-xs font-bold shadow transition-colors cursor-pointer"
                >
                  {editingCommittee ? "Save Profile" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Footer matching Screenshot ─── */}
      <footer className="mt-auto border-t border-gray-200/80 bg-white/95 relative overflow-hidden py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-12 items-start">
          <div className="md:col-span-5">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
              DTU – SEWA 2026
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed max-w-sm">
              Young India&apos;s Knowledge &amp; Technology Initiative — Rashtriya Innovation
              Challenge. Empowering youth to create sustainable, prototype-driven solutions for Viksit
              Bharat.
            </p>

            <div className="mt-4 flex items-center gap-2 text-[#ff3355]">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="size-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center hover:scale-105 transition-transform"
              >
                <Facebook size={13} fill="currentColor" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X"
                className="size-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center hover:scale-105 transition-transform"
              >
                <svg className="size-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="size-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center hover:scale-105 transition-transform"
              >
                <Instagram size={13} strokeWidth={2} />
              </a>
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
              Navigation
            </h4>
            <div className="space-y-1.5 text-xs text-gray-600 font-medium">
              <div>
                <Link to="/about" className="hover:text-[#ff3355]">
                  About Challenge
                </Link>
              </div>
              <div>
                <Link to="/guidelines" className="hover:text-[#ff3355]">
                  5 National Themes
                </Link>
              </div>
              <div>
                <Link to="/problem-statements" className="hover:text-[#ff3355]">
                  Problem Statements (UDAN)
                </Link>
              </div>
              <div>
                <Link to="/events" className="hover:text-[#ff3355]">
                  100-Day Timeline
                </Link>
              </div>
              <div>
                <Link to="/signin" className="hover:text-[#ff3355]">
                  Login
                </Link>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 flex justify-start md:justify-end">
            <div className="relative w-full max-w-[280px] h-[160px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-slate-100 group">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Delhi+Technological+University"
                target="_blank"
                rel="noreferrer"
                className="absolute top-2.5 left-2.5 z-10 text-left bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded shadow-xs"
              >
                <div className="text-[10px] font-bold text-gray-900 leading-none flex items-center gap-1">
                  DTU
                  <span className="size-1.5 rounded-full bg-[#ff3355]" />
                </div>
                <div className="text-[9px] font-bold text-gray-700 leading-tight">Delhi</div>
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
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([28.7499, 77.1170], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.circleMarker([28.7499, 77.1170], { color: '#ff3355', fillColor: '#ff3355', fillOpacity: 0.9, radius: 6 }).addTo(map);
  </script>
</body>
</html>`}
                className="w-full h-full border-0 pointer-events-none"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 text-center text-[11px] text-gray-400">
          Copyright &copy; 2026 Delhi Technological University (DTU). All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
