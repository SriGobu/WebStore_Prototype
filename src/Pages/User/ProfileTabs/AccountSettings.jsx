import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OtpInput from "../../../Components/Common/OtpInput";
import {
  updateName,
  initiateEmailChange,
  verifyEmailChange,
  resendEmailChangeOtp,
  deleteAccount,
} from "../../../Services/User/profileService";
import useAuthStore from "../../../Store/authStore";
import { logout } from "../../../Utils/logout";
import DeleteAccountModal from "../../../Components/User/DeleteAccountModal";
import ChangePasswordPanel from "../../../Components/Common/ChangePasswordPanel";

export default function AccountSettings({ onToast }) {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  // Name
  const [nameEdit, setNameEdit] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [nameSaving, setNameSaving] = useState(false);

  // Email
  const [emailStep, setEmailStep] = useState("idle"); // idle | form | otp
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [resending, setResending] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSaveName() {
    if (!name.trim()) return;
    setNameSaving(true);
    try {
      await updateName(name.trim());
      updateUser({ name: name.trim() });
      onToast("Name updated successfully");
      setNameEdit(false);
    } catch (err) {
      onToast(err.message || "Failed to update name");
    } finally {
      setNameSaving(false);
    }
  }

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
    if (!otp || otp.length !== 6) return;
    setEmailSaving(true);
    try {
      await verifyEmailChange(newEmail.trim(), otp);
      onToast("Email updated successfully. Please log in again.");
      logout(navigate, (msg) => onToast(msg));
      setEmailStep("idle");
      setNewEmail("");
      setOtp("");
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
      onToast("OTP resent to your new email");
    } catch (err) {
      onToast(err.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  }

  async function handleDeleteAccount(deleteContentToo) {
    setDeleting(true);
    try {
      await deleteAccount({ deleteContentToo });
      logout(navigate, (msg) => onToast(msg));
    } catch (err) {
      onToast(err.message || "Failed to delete account");
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  const [showPasswordPanel, setShowPasswordPanel] = useState(false); // NEW

  return (
    <div className="space-y-6">
      {/* Update Name */}
      <div className="bg-[#fafafa] rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-[#111] text-lg">
            Personal Information
          </h2>
          {!nameEdit && (
            <button
              onClick={() => setNameEdit(true)}
              className="bg-[#c4956a] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#b08560] transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="font-medium text-[#333] text-sm mb-1.5 block">
              Display Name
            </label>
            {nameEdit ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#f5efe6] border border-[#e0d9d0] rounded-xl px-4 py-2.5 text-sm text-[#111] focus:outline-none focus:border-[#c4956a] transition-colors"
              />
            ) : (
              <p className="text-[#111] text-sm">{user?.name}</p>
            )}
          </div>

          <div>
            <label className="font-medium text-[#333] text-sm mb-1.5 block">
              Email
            </label>
            <p className="text-[#111] text-sm">{user?.email}</p>
          </div>

          {nameEdit && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveName}
                disabled={nameSaving || !name.trim()}
                className="bg-[#c4956a] text-white px-6 py-2 rounded-xl text-sm hover:bg-[#b08560] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {nameSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setNameEdit(false);
                  setName(user?.name ?? "");
                }}
                className="bg-[#f5efe6] border border-[#e0d9d0] text-[#111] px-6 py-2 rounded-xl text-sm hover:bg-[#e8dfd4] transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Email */}
      <div className="bg-[#fafafa] rounded-xl shadow-md p-6">
        <h2 className="font-semibold text-[#111] text-lg mb-6">Change Email</h2>

        {emailStep === "idle" && (
          <div className="space-y-4">
            <p className="font-light text-[#767676] text-sm">
              Current email:{" "}
              <span className="text-[#111] font-medium">{user?.email}</span>
            </p>
            <button
              onClick={() => setEmailStep("form")}
              className="bg-[#c4956a] text-white px-6 py-2 rounded-xl text-sm hover:bg-[#b08560] transition-colors"
            >
              Change Email
            </button>
          </div>
        )}

        {emailStep === "form" && (
          <div className="space-y-4">
            <div>
              <label className="font-medium text-[#333] text-sm mb-1.5 block">
                New Email Address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter your new email"
                className="w-full bg-[#f5efe6] border border-[#e0d9d0] rounded-xl px-4 py-2.5 text-sm text-[#111] focus:outline-none focus:border-[#c4956a] transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleInitiateEmail}
                disabled={emailSaving || !newEmail.trim()}
                className="bg-[#c4956a] text-white px-6 py-2 rounded-xl text-sm hover:bg-[#b08560] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {emailSaving ? "Sending..." : "Send OTP"}
              </button>
              <button
                onClick={() => {
                  setEmailStep("idle");
                  setNewEmail("");
                }}
                className="bg-[#f5efe6] border border-[#e0d9d0] text-[#111] px-6 py-2 rounded-xl text-sm hover:bg-[#e8dfd4] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {emailStep === "otp" && (
          <div className="space-y-6">
            <p className="font-light text-[#767676] text-sm">
              An OTP has been sent to{" "}
              <span className="text-[#111] font-medium">{newEmail}</span>
            </p>
            <div>
              <label className="font-medium text-[#333] text-sm mb-3 block text-start">
                Enter OTP
              </label>
              <OtpInput
                value={otp}
                onChange={setOtp}
                disabled={emailSaving}
                align="left"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleVerifyEmail}
                disabled={emailSaving || otp.length !== 6}
                className="bg-[#c4956a] text-white px-6 py-2 rounded-xl text-sm hover:bg-[#b08560] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {emailSaving ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                onClick={handleResendOtp}
                disabled={resending}
                className="bg-[#f5efe6] border border-[#e0d9d0] text-[#111] px-6 py-2 rounded-xl text-sm hover:bg-[#e8dfd4] transition-colors disabled:opacity-40"
              >
                {resending ? "Resending..." : "Resend OTP"}
              </button>
              <button
                onClick={() => {
                  setEmailStep("idle");
                  setNewEmail("");
                  setOtp("");
                }}
                className="text-[#767676] text-sm hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password — NEW, same card style as the rest of this page */}
      <div className="bg-[#fafafa] rounded-xl shadow-md p-6">
        <h2 className="font-semibold text-[#111] text-lg mb-2">Password</h2>
        <p className="font-light text-[#767676] text-sm mb-4">
          Send a one-time code to your current email to set a new password.
        </p>
        <button
          onClick={() => setShowPasswordPanel(true)}
          className="bg-[#c4956a] text-white px-6 py-2 rounded-xl text-sm hover:bg-[#b08560] transition-colors"
        >
          Change Password
        </button>
      </div>

      {/* Danger Zone — unchanged */}

      {showPasswordPanel && (
        <ChangePasswordPanel
          onClose={() => setShowPasswordPanel(false)}
          onToast={onToast}
        />
      )}

      {/* Danger Zone */}
      <div className="bg-[#fafafa] rounded-xl shadow-md p-6 border border-red-100">
        <h2 className="font-semibold text-[#111] text-lg mb-2">Danger Zone</h2>
        <p className="font-light text-[#767676] text-sm mb-4">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="bg-red-500 text-white px-6 py-2 rounded-xl text-sm hover:bg-red-600 transition-colors"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Account Modal — toggle + data-handling explainer */}
      {showDeleteConfirm && (
        <DeleteAccountModal
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteAccount}
          deleting={deleting}
        />
      )}
    </div>
  );
}
