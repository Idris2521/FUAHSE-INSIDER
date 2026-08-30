import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  FileText,
  Tag,
  Settings as SettingsIcon,
  Activity,
  LogOut,
  Search,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  Share2,
  Trash2,
  Edit3,
  UserPlus,
  Lock,
  Database,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Play,
  Pause,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Radio,
  Sliders,
  Filter,
  File,
  FileCode,
  Download,
  Volume2,
  Video,
  Image as ImageIcon,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  AdminAccount,
  AdminRole,
  AuditLog,
  Category,
  DashboardStats,
  NIGERIAN_STATES,
  Submission,
  SubmissionStatus,
  SystemSettings,
  UserProfile,
} from "../types";
import { api, getAdminToken, setAdminToken } from "../lib/api";
import { WhatsAppButton } from "./WhatsAppButton";
import { FuahseLogo } from "./FuahseLogo";

interface AdminPortalProps {
  onExitToPublic: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onExitToPublic }) => {
  const [admin, setAdmin] = useState<AdminAccount | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [configStatus, setConfigStatus] = useState<any>(null);

  // Login / First Setup State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [setupName, setSetupName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "submissions" | "users" | "categories" | "admins" | "audit" | "settings"
  >("dashboard");

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [subPage, setSubPage] = useState(1);
  const [subCategoryFilter, setSubCategoryFilter] = useState("all");
  const [subTypeFilter, setSubTypeFilter] = useState("all");
  const [subStatusFilter, setSubStatusFilter] = useState("all");
  const [subSearch, setSubSearch] = useState("");

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userStateFilter, setUserStateFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");

  const [adminsList, setAdminsList] = useState<AdminAccount[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);

  // Modal / Detail states
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [revealedIdentity, setRevealedIdentity] = useState<any | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [statusChangeModalSub, setStatusChangeModalSub] = useState<Submission | null>(null);
  const [newStatus, setNewStatus] = useState<SubmissionStatus>("approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [moderationNotes, setModerationNotes] = useState("");
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Edit Submission Content modal
  const [editContentSub, setEditContentSub] = useState<Submission | null>(null);
  const [editContentText, setEditContentText] = useState("");
  const [editContentCat, setEditContentCat] = useState("");

  // User Edit Modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserAge, setEditUserAge] = useState<number | "">("");
  const [editUserState, setEditUserState] = useState("");
  const [editUserWhatsApp, setEditUserWhatsApp] = useState("");

  // Create Admin Modal
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>("CONTENT_ADMIN");

  // Create Category Modal
  const [isCreateCatOpen, setIsCreateCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // SQL Migration Schema Viewer Modal
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize Admin Session
  useEffect(() => {
    checkConfigAndSession();
  }, []);

  const refreshCurrentView = async (showBanner = false) => {
    if (!admin) return;
    setIsRefreshing(true);
    try {
      await api.syncSupabase().catch(() => {});
      if (activeTab === "dashboard") {
        await Promise.all([fetchStats(), fetchCategories(), fetchAdminSubmissions()]);
      } else if (activeTab === "submissions") {
        await fetchAdminSubmissions();
      } else if (activeTab === "users" && (admin.role === "SUPER_ADMIN" || admin.role === "USER_ADMIN")) {
        await fetchAdminUsers();
      } else if (activeTab === "admins" && admin.role === "SUPER_ADMIN") {
        await fetchAdminsList();
      } else if (activeTab === "categories") {
        await fetchCategories();
      } else if (activeTab === "audit" && admin.role === "SUPER_ADMIN") {
        await fetchAuditLogs();
      } else if (activeTab === "settings" && admin.role === "SUPER_ADMIN") {
        await fetchSettings();
      }
      if (showBanner) {
        showFeedback("success", "Database records and user counts refreshed successfully");
      }
    } catch (err) {
      console.error("Auto refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Periodic Auto-Polling (Every 10 seconds) to ensure real-time single source of truth
  useEffect(() => {
    if (!admin) return;
    const interval = setInterval(() => {
      refreshCurrentView(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [
    admin,
    activeTab,
    subPage,
    subCategoryFilter,
    subTypeFilter,
    subStatusFilter,
    subSearch,
    userPage,
    userSearch,
    userStateFilter,
    userStatusFilter,
  ]);

  const checkConfigAndSession = async () => {
    setLoadingAuth(true);
    try {
      const cfg = await api.getConfigStatus();
      setConfigStatus(cfg);

      const token = getAdminToken();
      if (token) {
        try {
          const meRes = await api.getAdminMe();
          setAdmin(meRes.admin);
        } catch {
          setAdminToken(null);
          setAdmin(null);
        }
      }
    } catch {
      setAdminToken(null);
      setAdmin(null);
    } finally {
      setLoadingAuth(false);
    }
  };

  // Fetch data when activeTab changes or admin logs in
  useEffect(() => {
    if (!admin) return;

    if (activeTab === "dashboard") {
      fetchStats();
      fetchCategories();
      fetchAdminSubmissions();
    } else if (activeTab === "submissions") {
      fetchAdminSubmissions();
    } else if (activeTab === "users" && (admin.role === "SUPER_ADMIN" || admin.role === "USER_ADMIN")) {
      fetchAdminUsers();
    } else if (activeTab === "admins" && admin.role === "SUPER_ADMIN") {
      fetchAdminsList();
    } else if (activeTab === "categories") {
      fetchCategories();
    } else if (activeTab === "audit" && admin.role === "SUPER_ADMIN") {
      fetchAuditLogs();
    } else if (activeTab === "settings" && admin.role === "SUPER_ADMIN") {
      fetchSettings();
    }

    // Auto-polling interval: live sync database state across devices every 4 seconds
    const interval = setInterval(() => {
      if (activeTab === "dashboard") {
        fetchStats();
        fetchAdminSubmissions();
      } else if (activeTab === "submissions") {
        fetchAdminSubmissions();
      } else if (activeTab === "users" && (admin.role === "SUPER_ADMIN" || admin.role === "USER_ADMIN")) {
        fetchAdminUsers();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [
    admin,
    activeTab,
    subPage,
    subCategoryFilter,
    subTypeFilter,
    subStatusFilter,
    subSearch,
    userPage,
    userSearch,
    userStateFilter,
    userStatusFilter,
  ]);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Data Fetchers
  const fetchStats = async () => {
    try {
      const res = await api.getDashboardStats();
      setStats(res.stats);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchAdminSubmissions = async () => {
    try {
      const res = await api.getAdminSubmissions({
        page: subPage,
        limit: 15,
        category: subCategoryFilter,
        type: subTypeFilter,
        status: subStatusFilter,
        search: subSearch,
      });
      setSubmissions(res.submissions);
      setSubTotal(res.pagination.total);
    } catch (err) {
      console.error("Error fetching admin submissions:", err);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const res = await api.getAdminUsers({
        page: userPage,
        limit: 15,
        search: userSearch,
        state: userStateFilter,
        status: userStatusFilter,
      });
      setUsers(res.users);
      setUserTotal(res.pagination.total);
    } catch (err) {
      console.error("Error fetching admin users:", err);
    }
  };

  const fetchAdminsList = async () => {
    try {
      const res = await api.getAdmins();
      setAdminsList(res.admins);
    } catch (err) {
      console.error("Error fetching admins:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.getCategories();
      setCategoriesList(res.categories);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.getAuditLogs({ page: 1, limit: 50 });
      setAuditLogs(res.logs);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.getSettings();
      setSystemSettings(res.settings);
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  // Auth Handlers
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await api.adminLogin(loginEmail.trim(), loginPassword);
      setAdminToken(res.token);
      setAdmin(res.admin);
      showFeedback("success", `Welcome back, ${res.admin.name} (${res.admin.role})`);
    } catch (err: any) {
      setAuthError(err.message || "Invalid email or password");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSetupFirstSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (!setupName || !setupEmail || setupPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      const res = await api.setupFirstSuperAdmin({
        name: setupName.trim(),
        email: setupEmail.trim().toLowerCase(),
        password: setupPassword,
      });
      setAdminToken(res.token);
      setAdmin(res.admin);
      setConfigStatus((prev: any) => ({ ...prev, hasSuperAdmin: true, adminCount: 1 }));
      showFeedback("success", "Super Admin account initialized successfully");
    } catch (err: any) {
      setAuthError(err.message || "Setup failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setAdmin(null);
    setActiveTab("dashboard");
    showFeedback("success", "Logged out from Admin Portal");
  };

  // Status update (Review, Accept, Reject, Mark as Posted)
  const handleOpenStatusModal = (sub: Submission, initialStatus: SubmissionStatus) => {
    setStatusChangeModalSub(sub);
    setNewStatus(initialStatus);
    setRejectionReason(sub.rejection_reason || "");
    setModerationNotes(sub.moderation_notes || "");
  };

  const handleQuickStatus = async (sub: Submission, status: SubmissionStatus) => {
    if (status === "rejected") {
      handleOpenStatusModal(sub, "rejected");
      return;
    }
    try {
      const res = await api.updateSubmissionStatus(sub.id, {
        status,
        moderation_notes: `Quick action by ${admin?.name || "Admin"}`,
      });
      setSubmissions((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, ...res.submission } : s))
      );
      if (selectedSub?.id === sub.id) {
        setSelectedSub((prev) => (prev ? { ...prev, ...res.submission } : null));
      }
      fetchStats();
      showFeedback("success", `Submission marked as ${status}`);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to update status");
    }
  };

  const handleSaveStatus = async () => {
    if (!statusChangeModalSub) return;
    setSubmittingStatus(true);
    try {
      const res = await api.updateSubmissionStatus(statusChangeModalSub.id, {
        status: newStatus,
        rejection_reason: newStatus === "rejected" ? rejectionReason : undefined,
        moderation_notes: moderationNotes,
      });

      setSubmissions((prev) =>
        prev.map((s) => (s.id === statusChangeModalSub.id ? { ...s, ...res.submission } : s))
      );
      if (selectedSub?.id === statusChangeModalSub.id) {
        setSelectedSub((prev) => (prev ? { ...prev, ...res.submission } : null));
      }
      setStatusChangeModalSub(null);
      fetchStats();
      showFeedback("success", `Submission marked as ${newStatus}`);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to update status");
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Reveal Identity (SUPER ADMIN & USER ADMIN ONLY)
  const handleRevealIdentity = async (submissionId: string) => {
    setIsRevealing(true);
    try {
      const res = await api.revealIdentity(submissionId);
      setRevealedIdentity(res.identity);
      showFeedback("success", "Sensitive Identity Revealed (Action recorded in Audit Log)");
    } catch (err: any) {
      showFeedback("error", err.message || "Unauthorized to reveal user identity");
    } finally {
      setIsRevealing(false);
    }
  };

  // Content edit
  const handleOpenEditContent = (sub: Submission) => {
    setEditContentSub(sub);
    setEditContentText(sub.text_content || "");
    setEditContentCat(sub.category_name || "");
  };

  const handleSaveEditContent = async () => {
    if (!editContentSub) return;
    try {
      const res = await api.updateSubmissionContent(editContentSub.id, {
        text_content: editContentText,
        category_name: editContentCat,
      });
      setSubmissions((prev) =>
        prev.map((s) => (s.id === editContentSub.id ? { ...s, ...res.submission } : s))
      );
      setEditContentSub(null);
      showFeedback("success", "Submission content updated");
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to edit content");
    }
  };

  // Delete submission
  const handleDeleteSubmission = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this submission?")) return;
    try {
      await api.deleteAdminSubmission(id);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      if (selectedSub?.id === id) setSelectedSub(null);
      fetchStats();
      showFeedback("success", "Submission deleted");
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to delete submission");
    }
  };

  // Create Admin (Super Admin only)
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createAdmin({
        name: newAdminName.trim(),
        email: newAdminEmail.trim().toLowerCase(),
        password: newAdminPassword,
        role: newAdminRole,
      });
      setAdminsList((prev) => [...prev, res.admin]);
      setIsCreateAdminOpen(false);
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPassword("");
      showFeedback("success", `Admin ${res.admin.email} created as ${res.admin.role}`);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to create admin");
    }
  };

  // Toggle Admin status
  const handleToggleAdminStatus = async (targetAdmin: AdminAccount) => {
    const nextStatus = targetAdmin.status === "active" ? "disabled" : "active";
    if (!window.confirm(`Are you sure you want to set admin ${targetAdmin.email} to ${nextStatus}?`)) return;
    try {
      const res = await api.updateAdminStatus(targetAdmin.id, nextStatus);
      setAdminsList((prev) =>
        prev.map((a) => (a.id === targetAdmin.id ? { ...a, status: res.admin.status } : a))
      );
      showFeedback("success", `Admin status updated to ${nextStatus}`);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to update admin status");
    }
  };

  // Category Actions
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await api.createCategory(newCatName.trim());
      setCategoriesList((prev) => [...prev, res.category]);
      setIsCreateCatOpen(false);
      setNewCatName("");
      showFeedback("success", `Category "${res.category.name}" created`);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to create category");
    }
  };

  const handleToggleCategoryActive = async (cat: Category) => {
    try {
      const res = await api.updateCategory(cat.id, cat.name, !cat.is_active);
      setCategoriesList((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: res.category.is_active } : c))
      );
      showFeedback("success", `Category "${cat.name}" is now ${res.category.is_active ? "Active" : "Disabled"}`);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to update category");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.deleteCategory(id);
      setCategoriesList((prev) => prev.filter((c) => c.id !== id));
      showFeedback("success", "Category deleted");
    } catch (err: any) {
      showFeedback("error", err.message || "Cannot delete category");
    }
  };

  // User Actions (User Admin & Super Admin)
  const handleOpenEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setEditUserName(u.name);
    setEditUserAge(u.age);
    setEditUserState(u.state);
    setEditUserWhatsApp(u.whatsapp_number);
  };

  const handleSaveEditUser = async () => {
    if (!editingUser) return;
    try {
      const res = await api.updateUserProfileAdmin(editingUser.id, {
        name: editUserName.trim(),
        age: Number(editUserAge),
        state: editUserState.trim(),
        whatsapp_number: editUserWhatsApp.trim(),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...res.profile } : u))
      );
      setEditingUser(null);
      showFeedback("success", "User profile updated");
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to update user profile");
    }
  };

  const handleToggleUserStatus = async (u: UserProfile) => {
    const nextStatus = u.account_status === "active" ? "deactivated" : "active";
    if (!window.confirm(`Set user ${u.follower_id} status to ${nextStatus}?`)) return;
    try {
      const res = await api.updateUserStatusAdmin(u.id, nextStatus);
      setUsers((prev) =>
        prev.map((usr) => (usr.id === u.id ? { ...usr, account_status: res.profile.account_status } : usr))
      );
      showFeedback("success", `User account ${nextStatus}`);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to update user status");
    }
  };

  // Copy SQL schema
  const handleCopySql = () => {
    const sqlContent = `-- Complete Supabase SQL Schema for FUAHSE_🅸🅽🆂🅸🅳🅴🆁 (The Campus Mirror)
-- Run this in your Supabase SQL Editor to provision all tables, sequences, RLS & triggers:
-- See /supabase-schema.sql for the full migration script.`;
    navigator.clipboard.writeText(sqlContent);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  // ---------------------------------------------------------------------------
  // RENDER AUTHENTICATION VIEW (If not logged in as Admin) - White & Blue Theme
  // ---------------------------------------------------------------------------
  if (!admin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-900/5 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <FuahseLogo size="lg" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-blue-950">Administrator Portal</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                FUAHSE_🅸🅽🆂🅸🅳🅴🆁 Editorial, Moderation & User Control
              </p>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{authError}</span>
            </div>
          )}

          {/* First Time Super Admin Setup If None Exists */}
          {configStatus && !configStatus.hasSuperAdmin ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs leading-relaxed">
                <strong>First-Time Initialization:</strong> No Super Admin account detected in the database. Create the master Super Admin credentials below.
              </div>

              <form onSubmit={handleSetupFirstSuperAdmin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Super Admin Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Editor"
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@fuahse.com"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Master Password (min 8 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••••••"
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs tracking-wide shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {authLoading ? "Initializing Master Admin..." : "Initialize First Super Admin"}
                </button>
              </form>
            </div>
          ) : (
            /* Standard Admin Login */
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@fuahse.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {authLoading ? "Authenticating..." : "Enter Admin Portal"}
              </button>
            </form>
          )}

          <div className="pt-2 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={onExitToPublic}
              className="text-xs text-blue-700 hover:text-blue-900 font-bold transition-colors"
            >
              ← Back to Campus Public Mirror
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pending submissions for quick moderation ribbon
  const pendingSubmissions = submissions.filter((s) => s.status === "pending");

  // ---------------------------------------------------------------------------
  // RENDER AUTHENTICATED ADMIN DASHBOARD (White & Blue Theme + Horizontal List)
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Admin Bar */}
      <div className="bg-white border border-blue-100 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-blue-950">{admin.name}</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  admin.role === "SUPER_ADMIN"
                    ? "bg-blue-100 text-blue-900 border border-blue-300"
                    : admin.role === "USER_ADMIN"
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-sky-100 text-sky-900 border border-sky-300"
                }`}
              >
                {admin.role.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">{admin.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="btn-admin-refresh-data"
            onClick={() => refreshCurrentView(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-900 text-xs font-bold border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? "animate-spin text-blue-500" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh DB"}</span>
          </button>

          {admin.role === "SUPER_ADMIN" && (
            <button
              type="button"
              onClick={() => setIsSqlModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Supabase SQL</span>
            </button>
          )}

          <WhatsAppButton variant="compact" />

          <button
            type="button"
            onClick={onExitToPublic}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
          >
            View Public Site
          </button>

          <button
            type="button"
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-blue-100 overflow-x-auto shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "dashboard"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-blue-900 hover:bg-blue-50/50"
          }`}
        >
          <Activity className={`w-4 h-4 ${activeTab === "dashboard" ? "text-white" : "text-blue-600"}`} />
          <span>Dashboard Overview</span>
        </button>

        {/* Submissions Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("submissions")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "submissions"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:text-blue-900 hover:bg-blue-50/50"
          }`}
        >
          <FileText className={`w-4 h-4 ${activeTab === "submissions" ? "text-white" : "text-emerald-600"}`} />
          <span>Submissions Queue</span>
          {stats?.pendingSubmissions ? (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "submissions" ? "bg-white text-blue-900" : "bg-amber-100 text-amber-800"
              }`}
            >
              {stats.pendingSubmissions}
            </span>
          ) : null}
          {admin.role === "CONTENT_ADMIN" && (
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-100 text-blue-900 font-mono font-bold">
              Anonymous Mode
            </span>
          )}
        </button>

        {/* Users Tab (SUPER ADMIN & USER ADMIN ONLY) */}
        {(admin.role === "SUPER_ADMIN" || admin.role === "USER_ADMIN") && (
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-blue-900 hover:bg-blue-50/50"
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === "users" ? "text-white" : "text-blue-600"}`} />
            <span>User Management</span>
          </button>
        )}

        {/* Categories Tab (Super Admin) */}
        {admin.role === "SUPER_ADMIN" && (
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "categories"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-blue-900 hover:bg-blue-50/50"
            }`}
          >
            <Tag className={`w-4 h-4 ${activeTab === "categories" ? "text-white" : "text-blue-600"}`} />
            <span>Categories</span>
          </button>
        )}

        {/* Admins Tab (SUPER ADMIN ONLY) */}
        {admin.role === "SUPER_ADMIN" && (
          <button
            type="button"
            onClick={() => setActiveTab("admins")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "admins"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-blue-900 hover:bg-blue-50/50"
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${activeTab === "admins" ? "text-white" : "text-purple-600"}`} />
            <span>Admin Accounts</span>
          </button>
        )}

        {/* Audit Logs Tab (SUPER ADMIN ONLY) */}
        {admin.role === "SUPER_ADMIN" && (
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-blue-900 hover:bg-blue-50/50"
            }`}
          >
            <Lock className={`w-4 h-4 ${activeTab === "audit" ? "text-white" : "text-sky-600"}`} />
            <span>Audit Logs</span>
          </button>
        )}

        {/* Settings Tab (SUPER ADMIN ONLY) */}
        {admin.role === "SUPER_ADMIN" && (
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-blue-900 hover:bg-blue-50/50"
            }`}
          >
            <SettingsIcon className={`w-4 h-4 ${activeTab === "settings" ? "text-white" : "text-slate-400"}`} />
            <span>Settings</span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. DASHBOARD OVERVIEW TAB (Horizontal List Form Layout)        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* SECTION A: Horizontal Metrics Overview List */}
          <div className="bg-white border border-blue-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-blue-950 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Live Platform Overview
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Real-time database counts for users, submissions, and status pipeline
                </p>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                Single Source of Truth
              </span>
            </div>

            {/* Horizontal Scrollable Metrics List */}
            <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {/* Registered Followers Card */}
              <div className="min-w-[180px] sm:min-w-[200px] flex-1 p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                    Registered Users
                  </span>
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-black text-blue-950">
                    {stats?.totalUsers ?? 0}
                  </div>
                  <div className="text-[11px] font-semibold text-blue-700 flex items-center gap-1 mt-0.5">
                    <span>+{stats?.newUsersToday ?? 0} today</span>
                  </div>
                </div>
              </div>

              {/* Total Submissions Card */}
              <div className="min-w-[180px] sm:min-w-[200px] flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Total Submissions
                  </span>
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-black text-slate-900">
                    {stats?.totalSubmissions ?? 0}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">All time records</div>
                </div>
              </div>

              {/* Pending Review Card (Highlighted for Action) */}
              <div
                onClick={() => {
                  setSubStatusFilter("pending");
                  setActiveTab("submissions");
                }}
                className="min-w-[180px] sm:min-w-[200px] flex-1 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col justify-between cursor-pointer hover:bg-amber-100/70 transition-colors group"
                title="Click to review pending submissions"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                    Pending Review
                  </span>
                  <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-black text-amber-800">
                    {stats?.pendingSubmissions ?? 0}
                  </div>
                  <div className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mt-0.5">
                    <span>Action Required →</span>
                  </div>
                </div>
              </div>

              {/* Approved Stories Card */}
              <div
                onClick={() => {
                  setSubStatusFilter("approved");
                  setActiveTab("submissions");
                }}
                className="min-w-[180px] sm:min-w-[200px] flex-1 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between cursor-pointer hover:bg-emerald-100/70 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                    Approved Stories
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-black text-emerald-800">
                    {stats?.approvedSubmissions ?? 0}
                  </div>
                  <div className="text-[11px] font-medium text-emerald-700 mt-0.5">Ready for broadcast</div>
                </div>
              </div>

              {/* Posted to WhatsApp Channel Card */}
              <div
                onClick={() => {
                  setSubStatusFilter("posted");
                  setActiveTab("submissions");
                }}
                className="min-w-[180px] sm:min-w-[200px] flex-1 p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col justify-between cursor-pointer hover:bg-purple-100/70 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
                    Posted Channel
                  </span>
                  <Share2 className="w-4 h-4 text-purple-600" />
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-black text-purple-800">
                    {stats?.postedSubmissions ?? 0}
                  </div>
                  <div className="text-[11px] font-medium text-purple-700 mt-0.5">Live on WhatsApp</div>
                </div>
              </div>

              {/* Rejected Card */}
              <div
                onClick={() => {
                  setSubStatusFilter("rejected");
                  setActiveTab("submissions");
                }}
                className="min-w-[180px] sm:min-w-[200px] flex-1 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col justify-between cursor-pointer hover:bg-rose-100/70 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900">
                    Rejected
                  </span>
                  <XCircle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-black text-rose-800">
                    {stats?.rejectedSubmissions ?? 0}
                  </div>
                  <div className="text-[11px] font-medium text-rose-700 mt-0.5">Declined items</div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: Categories in Horizontal List Form */}
          <div className="bg-white border border-blue-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-blue-950 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  Categories & Topic Channels (Horizontal List)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Active submission channels for campus news, stories, confessions & updates
                </p>
              </div>

              <div className="flex items-center gap-2">
                {admin.role === "SUPER_ADMIN" && (
                  <button
                    type="button"
                    onClick={() => setIsCreateCatOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Add Category</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab("categories")}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Manage All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Horizontal Category Cards List */}
            <div className="flex items-center gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
              {/* All Categories Chip */}
              <div
                onClick={() => {
                  setSubCategoryFilter("all");
                  setActiveTab("submissions");
                }}
                className={`min-w-[160px] p-3.5 rounded-2xl border cursor-pointer transition-all shrink-0 ${
                  subCategoryFilter === "all"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 hover:bg-blue-50 text-slate-800 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">All Topics</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-black">{stats?.totalSubmissions ?? 0}</div>
                <div className="text-[10px] opacity-75 font-medium mt-1">Total across channels</div>
              </div>

              {/* Dynamic Categories */}
              {categoriesList.map((cat) => {
                const count = submissions.filter((s) => s.category_name === cat.name).length;
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setSubCategoryFilter(cat.name);
                      setActiveTab("submissions");
                    }}
                    className="min-w-[180px] sm:min-w-[210px] p-3.5 rounded-2xl bg-white border border-blue-100 hover:border-blue-300 hover:shadow-sm hover:bg-blue-50/40 transition-all cursor-pointer shrink-0 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            cat.is_active
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {cat.is_active ? "Active" : "Disabled"}
                        </span>
                        <Tag className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <h4 className="text-xs font-black text-blue-950 truncate" title={cat.name}>
                        {cat.name}
                      </h4>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500 font-medium">In Current Queue</span>
                      <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                        {count} items
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION C: Fast-Review Moderation Queue (Pending Submissions Horizontal Row) */}
          <div className="bg-white border border-blue-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-blue-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Rapid Review & Approval Queue ({pendingSubmissions.length} Pending)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Review, accept, or reject incoming media, audio, file, video and text stories in one click
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubStatusFilter("pending");
                  setActiveTab("submissions");
                }}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingSubmissions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">All submissions are reviewed!</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Great job! No pending stories waiting in the moderation queue.
                </p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin">
                {pendingSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="min-w-[280px] sm:min-w-[320px] max-w-[340px] p-4 rounded-2xl bg-slate-50 border border-blue-200/80 shadow-xs flex flex-col justify-between shrink-0 space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          #{sub.id.slice(0, 6)}
                        </span>
                        <span className="text-[10px] font-bold font-mono text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded-md">
                          {sub.follower_id}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-blue-950 truncate">{sub.category_name}</span>
                        <span className="text-slate-400">•</span>
                        <span className="capitalize font-semibold text-slate-600 flex items-center gap-1">
                          {sub.submission_type === "image" && <ImageIcon className="w-3 h-3 text-blue-600" />}
                          {sub.submission_type === "video" && <Video className="w-3 h-3 text-purple-600" />}
                          {sub.submission_type === "audio" && <Volume2 className="w-3 h-3 text-amber-600" />}
                          {sub.submission_type === "file" && <File className="w-3 h-3 text-emerald-600" />}
                          {sub.submission_type}
                        </span>
                      </div>

                      {/* Content excerpt */}
                      <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200">
                        {sub.text_content || (sub.media?.length ? `[${sub.media.length} media attached: ${sub.submission_type}]` : "No text content")}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedSub(sub)}
                        className="p-2 rounded-xl bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold transition-colors cursor-pointer"
                        title="View Full Content"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickStatus(sub, "approved")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickStatus(sub, "rejected")}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role Access Summary Banner */}
          <div className="bg-white border border-blue-100 rounded-3xl p-6 space-y-2 shadow-sm">
            <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
              Role Authority: {admin.role.replace("_", " ")}
            </h3>
            {admin.role === "CONTENT_ADMIN" && (
              <p className="text-xs text-slate-600 leading-relaxed">
                As a <strong>Content Administrator</strong>, you have permissions to review, approve, reject, edit text, and mark submissions as posted. In accordance with strict campus privacy policies, <strong className="text-blue-900">real user identities (names, WhatsApp numbers, age, state) are stripped on the backend</strong> and are completely inaccessible.
              </p>
            )}
            {admin.role === "USER_ADMIN" && (
              <p className="text-xs text-slate-600 leading-relaxed">
                As a <strong>User Administrator</strong>, you have permissions to manage user follower profiles, verify WhatsApp numbers, and manage user account statuses. Identity views are strictly logged in the audit trail.
              </p>
            )}
            {admin.role === "SUPER_ADMIN" && (
              <p className="text-xs text-slate-600 leading-relaxed">
                As a <strong>Super Administrator</strong>, you possess master privileges over content, users, administrator accounts, categories, audit logs, and system settings.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SUBMISSIONS MANAGEMENT TABLE                               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "submissions" && (
        <div className="bg-white border border-blue-100 rounded-3xl p-6 space-y-5 shadow-sm">
          {/* Header & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-xl font-black text-blue-950">Submissions Queue</h3>
              <p className="text-xs text-slate-500">
                Showing {submissions.length} of {subTotal} submissions
                {admin.role === "CONTENT_ADMIN" && (
                  <span className="ml-2 font-bold text-blue-700">(User Identity Isolated)</span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ID / Follower..."
                  value={subSearch}
                  onChange={(e) => {
                    setSubSearch(e.target.value);
                    setSubPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <select
                value={subStatusFilter}
                onChange={(e) => {
                  setSubStatusFilter(e.target.value);
                  setSubPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="approved">Approved</option>
                <option value="posted">Posted</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={subTypeFilter}
                onChange={(e) => {
                  setSubTypeFilter(e.target.value);
                  setSubPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option value="all">All Formats</option>
                <option value="text">Text Story</option>
                <option value="image">Image / Photo</option>
                <option value="video">Video Clip</option>
                <option value="audio">Voice Note / Audio</option>
                <option value="file">Document / File</option>
              </select>

              <select
                value={subCategoryFilter}
                onChange={(e) => {
                  setSubCategoryFilter(e.target.value);
                  setSubPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={fetchAdminSubmissions}
                className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-blue-800 border border-slate-200 cursor-pointer"
                title="Refresh Submissions"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider bg-slate-50/60">
                <tr>
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Follower</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Format</th>
                  <th className="py-3 px-3">Content / Media</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                      No submissions found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-600">
                        #{sub.id.slice(0, 6)}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-blue-700">
                        {sub.follower_id}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-900">
                        {sub.category_name}
                      </td>
                      <td className="py-3.5 px-3 capitalize text-slate-700 font-medium">
                        <span className="inline-flex items-center gap-1">
                          {sub.submission_type === "image" && <ImageIcon className="w-3 h-3 text-blue-600" />}
                          {sub.submission_type === "video" && <Video className="w-3 h-3 text-purple-600" />}
                          {sub.submission_type === "audio" && <Volume2 className="w-3 h-3 text-amber-600" />}
                          {sub.submission_type === "file" && <File className="w-3 h-3 text-emerald-600" />}
                          {sub.submission_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 max-w-xs truncate text-slate-700">
                        {sub.text_content || (sub.media?.length ? `[${sub.media.length} media attached]` : "—")}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            sub.status === "approved"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : sub.status === "posted"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : sub.status === "rejected"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : sub.status === "reviewing"
                              ? "bg-sky-100 text-sky-800 border border-sky-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 font-mono">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSub(sub);
                              setRevealedIdentity(null);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-blue-800 border border-slate-200 cursor-pointer"
                            title="View / Moderate"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditContent(sub)}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer"
                            title="Edit Content"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(sub, "approved")}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer"
                            title="Approve"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(sub, "rejected")}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                            title="Reject"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(sub, "posted")}
                            className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 cursor-pointer"
                            title="Mark as Posted to Channel"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {(admin.role === "SUPER_ADMIN" || admin.role === "CONTENT_ADMIN") && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSubmission(sub.id)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-600 border border-slate-200 cursor-pointer"
                              title="Delete Submission"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>Page {subPage} of {Math.max(1, Math.ceil(subTotal / 15))}</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={subPage <= 1}
                onClick={() => setSubPage((p) => p - 1)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={subPage >= Math.ceil(subTotal / 15)}
                onClick={() => setSubPage((p) => p + 1)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. USER MANAGEMENT TAB (Super Admin & User Admin)             */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "users" && (admin.role === "SUPER_ADMIN" || admin.role === "USER_ADMIN") && (
        <div className="bg-white border border-blue-100 rounded-3xl p-6 space-y-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-xl font-black text-blue-950">Registered Users (Followers)</h3>
              <p className="text-xs text-slate-500">
                Showing {users.length} of {userTotal} registered followers in database
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Follower ID / Name / Phone..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <select
                value={userStatusFilter}
                onChange={(e) => {
                  setUserStatusFilter(e.target.value);
                  setUserPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>

              <select
                value={userStateFilter}
                onChange={(e) => {
                  setUserStateFilter(e.target.value);
                  setUserPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option value="all">All States</option>
                {NIGERIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={fetchAdminUsers}
                className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-blue-800 border border-slate-200 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider bg-slate-50/60">
                <tr>
                  <th className="py-3 px-3">Follower ID</th>
                  <th className="py-3 px-3">Full Name</th>
                  <th className="py-3 px-3">Age</th>
                  <th className="py-3 px-3">State</th>
                  <th className="py-3 px-3">WhatsApp Number</th>
                  <th className="py-3 px-3">Submissions</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Registered</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-blue-700">
                        {u.follower_id}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        {u.name}
                      </td>
                      <td className="py-3.5 px-3 text-slate-700">{u.age}</td>
                      <td className="py-3.5 px-3 text-slate-700">{u.state}</td>
                      <td className="py-3.5 px-3 font-mono font-semibold text-emerald-700">
                        {u.whatsapp_number}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        {u.submission_count ?? 0}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.account_status === "active"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {u.account_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 font-mono">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-amber-700 border border-slate-200 cursor-pointer"
                            title="Edit User"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                              u.account_status === "active"
                                ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                            }`}
                            title={u.account_status === "active" ? "Deactivate" : "Activate"}
                          >
                            {u.account_status === "active" ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. ADMIN ACCOUNTS MANAGEMENT (SUPER ADMIN ONLY)               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "admins" && admin.role === "SUPER_ADMIN" && (
        <div className="bg-white border border-blue-100 rounded-3xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-xl font-black text-blue-950">Administrator Accounts</h3>
              <p className="text-xs text-slate-500">
                Manage roles (Super Admin, User Admin, Content Admin)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateAdminOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create New Admin</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider bg-slate-50/60">
                <tr>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminsList.map((adm) => (
                  <tr key={adm.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900">{adm.name}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-700">{adm.email}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          adm.role === "SUPER_ADMIN"
                            ? "bg-blue-100 text-blue-900 border border-blue-200"
                            : adm.role === "USER_ADMIN"
                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                            : "bg-sky-100 text-sky-900 border border-sky-200"
                        }`}
                      >
                        {adm.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          adm.status === "active"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {adm.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 font-mono">
                      {new Date(adm.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <select
                          value={adm.role}
                          onChange={async (e) => {
                            try {
                              const res = await api.updateAdminRole(adm.id, e.target.value);
                              setAdminsList((prev) =>
                                prev.map((a) => (a.id === adm.id ? { ...a, role: res.admin.role } : a))
                              );
                              showFeedback("success", `Role updated for ${adm.email}`);
                            } catch (err: any) {
                              showFeedback("error", err.message || "Failed to change role");
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-800"
                        >
                          <option value="SUPER_ADMIN">SUPER ADMIN</option>
                          <option value="USER_ADMIN">USER ADMIN</option>
                          <option value="CONTENT_ADMIN">CONTENT ADMIN</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleToggleAdminStatus(adm)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 border border-slate-200 cursor-pointer"
                        >
                          {adm.status === "active" ? "Disable" : "Enable"}
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

      {/* ------------------------------------------------------------- */}
      {/* 5. CATEGORIES MANAGEMENT TAB (SUPER ADMIN ONLY)              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "categories" && admin.role === "SUPER_ADMIN" && (
        <div className="bg-white border border-blue-100 rounded-3xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-xl font-black text-blue-950">Categories Management</h3>
              <p className="text-xs text-slate-500">
                Configure topic categories for student submissions
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateCatOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoriesList.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-blue-950">{cat.name}</h4>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      cat.is_active ? "text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    {cat.is_active ? "Active" : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleCategoryActive(cat)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200 cursor-pointer"
                  >
                    {cat.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. AUDIT LOGS TAB (SUPER ADMIN ONLY)                         */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "audit" && admin.role === "SUPER_ADMIN" && (
        <div className="bg-white border border-blue-100 rounded-3xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-xl font-black text-blue-950">System Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Immutable record of administrative actions, identity reveals, and moderation changes
              </p>
            </div>
            <button
              type="button"
              onClick={fetchAuditLogs}
              className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-blue-800 border border-slate-200 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No audit records logged yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700">{log.action}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-[10px] text-slate-700 font-bold uppercase">
                        {log.target_type}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      By <strong className="text-blue-950">{log.actor_email}</strong> ({log.actor_role})
                    </p>
                  </div>
                  <div className="text-right text-slate-500 text-[11px] font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. SETTINGS TAB (SUPER ADMIN ONLY)                           */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "settings" && admin.role === "SUPER_ADMIN" && systemSettings && (
        <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm max-w-3xl">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl font-black text-blue-950">Platform Settings</h3>
            <p className="text-xs text-slate-500">
              Global system configuration, WhatsApp broadcast link & upload limits
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                WhatsApp Channel URL
              </label>
              <input
                type="url"
                value={systemSettings.whatsapp_channel_url}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, whatsapp_channel_url: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Max Image MB
                </label>
                <input
                  type="number"
                  value={systemSettings.max_image_mb}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, max_image_mb: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Max Video MB
                </label>
                <input
                  type="number"
                  value={systemSettings.max_video_mb}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, max_video_mb: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Max Audio MB
                </label>
                <input
                  type="number"
                  value={systemSettings.max_audio_mb}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, max_audio_mb: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  await api.updateSettings(systemSettings);
                  showFeedback("success", "Settings updated");
                } catch (err: any) {
                  showFeedback("error", err.message || "Failed to update settings");
                }
              }}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Save System Settings
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBMISSION MODERATION DETAIL MODAL (Images, Video, Voice Notes, Files) */}
      {/* ------------------------------------------------------------- */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setSelectedSub(null);
                setRevealedIdentity(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              ✕
            </button>

            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-slate-500">
                  ID: #{selectedSub.id.slice(0, 8)}
                </span>
                <span className="font-mono text-xs font-bold text-blue-700">
                  Follower: {selectedSub.follower_id}
                </span>
              </div>
              <h3 className="text-xl font-black text-blue-950">
                {selectedSub.category_name} ({selectedSub.submission_type})
              </h3>
              <p className="text-xs text-slate-500">
                Submitted {new Date(selectedSub.created_at).toLocaleString()}
              </p>
            </div>

            {/* Text Content */}
            {selectedSub.text_content && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-xs uppercase font-bold text-slate-500 mb-2">Content Text</div>
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedSub.text_content}
                </p>
              </div>
            )}

            {/* Attached Media (All Supported Formats: Photos, Video, Audio / Voice note, File) */}
            {selectedSub.media && selectedSub.media.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs uppercase font-bold text-slate-500">Attached Media & Files</div>
                {selectedSub.media.map((m, idx) => (
                  <div key={m.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    {m.file_type === "image" && (
                      <div>
                        <div className="text-[11px] font-bold text-blue-800 mb-1 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Image Attachment</span>
                        </div>
                        <img
                          src={m.file_url}
                          alt="Media attachment"
                          className="max-h-80 w-auto mx-auto rounded-xl object-contain border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    {m.file_type === "video" && (
                      <div>
                        <div className="text-[11px] font-bold text-purple-800 mb-1 flex items-center gap-1">
                          <Video className="w-3.5 h-3.5" />
                          <span>Video Clip</span>
                        </div>
                        <video src={m.file_url} controls className="w-full max-h-80 rounded-xl border border-slate-200 bg-black" />
                      </div>
                    )}
                    {m.file_type === "audio" && (
                      <div>
                        <div className="text-[11px] font-bold text-amber-800 mb-1 flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Voice Note / Audio Record</span>
                        </div>
                        <audio src={m.file_url} controls className="w-full mt-1" />
                      </div>
                    )}
                    {m.file_type === "file" && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                            <File className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 truncate max-w-xs">{m.file_name || "Attached Document"}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{m.mime_type || "Document File"}</p>
                          </div>
                        </div>
                        <a
                          href={m.file_url}
                          target="_blank"
                          rel="noreferrer"
                          download={m.file_name || "document"}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* SENSITIVE IDENTITY SECTION (SUPER ADMIN & USER ADMIN ONLY) */}
            {admin.role !== "CONTENT_ADMIN" ? (
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-blue-900">
                    Protected Follower Identity
                  </span>
                  {!revealedIdentity && (
                    <button
                      type="button"
                      onClick={() => handleRevealIdentity(selectedSub.id)}
                      disabled={isRevealing}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isRevealing ? "Revealing..." : "Reveal Identity"}</span>
                    </button>
                  )}
                </div>

                {revealedIdentity ? (
                  <div className="pt-2 grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-blue-100">
                    <div>Name: <strong className="text-slate-900">{revealedIdentity.name}</strong></div>
                    <div>WhatsApp: <strong className="text-emerald-700 font-mono">{revealedIdentity.whatsapp_number}</strong></div>
                    <div>Age: <strong className="text-slate-900">{revealedIdentity.age}</strong></div>
                    <div>State: <strong className="text-slate-900">{revealedIdentity.state}</strong></div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Identity is masked by default for student privacy. Clicking "Reveal Identity" will access the profile and record an entry in the system audit log.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Privacy Restriction:</strong> Content Administrator view does not have access to student names or WhatsApp numbers.
                </span>
              </div>
            )}

            {/* Quick Moderation Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(selectedSub, "approved")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Story</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(selectedSub, "rejected")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Story</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(selectedSub, "posted")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Mark Posted</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedSub(null);
                  setRevealedIdentity(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STATUS CHANGE & MODERATION NOTES MODAL                        */}
      {/* ------------------------------------------------------------- */}
      {statusChangeModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-blue-950">
              Update Status: <span className="uppercase text-blue-600">{newStatus}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Submission #{statusChangeModalSub.id.slice(0, 8)} by {statusChangeModalSub.follower_id}
            </p>

            {newStatus === "rejected" && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Rejection Reason (Visible to user)
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this content was not accepted..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Internal Moderation Notes (Admin-only)
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes for other editors..."
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusChangeModalSub(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={submittingStatus}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {submittingStatus ? "Updating..." : "Save Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* EDIT SUBMISSION CONTENT MODAL                                 */}
      {/* ------------------------------------------------------------- */}
      {editContentSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-blue-950">Edit Submission Content</h3>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={editContentCat}
                onChange={(e) => setEditContentCat(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Text Content</label>
              <textarea
                rows={5}
                value={editContentText}
                onChange={(e) => setEditContentText(e.target.value)}
                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditContentSub(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditContent}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CREATE ADMIN MODAL (SUPER ADMIN ONLY)                         */}
      {/* ------------------------------------------------------------- */}
      {isCreateAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-blue-950">Create New Administrator</h3>

            <form onSubmit={handleCreateAdmin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Content Editor"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="editor@fuahse.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Role</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                >
                  <option value="CONTENT_ADMIN">Content Admin (Review Submissions, Anonymous Only)</option>
                  <option value="USER_ADMIN">User Admin (Manage Followers & Profile Info)</option>
                  <option value="SUPER_ADMIN">Super Admin (Full Master Privileges)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateAdminOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CREATE CATEGORY MODAL (SUPER ADMIN ONLY)                      */}
      {/* ------------------------------------------------------------- */}
      {isCreateCatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-blue-950">Add New Category</h3>

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sports & Games"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCatOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUPABASE SQL SCHEMA MODAL (SUPER ADMIN ONLY)                  */}
      {/* ------------------------------------------------------------- */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-blue-950 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  Supabase PostgreSQL Schema & Storage Guide
                </h3>
                <p className="text-xs text-slate-500">
                  Ready-to-run database migrations and policies
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs text-slate-700">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[11px] overflow-x-auto">
                <pre>{`-- 1. Create Follower Sequence & Generator
CREATE SEQUENCE IF NOT EXISTS follower_id_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_follower_id()
RETURNS TEXT AS $$
DECLARE next_val BIGINT;
BEGIN
  next_val := nextval('follower_id_seq');
  RETURN 'FOLLOWER-' || LPAD(next_val::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id TEXT UNIQUE NOT NULL DEFAULT generate_follower_id(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  state TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  account_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  follower_id TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  category_name TEXT NOT NULL,
  submission_type TEXT NOT NULL,
  text_content TEXT,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  moderation_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  posted_by TEXT,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Storage bucket: Create 'submissions-media' bucket with public access in Supabase Storage`}</pre>
              </div>

              <p className="text-slate-600">
                To connect to your real Supabase project:
                <br />1. Paste the complete SQL from <code className="text-blue-700 font-bold">/supabase-schema.sql</code> into your Supabase SQL Editor and run it.
                <br />2. Create a bucket named <strong className="text-slate-900">submissions-media</strong> in Supabase Storage.
                <br />3. Add <strong className="text-slate-900">SUPABASE_URL</strong>, <strong className="text-slate-900">SUPABASE_ANON_KEY</strong>, and <strong className="text-slate-900">SUPABASE_SERVICE_ROLE_KEY</strong> into your environment settings.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{sqlCopied ? "Copied!" : "Copy SQL Schema"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* USER EDIT PROFILE MODAL                                       */}
      {/* ------------------------------------------------------------- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-blue-950">
              Edit User: <span className="font-mono text-blue-700">{editingUser.follower_id}</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={editUserAge}
                    onChange={(e) => setEditUserAge(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">State</label>
                  <select
                    value={editUserState}
                    onChange={(e) => setEditUserState(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  value={editUserWhatsApp}
                  onChange={(e) => setEditUserWhatsApp(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditUser}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save User Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
