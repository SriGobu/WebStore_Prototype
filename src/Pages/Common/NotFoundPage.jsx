import { useNavigate } from "react-router-dom";
import ROUTES from "../../Constants/routeConstants";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f5efe6] min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="font-bold text-[#c4956a] text-7xl mb-2">404</p>
        <p className="text-[#111] text-xl mb-2">Page not found</p>
        <p className="font-light text-[#767676] text-sm mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="bg-[#c4956a] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#b08560] transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
