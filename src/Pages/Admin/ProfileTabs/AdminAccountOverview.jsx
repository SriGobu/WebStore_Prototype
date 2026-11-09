import { ShieldCheck, Mail, Fingerprint } from "lucide-react";
import useAuthStore from "../../../Store/authStore";

export default function AdminAccountOverview() {
  const { user } = useAuthStore();
  const displayName =
    user?.name || user?.email?.split("@")[0] || "Administrator";

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#e8ddd2] p-5 flex items-center gap-4">
        <div className="size-14 rounded-full bg-[#334155] flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-lg">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#1a1a1a] truncate">
              {displayName}
            </h3>
            <span className="bg-[#334155] text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide">
              ADMIN
            </span>
          </div>
          <p className="text-[13px] text-[#888] flex items-center gap-1 mt-0.5">
            <Mail size={12} /> {user?.email || "—"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e8ddd2] p-4 space-y-3">
        <div className="flex items-center gap-2 text-[13px] text-[#333]">
          <ShieldCheck size={14} className="text-[#334155] shrink-0" />
          <span>
            Role:{" "}
            <span className="font-medium capitalize">
              {user?.role || "admin"}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-[#333]">
          <Fingerprint size={14} className="text-[#334155] shrink-0" />
          <span className="font-mono text-[12px] break-all">
            {user?.id || user?._id || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
