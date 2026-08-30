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
      <div className="relative rounded-2xl sm:rounded-3xl bg-stone-900/90 border border-stone-800 p-4 sm:p-8 text-center space-y-4 sm:space-y-6 shadow-2xl overflow-hidden w-full">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-b from-rose-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Live Pill & Follower Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>CAMPUS DISPATCH LIVE</span>
          </div>

          {user ? (
            <button
              type="button"
              onClick={() => onNavigate("profile")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold bg-stone-950 text-stone-300 border border-stone-800 hover:border-rose-500/50 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Badge: <strong className="text-rose-400">{user.follower_id}</strong></span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth("register")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-rose-400" />
              <span>Get Your Follower ID</span>
            </button>
          )}
        </div>

        {/* Branding & Subtitle */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            FUAHSE_🅸🅽🆂🅸🅳🅴🆁
          </h1>
          <p className="text-sm sm:text-lg md:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-300 to-amber-300">
            The Campus Mirror
          </p>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed">
            Anonymous campus submissions, confessions, gossip, and news directly connected to WhatsApp Channel.
          </p>
        </div>

        {/* Action Grid (Submit, Track, Channel, Profile) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 max-w-3xl mx-auto pt-2">
          <button
            type="button"
            id="btn-home-submit-content"
            onClick={() => onNavigate("submit")}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-md shadow-rose-950/50 active:scale-98 transition-all cursor-pointer"
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
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl sm:rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs sm:text-sm border border-stone-700 active:scale-98 transition-all cursor-pointer"
          >
            <ListChecks className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">My Submissions</span>
          </button>

          <WhatsAppButton
            variant="primary"
            label="VISIT CHANNEL"
            className="w-full text-xs sm:text-sm py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl"
          />

          <button
            type="button"
            id="btn-home-my-profile"
            onClick={() => {
              if (user) onNavigate("profile");
              else onOpenAuth("register");
            }}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl sm:rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs sm:text-sm border border-stone-700 active:scale-98 transition-all cursor-pointer"
          >
            <User className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate">{user ? user.follower_id : "My Profile"}</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* QUICK STATUS TRACKER (IF LOGGED IN) */}
      {/* ------------------------------------------------------------- */}
      {user && myRecentSubmissions.length > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Your Recent Submissions Tracker
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("my-submissions")}
              className="text-xs font-bold text-rose-400 hover:text-rose-300"
            >
              View All ({myRecentSubmissions.length}) &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {myRecentSubmissions.map((sub) => (
              <div
                key={sub.id}
                onClick={() => onNavigate("my-submissions")}
                className="p-3 rounded-xl bg-stone-950 border border-stone-800 hover:border-stone-700 cursor-pointer transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono text-stone-400">#{sub.id.slice(0, 8)}</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                    sub.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    sub.status === "rejected" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                    "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <p className="text-xs text-stone-300 line-clamp-1 font-medium">
                  {sub.text_content || `[${sub.type.toUpperCase()}] Submission`}
                </p>
                <div className="flex items-center justify-between text-[10px] text-stone-500">
                  <span className="text-rose-400 font-bold">{sub.category}</span>
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
      <div className="bg-stone-900 border border-stone-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400">
              Campus Topics
            </span>
            <h2 className="text-base sm:text-xl font-black text-white">
              What Are You Submitting Today?
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("submit")}
            className="flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300"
          >
            <span>Submit Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { name: "Gossip", icon: Flame, color: "text-rose-400", desc: "Hostel talk & rumors" },
            { name: "Relationship", icon: MessageSquareQuote, color: "text-pink-400", desc: "Love & situationships" },
            { name: "Entertainment", icon: Sparkles, color: "text-amber-400", desc: "Events & trends" },
            { name: "Campus", icon: Radio, color: "text-emerald-400", desc: "Faculty & hostel life" },
            { name: "Celebrity", icon: Sparkle, color: "text-yellow-400", desc: "Campus stars & VIPs" },
            { name: "Confession", icon: EyeOff, color: "text-purple-400", desc: "Secret revelations" },
            { name: "News / Tip", icon: FileCheck2, color: "text-sky-400", desc: "Exclusive news & alerts" },
            { name: "Other", icon: Send, color: "text-stone-400", desc: "General messages" },
          ].map((item) => (
            <div
              key={item.name}
              onClick={() => onNavigate("submit")}
              className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-stone-950 border border-stone-800 hover:border-rose-500/40 transition-all cursor-pointer group select-none"
            >
              <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.color} mb-1.5 group-hover:scale-110 transition-transform`} />
              <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                {item.name}
              </h4>
              <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 100% ANONYMITY & PRIVACY SEPARATION PILLARS */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <EyeOff className="w-5 h-5" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white">100% Anonymous Identity</h3>
          <p className="text-[11px] sm:text-xs text-stone-400 leading-relaxed">
            Content moderators only see your unique Follower ID (e.g. <strong className="text-rose-400">{user?.follower_id || "FOLLOWER-027"}</strong>). Real names are never exposed.
          </p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Mic className="w-5 h-5" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white">All Formats Supported</h3>
          <p className="text-[11px] sm:text-xs text-stone-400 leading-relaxed">
            Share texts, screenshots, viral video clips, or record live voice notes with in-app microphone.
          </p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white">Direct WhatsApp Sync</h3>
          <p className="text-[11px] sm:text-xs text-stone-400 leading-relaxed">
            Approved campus gossip and hot stories are formatted and broadcast directly to our official WhatsApp Channel.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* WHATSAPP CALLOUT CARD */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-stone-900 to-teal-950/90 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Radio className="w-3 h-3 text-emerald-400" />
            Official Broadcast Channel
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            Join The WhatsApp Community Channel
          </h3>
          <p className="text-[11px] sm:text-xs text-stone-300 max-w-md">
            Never miss out on approved campus gossip, trending confessions, and breaking news.
          </p>
        </div>

        <WhatsAppButton variant="primary" label="VISIT CHANNEL" className="w-full sm:w-auto shrink-0 text-xs py-2.5 px-5" />
      </div>
    </div>
  );
};

