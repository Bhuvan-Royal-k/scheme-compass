"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function LanguageSelector() {
  const { lang, changeLanguage } = useLanguage();

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <select
        value={lang}
        onChange={(e) => changeLanguage(e.target.value)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          backgroundColor: "#ffffff",
          color: "#0d2b55",
          border: "1.5px solid #cbd5e1",
          borderRadius: "8px",
          padding: "6px 28px 6px 12px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          outline: "none",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          transition: "all 0.2s ease",
        }}
        aria-label="Select Language"
      >
        <option value="en">🌐 English</option>
        <option value="kn">🌐 ಕನ್ನಡ (Kannada)</option>
        <option value="ta">🌐 தமிழ் (Tamil)</option>
        <option value="hi">🌐 हिन्दी (Hindi)</option>
      </select>
      <span
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          fontSize: "10px",
          color: "#64748b",
        }}
      >
        ▼
      </span>
    </div>
  );
}
