import React from "react";
import { User, Send, ListChecks, ShieldAlert, Sparkles, MessageCircle, LogIn } from "lucide-react";
import { UserProfile } from "../types";
import { WhatsAppButton } from "./WhatsAppButton";

interface HeaderProps {
  activeTab: "home" | "submit" | "my-submissions" | "profile" | "admin";
  onNavigate: (tab: "home" | "submit" | "my-submissions" | "profile" | "admin") => void;
  user: UserProfile | null;
  onOpenAuth: (mode?: "login" | "register") => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-md border-b border-stone-800/90 w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Brand / Logo Treatment */}
          <div
            id="brand-logo-container"
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none min-w-0 shrink"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-rose-600 via-red-600 to-amber-600 p-0.5 shadow-md shadow-rose-950/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-stone-950 rounded-[10px] flex items-center justify-center">
                <span className="font-mono font-black text-sm sm:text-base tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-300">
                  F_I
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <h1 className="text-xs sm:text-base md:text-lg font-black tracking-tight text-white group-hover:text-rose-400 transition-colors truncate max-w-[125px] xs:max-w-[170px] sm:max-w-none">
                  FUAHSE_🅸🅽🆂🅸🅳🅴🆁
                </h1>
                <span className="inline-flex items-center px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                  LIVE
                </span>
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-stone-400 tracking-wide truncate">
                The Campus Mirror
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-900/80 p-1.5 rounded-2xl border border-stone-800">
            <button
              type="button"
              id="nav-tab-home"
              onClick={() => onNavigate("home")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                activeTab === "home"
                  ? "bg-stone-800 text-white shadow-sm border border-stone-700"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/40"
              }`}
            >
              Home
            </button>
            <button
              type="button"
              id="nav-tab-submit"
              onClick={() => onNavigate("submit")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                activeTab === "submit"
                  ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm"
                  : "text-stone-300 hover:text-white hover:bg-stone-800/40"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Content</span>
            </button>
            <button
              type="button"
              id="nav-tab-my-submissions"
              onClick={() => {
                if (user) {
                  onNavigate("my-submissions");
                } else {
                  onOpenAuth("login");
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                activeTab === "my-submissions"
                  ? "bg-stone-800 text-white shadow-sm border border-stone-700"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/40"
              }`}
            >
              <ListChecks className="w-3.5 h-3.5 text-amber-400" />
              <span>My Submissions</span>
            </button>
            <button
              type="button"
              id="nav-tab-profile"
              onClick={() => {
                if (user) {
                  onNavigate("profile");
                } else {
                  onOpenAuth("register");
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                activeTab === "profile"
                  ? "bg-stone-800 text-white shadow-sm border border-stone-700"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/40"
              }`}
            >
              <User className="w-3.5 h-3.5 text-rose-400" />
              <span>{user ? user.follower_id : "My Profile"}</span>
            </button>
          </nav>

          {/* Right Action Area */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <WhatsAppButton variant="compact" label="Channel" className="text-[11px] px-2.5 py-1 sm:px-3.5 sm:py-1.5" />

            {user ? (
              <button
                type="button"
                id="btn-user-badge-header"
                onClick={() => onNavigate("profile")}
                className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-stone-900 border border-rose-500/40 hover:border-rose-500 text-[11px] sm:text-xs font-mono font-bold text-rose-400 transition-colors shadow-sm truncate max-w-[100px] xs:max-w-[130px] sm:max-w-none"
              >
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span className="truncate">{user.follower_id}</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-open-auth-header"
                onClick={() => onOpenAuth("register")}
                className="flex items-center gap-1 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden xs:inline">Log In</span>
              </button>
            )}

            {/* Admin Portal Toggle */}
            <button
              type="button"
              id="btn-admin-portal-header"
              onClick={() => onNavigate("admin")}
              title="Admin Portal"
              className={`p-1.5 sm:p-2.5 rounded-xl border transition-colors shrink-0 ${
                activeTab === "admin"
                  ? "bg-rose-950/60 border-rose-500/50 text-rose-400"
                  : "bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-between py-1.5 border-t border-stone-800/80 -mx-3 px-3 bg-stone-950/95 overflow-x-hidden gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className={`flex-1 py-1.5 text-center rounded-lg font-bold transition-colors ${
              activeTab === "home" ? "bg-stone-800 text-white shadow-inner" : "text-stone-400"
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => onNavigate("submit")}
            className={`flex-1 py-1.5 text-center rounded-lg font-bold transition-colors ${
              activeTab === "submit" ? "bg-rose-600 text-white" : "text-stone-300"
            }`}
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => {
              if (user) onNavigate("my-submissions");
              else onOpenAuth("login");
            }}
            className={`flex-1 py-1.5 text-center rounded-lg font-bold transition-colors truncate px-1 ${
              activeTab === "my-submissions" ? "bg-stone-800 text-white shadow-inner" : "text-stone-400"
            }`}
          >
            Track
          </button>
          <button
            type="button"
            onClick={() => {
              if (user) onNavigate("profile");
              else onOpenAuth("register");
            }}
            className={`flex-1 py-1.5 text-center rounded-lg font-bold transition-colors truncate px-1 ${
              activeTab === "profile" ? "bg-stone-800 text-white shadow-inner" : "text-stone-400"
            }`}
          >
            {user ? "ID" : "Account"}
          </button>
        </div>
      </div>
    </header>
  );
};

