import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import VideoModal from "../components/VideoModal";
import SignupModal from "../pages/SignupModal";
import LoginModal from "../pages/LoginModal";

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  progress: number;
  addedDate: string;
}

const Library: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const navigate = useNavigate();

  const handleAddVideo = (url: string) => {
    const videoId =
      url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)?.[1];
    if (videoId) {
      navigate(`/course/video/${videoId}`);
      setIsVideoModalOpen(false);
    }
  };

  const handleAddPlaylist = (url: string) => {
    const playlistId = url.match(/(?:youtube\.com\/playlist\?list=)([^&\n?#]+)/)?.[1];
    if (playlistId) {
      navigate(`/course/playlist/${playlistId}`);
      setIsVideoModalOpen(false);
    }
  };

  const handleAddVideoClick = () => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsVideoModalOpen(true);
    } else {
      setIsSignupModalOpen(true);
    }
  };

  const handleSignupSuccess = () => {
    setIsSignupModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    setIsVideoModalOpen(true);
  };

  return (
    <div className="flex-1 p-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">Hello, Tanishka 👋</h1>
        <button
          onClick={handleAddVideoClick}
          className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="mr-2" size={16} /> Add Video/Playlist
        </button>
      </div>

      <div className="bg-blue-900 bg-opacity-30 p-6 rounded-lg mb-10 flex justify-between items-center">
        <p className="text-blue-400">
          You're currently on the free plan. Upgrade to **Kozu+** for unlimited videos and playlists!
        </p>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
          Upgrade to Kozu+
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-16 text-center text-white flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
            <div className="text-4xl">📚</div>
          </div>
          <h3 className="text-xl font-semibold mb-3">Your Library is Empty</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Start by adding your first video or playlist to begin your learning journey
          </p>
          <button
            onClick={handleAddVideoClick}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
          >
            Add Your First Video
          </button>
        </div>
      ) : (
        <div>{/* Render your video list here */}</div>
      )}

      {/* Modals */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onAddVideo={handleAddVideo}
        onAddPlaylist={handleAddPlaylist}
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSuccess={handleSignupSuccess}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default Library;
