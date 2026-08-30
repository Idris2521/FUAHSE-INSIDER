import React from "react";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_CHANNEL_URL } from "../types";

interface WhatsAppButtonProps {
  variant?: "primary" | "secondary" | "compact";
  className?: string;
  label?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  variant = "primary",
  className = "",
  label = "VISIT CHANNEL",
}) => {
  const handleClick = () => {
    window.open(WHATSAPP_CHANNEL_URL, "_blank", "noopener,noreferrer");
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        id="btn-whatsapp-channel-compact"
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-emerald-600/30 active:scale-95 ${className}`}
      >
        <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
        <span>{label}</span>
      </button>
    );
  }

  if (variant === "secondary") {
    return (
      <button
        type="button"
        id="btn-whatsapp-channel-secondary"
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 hover:border-emerald-400 active:scale-98 ${className}`}
      >
        <MessageCircle className="w-4 h-4 text-emerald-400" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      id="btn-whatsapp-channel-primary"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-extrabold text-sm tracking-wider uppercase transition-all duration-200 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/40 hover:shadow-emerald-600/40 active:scale-98 cursor-pointer ${className}`}
    >
      <div className="p-1 rounded-lg bg-black/20">
        <MessageCircle className="w-4 h-4 text-white fill-white/20" />
      </div>
      <span>{label}</span>
    </button>
  );
};
