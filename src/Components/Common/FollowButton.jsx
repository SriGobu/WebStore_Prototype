import { useEffect, useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import {
  followDeveloper,
  unfollowDeveloper,
  getFollowStatus,
} from "../../Services/Common/followService";

export default function FollowButton({ developerId }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    let cancelled = false;
    if (!developerId) return;
    getFollowStatus(developerId)
      .then((res) => {
        if (!cancelled) setIsFollowing(res.data.isFollowing);
      })
      .catch(() => {}); // not logged in, or self-view — button stays in default state
    return () => {
      cancelled = true;
    };
  }, [developerId]);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await unfollowDeveloper(developerId);
      } else {
        await followDeveloper(developerId);
      }
      setIsFollowing((v) => !v);
    } catch (err) {
      console.error("Follow toggle failed:", err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
        isFollowing
          ? "bg-[#f5efe6] border border-[#e0d9d0] text-[#111] hover:bg-[#e8dfd4]"
          : "bg-[#c4956a] text-white hover:bg-[#b08560]"
      }`}
    >
      {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
