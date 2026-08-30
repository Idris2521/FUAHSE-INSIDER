import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { UserHome } from "./components/UserHome";
import { SubmitContent } from "./components/SubmitContent";
import { MySubmissions } from "./components/MySubmissions";
import { UserProfileView } from "./components/UserProfileView";
import { AdminPortal } from "./components/AdminPortal";
import { AuthModal } from "./components/AuthModal";
import { WhatsAppButton } from "./components/WhatsAppButton";
import { UserProfile, WHATSAPP_CHANNEL_URL } from "./types";
import { api, getUserToken, setUserToken } from "./lib/api";
import { ShieldCheck, Heart, Radio, Lock } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "home" | "submit" | "my-submissions" | "profile" | "admin"
  >("home");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<"login" | "register">("register");
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Check user authentication session on mount
  useEffect(() => {
    const initUser = async () => {
      const token = getUserToken();
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.profile);
        } catch (err) {
          console.error("Session expired or invalid:", err);
          setUserToken(null);
          setUser(null);
        }
      }
      setLoadingInitial(false);
    };

    initUser();
  }, []);

  const handleOpenAuth = (mode: "login" | "register" = "register") => {
    setAuthModalInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (profile: UserProfile, token: string) => {
    setUserToken(token);
    setUser(profile);
  };

  const handleLogout = () => {
    setUserToken(null);
    setUser(null);
    if (activeTab === "my-submissions" || activeTab === "profile") {
      setActiveTab("home");
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Global Application Header */}
      <Header
        activeTab={activeTab}
        onNavigate={(tab) => setActiveTab(tab)}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === "home" && (
          <UserHome
            user={user}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenAuth={() => handleOpenAuth("register")}
          />
        )}

        {activeTab === "submit" && (
          <SubmitContent
            user={user}
            onOpenAuth={() => handleOpenAuth("register")}
            onNavigateMySubmissions={() => setActiveTab("my-submissions")}
          />
        )}

        {activeTab === "my-submissions" && (
          <MySubmissions
            user={user}
            onOpenAuth={() => handleOpenAuth("login")}
            onNavigateSubmit={() => setActiveTab("submit")}
          />
        )}

        {activeTab === "profile" && user && (
          <UserProfileView
            user={user}
            onUpdateSuccess={(updated) => setUser(updated)}
            onLogout={handleLogout}
            onNavigateSubmissions={() => setActiveTab("my-submissions")}
          />
        )}

        {activeTab === "admin" && (
          <AdminPortal onExitToPublic={() => setActiveTab("home")} />
        )}
      </main>

      {/* Global Modern Footer */}
      <footer className="border-t border-stone-900 bg-stone-950/80 py-10 px-4 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-stone-500">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-mono font-black text-sm text-stone-200">
                FUAHSE_🅸🅽🆂🅸🅳🅴🆁
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold text-[10px]">
                The Campus Mirror
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Anonymous campus content-submission platform connected to WhatsApp Channel.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className="hover:text-stone-300 transition-colors"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("submit")}
              className="hover:text-stone-300 transition-colors"
            >
              Submit Content
            </button>
            <button
              type="button"
              onClick={() => {
                if (user) setActiveTab("my-submissions");
                else handleOpenAuth("login");
              }}
              className="hover:text-stone-300 transition-colors"
            >
              My Submissions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className="hover:text-stone-300 transition-colors text-rose-400/80 font-bold"
            >
              Admin Portal
            </button>
          </div>

          <div className="flex items-center gap-3">
            <WhatsAppButton variant="compact" label="Join Channel" />
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-stone-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <span>&copy; {new Date().getFullYear()} FUAHSE_🅸🅽🆂🅸🅳🅴🆁. All rights reserved.</span>
            <span className="hidden sm:inline text-stone-700">•</span>
            <span className="text-rose-400/90 font-medium">Created by menmex social media management</span>
          </div>
          <div className="flex items-center gap-1.5 text-stone-400">
            <Lock className="w-3 h-3 text-stone-500 shrink-0" />
            <span>Strict Anonymous Submission Protocol Enforced</span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalInitialMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
