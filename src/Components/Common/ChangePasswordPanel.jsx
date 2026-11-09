// Components/Common/ChangePasswordPanel.jsx
import ChangePasswordFlow from "./ChangePasswordFlow";
import useAuthStore from "../../Store/authStore";

export default function ChangePasswordPanel({ onClose, onToast }) {
  const { user } = useAuthStore();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm">
        <ChangePasswordFlow
          mode="embedded"
          initialEmail={user.email}
          requireEmailStep={false}
          onToast={onToast}
          onDone={() => {
            onToast("Password changed successfully");
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
