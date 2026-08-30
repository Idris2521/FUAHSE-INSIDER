import express, { Request, Response, NextFunction } from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";
import {
  AdminRole,
  UserProfile,
  AdminAccount,
  Category,
  Submission,
  AuditLog,
  SystemSettings,
  DashboardStats,
  WHATSAPP_CHANNEL_URL,
} from "./src/types";

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
// Internal cryptographic token signing key (managed automatically)
const AUTH_SECRET = "fuahse-insider-campus-mirror-secret-key-2026";

// ---------------------------------------------------------------------------
// Native Crypto Token Management (No external JWT dependencies)
// ---------------------------------------------------------------------------
interface AuthTokenPayload {
  userId?: string;
  followerId?: string;
  adminId?: string;
  email?: string;
  role?: AdminRole;
  type: "user" | "admin";
  iat?: number;
  exp?: number;
}

function createAuthToken(payload: AuthTokenPayload, expiresInSeconds = 30 * 24 * 3600): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const fullPayload = { ...payload, iat, exp };
  const payloadStr = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payloadStr).digest("base64url");
  return `${payloadStr}.${signature}`;
}

function verifyAuthToken<T extends AuthTokenPayload = AuthTokenPayload>(token: string): T | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadStr, signature] = parts;
  if (!payloadStr || !signature) return null;

  try {
    const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(payloadStr).digest("base64url");
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf-8")) as T;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl.includes("supabase.co") &&
  supabaseServiceKey &&
  supabaseServiceKey.length > 20
);

let supabaseClient: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
    console.log("[Supabase] Connected with service role credentials to:", supabaseUrl);
  } catch (err) {
    console.error("[Supabase] Initialization error:", err);
  }
}

// Automatic bootstrap synchronization from Supabase cloud database
async function syncFromSupabase() {
  if (!supabaseClient) return;

  try {
    console.log("[Supabase Sync] Fetching existing cloud data...");

    // Sync categories
    const { data: cats, error: catErr } = await supabaseClient.from("categories").select("*");
    if (!catErr && cats && cats.length > 0) {
      memoryStore.categories = cats;
      console.log(`[Supabase Sync] Loaded ${cats.length} categories from Supabase`);
    }

    // Sync profiles
    const { data: profiles, error: profErr } = await supabaseClient.from("profiles").select("*");
    if (!profErr && profiles && profiles.length > 0) {
      memoryStore.profiles = profiles.map((p) => ({
        id: p.id,
        follower_id: p.follower_id,
        name: p.name,
        age: p.age,
        state: p.state,
        whatsapp_number: p.whatsapp_number,
        account_status: p.account_status,
        created_at: p.created_at,
        updated_at: p.updated_at,
        password_hash: p.password_hash,
      }));
      memoryStore.followerCounter = profiles.length + 1;
      console.log(`[Supabase Sync] Loaded ${profiles.length} user profiles from Supabase`);
    }

    // Sync admin accounts
    const { data: admins, error: adminErr } = await supabaseClient.from("admin_roles").select("*");
    if (!adminErr && admins && admins.length > 0) {
      memoryStore.adminAccounts = admins.map((a) => ({
        id: a.id,
        email: a.email,
        name: a.name,
        role: a.role,
        status: a.status,
        created_at: a.created_at,
        updated_at: a.updated_at,
        password_hash: a.password_hash,
      }));
      console.log(`[Supabase Sync] Loaded ${admins.length} admins from Supabase`);
    }

    // Sync submissions
    const { data: subs, error: subErr } = await supabaseClient.from("submissions").select("*, media:submission_media(*)").order("created_at", { ascending: false });
    if (!subErr && subs && subs.length > 0) {
      memoryStore.submissions = subs.map((s) => ({
        id: s.id,
        user_id: s.user_id,
        follower_id: s.follower_id,
        category_id: s.category_id,
        category_name: s.category_name,
        submission_type: s.submission_type,
        text_content: s.text_content,
        status: s.status,
        rejection_reason: s.rejection_reason,
        moderation_notes: s.moderation_notes,
        reviewed_by: s.reviewed_by,
        reviewed_at: s.reviewed_at,
        posted_by: s.posted_by,
        posted_at: s.posted_at,
        created_at: s.created_at,
        updated_at: s.updated_at,
        media: s.media || [],
      }));
      console.log(`[Supabase Sync] Loaded ${subs.length} submissions from Supabase`);
    }
  } catch (err) {
    console.error("[Supabase Sync Error]", err);
  }
}

// ---------------------------------------------------------------------------
// In-Memory Fallback Storage Store (Guarantees zero downtime & immediate testability)
// ---------------------------------------------------------------------------
interface InMemStore {
  followerCounter: number;
  profiles: (UserProfile & { password_hash?: string })[];
  adminAccounts: (AdminAccount & { password_hash: string })[];
  categories: Category[];
  submissions: Submission[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

// Password hashing utility
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "fuahse_salt_2026").digest("hex");
}

const DEFAULT_SUPER_ADMIN: AdminAccount & { password_hash: string } = {
  id: "admin-master-001",
  name: "Lead Editorial Admin",
  email: "admin@fuahse.com",
  role: "SUPER_ADMIN",
  status: "active",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  password_hash: hashPassword("Admin@12345"),
};

const memoryStore: InMemStore = {
  followerCounter: 1,
  profiles: [],
  adminAccounts: [DEFAULT_SUPER_ADMIN],
  categories: [
    { id: "cat-1", name: "Gossip", slug: "gossip", is_active: true, created_at: new Date().toISOString() },
    { id: "cat-2", name: "Relationship", slug: "relationship", is_active: true, created_at: new Date().toISOString() },
    { id: "cat-3", name: "Entertainment", slug: "entertainment", is_active: true, created_at: new Date().toISOString() },
    { id: "cat-4", name: "Campus", slug: "campus", is_active: true, created_at: new Date().toISOString() },
    { id: "cat-5", name: "Celebrity", slug: "celebrity", is_active: true, created_at: new Date().toISOString() },
    { id: "cat-6", name: "Confession", slug: "confession", is_active: true, created_at: new Date().toISOString() },
    { id: "cat-7", name: "News / Tip", slug: "news-tip", is_active: true, created_at: new Date().toISOString() },
    { id: "cat-8", name: "Other", slug: "other", is_active: true, created_at: new Date().toISOString() },
  ],
  submissions: [],
  auditLogs: [],
  settings: {
    platform_name: "FUAHSE_🅸🅽🆂🅸🅳🅴🆁",
    subtitle: "The Campus Mirror",
    whatsapp_channel_url: WHATSAPP_CHANNEL_URL,
    allow_submissions: true,
    max_image_mb: 10,
    max_video_mb: 50,
    max_audio_mb: 25,
  },
};

function generateUniqueFollowerId(): string {
  const current = memoryStore.followerCounter;
  memoryStore.followerCounter += 1;
  const numStr = String(current).padStart(3, "0");
  return `FOLLOWER-${numStr}`;
}

// Log audit action
async function recordAudit(
  actor: { id: string; email: string; role: string },
  action: string,
  target_type: string,
  target_id?: string,
  details?: Record<string, any>
) {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    actor_id: actor.id,
    actor_email: actor.email,
    actor_role: actor.role,
    action,
    target_type,
    target_id,
    details: details || {},
    created_at: new Date().toISOString(),
  };

  memoryStore.auditLogs.unshift(log);

  if (supabaseClient) {
    try {
      await supabaseClient.from("audit_logs").insert({
        id: log.id,
        actor_id: log.actor_id,
        actor_email: log.actor_email,
        actor_role: log.actor_role,
        action: log.action,
        target_type: log.target_type,
        target_id: log.target_id,
        details: log.details,
        created_at: log.created_at,
      });
    } catch (err) {
      console.error("[AuditLog Supabase Error]:", err);
    }
  }
}

// Express App Initialization
async function startServer() {
  // Sync existing data from Supabase if connected
  await syncFromSupabase();

  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Security Headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    next();
  });

  // ---------------------------------------------------------------------------
  // Authentication Middlewares
  // ---------------------------------------------------------------------------
  // User (Follower) Auth
  const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized: Missing authentication token" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAuthToken<{ userId: string; followerId: string; type: "user" }>(token);
    if (!decoded || decoded.type !== "user" || !decoded.userId) {
      res.status(401).json({ error: "Unauthorized: Session expired or invalid" });
      return;
    }

    (req as any).user = decoded;
    next();
  };

  // Admin Auth
  const authenticateAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized: Missing admin authorization token" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAuthToken<{
      adminId: string;
      email: string;
      role: AdminRole;
      type: "admin";
    }>(token);

    if (!decoded || decoded.type !== "admin" || !decoded.adminId) {
      res.status(401).json({ error: "Unauthorized: Admin session expired or invalid" });
      return;
    }

    (req as any).admin = decoded;
    next();
  };

  // Role Gate Middleware
  const requireRoles = (...allowedRoles: AdminRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const admin = (req as any).admin;
      if (!admin || !allowedRoles.includes(admin.role)) {
        res.status(403).json({ error: `Forbidden: Requires ${allowedRoles.join(" or ")} privileges` });
        return;
      }
      next();
    };
  };

  // ---------------------------------------------------------------------------
  // API Routes
  // ---------------------------------------------------------------------------

  // 1. Health & Config Status
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      platform: "FUAHSE_🅸🅽🆂🅸🅳🅴🆁",
      subtitle: "The Campus Mirror",
      isSupabaseConnected: isSupabaseConfigured,
    });
  });

  app.get("/api/config-status", (req, res) => {
    res.json({
      isSupabaseConnected: isSupabaseConfigured,
      supabaseUrlConfigured: Boolean(supabaseUrl),
      supabaseAnonKeyConfigured: Boolean(supabaseAnonKey),
      supabaseServiceRoleKeyConfigured: Boolean(supabaseServiceKey),
      adminCount: memoryStore.adminAccounts.length,
      hasSuperAdmin: memoryStore.adminAccounts.some((a) => a.role === "SUPER_ADMIN" && a.status === "active"),
      whatsappChannelUrl: memoryStore.settings.whatsapp_channel_url,
    });
  });

  // 2. Categories
  app.get("/api/categories", async (req, res) => {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("categories")
          .select("*")
          .order("name", { ascending: true });
        if (!error && data && data.length > 0) {
          res.json({ categories: data });
          return;
        }
      } catch (err) {
        console.error("[Get Categories Supabase]", err);
      }
    }
    res.json({ categories: memoryStore.categories });
  });

  app.post("/api/categories", authenticateAdmin, requireRoles("SUPER_ADMIN"), async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Category name is required" });
      return;
    }
    const cleanName = name.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const newCat: Category = {
      id: crypto.randomUUID(),
      name: cleanName,
      slug,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    memoryStore.categories.push(newCat);

    if (supabaseClient) {
      try {
        await supabaseClient.from("categories").insert(newCat);
      } catch (err) {
        console.error("[Insert Category Supabase]", err);
      }
    }

    await recordAudit(
      { id: (req as any).admin.adminId, email: (req as any).admin.email, role: (req as any).admin.role },
      "CREATE_CATEGORY",
      "CATEGORY",
      newCat.id,
      { name: cleanName }
    );

    res.status(201).json({ category: newCat });
  });

  app.put("/api/categories/:id", authenticateAdmin, requireRoles("SUPER_ADMIN"), async (req, res) => {
    const { id } = req.params;
    const { name, is_active } = req.body;

    const catIndex = memoryStore.categories.findIndex((c) => c.id === id);
    if (catIndex === -1) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    if (name) {
      memoryStore.categories[catIndex].name = name.trim();
      memoryStore.categories[catIndex].slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
    if (typeof is_active === "boolean") {
      memoryStore.categories[catIndex].is_active = is_active;
    }

    const updated = memoryStore.categories[catIndex];

    if (supabaseClient) {
      try {
        await supabaseClient.from("categories").update({
          name: updated.name,
          slug: updated.slug,
          is_active: updated.is_active,
        }).eq("id", id);
      } catch (err) {
        console.error("[Update Category Supabase]", err);
      }
    }

    await recordAudit(
      { id: (req as any).admin.adminId, email: (req as any).admin.email, role: (req as any).admin.role },
      "UPDATE_CATEGORY",
      "CATEGORY",
      id,
      { name: updated.name, is_active: updated.is_active }
    );

    res.json({ category: updated });
  });

  app.delete("/api/categories/:id", authenticateAdmin, requireRoles("SUPER_ADMIN"), async (req, res) => {
    const { id } = req.params;
    const isUsed = memoryStore.submissions.some((s) => s.category_id === id);
    if (isUsed) {
      res.status(400).json({ error: "Cannot delete category referenced by existing submissions. Disable it instead." });
      return;
    }

    memoryStore.categories = memoryStore.categories.filter((c) => c.id !== id);

    if (supabaseClient) {
      try {
        await supabaseClient.from("categories").delete().eq("id", id);
      } catch (err) {
        console.error("[Delete Category Supabase]", err);
      }
    }

    await recordAudit(
      { id: (req as any).admin.adminId, email: (req as any).admin.email, role: (req as any).admin.role },
      "DELETE_CATEGORY",
      "CATEGORY",
      id
    );

    res.json({ success: true, message: "Category deleted" });
  });

  // ---------------------------------------------------------------------------
  // User (Follower) Registration & Authentication
  // ---------------------------------------------------------------------------
  app.post("/api/auth/register", async (req, res) => {
    const { name, age, state, whatsapp_number, password } = req.body;

    // Validate inputs
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({ error: "Valid name is required (minimum 2 characters)" });
      return;
    }
    const numAge = Number(age);
    if (isNaN(numAge) || numAge < 13 || numAge > 100) {
      res.status(400).json({ error: "Valid age between 13 and 100 is required" });
      return;
    }
    if (!state || typeof state !== "string") {
      res.status(400).json({ error: "State is required" });
      return;
    }
    if (!whatsapp_number || typeof whatsapp_number !== "string" || whatsapp_number.trim().length < 7) {
      res.status(400).json({ error: "Valid WhatsApp number is required" });
      return;
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    // Normalize WhatsApp number
    const cleanWhatsApp = whatsapp_number.trim().replace(/[^\d+]/g, "");

    // Check duplicate WhatsApp in memory
    const existing = memoryStore.profiles.find(
      (p) => p.whatsapp_number.replace(/[^\d]/g, "") === cleanWhatsApp.replace(/[^\d]/g, "")
    );
    if (existing) {
      res.status(400).json({ error: "A user account with this WhatsApp number already exists. Please log in." });
      return;
    }

    // Generate follower ID
    let followerId = "";
    if (supabaseClient) {
      try {
        const { data: seqData, error: seqErr } = await supabaseClient.rpc("generate_follower_id");
        if (!seqErr && seqData) {
          followerId = seqData;
        }
      } catch (err) {
        console.warn("[Follower ID RPC Failed, fallback to server generator]", err);
      }
    }
    if (!followerId) {
      followerId = generateUniqueFollowerId();
    }

    const userId = crypto.randomUUID();
    const password_hash = hashPassword(password);
    const now = new Date().toISOString();

    const profile: UserProfile = {
      id: userId,
      follower_id: followerId,
      name: name.trim(),
      age: numAge,
      state: state.trim(),
      whatsapp_number: cleanWhatsApp,
      account_status: "active",
      created_at: now,
      updated_at: now,
      submission_count: 0,
    };

    memoryStore.profiles.push({ ...profile, password_hash });

    if (supabaseClient) {
      try {
        await supabaseClient.from("profiles").insert({
          id: userId,
          follower_id: followerId,
          name: profile.name,
          age: profile.age,
          state: profile.state,
          whatsapp_number: profile.whatsapp_number,
          password_hash,
          account_status: "active",
          created_at: now,
          updated_at: now,
        });
      } catch (err) {
        console.error("[Supabase Insert Profile Error]", err);
      }
    }

    // Issue Auth Token
    const token = createAuthToken({
      userId: profile.id,
      followerId: profile.follower_id,
      type: "user",
    }, 30 * 24 * 3600);

    res.status(201).json({
      message: "Registration successful",
      token,
      profile,
    });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      res.status(400).json({ error: "Follower ID or WhatsApp number and Password are required" });
      return;
    }

    const cleanIdentifier = String(identifier).trim();
    const cleanDigits = cleanIdentifier.replace(/[^\d]/g, "");
    const cleanPwdHash = hashPassword(String(password));

    // Try finding user in memory store by Follower ID, WhatsApp Number, or Name
    let user = memoryStore.profiles.find((p) => {
      const matchFollowerId = p.follower_id.toUpperCase() === cleanIdentifier.toUpperCase();
      const pDigits = p.whatsapp_number.replace(/[^\d]/g, "");
      const matchWhatsApp =
        cleanDigits.length >= 7 &&
        (pDigits === cleanDigits || pDigits.endsWith(cleanDigits) || cleanDigits.endsWith(pDigits));
      const matchName = p.name.trim().toLowerCase() === cleanIdentifier.toLowerCase();
      return matchFollowerId || matchWhatsApp || matchName;
    });

    // If user is not in memory or doesn't have password_hash, query Supabase cloud database
    if ((!user || !user.password_hash) && supabaseClient) {
      try {
        let query = supabaseClient.from("profiles").select("*");
        if (cleanIdentifier.toUpperCase().startsWith("FOLLOWER-")) {
          query = query.ilike("follower_id", cleanIdentifier);
        } else if (cleanDigits.length >= 7) {
          query = query.or(`whatsapp_number.ilike.%${cleanDigits}%,whatsapp_number.eq.${cleanIdentifier},name.ilike.${cleanIdentifier}`);
        } else {
          query = query.or(`follower_id.ilike.${cleanIdentifier},whatsapp_number.eq.${cleanIdentifier},name.ilike.${cleanIdentifier}`);
        }

        const { data, error } = await query.limit(1).maybeSingle();

        if (!error && data) {
          const mappedProfile = {
            id: data.id,
            follower_id: data.follower_id,
            name: data.name,
            age: data.age,
            state: data.state,
            whatsapp_number: data.whatsapp_number,
            account_status: data.account_status,
            created_at: data.created_at,
            updated_at: data.updated_at,
            password_hash: data.password_hash,
          };
          const existingIdx = memoryStore.profiles.findIndex((p) => p.id === data.id);
          if (existingIdx !== -1) {
            memoryStore.profiles[existingIdx] = mappedProfile;
          } else {
            memoryStore.profiles.push(mappedProfile);
          }
          user = mappedProfile;
        }
      } catch (err) {
        console.error("[Supabase Login Query Error]", err);
      }
    }

    if (!user) {
      res.status(401).json({ error: "Invalid Follower ID / WhatsApp number or password" });
      return;
    }

    // Verify Password Hash
    if (user.password_hash && user.password_hash !== cleanPwdHash) {
      res.status(401).json({ error: "Invalid Follower ID / WhatsApp number or password" });
      return;
    }

    if (user.account_status !== "active") {
      res.status(403).json({ error: `Account is ${user.account_status}. Please contact the administrator.` });
      return;
    }

    const count = memoryStore.submissions.filter((s) => s.user_id === user!.id).length;

    const token = createAuthToken({
      userId: user.id,
      followerId: user.follower_id,
      type: "user",
    }, 30 * 24 * 3600);

    const { password_hash: _, ...safeProfile } = user;

    res.json({
      message: "Login successful",
      token,
      profile: { ...safeProfile, submission_count: count },
    });
  });

  app.get("/api/auth/me", authenticateUser, async (req, res) => {
    const userPayload = (req as any).user;
    let profile = memoryStore.profiles.find((p) => p.id === userPayload.userId);

    // If profile not found in memory, try retrieving from Supabase
    if (!profile && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", userPayload.userId)
          .maybeSingle();

        if (!error && data) {
          profile = {
            id: data.id,
            follower_id: data.follower_id,
            name: data.name,
            age: data.age,
            state: data.state,
            whatsapp_number: data.whatsapp_number,
            account_status: data.account_status,
            created_at: data.created_at,
            updated_at: data.updated_at,
            password_hash: data.password_hash,
          };
          memoryStore.profiles.push(profile);
        }
      } catch (err) {
        console.error("[Supabase Auth/Me Query Error]", err);
      }
    }

    if (!profile) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }

    // Attach submission count
    const count = memoryStore.submissions.filter((s) => s.user_id === profile!.id).length;
    const { password_hash: _, ...safeProfile } = profile;
    res.json({ profile: { ...safeProfile, submission_count: count } });
  });

  app.put("/api/auth/profile", authenticateUser, async (req, res) => {
    const userPayload = (req as any).user;
    const { name, age, state, whatsapp_number } = req.body;

    const profileIndex = memoryStore.profiles.findIndex((p) => p.id === userPayload.userId);
    if (profileIndex === -1) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const current = memoryStore.profiles[profileIndex];

    if (name && typeof name === "string") current.name = name.trim();
    if (age && !isNaN(Number(age))) current.age = Number(age);
    if (state && typeof state === "string") current.state = state.trim();
    if (whatsapp_number && typeof whatsapp_number === "string") {
      current.whatsapp_number = whatsapp_number.trim().replace(/[^\d+]/g, "");
    }
    current.updated_at = new Date().toISOString();

    if (supabaseClient) {
      try {
        await supabaseClient.from("profiles").update({
          name: current.name,
          age: current.age,
          state: current.state,
          whatsapp_number: current.whatsapp_number,
          updated_at: current.updated_at,
        }).eq("id", current.id);
      } catch (err) {
        console.error("[Supabase Update Profile Error]", err);
      }
    }

    res.json({ message: "Profile updated successfully", profile: current });
  });

  // ---------------------------------------------------------------------------
  // Submissions (Follower Endpoints)
  // ---------------------------------------------------------------------------
  app.post("/api/submissions", authenticateUser, async (req, res) => {
    const userPayload = (req as any).user;
    const { category_id, category_name, submission_type, text_content, media_items } = req.body;

    if (!category_name) {
      res.status(400).json({ error: "Category is required" });
      return;
    }
    if (!submission_type || !["text", "image", "video", "audio", "file"].includes(submission_type)) {
      res.status(400).json({ error: "Valid submission type (text, image, video, audio, file) is required" });
      return;
    }

    if (submission_type === "text" && (!text_content || !text_content.trim())) {
      res.status(400).json({ error: "Text content cannot be empty" });
      return;
    }

    if (["image", "video", "audio", "file"].includes(submission_type) && (!media_items || media_items.length === 0) && (!text_content || !text_content.trim())) {
      res.status(400).json({ error: `Please provide a ${submission_type} file or text content` });
      return;
    }

    const userProfile = memoryStore.profiles.find((p) => p.id === userPayload.userId);
    if (!userProfile) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }

    userProfile.submission_count = (userProfile.submission_count || 0) + 1;
    userProfile.updated_at = new Date().toISOString();

    const submissionId = crypto.randomUUID();
    const now = new Date().toISOString();

    const mediaList = (media_items || []).map((m: any) => ({
      id: crypto.randomUUID(),
      submission_id: submissionId,
      file_url: m.file_url,
      storage_path: m.storage_path,
      file_type: m.file_type || submission_type,
      file_size: m.file_size,
      mime_type: m.mime_type,
      created_at: now,
    }));

    const submission: Submission = {
      id: submissionId,
      user_id: userPayload.userId,
      follower_id: userProfile.follower_id,
      category_id: category_id || null,
      category_name: category_name,
      submission_type: submission_type,
      text_content: text_content ? text_content.trim() : "",
      status: "pending",
      created_at: now,
      updated_at: now,
      media: mediaList,
    };

    memoryStore.submissions.unshift(submission);

    if (supabaseClient) {
      try {
        await supabaseClient.from("submissions").insert({
          id: submissionId,
          user_id: userPayload.userId,
          follower_id: userProfile.follower_id,
          category_id: submission.category_id,
          category_name: submission.category_name,
          submission_type: submission.submission_type,
          text_content: submission.text_content,
          status: "pending",
          created_at: now,
          updated_at: now,
        });

        if (mediaList.length > 0) {
          await supabaseClient.from("submission_media").insert(mediaList);
        }
      } catch (err) {
        console.error("[Supabase Insert Submission Error]", err);
      }
    }

    res.status(201).json({
      message: "Submission received successfully. Our team will review it shortly.",
      submission,
    });
  });

  app.get("/api/my-submissions", authenticateUser, async (req, res) => {
    const userPayload = (req as any).user;
    let userSubmissions = memoryStore.submissions.filter((s) => s.user_id === userPayload.userId);

    // If none found in memory, check Supabase
    if (userSubmissions.length === 0 && supabaseClient) {
      try {
        const { data: subs, error } = await supabaseClient
          .from("submissions")
          .select("*, media:submission_media(*)")
          .eq("user_id", userPayload.userId)
          .order("created_at", { ascending: false });

        if (!error && subs && subs.length > 0) {
          const mapped = subs.map((s) => ({
            id: s.id,
            user_id: s.user_id,
            follower_id: s.follower_id,
            category_id: s.category_id,
            category_name: s.category_name,
            submission_type: s.submission_type,
            text_content: s.text_content,
            status: s.status,
            rejection_reason: s.rejection_reason,
            moderation_notes: s.moderation_notes,
            reviewed_by: s.reviewed_by,
            reviewed_at: s.reviewed_at,
            posted_by: s.posted_by,
            posted_at: s.posted_at,
            created_at: s.created_at,
            updated_at: s.updated_at,
            media: s.media || [],
          }));
          // Merge into memory store
          mapped.forEach((item) => {
            if (!memoryStore.submissions.some((ms) => ms.id === item.id)) {
              memoryStore.submissions.push(item);
            }
          });
          userSubmissions = mapped;
        }
      } catch (err) {
        console.error("[Supabase My Submissions Error]", err);
      }
    }

    const formatted = userSubmissions.map((s) => ({
      id: s.id,
      follower_id: s.follower_id,
      category_name: s.category_name,
      submission_type: s.submission_type,
      text_content: s.text_content,
      status: s.status,
      rejection_reason: s.status === "rejected" ? s.rejection_reason : undefined,
      created_at: s.created_at,
      updated_at: s.updated_at,
      media: s.media,
    }));

    res.json({ submissions: formatted });
  });

  app.get("/api/my-submissions/:id", authenticateUser, async (req, res) => {
    const userPayload = (req as any).user;
    const { id } = req.params;

    const sub = memoryStore.submissions.find((s) => s.id === id && s.user_id === userPayload.userId);
    if (!sub) {
      res.status(404).json({ error: "Submission not found or unauthorized" });
      return;
    }

    res.json({
      submission: {
        id: sub.id,
        follower_id: sub.follower_id,
        category_name: sub.category_name,
        submission_type: sub.submission_type,
        text_content: sub.text_content,
        status: sub.status,
        rejection_reason: sub.status === "rejected" ? sub.rejection_reason : undefined,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        media: sub.media,
      },
    });
  });

  app.put("/api/my-submissions/:id", authenticateUser, async (req, res) => {
    const userPayload = (req as any).user;
    const { id } = req.params;
    const { text_content, category_name, category_id } = req.body;

    const subIndex = memoryStore.submissions.findIndex((s) => s.id === id && s.user_id === userPayload.userId);
    if (subIndex === -1) {
      res.status(404).json({ error: "Submission not found or unauthorized" });
      return;
    }

    const sub = memoryStore.submissions[subIndex];
    if (sub.status !== "pending") {
      res.status(400).json({ error: `Cannot edit submission with status '${sub.status}'. Only 'pending' submissions can be edited.` });
      return;
    }

    if (text_content !== undefined) sub.text_content = text_content.trim();
    if (category_name) sub.category_name = category_name;
    if (category_id) sub.category_id = category_id;
    sub.updated_at = new Date().toISOString();

    if (supabaseClient) {
      try {
        await supabaseClient.from("submissions").update({
          text_content: sub.text_content,
          category_name: sub.category_name,
          category_id: sub.category_id,
          updated_at: sub.updated_at,
        }).eq("id", id);
      } catch (err) {
        console.error("[Supabase Edit Submission Error]", err);
      }
    }

    res.json({ message: "Submission updated successfully", submission: sub });
  });

  app.delete("/api/my-submissions/:id", authenticateUser, async (req, res) => {
    const userPayload = (req as any).user;
    const { id } = req.params;

    const subIndex = memoryStore.submissions.findIndex((s) => s.id === id && s.user_id === userPayload.userId);
    if (subIndex === -1) {
      res.status(404).json({ error: "Submission not found or unauthorized" });
      return;
    }

    const sub = memoryStore.submissions[subIndex];
    if (sub.status !== "pending") {
      res.status(400).json({ error: `Cannot delete submission with status '${sub.status}'. Only 'pending' submissions can be deleted.` });
      return;
    }

    memoryStore.submissions.splice(subIndex, 1);

    if (supabaseClient) {
      try {
        await supabaseClient.from("submissions").delete().eq("id", id);
      } catch (err) {
        console.error("[Supabase Delete Submission Error]", err);
      }
    }

    res.json({ success: true, message: "Submission deleted successfully" });
  });

  // Media Upload Endpoint
  app.post("/api/upload-media", authenticateUser, async (req, res) => {
    const { file_data, file_name, file_type, mime_type } = req.body;

    if (!file_data || !file_type) {
      res.status(400).json({ error: "File data and file type are required" });
      return;
    }

    // Validate mime types
    const validMimes: Record<string, string[]> = {
      image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
      video: ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska", "video/3gpp"],
      audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/webm", "audio/ogg", "audio/m4a", "audio/aac", "audio/x-m4a"],
      file: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/zip",
        "application/x-zip-compressed",
        "application/octet-stream",
      ],
    };

    if (mime_type && validMimes[file_type] && !validMimes[file_type].includes(mime_type) && file_type !== "file") {
      res.status(400).json({ error: `Unsupported MIME type '${mime_type}' for ${file_type}` });
      return;
    }

    const cleanExt = (file_name ? path.extname(file_name) : "").replace(/[^a-zA-Z0-9]/g, "") || (file_type === "audio" ? "webm" : file_type === "image" ? "jpg" : file_type === "file" ? "pdf" : "mp4");
    const uniqueFileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${cleanExt}`;
    const storagePath = `submissions/${file_type}/${uniqueFileName}`;

    let publicUrl = file_data; // Default: base64/data URI if direct

    if (supabaseClient && file_data.startsWith("data:")) {
      try {
        const base64Data = file_data.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");

        const { data: uploadData, error: uploadErr } = await supabaseClient.storage
          .from("submissions-media")
          .upload(storagePath, buffer, {
            contentType: mime_type || "application/octet-stream",
            upsert: false,
          });

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabaseClient.storage
            .from("submissions-media")
            .getPublicUrl(storagePath);
          if (urlData && urlData.publicUrl) {
            publicUrl = urlData.publicUrl;
          }
        } else {
          console.warn("[Supabase Storage Upload Warning, fallback to direct URI]:", uploadErr?.message);
        }
      } catch (err) {
        console.error("[Supabase Storage Upload Error]:", err);
      }
    }

    res.status(201).json({
      file_url: publicUrl,
      storage_path: storagePath,
      file_type,
      mime_type,
    });
  });

  // ---------------------------------------------------------------------------
  // Admin Authentication & Setup
  // ---------------------------------------------------------------------------
  app.post("/api/admin/setup-first-super-admin", async (req, res) => {
    const { name, email, password } = req.body;

    const hasSuperAdmin = memoryStore.adminAccounts.some((a) => a.role === "SUPER_ADMIN" && a.status === "active");
    if (hasSuperAdmin) {
      res.status(400).json({ error: "A Super Admin already exists. Please log in with existing admin credentials." });
      return;
    }

    if (!name || !email || !password || password.length < 8) {
      res.status(400).json({ error: "Valid name, email, and password (min 8 characters) are required" });
      return;
    }

    const adminId = crypto.randomUUID();
    const now = new Date().toISOString();
    const password_hash = hashPassword(password);

    const superAdmin: AdminAccount & { password_hash: string } = {
      id: adminId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: "SUPER_ADMIN",
      status: "active",
      created_at: now,
      updated_at: now,
      password_hash,
    };

    memoryStore.adminAccounts.push(superAdmin);

    if (supabaseClient) {
      try {
        await supabaseClient.from("admin_roles").insert({
          id: adminId,
          name: superAdmin.name,
          email: superAdmin.email,
          role: "SUPER_ADMIN",
          status: "active",
          password_hash,
          created_at: now,
          updated_at: now,
        });
      } catch (err) {
        console.error("[Supabase Create Super Admin Error]", err);
      }
    }

    await recordAudit(
      { id: adminId, email: superAdmin.email, role: "SUPER_ADMIN" },
      "SETUP_FIRST_SUPER_ADMIN",
      "ADMIN",
      adminId,
      { email: superAdmin.email }
    );

    const token = createAuthToken({
      adminId: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
      type: "admin",
    }, 7 * 24 * 3600);

    res.status(201).json({
      message: "First Super Admin created successfully",
      token,
      admin: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        status: superAdmin.status,
      },
    });
  });

  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPwdHash = hashPassword(String(password));

    let admin = memoryStore.adminAccounts.find(
      (a) => a.email.toLowerCase() === cleanEmail && a.password_hash === cleanPwdHash
    );

    if (!admin && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from("admin_roles")
          .select("*")
          .eq("email", cleanEmail)
          .single();

        if (!error && data && data.password_hash === cleanPwdHash) {
          admin = {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            status: data.status,
            created_at: data.created_at,
            updated_at: data.updated_at,
            password_hash: data.password_hash,
          };
          memoryStore.adminAccounts.push(admin);
        }
      } catch (err) {
        console.error("[Supabase Admin Login Query Error]", err);
      }
    }

    if (!admin) {
      res.status(401).json({ error: "Invalid admin email or password" });
      return;
    }

    if (admin.status !== "active") {
      res.status(403).json({ error: "This administrator account has been disabled." });
      return;
    }

    await recordAudit(
      { id: admin.id, email: admin.email, role: admin.role },
      "ADMIN_LOGIN",
      "SESSION",
      admin.id
    );

    const token = createAuthToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      type: "admin",
    }, 7 * 24 * 3600);

    res.json({
      message: "Admin login successful",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
      },
    });
  });

  app.get("/api/admin/me", authenticateAdmin, (req, res) => {
    const adminPayload = (req as any).admin;
    const admin = memoryStore.adminAccounts.find((a) => a.id === adminPayload.adminId);
    if (!admin) {
      // Return payload info if not in memory
      res.json({
        admin: {
          id: adminPayload.adminId,
          email: adminPayload.email,
          role: adminPayload.role,
          name: adminPayload.email.split("@")[0],
          status: "active",
        },
      });
      return;
    }
    res.json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status,
      },
    });
  });

  // ---------------------------------------------------------------------------
  // Admin Submissions Moderation (Strict Content Admin Privacy Enforcement)
  // ---------------------------------------------------------------------------
  app.get("/api/admin/submissions", authenticateAdmin, async (req, res) => {
    const admin = (req as any).admin;
    const { category, type, status, search, page = "1", limit = "20" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));

    let filtered = [...memoryStore.submissions];

    if (category && category !== "all") {
      filtered = filtered.filter((s) => s.category_name.toLowerCase() === String(category).toLowerCase() || s.category_id === category);
    }
    if (type && type !== "all") {
      filtered = filtered.filter((s) => s.submission_type === type);
    }
    if (status && status !== "all") {
      filtered = filtered.filter((s) => s.status === status);
    }
    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.follower_id.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          (s.text_content && s.text_content.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    // CRITICAL PRIVACY RULE: If role is CONTENT_ADMIN, user identity is strictly excluded!
    const sanitizedSubmissions = paginated.map((s) => {
      const base: Submission = {
        id: s.id,
        follower_id: s.follower_id,
        category_id: s.category_id,
        category_name: s.category_name,
        submission_type: s.submission_type,
        text_content: s.text_content,
        status: s.status,
        rejection_reason: s.rejection_reason,
        moderation_notes: s.moderation_notes,
        reviewed_by: s.reviewed_by,
        reviewed_at: s.reviewed_at,
        posted_by: s.posted_by,
        posted_at: s.posted_at,
        created_at: s.created_at,
        updated_at: s.updated_at,
        media: s.media,
      };

      // Only SUPER_ADMIN and USER_ADMIN can receive user_profile if explicitly fetched
      if (admin.role === "SUPER_ADMIN") {
        base.user_id = s.user_id;
      }
      return base;
    });

    res.json({
      submissions: sanitizedSubmissions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  });

  app.get("/api/admin/submissions/:id", authenticateAdmin, async (req, res) => {
    const admin = (req as any).admin;
    const { id } = req.params;

    const sub = memoryStore.submissions.find((s) => s.id === id);
    if (!sub) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    const responseSub: Submission = {
      id: sub.id,
      follower_id: sub.follower_id,
      category_id: sub.category_id,
      category_name: sub.category_name,
      submission_type: sub.submission_type,
      text_content: sub.text_content,
      status: sub.status,
      rejection_reason: sub.rejection_reason,
      moderation_notes: sub.moderation_notes,
      reviewed_by: sub.reviewed_by,
      reviewed_at: sub.reviewed_at,
      posted_by: sub.posted_by,
      posted_at: sub.posted_at,
      created_at: sub.created_at,
      updated_at: sub.updated_at,
      media: sub.media,
    };

    if (admin.role === "SUPER_ADMIN") {
      responseSub.user_id = sub.user_id;
    }

    res.json({ submission: responseSub });
  });

  app.put("/api/admin/submissions/:id/status", authenticateAdmin, async (req, res) => {
    const admin = (req as any).admin;
    const { id } = req.params;
    const { status, rejection_reason, moderation_notes } = req.body;

    if (!status || !["pending", "reviewing", "approved", "rejected", "posted"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const subIndex = memoryStore.submissions.findIndex((s) => s.id === id);
    if (subIndex === -1) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    const sub = memoryStore.submissions[subIndex];
    sub.status = status;
    if (rejection_reason !== undefined) sub.rejection_reason = rejection_reason;
    if (moderation_notes !== undefined) sub.moderation_notes = moderation_notes;
    sub.updated_at = new Date().toISOString();

    if (status === "approved" || status === "rejected" || status === "reviewing") {
      sub.reviewed_by = admin.email;
      sub.reviewed_at = new Date().toISOString();
    }
    if (status === "posted") {
      sub.posted_by = admin.email;
      sub.posted_at = new Date().toISOString();
    }

    if (supabaseClient) {
      try {
        await supabaseClient.from("submissions").update({
          status: sub.status,
          rejection_reason: sub.rejection_reason,
          moderation_notes: sub.moderation_notes,
          reviewed_by: sub.reviewed_by,
          reviewed_at: sub.reviewed_at,
          posted_by: sub.posted_by,
          posted_at: sub.posted_at,
          updated_at: sub.updated_at,
        }).eq("id", id);
      } catch (err) {
        console.error("[Supabase Update Status Error]", err);
      }
    }

    await recordAudit(
      { id: admin.adminId, email: admin.email, role: admin.role },
      `SUBMISSION_STATUS_${status.toUpperCase()}`,
      "SUBMISSION",
      id,
      { status, follower_id: sub.follower_id }
    );

    res.json({ message: `Submission marked as ${status}`, submission: sub });
  });

  app.put("/api/admin/submissions/:id/content", authenticateAdmin, async (req, res) => {
    const admin = (req as any).admin;
    const { id } = req.params;
    const { text_content, category_name, category_id, moderation_notes } = req.body;

    const subIndex = memoryStore.submissions.findIndex((s) => s.id === id);
    if (subIndex === -1) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    const sub = memoryStore.submissions[subIndex];
    if (text_content !== undefined) sub.text_content = text_content.trim();
    if (category_name) sub.category_name = category_name;
    if (category_id) sub.category_id = category_id;
    if (moderation_notes !== undefined) sub.moderation_notes = moderation_notes;
    sub.updated_at = new Date().toISOString();

    if (supabaseClient) {
      try {
        await supabaseClient.from("submissions").update({
          text_content: sub.text_content,
          category_name: sub.category_name,
          category_id: sub.category_id,
          moderation_notes: sub.moderation_notes,
          updated_at: sub.updated_at,
        }).eq("id", id);
      } catch (err) {
        console.error("[Supabase Edit Content Error]", err);
      }
    }

    await recordAudit(
      { id: admin.adminId, email: admin.email, role: admin.role },
      "SUBMISSION_CONTENT_EDIT",
      "SUBMISSION",
      id,
      { follower_id: sub.follower_id }
    );

    res.json({ message: "Content updated", submission: sub });
  });

  app.delete("/api/admin/submissions/:id", authenticateAdmin, async (req, res) => {
    const admin = (req as any).admin;
    const { id } = req.params;

    const subIndex = memoryStore.submissions.findIndex((s) => s.id === id);
    if (subIndex === -1) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    const removed = memoryStore.submissions.splice(subIndex, 1)[0];

    if (supabaseClient) {
      try {
        await supabaseClient.from("submissions").delete().eq("id", id);
      } catch (err) {
        console.error("[Supabase Delete Submission Error]", err);
      }
    }

    await recordAudit(
      { id: admin.adminId, email: admin.email, role: admin.role },
      "DELETE_SUBMISSION",
      "SUBMISSION",
      id,
      { follower_id: removed.follower_id }
    );

    res.json({ success: true, message: "Submission deleted" });
  });

  // Explicit Reveal Identity (SUPER ADMIN & USER ADMIN only)
  app.post("/api/admin/submissions/:id/reveal-identity", authenticateAdmin, requireRoles("SUPER_ADMIN", "USER_ADMIN"), async (req, res) => {
    const admin = (req as any).admin;
    const { id } = req.params;

    const sub = memoryStore.submissions.find((s) => s.id === id);
    if (!sub) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    const profile = memoryStore.profiles.find((p) => p.id === sub.user_id || p.follower_id === sub.follower_id);
    if (!profile) {
      res.status(404).json({ error: "User identity profile not found" });
      return;
    }

    await recordAudit(
      { id: admin.adminId, email: admin.email, role: admin.role },
      "REVEAL_SENSITIVE_IDENTITY",
      "USER_PROFILE",
      profile.id,
      { follower_id: profile.follower_id, submission_id: sub.id }
    );

    res.json({
      identity: {
        follower_id: profile.follower_id,
        name: profile.name,
        age: profile.age,
        state: profile.state,
        whatsapp_number: profile.whatsapp_number,
        account_status: profile.account_status,
        created_at: profile.created_at,
      },
    });
  });

  // ---------------------------------------------------------------------------
  // Admin User Management (SUPER ADMIN & USER ADMIN only)
  // ---------------------------------------------------------------------------
  app.get("/api/admin/users", authenticateAdmin, requireRoles("SUPER_ADMIN", "USER_ADMIN"), async (req, res) => {
    const admin = (req as any).admin;
    const { search, state, status, page = "1", limit = "20" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));

    let filtered = memoryStore.profiles.map((p) => {
      const count = memoryStore.submissions.filter((s) => s.user_id === p.id || s.follower_id === p.follower_id).length;
      return {
        ...p,
        submission_count: count,
      };
    });

    if (state && state !== "all") {
      filtered = filtered.filter((u) => u.state.toLowerCase() === String(state).toLowerCase());
    }
    if (status && status !== "all") {
      filtered = filtered.filter((u) => u.account_status === status);
    }
    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.follower_id.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.whatsapp_number.includes(q)
      );
    }

    const total = filtered.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    await recordAudit(
      { id: admin.adminId, email: admin.email, role: admin.role },
      "VIEW_USERS_LIST",
      "USER_LIST",
      undefined,
      { count: paginated.length, page: pageNum }
    );

    res.json({
      users: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  });

  app.put("/api/admin/users/:id/profile", authenticateAdmin, requireRoles("SUPER_ADMIN", "USER_ADMIN"), async (req, res) => {
    const admin = (req as any).admin;
    const { id } = req.params;
    const { name, age, state, whatsapp_number } = req.body;

    const profileIndex = memoryStore.profiles.findIndex((p) => p.id === id);
    if (profileIndex === -1) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }

    const profile = memoryStore.profiles[profileIndex];
    if (name) profile.name = name.trim();
    if (age && !isNaN(Number(age))) profile.age = Number(age);
    if (state) profile.state = state.trim();
    if (whatsapp_number) profile.whatsapp_number = whatsapp_number.trim().replace(/[^\d+]/g, "");
    profile.updated_at = new Date().toISOString();

    if (supabaseClient) {
      try {
        await supabaseClient.from("profiles").update({
          name: profile.name,
          age: profile.age,
          state: profile.state,
          whatsapp_number: profile.whatsapp_number,
          updated_at: profile.updated_at,
        }).eq("id", id);
      } catch (err) {
        console.error("[Supabase Update User Error]", err);
      }
    }

    await recordAudit(
      { id: admin.adminId, email: admin.email, role: admin.role },
      "UPDATE_USER_PROFILE",
      "USER_PROFILE",
      id,
      { follower_id: profile.follower_id }
    );

    res.json({ message: "User profile updated", profile });
  });

  app.put("/api/admin/users/:id/status", authenticateAdmin, requireRoles("SUPER_ADMIN", "USER_ADMIN"), async (req, res) => {
    const admin = (req as any).admin;
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "deactivated", "suspended"].includes(status)) {
      res.status(400).json({ error: "Invalid account status" });
      return;
    }

    const profileIndex = memoryStore.profiles.findIndex((p) => p.id === id);
    if (profileIndex === -1) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const profile = memoryStore.profiles[profileIndex];
    profile.account_status = status;
    profile.updated_at = new Date().toISOString();

    if (supabaseClient) {
      try {
        await supabaseClient.from("profiles").update({
          account_status: status,
          updated_at: profile.updated_at,
        }).eq("id", id);
      } catch (err) {
        console.error("[Supabase User Status Error]", err);
      }
    }

    await recordAudit(
      { id: admin.adminId, email: admin.email, role: admin.role },
      `USER_STATUS_${status.toUpperCase()}`,
      "USER_PROFILE",
      id,
      { follower_id: profile.follower_id, new_status: status }
    );

    res.json({ message: `User account ${status}`, profile });
  });

  // ---------------------------------------------------------------------------
  // Super Admin - Admin Accounts Management
  // ---------------------------------------------------------------------------
  app.get("/api/admin/admins", authenticateAdmin, requireRoles("SUPER_ADMIN"), (req, res) => {
    const sanitized = memoryStore.adminAccounts.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      status: a.status,
      created_at: a.created_at,
      updated_at: a.updated_at,
    }));
    res.json({ admins: sanitized });
  });

  app.post("/api/admin/admins", authenticateAdmin, requireRoles("SUPER_ADMIN"), async (req, res) => {
    const currentAdmin = (req as any).admin;
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || password.length < 8) {
      res.status(400).json({ error: "Name, email, and password (min 8 chars) are required" });
      return;
    }
    if (!["SUPER_ADMIN", "USER_ADMIN", "CONTENT_ADMIN"].includes(role)) {
      res.status(400).json({ error: "Valid admin role is required" });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (memoryStore.adminAccounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
      res.status(400).json({ error: "An admin with this email already exists" });
      return;
    }

    const adminId = crypto.randomUUID();
    const now = new Date().toISOString();
    const password_hash = hashPassword(password);

    const newAdmin: AdminAccount & { password_hash: string } = {
      id: adminId,
      name: name.trim(),
      email: cleanEmail,
      role: role as AdminRole,
      status: "active",
      created_at: now,
      updated_at: now,
      password_hash,
    };

    memoryStore.adminAccounts.push(newAdmin);

    if (supabaseClient) {
      try {
        await supabaseClient.from("admin_roles").insert({
          id: adminId,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
          status: "active",
          password_hash,
          created_at: now,
          updated_at: now,
        });
      } catch (err) {
        console.error("[Supabase Insert Admin Error]", err);
      }
    }

    await recordAudit(
      { id: currentAdmin.adminId, email: currentAdmin.email, role: currentAdmin.role },
      "CREATE_ADMIN",
      "ADMIN",
      adminId,
      { email: cleanEmail, role }
    );

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        status: newAdmin.status,
      },
    });
  });

  app.put("/api/admin/admins/:id/role", authenticateAdmin, requireRoles("SUPER_ADMIN"), async (req, res) => {
    const currentAdmin = (req as any).admin;
    const { id } = req.params;
    const { role } = req.body;

    if (!["SUPER_ADMIN", "USER_ADMIN", "CONTENT_ADMIN"].includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }

    const adminIndex = memoryStore.adminAccounts.findIndex((a) => a.id === id);
    if (adminIndex === -1) {
      res.status(404).json({ error: "Admin not found" });
      return;
    }

    const targetAdmin = memoryStore.adminAccounts[adminIndex];

    // Prevent demoting the only active super admin
    if (targetAdmin.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
      const activeSuperAdmins = memoryStore.adminAccounts.filter(
        (a) => a.role === "SUPER_ADMIN" && a.status === "active"
      );
      if (activeSuperAdmins.length <= 1) {
        res.status(400).json({ error: "Cannot demote the only active Super Admin" });
        return;
      }
    }

    targetAdmin.role = role as AdminRole;
    targetAdmin.updated_at = new Date().toISOString();

    if (supabaseClient) {
      try {
        await supabaseClient.from("admin_roles").update({
          role,
          updated_at: targetAdmin.updated_at,
        }).eq("id", id);
      } catch (err) {
        console.error("[Supabase Update Role Error]", err);
      }
    }

    await recordAudit(
      { id: currentAdmin.adminId, email: currentAdmin.email, role: currentAdmin.role },
      "CHANGE_ADMIN_ROLE",
      "ADMIN",
      id,
      { email: targetAdmin.email, new_role: role }
    );

    res.json({ message: "Admin role updated", admin: targetAdmin });
  });

  app.put("/api/admin/admins/:id/status", authenticateAdmin, requireRoles("SUPER_ADMIN"), async (req, res) => {
    const currentAdmin = (req as any).admin;
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "disabled"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const adminIndex = memoryStore.adminAccounts.findIndex((a) => a.id === id);
    if (adminIndex === -1) {
      res.status(404).json({ error: "Admin not found" });
      return;
    }

    const targetAdmin = memoryStore.adminAccounts[adminIndex];

    // Prevent disabling the only active super admin
    if (targetAdmin.role === "SUPER_ADMIN" && status === "disabled") {
      const activeSuperAdmins = memoryStore.adminAccounts.filter(
        (a) => a.role === "SUPER_ADMIN" && a.status === "active"
      );
      if (activeSuperAdmins.length <= 1) {
        res.status(400).json({ error: "Cannot disable the only active Super Admin" });
        return;
      }
    }

    targetAdmin.status = status as "active" | "disabled";
    targetAdmin.updated_at = new Date().toISOString();

    if (supabaseClient) {
      try {
        await supabaseClient.from("admin_roles").update({
          status,
          updated_at: targetAdmin.updated_at,
        }).eq("id", id);
      } catch (err) {
        console.error("[Supabase Update Admin Status Error]", err);
      }
    }

    await recordAudit(
      { id: currentAdmin.adminId, email: currentAdmin.email, role: currentAdmin.role },
      `ADMIN_STATUS_${status.toUpperCase()}`,
      "ADMIN",
      id,
      { email: targetAdmin.email }
    );

    res.json({ message: `Admin ${status}`, admin: targetAdmin });
  });

  app.delete("/api/admin/admins/:id", authenticateAdmin, requireRoles("SUPER_ADMIN"), async (req, res) => {
    const currentAdmin = (req as any).admin;
    const { id } = req.params;

    const adminIndex = memoryStore.adminAccounts.findIndex((a) => a.id === id);
    if (adminIndex === -1) {
      res.status(404).json({ error: "Admin not found" });
      return;
    }

    const targetAdmin = memoryStore.adminAccounts[adminIndex];
    if (targetAdmin.role === "SUPER_ADMIN") {
      const activeSuperAdmins = memoryStore.adminAccounts.filter(
        (a) => a.role === "SUPER_ADMIN" && a.status === "active"
      );
      if (activeSuperAdmins.length <= 1) {
        res.status(400).json({ error: "Cannot delete the only Super Admin" });
        return;
      }
    }

    const deleted = memoryStore.adminAccounts.splice(adminIndex, 1)[0];

    if (supabaseClient) {
      try {
        await supabaseClient.from("admin_roles").delete().eq("id", id);
      } catch (err) {
        console.error("[Supabase Delete Admin Error]", err);
      }
    }

    await recordAudit(
      { id: currentAdmin.adminId, email: currentAdmin.email, role: currentAdmin.role },
      "DELETE_ADMIN",
      "ADMIN",
      id,
      { email: deleted.email }
    );

    res.json({ success: true, message: "Admin deleted" });
  });

  // ---------------------------------------------------------------------------
  // Statistics & Audit Logs
  // ---------------------------------------------------------------------------
  app.get("/api/admin/stats", authenticateAdmin, (req, res) => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const totalUsers = memoryStore.profiles.length;
    const newUsersToday = memoryStore.profiles.filter((p) => p.created_at.startsWith(todayStr)).length;

    const totalSubmissions = memoryStore.submissions.length;
    const pendingSubmissions = memoryStore.submissions.filter((s) => s.status === "pending").length;
    const reviewingSubmissions = memoryStore.submissions.filter((s) => s.status === "reviewing").length;
    const approvedSubmissions = memoryStore.submissions.filter((s) => s.status === "approved").length;
    const postedSubmissions = memoryStore.submissions.filter((s) => s.status === "posted").length;
    const rejectedSubmissions = memoryStore.submissions.filter((s) => s.status === "rejected").length;

    const stats: DashboardStats = {
      totalUsers,
      newUsersToday,
      totalSubmissions,
      pendingSubmissions,
      reviewingSubmissions,
      approvedSubmissions,
      postedSubmissions,
      rejectedSubmissions,
    };

    res.json({ stats });
  });

  app.get("/api/admin/audit-logs", authenticateAdmin, requireRoles("SUPER_ADMIN"), (req, res) => {
    const { search, action, page = "1", limit = "30" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 30));

    let filtered = [...memoryStore.auditLogs];

    if (action && action !== "all") {
      filtered = filtered.filter((l) => l.action.toLowerCase().includes(String(action).toLowerCase()));
    }
    if (search && typeof search === "string" && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.actor_email.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.target_type.toLowerCase().includes(q) ||
          (l.target_id && l.target_id.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    res.json({
      logs: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  });

  // ---------------------------------------------------------------------------
  // Settings API
  // ---------------------------------------------------------------------------
  app.get("/api/settings", (req, res) => {
    res.json({ settings: memoryStore.settings });
  });

  app.put("/api/settings", authenticateAdmin, requireRoles("SUPER_ADMIN"), async (req, res) => {
    const admin = (req as any).admin;
    const { platform_name, subtitle, whatsapp_channel_url, allow_submissions, max_image_mb, max_video_mb, max_audio_mb } = req.body;

    if (platform_name) memoryStore.settings.platform_name = platform_name.trim();
    if (subtitle) memoryStore.settings.subtitle = subtitle.trim();
    if (whatsapp_channel_url) memoryStore.settings.whatsapp_channel_url = whatsapp_channel_url.trim();
    if (typeof allow_submissions === "boolean") memoryStore.settings.allow_submissions = allow_submissions;
    if (max_image_mb) memoryStore.settings.max_image_mb = Number(max_image_mb);
    if (max_video_mb) memoryStore.settings.max_video_mb = Number(max_video_mb);
    if (max_audio_mb) memoryStore.settings.max_audio_mb = Number(max_audio_mb);

    await recordAudit(
      { id: admin.adminId, email: admin.email, role: admin.role },
      "UPDATE_SYSTEM_SETTINGS",
      "SYSTEM_SETTINGS",
      "general",
      memoryStore.settings
    );

    res.json({ message: "Settings updated", settings: memoryStore.settings });
  });

  // ---------------------------------------------------------------------------
  // Vite Integration for Dev / Static Serving for Production
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FUAHSE_INSIDER] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal server error:", err);
});
