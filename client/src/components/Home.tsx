import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Library from "./Library";
import Profile from "./Profile";

const Home: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<"library" | "profile">("library");

  return (
    <div className="flex bg-gray-900 text-white min-h-screen">
      <Sidebar onTabChange={setCurrentTab} />
      <div className="flex-1">
        {currentTab === "library" && <Library />}
        {currentTab === "profile" && <Profile />}
      </div>
    </div>
  );
};

export default Home;
