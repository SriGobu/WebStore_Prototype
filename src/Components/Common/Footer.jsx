import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LegalModal from "./LegalModal";
import { LEGAL_CONTENT } from "../../Constants/legalContent";

function Footer() {
  const navigate = useNavigate();
  const [openDoc, setOpenDoc] = useState(null); // null | 'privacy' | 'terms'

  return (
    <>
      <footer className="bg-[#d4c4b0] py-5 sm:py-6">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row gap-2 sm:gap-0 justify-center sm:justify-between items-center text-center sm:text-left">
          <p className="text-[#111] text-[11px] sm:text-xs order-2 sm:order-1">
            © 2026 WebStore by SG'Works. All rights reserved.
          </p>
          <div className="flex items-center gap-3 sm:gap-4 order-1 sm:order-2">
            <button
              onClick={() => setOpenDoc("terms")}
              className="text-[#111] text-[11px] sm:text-xs hover:underline"
            >
              Terms
            </button>
            <span className="text-[#111] text-[11px] sm:text-xs">·</span>
            <button
              onClick={() => setOpenDoc("privacy")}
              className="text-[#111] text-[11px] sm:text-xs hover:underline"
            >
              Privacy
            </button>
            <span className="text-[#111] text-[11px] sm:text-xs">·</span>
            <button
              onClick={() => navigate("/profile?section=support")}
              className="text-[#111] text-[11px] sm:text-xs hover:underline"
            >
              Contact
            </button>
          </div>
        </div>
      </footer>

      {openDoc && (
        <LegalModal
          content={LEGAL_CONTENT[openDoc]}
          onClose={() => setOpenDoc(null)}
        />
      )}
    </>
  );
}

export default Footer;
