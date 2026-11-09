import api from "../../Config/axios";
import useAuthStore from "../../Store/authStore";

// Follow routes are mounted identically under both /user and /dev (same
// Controllers/Common/Follow.js on the backend) — pick the right prefix
// based on the currently logged-in role so this one service works for
// both User and Developer callers.
function rolePrefix() {
  const { user } = useAuthStore.getState();
  return user?.role === "developer" ? "/dev" : "/user";
}

export const followDeveloper = async (developerId) => {
  return await api.post(`${rolePrefix()}/follow/${developerId}`);
};

export const unfollowDeveloper = async (developerId) => {
  return await api.delete(`${rolePrefix()}/follow/${developerId}`);
};

export const getFollowStatus = async (developerId) => {
  return await api.get(`${rolePrefix()}/follow/${developerId}/status`);
};
