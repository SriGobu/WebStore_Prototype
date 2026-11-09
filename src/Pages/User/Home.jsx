import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/User/Header";
import CategoryPills from "../../Components/User/CategoryPills";
import useWebsiteStore from "../../Store/websiteStore";
import Footer from "../../Components/Common/Footer";
import {
  getUniqueCategories,
  filterByCategory,
} from "../../Utils/categoryUtils";
import WebsiteCard from "../../Components/User/WebsiteCard";

function Home() {
  const navigate = useNavigate();
  const { websites, fetchWebsites } = useWebsiteStore();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = getUniqueCategories(websites);
  const filteredApps = filterByCategory(websites, selectedCategory);

  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  return (
    <div className="bg-[#f5efe6] min-h-screen w-full flex flex-col">
      <Header />
      <main className="max-w-[1440px] w-full mx-auto px-8 py-10 flex-1">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="font-semibold text-[#111] text-3xl mb-3">
            Explore Websites
          </h1>
          <p className="text-[#767676] text-sm mb-8">
            Discover curated tools, services and productivity websites
          </p>
          {/* Category Filters */}
          <CategoryPills
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>
        {/* App Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredApps.map((app) => (
            <WebsiteCard
              key={app._id}
              app={app}
              onClick={() => navigate(`/website/${app._id}`)}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Home;
