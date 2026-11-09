import { useRef, useEffect } from "react";

/**
 * OtpInput
 *
 * Reusable 6-digit OTP entry — 6 individual boxes, one per digit.
 * Auto-advances focus as you type, backspace navigates back,
 * arrow keys move between boxes, paste fills all boxes at once.
 *
 * Props:
 * - value: string (e.g. "" | "123" | "123456")
 * - onChange: (newValue: string) => void
 * - length: number (default 6)
 * - disabled: boolean
 * - autoFocus: boolean (default true)
 * - align: 'center' | 'left' (default 'center')
 *   — use 'left' inside forms to align with other form inputs
 *   — use 'center' for standalone OTP screens (EmailVerify, ForgotPassword)
 */
export default function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
  align = "center",
}) {
  const inputRefs = useRef([]);

  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // defensive coercion — never crashes regardless of what caller passes
  const safeValue =
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? value.join("")
        : "";

  const digits = safeValue.split("").slice(0, length);
  while (digits.length < length) digits.push("");

  function setDigit(index, char) {
    const next = [...digits];
    next[index] = char;
    onChange(next.join(""));
  }

  function handleChange(index, e) {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    setDigit(index, char);
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setDigit(index, "");
      } else if (index > 0) {
        setDigit(index - 1, "");
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div
      className={`flex gap-3 ${
        align === "left" ? "justify-start" : "justify-center"
      }`}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          placeholder="•"
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-12 h-12 border-2 border-[#D4C4B0] rounded-lg text-xl font-semibold text-center bg-[#F9F6F3] text-[#2d2d2d] placeholder-[#D4C4B0] focus:outline-none focus:border-[#B8956A] focus:bg-white focus:ring-2 focus:ring-[#B8956A]/10 disabled:bg-[#F0EDE8] disabled:cursor-not-allowed transition-all"
        />
      ))}
    </div>
  );
}
