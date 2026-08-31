import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { UserHome } from "./components/UserHome";
import { SubmitContent } from "./components/SubmitContent";
import { MySubmissions } from "./components/MySubmissions";
import { UserProfileView } from "./components/UserProfileView";
import { AdminPortal } from "./components/AdminPortal";
import { AuthModal } from "./components/AuthModal";
import { AuthGateway } from "./components/AuthGateway";
import { WhatsAppButton } from "./components/WhatsAppButton";
import { UserProfile, WHATSAPP_CHANNEL_URL } from "./types";
import { api, getUserToken, setUserToken } from "./lib/api";
import { ShieldCheck, Heart, Radio, Lock, Loader2 } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "home" | "submit" | "my-submissions" | "profile" | "admin"
  >("home");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<"login" | "register">("login");
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Check user authentication session on mount
  useEffect(() => {
    const initUser = async () => {
      const token = getUserToken();
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.profile);
        } catch {
          // Token is expired, invalid, or belongs to a cleared session
          setUserToken(null);
          setUser(null);
        }
      }
      setLoadingInitial(false);
    };

    initUser();
  }, []);

  const handleOpenAuth = (mode: "login" | "register" = "login") => {
    setAuthModalInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (profile: UserProfile, token?: string) => {
    if (token) {
      setUserToken(token);
    }
    setUser(profile);
  };

  const handleRegistrationComplete = () => {
    setActiveTab("home");
  };

  const handleLogout = () => {
    setUserToken(null);
    setUser(null);
    setActiveTab("home");
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-300">Loading FUAHSE Insider...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
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
        {/* If user is not authenticated and not on admin portal, present Login Interface First */}
        {!user && activeTab !== "admin" ? (
          <AuthGateway
            initialMode="login"
            onAuthSuccess={(profile, token) => {
              handleAuthSuccess(profile, token);
              setActiveTab("home");
            }}
            onNavigateAdmin={() => setActiveTab("admin")}
          />
        ) : (
          <>
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
                onSubmissionComplete={() => setActiveTab("my-submissions")}
                onNavigateHome={() => setActiveTab("home")}
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
          </>
        )}
      </main>

      {/* Global Modern Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 px-4 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-mono font-black text-sm text-blue-950">
                FUAHSE_🅸🅽🆂🅸🅳🅴🆁
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] border border-blue-200">
                The Campus Mirror 🪞💙
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Anonymous campus content-submission platform connected to WhatsApp Channel.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab("home")}
              className="hover:text-blue-600 transition-colors"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("submit")}
              className="hover:text-blue-600 transition-colors"
            >
              Submit Content
            </button>
            <button
              type="button"
              onClick={() => {
                if (user) setActiveTab("my-submissions");
                else handleOpenAuth("login");
              }}
              className="hover:text-blue-600 transition-colors"
            >
              My Submissions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className="hover:text-blue-700 transition-colors text-blue-600 font-bold"
            >
              Admin Portal
            </button>
          </div>

          <div className="flex items-center gap-3">
            <WhatsAppButton variant="compact" label="Join Channel" />
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <span>&copy; {new Date().getFullYear()} FUAHSE_🅸🅽🆂🅸🅳🅴🆁. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="text-blue-700 font-semibold">Created by menmex social media management</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Lock className="w-3 h-3 text-blue-600 shrink-0" />
            <span>Strict Anonymous Submission Protocol Enforced</span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalInitialMode}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onSuccess={handleAuthSuccess}
        onRegistrationComplete={handleRegistrationComplete}
      />
    </div>
  );
}
