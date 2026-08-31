import {
  UserProfile,
  AdminAccount,
  Category,
  Submission,
  AuditLog,
  SystemSettings,
  DashboardStats,
} from "../types";

const USER_TOKEN_KEY = "fuahse_user_token";
const ADMIN_TOKEN_KEY = "fuahse_admin_token";

export function getUserToken(): string | null {
  return localStorage.getItem(USER_TOKEN_KEY);
}

export function setUserToken(token: string | null): void {
  if (token) {
    localStorage.setItem(USER_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(USER_TOKEN_KEY);
  }
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string | null): void {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  tokenType?: "user" | "admin"
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (tokenType === "user") {
    const token = getUserToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  } else if (tokenType === "admin") {
    const token = getAdminToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({ error: "Failed to parse response" }));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Health & Config
  getHealth: () => request<{ status: string; isSupabaseConnected: boolean }>("/api/health"),
  getConfigStatus: () =>
    request<{
      isSupabaseConnected: boolean;
      supabaseUrlConfigured: boolean;
      supabaseAnonKeyConfigured: boolean;
      supabaseServiceRoleKeyConfigured: boolean;
      adminCount: number;
      hasSuperAdmin: boolean;
      whatsappChannelUrl: string;
    }>("/api/config-status"),
  getSettings: () => request<{ settings: SystemSettings }>("/api/settings"),
  updateSettings: (settings: Partial<SystemSettings>) =>
    request<{ message: string; settings: SystemSettings }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }, "admin"),

  // Categories
  getCategories: () => request<{ categories: Category[] }>("/api/categories"),
  createCategory: (name: string) =>
    request<{ category: Category }>("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    }, "admin"),
  updateCategory: (id: string, name: string, is_active: boolean) =>
    request<{ category: Category }>(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, is_active }),
    }, "admin"),
  deleteCategory: (id: string) =>
    request<{ success: boolean }>(`/api/categories/${id}`, {
      method: "DELETE",
    }, "admin"),

  // Follower Auth
  register: (payload: {
    name: string;
    age: number;
    state: string;
    whatsapp_number: string;
    password: string;
  }) =>
    request<{ message: string; token: string; profile: UserProfile }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (identifier: string, password: string) =>
    request<{ message: string; token: string; profile: UserProfile }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),
  getMe: () => request<{ profile: UserProfile }>("/api/auth/me", {}, "user"),
  updateProfile: (payload: Partial<UserProfile>) =>
    request<{ message: string; profile: UserProfile }>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }, "user"),

  // User Submissions
  submitContent: (payload: {
    category_id?: string;
    category_name: string;
    submission_type: string;
    text_content?: string;
    media_items?: Array<{
      file_url: string;
      storage_path?: string;
      file_type: string;
      file_size?: number;
      mime_type?: string;
    }>;
  }) =>
    request<{ message: string; submission: Submission }>("/api/submissions", {
      method: "POST",
      body: JSON.stringify(payload),
    }, "user"),
  getMySubmissions: () => request<{ submissions: Submission[] }>("/api/my-submissions", {}, "user"),
  getMySubmission: (id: string) => request<{ submission: Submission }>(`/api/my-submissions/${id}`, {}, "user"),
  updateMySubmission: (id: string, payload: { text_content?: string; category_name?: string; category_id?: string }) =>
    request<{ message: string; submission: Submission }>(`/api/my-submissions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }, "user"),
  deleteMySubmission: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/my-submissions/${id}`, {
      method: "DELETE",
    }, "user"),
  uploadMedia: (payload: {
    file_data: string;
    file_name?: string;
    file_type: string;
    mime_type?: string;
  }) =>
    request<{ file_url: string; file_name?: string; storage_path: string; file_type: string; mime_type?: string }>(
      "/api/upload-media",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      "user"
    ),

  // Admin Auth
  setupFirstSuperAdmin: (payload: { name: string; email: string; password: string }) =>
    request<{ message: string; token: string; admin: AdminAccount }>("/api/admin/setup-first-super-admin", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adminLogin: (email: string, password: string) =>
    request<{ message: string; token: string; admin: AdminAccount }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getAdminMe: () => request<{ admin: AdminAccount }>("/api/admin/me", {}, "admin"),

  // Admin Submissions
  getAdminSubmissions: (params: {
    category?: string;
    type?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.category) query.set("category", params.category);
    if (params.type) query.set("type", params.type);
    if (params.status) query.set("status", params.status);
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    return request<{
      submissions: Submission[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/api/admin/submissions?${query.toString()}`, {}, "admin");
  },
  getAdminSubmission: (id: string) => request<{ submission: Submission }>(`/api/admin/submissions/${id}`, {}, "admin"),
  updateSubmissionStatus: (
    id: string,
    payload: { status: string; rejection_reason?: string; moderation_notes?: string }
  ) =>
    request<{ message: string; submission: Submission }>(`/api/admin/submissions/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }, "admin"),
  updateSubmissionContent: (
    id: string,
    payload: { text_content?: string; category_name?: string; category_id?: string; moderation_notes?: string }
  ) =>
    request<{ message: string; submission: Submission }>(`/api/admin/submissions/${id}/content`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }, "admin"),
  deleteAdminSubmission: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/submissions/${id}`, {
      method: "DELETE",
    }, "admin"),
  revealIdentity: (id: string) =>
    request<{
      identity: {
        follower_id: string;
        name: string;
        age: number;
        state: string;
        whatsapp_number: string;
        account_status: string;
        created_at: string;
      };
    }>(`/api/admin/submissions/${id}/reveal-identity`, { method: "POST" }, "admin"),

  // Admin Users Management
  getAdminUsers: (params: { search?: string; state?: string; status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.state) query.set("state", params.state);
    if (params.status) query.set("status", params.status);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    return request<{
      users: UserProfile[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/api/admin/users?${query.toString()}`, {}, "admin");
  },
  updateUserProfileAdmin: (id: string, payload: Partial<UserProfile>) =>
    request<{ message: string; profile: UserProfile }>(`/api/admin/users/${id}/profile`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }, "admin"),
  updateUserStatusAdmin: (id: string, status: string) =>
    request<{ message: string; profile: UserProfile }>(`/api/admin/users/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }, "admin"),

  // Super Admin - Admins Management
  getAdmins: () => request<{ admins: AdminAccount[] }>("/api/admin/admins", {}, "admin"),
  createAdmin: (payload: { name: string; email: string; password: string; role: string }) =>
    request<{ message: string; admin: AdminAccount }>("/api/admin/admins", {
      method: "POST",
      body: JSON.stringify(payload),
    }, "admin"),
  updateAdminRole: (id: string, role: string) =>
    request<{ message: string; admin: AdminAccount }>(`/api/admin/admins/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }, "admin"),
  updateAdminStatus: (id: string, status: string) =>
    request<{ message: string; admin: AdminAccount }>(`/api/admin/admins/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }, "admin"),
  deleteAdmin: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/admins/${id}`, {
      method: "DELETE",
    }, "admin"),

  // Stats & Audit
  getDashboardStats: () => request<{ stats: DashboardStats }>("/api/admin/stats", {}, "admin"),
  syncSupabase: () =>
    request<{
      success: boolean;
      isSupabaseConnected: boolean;
      totalUsers: number;
      totalSubmissions: number;
      adminCount: number;
      categoriesCount: number;
    }>("/api/admin/sync-supabase", { method: "POST" }, "admin"),
  getAuditLogs: (params: { search?: string; action?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.action) query.set("action", params.action);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    return request<{
      logs: AuditLog[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/api/admin/audit-logs?${query.toString()}`, {}, "admin");
  },
};
