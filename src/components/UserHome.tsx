import React, { useState, useEffect } from "react";
import {
  Send,
  ListChecks,
  User,
  ShieldCheck,
  Flame,
  Radio,
  Lock,
  Sparkles,
  ArrowRight,
  EyeOff,
  FileCheck2,
  Mic,
  MessageSquareQuote,
  CheckCircle2,
  Clock,
  Sparkle,
} from "lucide-react";
import { Category, Submission, UserProfile, WHATSAPP_CHANNEL_URL } from "../types";
import { WhatsAppButton } from "./WhatsAppButton";
import { FuahseLogo } from "./FuahseLogo";
import { api } from "../lib/api";

interface UserHomeProps {
  user: UserProfile | null;
  onNavigate: (tab: "home" | "submit" | "my-submissions" | "profile" | "admin") => void;
  onOpenAuth: (mode?: "login" | "register") => void;
}

export const UserHome: React.FC<UserHomeProps> = ({
  user,
  onNavigate,
  onOpenAuth,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [myRecentSubmissions, setMyRecentSubmissions] = useState<Submission[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => {
    api.getCategories().then((res) => {
      setCategories(res.categories.filter((c) => c.is_active));
    }).catch(console.error);

    if (user) {
      setLoadingRecent(true);
      api.getMySubmissions().then((res) => {
        setMyRecentSubmissions(res.submissions.slice(0, 3));
      }).catch(console.error).finally(() => setLoadingRecent(false));
    }
  }, [user]);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden">
      {/* ------------------------------------------------------------- */}
      {/* HERO SECTION - All in One Welcome & Status */}
      {/* ------------------------------------------------------------- */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-white border border-blue-100 p-5 sm:p-8 text-center space-y-4 sm:space-y-6 shadow-sm overflow-hidden w-full">
        {/* Soft Blue glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-b from-blue-100 via-sky-50 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Official FUAHSE Logo Emblem */}
        <div className="flex justify-center relative">
          <FuahseLogo size="xl" className="shadow-lg shadow-blue-900/10 rounded-full" />
        </div>

        {/* Live Pill & Follower Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>CAMPUS DISPATCH LIVE</span>
          </div>

          {user ? (
            <button
              type="button"
              onClick={() => onNavigate("profile")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold bg-blue-50 text-blue-950 border border-blue-200 hover:border-blue-400 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Badge: <strong className="text-blue-700">{user.follower_id}</strong></span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth("register")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Get Your Follower ID</span>
            </button>
          )}
        </div>

        {/* Branding & Subtitle */}
        <div className="space-y-1.5 relative">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-blue-950 tracking-tight leading-tight">
            FUAHSE_🅸🅽🆂🅸🅳🅴🆁
          </h1>
          <p className="text-sm sm:text-lg md:text-xl font-extrabold text-blue-700">
            The Campus Mirror 🪞💙
          </p>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed font-medium">
            Anonymous campus submissions, confessions, hot gossip, voice notes, and media directly reviewed and dispatched to our official WhatsApp Channel.
          </p>
        </div>

        {/* Action Grid (Submit, Track, Channel, Profile) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 max-w-3xl mx-auto pt-2 relative">
          <button
            type="button"
            id="btn-home-submit-content"
            onClick={() => onNavigate("submit")}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3.5 rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-md shadow-blue-600/20 active:scale-98 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 shrink-0" />
            <span className="truncate">Submit Story</span>
          </button>

          <button
            type="button"
            id="btn-home-my-submissions"
            onClick={() => {
              if (user) onNavigate("my-submissions");
              else onOpenAuth("login");
            }}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3.5 rounded-xl sm:rounded-2xl bg-white hover:bg-blue-50 text-blue-950 font-bold text-xs sm:text-sm border border-slate-200 hover:border-blue-300 active:scale-98 transition-all cursor-pointer shadow-xs"
          >
            <ListChecks className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">My Submissions</span>
          </button>

          <WhatsAppButton
            variant="primary"
            label="VISIT CHANNEL"
            className="w-full text-xs sm:text-sm py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl"
          />

          <button
            type="button"
            id="btn-home-my-profile"
            onClick={() => {
              if (user) onNavigate("profile");
              else onOpenAuth("register");
            }}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3.5 rounded-xl sm:rounded-2xl bg-white hover:bg-blue-50 text-blue-950 font-bold text-xs sm:text-sm border border-slate-200 hover:border-blue-300 active:scale-98 transition-all cursor-pointer shadow-xs"
          >
            <User className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">{user ? user.follower_id : "My Profile"}</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* QUICK STATUS TRACKER (IF LOGGED IN) */}
      {/* ------------------------------------------------------------- */}
      {user && myRecentSubmissions.length > 0 && (
        <div className="bg-white border border-blue-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs sm:text-sm font-bold text-blue-950 uppercase tracking-wider">
                Your Recent Submissions Tracker
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("my-submissions")}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              View All ({myRecentSubmissions.length}) &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {myRecentSubmissions.map((sub) => (
              <div
                key={sub.id}
                onClick={() => onNavigate("my-submissions")}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono text-slate-500 font-semibold">#{sub.id.slice(0, 8)}</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                    sub.status === "approved" || sub.status === "posted" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                    sub.status === "rejected" ? "bg-red-100 text-red-800 border border-red-200" :
                    "bg-blue-100 text-blue-800 border border-blue-200"
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <p className="text-xs text-slate-800 line-clamp-1 font-medium">
                  {sub.text_content || `[${(sub.submission_type || "text").toUpperCase()}] Submission`}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="text-blue-700 font-bold">{sub.category_name || "General"}</span>
                  <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1-TAP CATEGORIES & EXPLORER */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-blue-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600">
              Campus Topics
            </span>
            <h2 className="text-base sm:text-xl font-black text-blue-950">
              What Are You Submitting Today?
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("submit")}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            <span>Submit Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { name: "Gossip", icon: Flame, color: "text-red-500", bg: "bg-red-50 border-red-100", desc: "Hostel talk & rumors" },
            { name: "Relationship", icon: MessageSquareQuote, color: "text-pink-500", bg: "bg-pink-50 border-pink-100", desc: "Love & situationships" },
            { name: "Entertainment", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-50 border-amber-100", desc: "Events & trends" },
            { name: "Campus", icon: Radio, color: "text-blue-600", bg: "bg-blue-50 border-blue-100", desc: "Faculty & hostel life" },
            { name: "Celebrity", icon: Sparkle, color: "text-indigo-500", bg: "bg-indigo-50 border-indigo-100", desc: "Campus stars & VIPs" },
            { name: "Confession", icon: EyeOff, color: "text-purple-500", bg: "bg-purple-50 border-purple-100", desc: "Secret revelations" },
            { name: "News / Tip", icon: FileCheck2, color: "text-sky-500", bg: "bg-sky-50 border-sky-100", desc: "Exclusive news & alerts" },
            { name: "Other", icon: Send, color: "text-slate-500", bg: "bg-slate-50 border-slate-200", desc: "General messages" },
          ].map((item) => (
            <div
              key={item.name}
              onClick={() => onNavigate("submit")}
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl ${item.bg} border hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group select-none`}
            >
              <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.color} mb-1.5 group-hover:scale-110 transition-transform`} />
              <h4 className="text-xs sm:text-sm font-bold text-blue-950 group-hover:text-blue-700 transition-colors">
                {item.name}
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 100% ANONYMITY & PRIVACY SEPARATION PILLARS */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-blue-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-blue-950">100% Anonymous Identity</h3>
          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-medium">
            Editorial moderators only see your unique Follower ID (e.g. <strong className="text-blue-700">{user?.follower_id || "FOLLOWER-001"}</strong>). Your real identity is protected.
          </p>
        </div>

        <div className="bg-white border border-blue-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Mic className="w-5 h-5" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-blue-950">All Formats Supported</h3>
          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-medium">
            Instant voice notes, video clips, high-res photos, documents, and rich text submissions handled seamlessly.
          </p>
        </div>

        <div className="bg-white border border-blue-100 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-2 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Radio className="w-5 h-5" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-blue-950">Direct WhatsApp Sync</h3>
          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-medium">
            Approved campus gossip and hot stories are reviewed and posted directly to our official WhatsApp Channel.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* WHATSAPP CALLOUT CARD */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 border border-blue-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md text-white">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
            <Radio className="w-3 h-3 text-emerald-300" />
            Official Broadcast Channel
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            Join The WhatsApp Community Channel
          </h3>
          <p className="text-[11px] sm:text-xs text-blue-100 max-w-md">
            Never miss out on approved campus gossip, trending confessions, and breaking news.
          </p>
        </div>

        <WhatsAppButton variant="primary" label="VISIT CHANNEL" className="w-full sm:w-auto shrink-0 text-xs py-2.5 px-5" />
      </div>
    </div>
  );
};

