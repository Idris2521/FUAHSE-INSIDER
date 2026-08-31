import React, { useState } from "react";
import { Tv, MessageCircle, ArrowUpRight, Sparkles, CheckCircle2, UserCheck, ShieldCheck } from "lucide-react";
import { UserProfile } from "../types";

interface FuahseTvCardProps {
  user: UserProfile | null;
  onOpenAuth?: (mode?: "login" | "register") => void;
  className?: string;
}

export const FUAHSE_TV_NUMBER = "2347089074837"; // 07089074837
export const FUAHSE_TV_DISPLAY_NUMBER = "07089074837";

export const FuahseTvCard: React.FC<FuahseTvCardProps> = ({
  user,
  onOpenAuth,
  className = "",
}) => {
  const [customName, setCustomName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);

  const effectiveName = user?.name?.trim() || customName.trim();

  const getWhatsAppUrl = (nameToUse: string) => {
    const cleanName = nameToUse.trim() || "Campus Follower";
    const message = `Hi, my name is ${cleanName} from FUAHSE Insider — The Campus Mirror. I’m saving your contact to receive your latest updates. Please save mine too.`;
    return `https://wa.me/${FUAHSE_TV_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If user is registered, open WhatsApp directly with their registered name
    if (user?.name) {
      window.open(getWhatsAppUrl(user.name), "_blank", "noopener,noreferrer");
      return;
    }

    // If not registered but custom name was entered
    if (customName.trim()) {
      window.open(getWhatsAppUrl(customName), "_blank", "noopener,noreferrer");
      return;
    }

    // If not logged in and no name typed yet, show quick name input or prompt
    setShowNameInput(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveName) return;
    window.open(getWhatsAppUrl(effectiveName), "_blank", "noopener,noreferrer");
  };

  return (
    <div
      id="fuahse-tv-whatsapp-card"
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white shadow-xl shadow-emerald-950/20 p-5 sm:p-7 transition-all ${className}`}
    >
      {/* Background glow ornaments */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left info column */}
        <div className="space-y-3 max-w-xl">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <Tv className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>FUAHSE TV 📺</span>
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-emerald-200 border border-white/10">
              <MessageCircle className="w-3 h-3 text-emerald-400" />
              <span>{FUAHSE_TV_DISPLAY_NUMBER}</span>
            </div>

            {user && (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/30 text-white border border-emerald-400/40">
                <UserCheck className="w-3 h-3 text-emerald-300" />
                <span>Syncing as: <strong className="text-emerald-200">{user.name}</strong></span>
              </div>
            )}
          </div>

          {/* Heading & Official Caption */}
          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Follow FUAHSE TV on WhatsApp</span>
              <span className="text-xl">📺</span>
            </h3>
            <p className="text-sm sm:text-base text-emerald-100/90 font-medium leading-relaxed">
              “Follow FUAHSE TV on WhatsApp. Save our contact to receive the latest updates, campus news and announcements.”
            </p>
          </div>

          {/* Live Message Preview snippet */}
          <div className="rounded-xl bg-black/30 border border-emerald-500/20 p-3 text-xs text-slate-300">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block mb-1">
              Automated Pre-Filled Message Preview:
            </span>
            <p className="italic font-mono text-[11px] text-emerald-100/80">
              “Hi, my name is <span className="font-bold text-emerald-300 underline">{user ? user.name : (customName.trim() || "[YOUR NAME]")}</span> from FUAHSE Insider — The Campus Mirror. I’m saving your contact to receive your latest updates. Please save mine too.”
            </p>
          </div>
        </div>

        {/* Right action column */}
        <div className="flex flex-col gap-3 min-w-[260px] sm:min-w-[280px]">
          {user ? (
            <button
              type="button"
              id="btn-open-fuahse-tv-whatsapp"
              onClick={handleCardClick}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 active:scale-98 transition-all cursor-pointer group"
            >
              <MessageCircle className="w-5 h-5 fill-slate-950/20 text-slate-950 group-hover:scale-110 transition-transform" />
              <span>Connect on WhatsApp</span>
              <ArrowUpRight className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          ) : showNameInput ? (
            <form onSubmit={handleFormSubmit} className="space-y-2 bg-black/40 p-3 rounded-xl border border-emerald-500/30">
              <label htmlFor="fuahse-tv-name-input" className="block text-[11px] font-bold text-emerald-300">
                Enter your name to connect:
              </label>
              <div className="flex gap-2">
                <input
                  id="fuahse-tv-name-input"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Idris Mohamed"
                  required
                  autoFocus
                  className="flex-1 bg-slate-900/90 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase cursor-pointer"
                >
                  Go
                </button>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowNameInput(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => onOpenAuth("register")}
                    className="text-[10px] text-emerald-400 hover:underline font-semibold"
                  >
                    Or Register Account &rarr;
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                id="btn-open-fuahse-tv-whatsapp-unauth"
                onClick={handleCardClick}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 active:scale-98 transition-all cursor-pointer group"
              >
                <MessageCircle className="w-5 h-5 fill-slate-950/20 text-slate-950 group-hover:scale-110 transition-transform" />
                <span>Chat with FUAHSE TV</span>
                <ArrowUpRight className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              {onOpenAuth && (
                <p className="text-center text-[11px] text-slate-400">
                  Have a badge?{" "}
                  <button
                    type="button"
                    onClick={() => onOpenAuth("login")}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    Log In
                  </button>{" "}
                  for automatic name sync.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-[11px] text-emerald-300/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Instant Contact Save & Announcement Broadcast</span>
          </div>
        </div>
      </div>
    </div>
  );
};
