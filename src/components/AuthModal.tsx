import React, { useState } from "react";
import { X, UserPlus, LogIn, Sparkles, CheckCircle2, Copy, Check, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { NIGERIAN_STATES, UserProfile } from "../types";
import { api, setUserToken } from "../lib/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (profile: UserProfile, token?: string) => void;
  onAuthSuccess?: (profile: UserProfile, token?: string) => void;
  onRegistrationComplete?: () => void;
  initialMode?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onAuthSuccess,
  onRegistrationComplete,
  initialMode = "register",
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registration form
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [state, setState] = useState("Lagos");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [password, setPassword] = useState("");

  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Post-Registration Success Step
  const [newFollower, setNewFollower] = useState<UserProfile | null>(null);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const notifyAuthSuccess = (profile: UserProfile, token?: string) => {
    if (token) {
      setUserToken(token);
    }
    if (onAuthSuccess) onAuthSuccess(profile, token);
    if (onSuccess) onSuccess(profile, token);
  };

  if (!isOpen) return null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f43f5e", "#10b981", "#3b82f6", "#f59e0b"],
      });
    } catch (_) {}
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!name.trim()) throw new Error("Please enter your name");
      if (!age || Number(age) < 13 || Number(age) > 100) throw new Error("Please enter a valid age between 13 and 100");
      if (!whatsappNumber.trim()) throw new Error("Please enter your WhatsApp number");
      if (!password || password.length < 6) throw new Error("Password must be at least 6 characters");

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
      // Immediately notify app about user authentication
      notifyAuthSuccess(res.profile, res.token);
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
      if (!loginIdentifier.trim()) throw new Error("Enter your Follower ID or WhatsApp number");
      if (!loginPassword) throw new Error("Enter your account password");

      const res = await api.login(loginIdentifier.trim(), loginPassword);
      setUserToken(res.token);
      notifyAuthSuccess(res.profile, res.token);
      onClose();
    } catch (err: any) {
      setError(err.message || "Login failed. Invalid credentials.");
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
      notifyAuthSuccess(newFollower, registrationToken || undefined);
      if (onRegistrationComplete) {
        onRegistrationComplete();
      }
      onClose();
      setNewFollower(null);
      setRegistrationToken(null);
    }
  };

  const handleModalClose = () => {
    if (newFollower) {
      notifyAuthSuccess(newFollower, registrationToken || undefined);
      if (onRegistrationComplete) {
        onRegistrationComplete();
      }
      setNewFollower(null);
      setRegistrationToken(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleModalClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: Follower ID Generation Success Display Screen */}
        {/* ------------------------------------------------------------- */}
        {newFollower ? (
          <div className="text-center py-4 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Account Created
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                YOUR UNIQUE FOLLOWER ID
              </h2>
              <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                Keep this safe. All your submissions are identified strictly by this anonymous badge.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-950 border border-rose-500/40 relative group">
              <div className="text-xs uppercase tracking-widest font-mono text-stone-500 mb-1">
                Permanent Follower Identifier
              </div>
              <div className="font-mono text-3xl sm:text-4xl font-extrabold text-rose-400 tracking-wider">
                {newFollower.follower_id}
              </div>

              <button
                type="button"
                onClick={handleCopyFollowerId}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-bold text-stone-300 transition-colors"
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

            <div className="text-left bg-stone-950/60 p-4 rounded-xl border border-stone-800 text-xs text-stone-400 space-y-1.5">
              <div className="font-bold text-stone-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Privacy & Anonymity Guarantee:
              </div>
              <p>
                Content administrators will only see <strong className="text-white">{newFollower.follower_id}</strong>. Your real name and WhatsApp number are strictly protected on the backend.
              </p>
            </div>

            <button
              type="button"
              id="btn-continue-after-register"
              onClick={handleFinishRegistration}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-rose-950/50 transition-all active:scale-98"
            >
              <span>Continue to Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* Login & Registration Tabs */
          /* ------------------------------------------------------------- */
          <div>
            <div className="flex items-center gap-2 border-b border-stone-800 pb-4 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                  mode === "register"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-950/40"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/40"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Register</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all ${
                  mode === "login"
                    ? "bg-stone-800 text-white border border-stone-700 shadow-md"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/40"
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            {mode === "register" ? (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                    Your Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samuel Adeleke"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                      Age <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={13}
                      max={100}
                      placeholder="e.g. 21"
                      value={age}
                      onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                      State <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    >
                      {NIGERIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                    WhatsApp Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 08012345678 or +2348012345678"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    No WhatsApp OTP verification code will be sent.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                    Create Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-rose-950/50 transition-all active:scale-98 cursor-pointer"
                >
                  {loading ? "Generating Follower ID..." : "Register & Get Follower ID"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                    Follower ID or WhatsApp Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FOLLOWER-001 or 08012345678"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Your account password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white font-extrabold text-sm tracking-wide border border-stone-700 transition-all active:scale-98 cursor-pointer"
                >
                  {loading ? "Signing In..." : "Log In to Account"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
