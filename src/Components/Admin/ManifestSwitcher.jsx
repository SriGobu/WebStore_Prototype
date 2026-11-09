import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ManifestSwitcher() {
  const location = useLocation();

  useEffect(() => {
    const manifestLink = document.getElementById("app-manifest");
    if (location.pathname === "/admin/login") {
      manifestLink.href = "/manifestAdmin.json";
    } else {
      manifestLink.href = "/manifest.json";
    }
  }, [location.pathname]);

  return null;
}

export default ManifestSwitcher;
