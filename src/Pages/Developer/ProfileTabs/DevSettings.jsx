import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import OtpInput from "../../../Components/Common/OtpInput";
import {
  updateName,
  initiateEmailChange,
  verifyEmailChange,
  resendEmailChangeOtp,
  deleteAccount,
} from "../../../Services/Developer/profileService";
import useAuthStore from "../../../Store/authStore";
import { logout } from "../../../Utils/logout";
import ChangePasswordPanel from "../../../Components/Common/ChangePasswordPanel";

export default function DevSettings({ onToast }) {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  // ── Name ──────────────────────────────────────────────────────────────────
  const [nameEdit, setNameEdit] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [nameSaving, setNameSaving] = useState(false);

  async function handleSaveName() {
    if (!name.trim()) return;
    setNameSaving(true);
    try {
      await updateName(name.trim());
      updateUser({ name: name.trim() });
      onToast("Name updated");
      setNameEdit(false);
    } catch (err) {
      onToast(err.message || "Failed to update name");
    } finally {
      setNameSaving(false);
    }
  }

  // ── Email ──────────────────────────────────────────────────────────────────
  const [emailStep, setEmailStep] = useState("idle"); // idle | form | otp
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleInitiateEmail() {
    if (!newEmail.trim()) return;
    setEmailSaving(true);
    try {
      await initiateEmailChange(newEmail.trim());
      setEmailStep("otp");
    } catch (err) {
      onToast(err.message || "Failed to initiate email change");
    } finally {
      setEmailSaving(false);
    }
  }

  async function handleVerifyEmail() {
    if (otp.length !== 6) return;
    setEmailSaving(true);
    try {
      await verifyEmailChange(newEmail.trim(), otp);
      onToast("Email updated. Please log in again.");
      logout(navigate);
    } catch (err) {
      onToast(err.message || "Invalid OTP");
      setEmailSaving(false);
    }
  }

  async function handleResendOtp() {
    setResending(true);
    try {
      await resendEmailChangeOtp(newEmail.trim());
      setOtp("");
      onToast("OTP resent");
    } catch (err) {
      onToast(err.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  }

  // ── Delete account ─────────────────────────────────────────────────────────
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function handleDeleteAccount() {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      // deleteContentToo: true — always delete everything for developer
      await deleteAccount({ deleteContentToo: true });
      logout(navigate);
    } catch (err) {
      onToast(err.message || "Failed to delete account");
      setDeleting(false);
    }
  }

  const inputCls =
    "w-full bg-[#f5efe6] border border-[#e0d9d0] rounded-xl px-4 py-2.5 text-sm text-[#1a1a1a] placeholder:text-[#b0a898] focus:outline-none focus:border-[#c4956a] transition-colors";

  const [showPasswordPanel, setShowPasswordPanel] = useState(false); // NEW

  return (
    <div className="space-y-4">
      {/* ── Personal info ── */}
      <div className="bg-white rounded-xl border border-[#e8ddd2] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#1a1a1a] text-[15px]">
            Personal Information
          </h3>
          {!nameEdit && (
            <button
              onClick={() => setNameEdit(true)}
              className="text-[12px] text-[#c4956a] hover:underline"
            >
              Edit
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-[#999] mb-1.5 block">
              Display Name
            </label>
            {nameEdit ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            ) : (
              <p className="text-[13px] text-[#1a1a1a] font-medium">
                {user?.name}
              </p>
            )}
          </div>

          <div>
            <label className="text-[12px] text-[#999] mb-1.5 block">
              Email
            </label>
            <p className="text-[13px] text-[#1a1a1a] font-medium">
              {user?.email}
            </p>
          </div>

          {nameEdit && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveName}
                disabled={nameSaving || !name.trim()}
                className="px-5 py-2 bg-[#c4956a] text-white rounded-xl text-[13px] font-medium hover:bg-[#b08560] transition-colors disabled:opacity-40"
              >
                {nameSaving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => {
                  setNameEdit(false);
                  setName(user?.name ?? "");
                }}
                className="px-5 py-2 bg-[#f5efe6] border border-[#e0d9d0] text-[#555] rounded-xl text-[13px] hover:bg-[#e8dfd4] transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Change email ── */}
      <div className="bg-white rounded-xl border border-[#e8ddd2] p-5">
        <h3 className="font-semibold text-[#1a1a1a] text-[15px] mb-4">
          Change Email
        </h3>

        {emailStep === "idle" && (
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-[#888]">
              Current:{" "}
              <span className="text-[#1a1a1a] font-medium">{user?.email}</span>
            </p>
            <button
              onClick={() => setEmailStep("form")}
              className="px-4 py-1.5 text-[12px] bg-[#c4956a] text-white rounded-lg hover:bg-[#b08560] transition-colors"
            >
              Change
            </button>
          </div>
        )}

        {emailStep === "form" && (
          <div className="space-y-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="New email address"
              className={inputCls}
            />
            <div className="flex gap-2">
              <button
                onClick={handleInitiateEmail}
                disabled={emailSaving || !newEmail.trim()}
                className="px-5 py-2 bg-[#c4956a] text-white rounded-xl text-[13px] font-medium hover:bg-[#b08560] disabled:opacity-40 transition-colors"
              >
                {emailSaving ? "Sending…" : "Send OTP"}
              </button>
              <button
                onClick={() => {
                  setEmailStep("idle");
                  setNewEmail("");
                }}
                className="px-5 py-2 bg-[#f5efe6] border border-[#e0d9d0] text-[#555] rounded-xl text-[13px] hover:bg-[#e8dfd4] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {emailStep === "otp" && (
          <div className="space-y-4">
            <p className="text-[12px] text-[#888]">
              OTP sent to{" "}
              <span className="text-[#1a1a1a] font-medium">{newEmail}</span>
            </p>
            <OtpInput
              value={otp}
              onChange={setOtp}
              disabled={emailSaving}
              align="left"
            />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleVerifyEmail}
                disabled={emailSaving || otp.length !== 6}
                className="px-5 py-2 bg-[#c4956a] text-white rounded-xl text-[13px] font-medium hover:bg-[#b08560] disabled:opacity-40 transition-colors"
              >
                {emailSaving ? "Verifying…" : "Verify"}
              </button>
              <button
                onClick={handleResendOtp}
                disabled={resending}
                className="px-5 py-2 bg-[#f5efe6] border border-[#e0d9d0] text-[#555] rounded-xl text-[13px] hover:bg-[#e8dfd4] disabled:opacity-40 transition-colors"
              >
                {resending ? "Resending…" : "Resend OTP"}
              </button>
              <button
                onClick={() => {
                  setEmailStep("idle");
                  setNewEmail("");
                  setOtp("");
                }}
                className="text-[12px] text-[#999] hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password — NEW, matches this page's compact card style */}
      <div className="bg-white rounded-xl border border-[#e8ddd2] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#1a1a1a] text-[15px] mb-1">
              Password
            </h3>
            <p className="text-[12px] text-[#888]">
              Send an OTP to your email to set a new password.
            </p>
          </div>
          <button
            onClick={() => setShowPasswordPanel(true)}
            className="px-4 py-1.5 text-[12px] bg-[#c4956a] text-white rounded-lg hover:bg-[#b08560] transition-colors shrink-0"
          >
            Change
          </button>
        </div>
      </div>

      {/* ── Danger zone ── */}

      {showPasswordPanel && (
        <ChangePasswordPanel
          onClose={() => setShowPasswordPanel(false)}
          onToast={onToast}
        />
      )}

      <div className="bg-white rounded-xl border border-red-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <h3 className="font-semibold text-red-600 text-[15px]">
            Danger Zone
          </h3>
        </div>
        <p className="text-[12px] text-[#888] mb-4 leading-relaxed">
          Permanently delete your developer account. This will remove all your
          websites, reviews, replies, wishlist and audit logs. This cannot be
          undone.
        </p>
        <button
          onClick={() => setShowDelete(true)}
          className="px-5 py-2 bg-red-500 text-white rounded-xl text-[13px] font-medium hover:bg-red-600 transition-colors"
        >
          Delete Account
        </button>
      </div>

      {/* ── Delete confirmation modal ── */}
      {showDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="size-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <h3 className="font-semibold text-[#1a1a1a] text-base text-center mb-1">
              Delete Developer Account?
            </h3>
            <p className="text-[12px] text-[#888] text-center mb-5 leading-relaxed">
              All your websites, reviews, replies and data will be permanently
              deleted. Type{" "}
              <span className="font-bold text-red-500">DELETE</span> to confirm.
            </p>

            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full border border-[#e0d9d0] rounded-xl px-4 py-2.5 text-sm text-center focus:outline-none focus:border-red-400 transition-colors mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDelete(false);
                  setConfirmText("");
                }}
                disabled={deleting}
                className="flex-1 py-2 bg-[#f5efe6] border border-[#e0d9d0] rounded-xl text-[#555] text-sm hover:bg-[#e8dfd4] disabled:opacity-40 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || confirmText !== "DELETE"}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-40 transition-colors"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
