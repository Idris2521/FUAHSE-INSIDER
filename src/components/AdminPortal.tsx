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

  // Initialize Admin Session
  useEffect(() => {
    checkConfigAndSession();
  }, []);

  const checkConfigAndSession = async () => {
    setLoadingAuth(true);
    try {
      const cfg = await api.getConfigStatus();
      setConfigStatus(cfg);

      const token = getAdminToken();
      if (token) {
        const meRes = await api.getAdminMe();
        setAdmin(meRes.admin);
      }
    } catch (err) {
      console.error("Admin init error:", err);
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

  // Status update
  const handleOpenStatusModal = (sub: Submission, initialStatus: SubmissionStatus) => {
    setStatusChangeModalSub(sub);
    setNewStatus(initialStatus);
    setRejectionReason(sub.rejection_reason || "");
    setModerationNotes(sub.moderation_notes || "");
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
  // RENDER AUTHENTICATION VIEW (If not logged in as Admin)
  // ---------------------------------------------------------------------------
  if (!admin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white">Administrator Portal</h2>
            <p className="text-xs text-stone-400">
              FUAHSE_🅸🅽🆂🅸🅳🅴🆁 Editorial & Moderation System
            </p>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {authError}
            </div>
          )}

          {/* First Time Super Admin Setup If None Exists */}
          {configStatus && !configStatus.hasSuperAdmin ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                <strong>First-Time Initialization:</strong> No Super Admin account detected. Create the master Super Admin credentials below.
              </div>

              <form onSubmit={handleSetupFirstSuperAdmin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1">
                    Super Admin Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Editor"
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@fuahse-insider.com"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1">
                    Master Password (min 8 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="••••••••••••"
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-bold text-xs tracking-wide shadow-lg disabled:opacity-50"
                >
                  {authLoading ? "Initializing Super Admin..." : "Initialize First Super Admin"}
                </button>
              </form>
            </div>
          ) : (
            /* Standard Admin Login */
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@fuahse-insider.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-bold text-xs tracking-wide shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? "Authenticating..." : "Enter Admin Portal"}
              </button>
            </form>
          )}

          <div className="pt-2 text-center border-t border-stone-800">
            <button
              type="button"
              onClick={onExitToPublic}
              className="text-xs text-stone-400 hover:text-stone-200 font-bold"
            >
              ← Back to Campus Public Mirror
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER AUTHENTICATED ADMIN DASHBOARD
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Admin Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">{admin.name}</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  admin.role === "SUPER_ADMIN"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : admin.role === "USER_ADMIN"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                }`}
              >
                {admin.role.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-stone-400 font-mono">{admin.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {admin.role === "SUPER_ADMIN" && (
            <button
              type="button"
              onClick={() => setIsSqlModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>Supabase Schema SQL</span>
            </button>
          )}

          <WhatsAppButton variant="compact" />

          <button
            type="button"
            onClick={onExitToPublic}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold border border-stone-700"
          >
            View Public Site
          </button>

          <button
            type="button"
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900 text-rose-400 text-xs font-bold border border-rose-500/30 transition-colors"
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
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Role-Aware Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-stone-900/90 p-1.5 rounded-2xl border border-stone-800 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "dashboard"
              ? "bg-stone-800 text-white border border-stone-700 shadow-sm"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          <Activity className="w-4 h-4 text-rose-400" />
          <span>Dashboard Overview</span>
        </button>

        {/* Submissions Tab (Super Admin & Content Admin & User Admin) */}
        <button
          type="button"
          onClick={() => setActiveTab("submissions")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === "submissions"
              ? "bg-stone-800 text-white border border-stone-700 shadow-sm"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Submissions Queue</span>
          {admin.role === "CONTENT_ADMIN" && (
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-400 font-mono font-bold">
              Anonymous Mode
            </span>
          )}
        </button>

        {/* Users Tab (SUPER ADMIN & USER ADMIN ONLY) */}
        {(admin.role === "SUPER_ADMIN" || admin.role === "USER_ADMIN") && (
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "users"
                ? "bg-stone-800 text-white border border-stone-700 shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>User Management</span>
          </button>
        )}

        {/* Categories Tab (Super Admin) */}
        {admin.role === "SUPER_ADMIN" && (
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "categories"
                ? "bg-stone-800 text-white border border-stone-700 shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Tag className="w-4 h-4 text-pink-400" />
            <span>Categories</span>
          </button>
        )}

        {/* Admins Tab (SUPER ADMIN ONLY) */}
        {admin.role === "SUPER_ADMIN" && (
          <button
            type="button"
            onClick={() => setActiveTab("admins")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "admins"
                ? "bg-stone-800 text-white border border-stone-700 shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Admin Accounts</span>
          </button>
        )}

        {/* Audit Logs Tab (SUPER ADMIN ONLY) */}
        {admin.role === "SUPER_ADMIN" && (
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "audit"
                ? "bg-stone-800 text-white border border-stone-700 shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <Lock className="w-4 h-4 text-sky-400" />
            <span>Audit Logs</span>
          </button>
        )}

        {/* Settings Tab (SUPER ADMIN ONLY) */}
        {admin.role === "SUPER_ADMIN" && (
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "settings"
                ? "bg-stone-800 text-white border border-stone-700 shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <SettingsIcon className="w-4 h-4 text-stone-400" />
            <span>Settings</span>
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. DASHBOARD OVERVIEW TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Total Submissions
              </span>
              <div className="text-3xl font-black text-white">
                {stats?.totalSubmissions ?? 0}
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                Pending Review
              </span>
              <div className="text-3xl font-black text-amber-400">
                {stats?.pendingSubmissions ?? 0}
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                Approved Stories
              </span>
              <div className="text-3xl font-black text-emerald-400">
                {stats?.approvedSubmissions ?? 0}
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-500">
                Posted to Channel
              </span>
              <div className="text-3xl font-black text-purple-400">
                {stats?.postedSubmissions ?? 0}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
                Rejected Submissions
              </span>
              <div className="text-2xl font-black text-rose-400">
                {stats?.rejectedSubmissions ?? 0}
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Registered Followers
              </span>
              <div className="text-2xl font-black text-white">
                {stats?.totalUsers ?? 0}
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                New Followers Today
              </span>
              <div className="text-2xl font-black text-emerald-400">
                {stats?.newUsersToday ?? 0}
              </div>
            </div>
          </div>

          {/* Role Access Summary Banner */}
          <div className="bg-stone-900/60 border border-stone-800 rounded-3xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Role Authority: {admin.role.replace("_", " ")}
            </h3>
            {admin.role === "CONTENT_ADMIN" && (
              <p className="text-xs text-stone-400 leading-relaxed">
                As a <strong>Content Administrator</strong>, you have permissions to review, approve, reject, edit text, and mark submissions as posted. In accordance with strict campus privacy policies, <strong className="text-rose-400">real user identities (names, WhatsApp numbers, age, state) are stripped on the backend</strong> and are completely inaccessible.
              </p>
            )}
            {admin.role === "USER_ADMIN" && (
              <p className="text-xs text-stone-400 leading-relaxed">
                As a <strong>User Administrator</strong>, you have permissions to manage user follower profiles, verify WhatsApp numbers, and manage user account statuses. Identity views are strictly logged in the audit trail.
              </p>
            )}
            {admin.role === "SUPER_ADMIN" && (
              <p className="text-xs text-stone-400 leading-relaxed">
                As a <strong>Super Administrator</strong>, you possess master privileges over content, users, administrator accounts, categories, audit logs, and system settings.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SUBMISSIONS MANAGEMENT TABLE */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "submissions" && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-5 shadow-xl">
          {/* Header & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-5">
            <div>
              <h3 className="text-xl font-black text-white">Submissions Queue</h3>
              <p className="text-xs text-stone-400">
                Showing {submissions.length} of {subTotal} submissions
                {admin.role === "CONTENT_ADMIN" && (
                  <span className="ml-2 font-bold text-rose-400">(User Identity Isolated)</span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search ID / Follower..."
                  value={subSearch}
                  onChange={(e) => {
                    setSubSearch(e.target.value);
                    setSubPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <select
                value={subStatusFilter}
                onChange={(e) => {
                  setSubStatusFilter(e.target.value);
                  setSubPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none"
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
                className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
              </select>

              <button
                type="button"
                onClick={fetchAdminSubmissions}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300"
                title="Refresh Submissions"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-800 text-stone-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Follower</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Content / Media</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-500 font-medium">
                      No submissions found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-stone-950/40 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-stone-400">
                        #{sub.id.slice(0, 6)}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-rose-400">
                        {sub.follower_id}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-stone-200">
                        {sub.category_name}
                      </td>
                      <td className="py-3.5 px-3 capitalize text-stone-300">
                        {sub.submission_type}
                      </td>
                      <td className="py-3.5 px-3 max-w-xs truncate text-stone-300">
                        {sub.text_content || (sub.media?.length ? `[${sub.media.length} media item]` : "—")}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            sub.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : sub.status === "posted"
                              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                              : sub.status === "rejected"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : sub.status === "reviewing"
                              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-stone-500">
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
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
                            title="View / Moderate"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditContent(sub)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400"
                            title="Edit Content"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(sub, "approved")}
                            className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400"
                            title="Approve"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(sub, "rejected")}
                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400"
                            title="Reject"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(sub, "posted")}
                            className="p-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-400"
                            title="Mark as Posted"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {(admin.role === "SUPER_ADMIN" || admin.role === "CONTENT_ADMIN") && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSubmission(sub.id)}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 text-rose-500"
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
          <div className="flex items-center justify-between pt-3 border-t border-stone-800 text-xs text-stone-500">
            <span>Page {subPage} of {Math.max(1, Math.ceil(subTotal / 15))}</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={subPage <= 1}
                onClick={() => setSubPage((p) => p - 1)}
                className="p-2 rounded-lg bg-stone-800 text-stone-300 disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={subPage >= Math.ceil(subTotal / 15)}
                onClick={() => setSubPage((p) => p + 1)}
                className="p-2 rounded-lg bg-stone-800 text-stone-300 disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. USER MANAGEMENT TAB (Super Admin & User Admin) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "users" && (admin.role === "SUPER_ADMIN" || admin.role === "USER_ADMIN") && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-5">
            <div>
              <h3 className="text-xl font-black text-white">Registered Users</h3>
              <p className="text-xs text-stone-400">
                Showing {users.length} of {userTotal} registered followers
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Follower ID / Name / Phone..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <select
                value={userStatusFilter}
                onChange={(e) => {
                  setUserStatusFilter(e.target.value);
                  setUserPage(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none"
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
                className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none"
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
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-800 text-stone-400 font-bold uppercase tracking-wider">
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
              <tbody className="divide-y divide-stone-800/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-stone-500 font-medium">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-stone-950/40 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-rose-400">
                        {u.follower_id}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-stone-100">
                        {u.name}
                      </td>
                      <td className="py-3.5 px-3 text-stone-300">{u.age}</td>
                      <td className="py-3.5 px-3 text-stone-300">{u.state}</td>
                      <td className="py-3.5 px-3 font-mono text-emerald-400">
                        {u.whatsapp_number}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-stone-200">
                        {u.submission_count ?? 0}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.account_status === "active"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {u.account_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-stone-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400"
                            title="Edit User"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u)}
                            className={`p-1.5 rounded-lg text-xs font-bold ${
                              u.account_status === "active"
                                ? "bg-rose-950/60 hover:bg-rose-900 text-rose-400"
                                : "bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400"
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
      {/* 4. ADMIN ACCOUNTS MANAGEMENT (SUPER ADMIN ONLY) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "admins" && admin.role === "SUPER_ADMIN" && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-800 pb-5">
            <div>
              <h3 className="text-xl font-black text-white">Administrator Accounts</h3>
              <p className="text-xs text-stone-400">
                Manage roles (Super Admin, User Admin, Content Admin)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateAdminOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create New Admin</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-800 text-stone-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {adminsList.map((adm) => (
                  <tr key={adm.id} className="hover:bg-stone-950/40 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-stone-100">{adm.name}</td>
                    <td className="py-3.5 px-3 font-mono text-stone-300">{adm.email}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          adm.role === "SUPER_ADMIN"
                            ? "bg-rose-500/20 text-rose-400"
                            : adm.role === "USER_ADMIN"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-sky-500/20 text-sky-400"
                        }`}
                      >
                        {adm.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          adm.status === "active"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {adm.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-stone-500">
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
                          className="px-2 py-1 rounded bg-stone-950 border border-stone-800 text-[11px] text-stone-300"
                        >
                          <option value="SUPER_ADMIN">SUPER ADMIN</option>
                          <option value="USER_ADMIN">USER ADMIN</option>
                          <option value="CONTENT_ADMIN">CONTENT ADMIN</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleToggleAdminStatus(adm)}
                          className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[11px] font-bold text-stone-300"
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
      {/* 5. CATEGORIES MANAGEMENT TAB (SUPER ADMIN ONLY) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "categories" && admin.role === "SUPER_ADMIN" && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-800 pb-5">
            <div>
              <h3 className="text-xl font-black text-white">Categories Management</h3>
              <p className="text-xs text-stone-400">
                Configure topic categories for student submissions
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateCatOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoriesList.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{cat.name}</h4>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      cat.is_active ? "text-emerald-400" : "text-stone-500"
                    }`}
                  >
                    {cat.is_active ? "Active" : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleCategoryActive(cat)}
                    className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-bold text-stone-300"
                  >
                    {cat.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 text-rose-500"
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
      {/* 6. AUDIT LOGS TAB (SUPER ADMIN ONLY) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "audit" && admin.role === "SUPER_ADMIN" && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-800 pb-5">
            <div>
              <h3 className="text-xl font-black text-white">System Audit Trail</h3>
              <p className="text-xs text-stone-400">
                Immutable record of administrative actions, identity reveals, and moderation changes
              </p>
            </div>
            <button
              type="button"
              onClick={fetchAuditLogs}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-8">No audit records logged yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-rose-400">{log.action}</span>
                      <span className="px-2 py-0.5 rounded bg-stone-800 text-[10px] text-stone-300 uppercase">
                        {log.target_type}
                      </span>
                    </div>
                    <p className="text-stone-400">
                      By <strong className="text-stone-200">{log.actor_email}</strong> ({log.actor_role})
                    </p>
                  </div>
                  <div className="text-right text-stone-500 text-[11px] font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. SETTINGS TAB (SUPER ADMIN ONLY) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === "settings" && admin.role === "SUPER_ADMIN" && systemSettings && (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl max-w-3xl">
          <div className="border-b border-stone-800 pb-4">
            <h3 className="text-xl font-black text-white">Platform Settings</h3>
            <p className="text-xs text-stone-400">
              Global system configuration and limits
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                WhatsApp Channel URL
              </label>
              <input
                type="url"
                value={systemSettings.whatsapp_channel_url}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, whatsapp_channel_url: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Max Image MB
                </label>
                <input
                  type="number"
                  value={systemSettings.max_image_mb}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, max_image_mb: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Max Video MB
                </label>
                <input
                  type="number"
                  value={systemSettings.max_video_mb}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, max_video_mb: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Max Audio MB
                </label>
                <input
                  type="number"
                  value={systemSettings.max_audio_mb}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, max_audio_mb: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
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
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
            >
              Save System Settings
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBMISSION MODERATION DETAIL MODAL */}
      {/* ------------------------------------------------------------- */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setSelectedSub(null);
                setRevealedIdentity(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white"
            >
              ✕
            </button>

            <div className="border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-stone-400">
                  ID: #{selectedSub.id.slice(0, 8)}
                </span>
                <span className="font-mono text-xs font-bold text-rose-400">
                  Follower: {selectedSub.follower_id}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">
                {selectedSub.category_name} ({selectedSub.submission_type})
              </h3>
              <p className="text-xs text-stone-400">
                Submitted {new Date(selectedSub.created_at).toLocaleString()}
              </p>
            </div>

            {/* Text Content */}
            {selectedSub.text_content && (
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800">
                <div className="text-xs uppercase font-bold text-stone-500 mb-2">Content Text</div>
                <p className="text-sm text-stone-200 whitespace-pre-wrap leading-relaxed">
                  {selectedSub.text_content}
                </p>
              </div>
            )}

            {/* Attached Media */}
            {selectedSub.media && selectedSub.media.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs uppercase font-bold text-stone-500">Attached Media</div>
                {selectedSub.media.map((m, idx) => (
                  <div key={m.id || idx} className="p-4 rounded-2xl bg-stone-950 border border-stone-800">
                    {m.file_type === "image" && (
                      <img
                        src={m.file_url}
                        alt="Media attachment"
                        className="max-h-80 w-auto mx-auto rounded-lg object-contain"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {m.file_type === "video" && (
                      <video src={m.file_url} controls className="w-full max-h-80 rounded-lg" />
                    )}
                    {m.file_type === "audio" && (
                      <audio src={m.file_url} controls className="w-full" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* SENSITIVE IDENTITY SECTION (SUPER ADMIN & USER ADMIN ONLY) */}
            {admin.role !== "CONTENT_ADMIN" ? (
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-stone-400">
                    Protected Follower Identity
                  </span>
                  {!revealedIdentity && (
                    <button
                      type="button"
                      onClick={() => handleRevealIdentity(selectedSub.id)}
                      disabled={isRevealing}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 text-xs font-bold border border-rose-500/30"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isRevealing ? "Revealing..." : "Reveal Identity"}</span>
                    </button>
                  )}
                </div>

                {revealedIdentity ? (
                  <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                    <div>Name: <strong className="text-white">{revealedIdentity.name}</strong></div>
                    <div>WhatsApp: <strong className="text-emerald-400 font-mono">{revealedIdentity.whatsapp_number}</strong></div>
                    <div>Age: <strong className="text-white">{revealedIdentity.age}</strong></div>
                    <div>State: <strong className="text-white">{revealedIdentity.state}</strong></div>
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-500">
                    Identity is masked by default. Clicking "Reveal Identity" will access the profile and record an entry in the system audit log.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-400 flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>Privacy Restriction:</strong> Content Administrator view does not have access to user names or WhatsApp numbers.
                </span>
              </div>
            )}

            {/* Quick Status Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(selectedSub, "approved")}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(selectedSub, "rejected")}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(selectedSub, "posted")}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  Mark Posted
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedSub(null);
                  setRevealedIdentity(null);
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STATUS CHANGE & MODERATION NOTES MODAL */}
      {/* ------------------------------------------------------------- */}
      {statusChangeModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-white">
              Update Status: <span className="uppercase text-rose-400">{newStatus}</span>
            </h3>
            <p className="text-xs text-stone-400">
              Submission #{statusChangeModalSub.id.slice(0, 8)} by {statusChangeModalSub.follower_id}
            </p>

            {newStatus === "rejected" && (
              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Rejection Reason (Visible to user)
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this content was not accepted..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                Internal Moderation Notes (Admin-only)
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes for other editors..."
                value={moderationNotes}
                onChange={(e) => setModerationNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusChangeModalSub(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={submittingStatus}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold disabled:opacity-50"
              >
                {submittingStatus ? "Updating..." : "Save Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* EDIT SUBMISSION CONTENT MODAL */}
      {/* ------------------------------------------------------------- */}
      {editContentSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-white">Edit Submission Content</h3>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-300 mb-1">Category</label>
              <input
                type="text"
                value={editContentCat}
                onChange={(e) => setEditContentCat(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-300 mb-1">Text Content</label>
              <textarea
                rows={5}
                value={editContentText}
                onChange={(e) => setEditContentText(e.target.value)}
                className="w-full p-4 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditContentSub(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditContent}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Save Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CREATE ADMIN MODAL (SUPER ADMIN ONLY) */}
      {/* ------------------------------------------------------------- */}
      {isCreateAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-white">Create New Administrator</h3>

            <form onSubmit={handleCreateAdmin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joy Content Editor"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="editor@fuahse-insider.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">Role</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
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
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CREATE CATEGORY MODAL (SUPER ADMIN ONLY) */}
      {/* ------------------------------------------------------------- */}
      {isCreateCatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-white">Add New Category</h3>

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sports & Games"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCatOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUPABASE SQL SCHEMA MODAL (SUPER ADMIN ONLY) */}
      {/* ------------------------------------------------------------- */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-sky-400" />
                  Supabase PostgreSQL Schema & Storage Guide
                </h3>
                <p className="text-xs text-stone-400">
                  Ready-to-run database migrations and policies
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1.5 rounded-lg bg-stone-800 text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs text-stone-300">
              <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 font-mono text-[11px] overflow-x-auto">
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

              <p className="text-stone-400">
                To connect to your real Supabase project:
                <br />1. Paste the complete SQL from <code className="text-rose-400">/supabase-schema.sql</code> into your Supabase SQL Editor and run it.
                <br />2. Create a bucket named <strong className="text-white">submissions-media</strong> in Supabase Storage.
                <br />3. Add <strong className="text-white">SUPABASE_URL</strong>, <strong className="text-white">SUPABASE_ANON_KEY</strong>, and <strong className="text-white">SUPABASE_SERVICE_ROLE_KEY</strong> into the environment settings.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold"
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{sqlCopied ? "Copied!" : "Copy SQL Schema"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* USER EDIT PROFILE MODAL */}
      {/* ------------------------------------------------------------- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-white">
              Edit User: <span className="font-mono text-rose-400">{editingUser.follower_id}</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-300 mb-1">Age</label>
                  <input
                    type="number"
                    value={editUserAge}
                    onChange={(e) => setEditUserAge(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-stone-300 mb-1">State</label>
                  <select
                    value={editUserState}
                    onChange={(e) => setEditUserState(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
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
                <label className="block text-xs font-bold uppercase text-stone-300 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  value={editUserWhatsApp}
                  onChange={(e) => setEditUserWhatsApp(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditUser}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
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
