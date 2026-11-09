import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { renderAllWebsites } from "../../Services/User/websiteService";
import Header from "../../Components/User/Header";
import Footer from "../../Components/Common/Footer";
import Toast from "../../Components/Common/Toast";
import ROUTES from "../../Constants/routeConstants";
import FollowButton from "../../Components/Common/FollowButton";

export default function PublisherPage() {
  const { ownerName } = useParams();
  const decodedOwnerName = decodeURIComponent(ownerName ?? "");
  const navigate = useNavigate();

  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    async function fetchByDeveloper() {
      try {
        const res = await renderAllWebsites();
        const all = res.data.websites ?? [];
        setWebsites(all.filter((site) => site.ownerName === decodedOwnerName));
      } catch (err) {
        setToastMessage(err.message || "Failed to load developer's websites");
      } finally {
        setLoading(false);
      }
    }
    fetchByDeveloper();
  }, [decodedOwnerName]);
  
  const developerId = websites.length > 0 ? websites[0].ownerId : null;

  return (
    <div className="bg-[#f5efe6] min-h-screen w-full overflow-x-hidden flex flex-col">
      <Helmet>
        <title>{decodedOwnerName} — Developer on WebStore</title>
        <meta
          name="description"
          content={`Explore ${websites.length} website${websites.length === 1 ? "" : "s"} published by ${decodedOwnerName} on WebStore.`}
        />
        <meta property="og:title" content={`${decodedOwnerName} | WebStore`} />
        <meta property="og:type" content="profile" />
        <link
          rel="canonical"
          href={`https://www.webstore.sg247.dev/developer/${encodeURIComponent(decodedOwnerName)}`}
        />
      </Helmet>
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      <Header />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 w-full flex-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-light text-[#767676] mb-6">
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="hover:underline"
          >
            WebStore
          </button>
          <span>›</span>
          <span>{decodedOwnerName}</span>
        </div>

        {/* Developer header */}
        <div className="bg-[#fafafa] rounded-xl shadow-md p-6 mb-6 flex items-center gap-4">
          <div className="size-14 rounded-full bg-[#c4956a] flex items-center justify-center shrink-0">
            <span className="font-bold text-white text-xl">
              {decodedOwnerName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="font-semibold text-[#111] text-xl">
              {decodedOwnerName}
            </h1>
            <p className="font-light text-[#767676] text-sm">
              {loading
                ? "Loading..."
                : `${websites.length} website${websites.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <FollowButton developerId={developerId} />
        </div>

        {/* Websites grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="inline-block w-6 h-6 border-2 border-[#c4956a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : websites.length === 0 ? (
          <p className="font-light text-[#767676] text-sm text-center py-20">
            No websites found for this developer.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {websites.map((site) => (
              <button
                key={site._id}
                onClick={() => navigate(`/website/${site._id}`)}
                className="bg-[#fafafa] rounded-xl shadow-md p-4 flex items-center gap-3 text-left hover:shadow-lg transition-shadow"
              >
                <div className="size-12 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={site.icon?.url}
                    alt={site.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#111] text-sm truncate">
                    {site.name}
                  </p>
                  <p className="font-light text-[#767676] text-xs truncate capitalize">
                    {site.category}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
