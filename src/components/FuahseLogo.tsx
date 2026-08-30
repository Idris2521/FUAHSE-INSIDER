import React from "react";

interface FuahseLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
  showText?: boolean;
}

export const FuahseLogo: React.FC<FuahseLogoProps> = ({
  size = "md",
  className = "",
  showText = false,
}) => {
  const sizeMap = {
    xs: "w-7 h-7",
    sm: "w-9 h-9",
    md: "w-11 h-11",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
    hero: "w-32 h-32 sm:w-40 sm:h-40",
  };

  const dimension = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`relative ${dimension} rounded-full shrink-0 shadow-md shadow-blue-900/15 overflow-hidden bg-white border border-blue-200 transition-transform duration-200 hover:scale-105 select-none`}>
        <img
          src="/logo.svg"
          alt="FUAHSE Insider - The Campus Mirror Logo"
          className="w-full h-full object-contain"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm sm:text-base tracking-tight text-blue-950">
              FUAHSE_🅸🅽🆂🅸🅳🅴🆁
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
              LIVE
            </span>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 tracking-wide">
            The Campus Mirror
          </span>
        </div>
      )}
    </div>
  );
};
