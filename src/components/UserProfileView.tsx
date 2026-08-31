import React, { useState } from "react";
import {
  User,
  Shield,
  Phone,
  MapPin,
  Calendar,
  Save,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { NIGERIAN_STATES, UserProfile } from "../types";
import { api, setUserToken } from "../lib/api";
import { WhatsAppButton } from "./WhatsAppButton";
import { FuahseTvCard } from "./FuahseTvCard";

interface UserProfileViewProps {
  user: UserProfile;
  onUpdateSuccess: (updated: UserProfile) => void;
  onLogout: () => void;
  onNavigateSubmissions: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  onUpdateSuccess,
  onLogout,
  onNavigateSubmissions,
}) => {
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState<number | "">(user.age);
  const [state, setState] = useState(user.state);
  const [whatsappNumber, setWhatsappNumber] = useState(user.whatsapp_number);

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyFollowerId = () => {
    navigator.clipboard.writeText(user.follower_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSaving(true);

    try {
      if (!name.trim()) throw new Error("Name cannot be empty");
      if (!age || Number(age) < 13 || Number(age) > 100) throw new Error("Age must be between 13 and 100");
      if (!whatsappNumber.trim()) throw new Error("WhatsApp number cannot be empty");

      const res = await api.updateProfile({
        name: name.trim(),
        age: Number(age),
        state: state.trim(),
        whatsapp_number: whatsappNumber.trim(),
      });

      onUpdateSuccess(res.profile);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 p-0.5 shadow-lg">
              <div className="w-full h-full bg-stone-950 rounded-[14px] flex items-center justify-center text-rose-400">
                <User className="w-8 h-8" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white">{user.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                  {user.account_status}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Registered on {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateSubmissions}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors"
            >
              My Submissions ({user.submission_count ?? 0})
            </button>
            <button
              type="button"
              id="btn-user-logout"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 text-xs font-bold border border-rose-500/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Permanent Follower ID Badge */}
        <div className="p-4 rounded-2xl bg-stone-950 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-stone-500">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>Permanent Anonymous Follower ID</span>
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-rose-400 tracking-wider mt-0.5">
              {user.follower_id}
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              This ID cannot be changed. It is your permanent badge across The Campus Mirror.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyFollowerId}
            className="self-start sm:self-center flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-bold text-stone-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy ID</span>
              </>
            )}
          </button>
        </div>

        {/* Feedback Messages */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                Age <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min={13}
                max={100}
                value={age}
                onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                State <span className="text-rose-400">*</span>
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 focus:outline-none focus:border-rose-500"
              >
                {NIGERIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                WhatsApp Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-sm text-stone-100 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 text-white font-bold text-xs tracking-wide shadow-lg shadow-rose-950/50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* FUAHSE TV 📺 WhatsApp Card */}
      <FuahseTvCard user={user} />

      {/* WhatsApp Community Box */}
      <div className="bg-stone-950/70 border border-emerald-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Stay Connected with The Campus Mirror
          </h4>
          <p className="text-xs text-stone-400 mt-1">
            Follow our verified WhatsApp channel to see published gossip, confessions, campus trends, and breaking campus stories.
          </p>
        </div>
        <WhatsAppButton variant="primary" className="shrink-0 w-full sm:w-auto" />
      </div>
    </div>
  );
};
