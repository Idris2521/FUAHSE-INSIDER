import React, { useState } from "react";
import {
  UserPlus,
  LogIn,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Lock,
  Tv,
  MessageCircle,
  Eye,
  EyeOff,
  User,
  Phone,
  MapPin,
  Calendar,
  KeyRound
} from "lucide-react";
import confetti from "canvas-confetti";
import { NIGERIAN_STATES, UserProfile } from "../types";
import { api, setUserToken } from "../lib/api";
import { FuahseLogo } from "./FuahseLogo";
import { FUAHSE_TV_DISPLAY_NUMBER } from "./FuahseTvCard";

interface AuthGatewayProps {
  onAuthSuccess: (profile: UserProfile, token?: string) => void;
  onNavigateAdmin: () => void;
  initialMode?: "login" | "register";
}

export const AuthGateway: React.FC<AuthGatewayProps> = ({
  onAuthSuccess,
  onNavigateAdmin,
  initialMode = "login",
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Registration state
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [state, setState] = useState("Lagos");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [password, setPassword] = useState("");

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Post-Registration Success Step
  const [newFollower, setNewFollower] = useState<UserProfile | null>(null);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#2563eb", "#10b981", "#3b82f6", "#f59e0b", "#6366f1"],
      });
    } catch (_) {}
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!name.trim()) throw new Error("Please enter your full name");
      if (!age || Number(age) < 13 || Number(age) > 100)
        throw new Error("Please enter a valid age between 13 and 100");
      if (!whatsappNumber.trim())
        throw new Error("Please enter your WhatsApp phone number");
      if (!password || password.length < 6)
        throw new Error("Password must be at least 6 characters long");

      const res = await api.register({
        name: name.trim(),
        age: Number(age),
        state: state.trim(),
        whatsapp_number: whatsappNumber.trim(),
        password,
      });

      setUserToken(res.token);
      setRegistrationToken(res.token);
      setNewFollower(res.profile);
      triggerConfetti();
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!loginIdentifier.trim())
        throw new Error("Enter your Follower ID (e.g. FOLLOWER-001) or WhatsApp number");
      if (!loginPassword)
        throw new Error("Enter your account password");

      const res = await api.login(loginIdentifier.trim(), loginPassword);
      setUserToken(res.token);
      onAuthSuccess(res.profile, res.token);
    } catch (err: any) {
      setError(err.message || "Login failed. Invalid Follower ID or Password.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFollowerId = () => {
    if (newFollower) {
      navigator.clipboard.writeText(newFollower.follower_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFinishRegistration = () => {
    if (newFollower) {
      onAuthSuccess(newFollower, registrationToken || undefined);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 px-6 py-6 text-white text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-2.5">
              <FuahseLogo size="lg" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-1.5">
              <span>FUAHSE_🅸🅽🆂🅸🅳🅴🆁</span>
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm font-semibold mt-0.5">
              The Campus Mirror 🪞💙
            </p>
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-white/10 text-blue-100 text-[11px] font-medium border border-white/10">
              <Lock className="w-3 h-3 text-blue-400" />
              <span>Campus Community Authentication Gateway</span>
            </div>
          </div>
        </div>

        {/* Inner Card Body */}
        <div className="p-6 sm:p-8">
          {/* ------------------------------------------------------------- */}
          {/* SUCCESS SCREEN (AFTER REGISTRATION) */}
          {/* ------------------------------------------------------------- */}
          {newFollower ? (
            <div className="text-center py-2 space-y-6 animate-fadeIn">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Account Created Successfully
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  YOUR UNIQUE FOLLOWER ID
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Save this badge ID. It connects all your submissions while preserving your anonymity.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 text-white border border-blue-500/40 relative">
                <div className="text-[10px] uppercase tracking-widest font-mono text-blue-300 mb-1">
                  Permanent Follower Identifier
                </div>
                <div className="font-mono text-3xl sm:text-4xl font-extrabold text-blue-400 tracking-wider">
                  {newFollower.follower_id}
                </div>

                <button
                  type="button"
                  onClick={handleCopyFollowerId}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Follower ID</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-left bg-blue-50/80 p-4 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-950">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Confidential Submission Protocol:
                </div>
                <p className="text-slate-600">
                  Your identity is protected. Content moderators will only see <strong className="text-blue-950">{newFollower.follower_id}</strong> on submitted stories.
                </p>
              </div>

              <button
                type="button"
                id="btn-gateway-enter-platform"
                onClick={handleFinishRegistration}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-98"
              >
                <span>Enter FUAHSE Insider Front Page</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* ------------------------------------------------------------- */
            /* LOGIN & REGISTER FORMS */
            /* ------------------------------------------------------------- */
            <div>
              {/* Tab Selector: Log In (First) vs Register */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6 border border-slate-200">
                <button
                  type="button"
                  id="tab-gateway-login"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                    mode === "login"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-blue-950 hover:bg-white/60"
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </button>

                <button
                  type="button"
                  id="tab-gateway-register"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer ${
                    mode === "register"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-blue-950 hover:bg-white/60"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* --------------------------------------------------------- */}
              {/* LOGIN FORM (PRIMARY FIRST INTERFACE) */}
              {/* --------------------------------------------------------- */}
              {mode === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Follower ID or WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        id="input-login-identifier"
                        placeholder="e.g. FOLLOWER-001 or 08012345678"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-mono"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        id="input-login-password"
                        placeholder="Enter your account password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-3"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-gateway-login"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>Verifying Credentials...</span>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Log In & Enter Front Page</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-xs text-slate-500">
                      New to FUAHSE Insider?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("register");
                          setError(null);
                        }}
                        className="text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        Create your account here &rarr;
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                /* --------------------------------------------------------- */
                /* REGISTRATION FORM */
                /* --------------------------------------------------------- */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        id="input-register-name"
                        placeholder="e.g. Samuel Adeleke"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Age <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          id="input-register-age"
                          min={13}
                          max={100}
                          placeholder="e.g. 21"
                          value={age}
                          onChange={(e) =>
                            setAge(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        State <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={state}
                          id="select-register-state"
                          onChange={(e) => setState(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        >
                          {NIGERIAN_STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        id="input-register-whatsapp"
                        placeholder="e.g. 08012345678"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Used for automated FUAHSE TV updates and submission queries.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Create Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        id="input-register-password"
                        minLength={6}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-gateway-register"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>Generating Follower ID...</span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Register & Get Follower ID</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-xs text-slate-500">
                      Already registered?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("login");
                          setError(null);
                        }}
                        className="text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        Log in with your Follower ID &rarr;
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Bottom Footer Actions */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              id="btn-gateway-admin-login"
              onClick={onNavigateAdmin}
              className="text-slate-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Admin Portal Login</span>
            </button>

            <div className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <Tv className="w-3 h-3 text-emerald-600" />
              <span>FUAHSE TV: {FUAHSE_TV_DISPLAY_NUMBER}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
