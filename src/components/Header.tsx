import React from "react";
import { User, Send, ListChecks, ShieldAlert, Sparkles, MessageCircle, LogIn } from "lucide-react";
import { UserProfile } from "../types";
import { WhatsAppButton } from "./WhatsAppButton";
import { FuahseLogo } from "./FuahseLogo";

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-xs w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Brand / Logo Treatment */}
          <div
            id="brand-logo-container"
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none min-w-0 shrink"
          >
            <FuahseLogo size="md" className="shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <h1 className="text-xs sm:text-base md:text-lg font-black tracking-tight text-blue-950 group-hover:text-blue-700 transition-colors truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">
                  FUAHSE_🅸🅽🆂🅸🅳🅴🆁
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                  LIVE
                </span>
              </div>
              <p className="text-[10px] sm:text-xs font-semibold text-blue-600 tracking-wide truncate">
                The Campus Mirror 🪞💙
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              id="nav-tab-home"
              onClick={() => onNavigate("home")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                activeTab === "home"
                  ? "bg-white text-blue-950 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-blue-900 hover:bg-white/60"
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
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-blue-900 hover:bg-white/80 font-bold"
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
                  ? "bg-white text-blue-950 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-blue-900 hover:bg-white/60"
              }`}
            >
              <ListChecks className="w-3.5 h-3.5 text-blue-600" />
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
                  ? "bg-white text-blue-950 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-blue-900 hover:bg-white/60"
              }`}
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
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
                className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-blue-50 border border-blue-200 hover:border-blue-400 text-[11px] sm:text-xs font-mono font-bold text-blue-900 transition-colors shadow-xs truncate max-w-[100px] xs:max-w-[130px] sm:max-w-none"
              >
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
                <span className="truncate">{user.follower_id}</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-open-auth-header"
                onClick={() => onOpenAuth("register")}
                className="flex items-center gap-1 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 transition-colors shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-600" />
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
                  ? "bg-blue-600 border-blue-700 text-white shadow-xs"
                  : "bg-slate-100 border-slate-200 text-slate-600 hover:text-blue-900 hover:bg-slate-200"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-between py-1.5 border-t border-slate-200 -mx-3 px-3 bg-white overflow-x-hidden gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className={`flex-1 py-1.5 text-center rounded-lg font-bold transition-colors ${
              activeTab === "home" ? "bg-blue-50 text-blue-900 font-black" : "text-slate-600"
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => onNavigate("submit")}
            className={`flex-1 py-1.5 text-center rounded-lg font-bold transition-colors ${
              activeTab === "submit" ? "bg-blue-600 text-white" : "text-slate-700"
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
              activeTab === "my-submissions" ? "bg-blue-50 text-blue-900 font-black" : "text-slate-600"
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
              activeTab === "profile" ? "bg-blue-50 text-blue-900 font-black" : "text-slate-600"
            }`}
          >
            {user ? "ID" : "Account"}
          </button>
        </div>
      </div>
    </header>
  );
};

