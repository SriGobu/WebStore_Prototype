import { useState } from "react";
import LegalModal from "../../../Components/Common/LegalModal";
import { LEGAL_CONTENT, ABOUT_CONTENT } from "../../../Constants/legalContent";
// ─── Legal content — sourced directly from TERMS_OF_SERVICE.md / PRIVACY_POLICY.md ──

// ─── Row on the main About & Legal page ──────────────────────────────────────

const ALL_LEGAL_CONTENT = {
  ...LEGAL_CONTENT,
  ...ABOUT_CONTENT,
};

function LegalRow({ icon, title, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-[#f5efe6] rounded-xl hover:bg-[#e8dfd4] transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <p className="font-medium text-[#111] text-sm">{title}</p>
      </div>
      <span className="text-[#c4956a] font-semibold shrink-0">→</span>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AboutLegal() {
  const [openDoc, setOpenDoc] = useState(null); // null | 'privacy' | 'terms' | 'about'

  return (
    <div className="space-y-6">
      <div className="bg-[#fafafa] rounded-xl shadow-md p-6">
        <h2 className="font-semibold text-[#111] text-lg mb-4">
          About & Legal
        </h2>
        <div className="space-y-2">
          <LegalRow
            icon="🔒"
            title="Privacy Policy"
            onClick={() => setOpenDoc("privacy")}
          />
          <LegalRow
            icon="📄"
            title="Terms of Service"
            onClick={() => setOpenDoc("terms")}
          />
          <LegalRow
            icon="ℹ️"
            title="About WebStore"
            onClick={() => setOpenDoc("about")}
          />
        </div>

        <div className="pt-6 mt-4 border-t border-[#e0d9d0]">
          <p className="font-light text-[#767676] text-xs text-center">
            WebStore v1.0.0 • © 2026 WebStore
          </p>
        </div>
      </div>

      {openDoc && (
        <LegalModal
          content={ALL_LEGAL_CONTENT[openDoc]}
          onClose={() => setOpenDoc(null)}
        />
      )}
    </div>
  );
}
