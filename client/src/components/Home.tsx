import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Library from "./Library";
import Profile from "./Profile";
import Tasks from "./Tasks";

const Home: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<"library" | "profile" | "tasks">("library");
  //const [videos, setVideos] = useState<any[]>([]); // pass down to Tasks
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  return (
    <div className="flex bg-gray-900 text-white min-h-screen">
      <Sidebar onTabChange={setCurrentTab} />
      <div className="flex-1">
        {currentTab === "library" && <Library />}
        {currentTab === "profile" && <Profile />}
        {currentTab === "tasks" && (
          <Tasks onSelectVideo={setSelectedVideo} />
        )}
      </div>
    </div>
  );
};

export default Home;
