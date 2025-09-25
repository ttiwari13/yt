import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import SignupModal from "../pages/SignupModal";
import LoginModal from "../pages/LoginModal";
import API from "../api";

interface Chapter {
  title: string;
  start_time: number;
  end_time: number | null;
}

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  progress: number;
  addedDate: string;
  chapters?: Chapter[];
}

const Library: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [isAddingVideo, setIsAddingVideo] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState("");

  const navigate = useNavigate();

  const handleAddVideo = async (url: string) => {
    try {
      const res = await API.post("/videos/add", { youtubeUrl: url });
      const { videoId } = res.data;

      const videoRes = await API.get(`/videos/${videoId}`);
      const videoData = videoRes.data;

      const newVideo: Video = {
        id: videoData.videoId || videoData.youtube_id,
        title: videoData.title,
        url: `https://www.youtube.com/watch?v=${videoData.youtube_id}`,
        thumbnail: videoData.thumbnail_url,
        duration: videoData.duration,
        progress: 0,
        addedDate: videoData.published_at,
        chapters: videoData.chapters,
      };

      setVideos((prev) => [...prev, newVideo]);
      setSelectedVideo(newVideo);
      setIsAddingVideo(false);
      setVideoUrlInput("");
    } catch (err) {
      console.error(err);
      alert("Failed to add video");
    }
  };

  const handleAddPlaylist = (url: string) => {
    const playlistId = url.match(/(?:youtube\.com\/playlist\?list=)([^&\n?#]+)/)?.[1];
    if (playlistId) {
      navigate(`/course/playlist/${playlistId}`);
      setIsAddingVideo(false);
      setVideoUrlInput("");
    }
  };

  const handleAddVideoClick = () => {
    const token = localStorage.getItem("token");
    if (!token) setIsSignupModalOpen(true);
    else setIsAddingVideo(true);
  };

  const handleSignupSuccess = () => {
    setIsSignupModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    setIsAddingVideo(true);
  };

  const VideoPage: React.FC<{ video: Video; onBack: () => void }> = ({ video, onBack }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [deadline, setDeadline] = useState<string>("");

    const handleChapterClick = (time: number) => {
      const iframe: HTMLIFrameElement | null = document.querySelector("#youtube-player");
      if (iframe) {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "seekTo", args: [time, true] }),
          "*"
        );
      }
      setCurrentTime(time);
    };

    const daysLeft = deadline
      ? Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <div className="flex-1 p-10">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
        >
          Back to Library
        </button>
        <h1 className="text-3xl font-bold mb-4">{video.title}</h1>
        <div className="flex gap-6">
          <div className="flex-1">
            <iframe
              id="youtube-player"
              className="w-full h-[500px] rounded-lg mb-4"
              src={`https://www.youtube.com/embed/${video.id}?enablejsapi=1`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <p>Progress: {Math.floor(video.progress * 100)}%</p>
            <div className="mt-4">
              <label className="mr-2">Set Deadline:</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="px-2 py-1 rounded-lg text-black"
              />
              {daysLeft !== null && <span className="ml-4">Days left: {daysLeft}</span>}
            </div>
          </div>

          {video.chapters && (
            <div className="w-72 bg-gray-800 p-4 rounded-lg overflow-y-auto max-h-[500px]">
              <h3 className="text-lg font-bold mb-3">Chapters</h3>
              <ul className="space-y-2">
                {video.chapters.map((ch, idx) => (
                  <li
                    key={idx}
                    className="p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
                    onClick={() => handleChapterClick(ch.start_time)}
                  >
                    {ch.title} ({Math.floor(ch.start_time / 60)}:
                    {(ch.start_time % 60).toString().padStart(2, "0")})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex bg-gray-900 min-h-screen text-white">
      {selectedVideo ? (
        <VideoPage video={selectedVideo} onBack={() => setSelectedVideo(null)} />
      ) : (
        <div className="flex-1 p-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Hello, Tanishka </h1>
            <button
              onClick={handleAddVideoClick}
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="mr-2" size={16} /> Add Video/Playlist
            </button>
          </div>

          {isAddingVideo && (
            <div className="flex gap-2 mb-6">
              <input
                type="url"
                placeholder="Paste YouTube video or playlist URL"
                className="flex-1 px-3 py-2 rounded-lg text-black"
                value={videoUrlInput}
                onChange={(e) => setVideoUrlInput(e.target.value)}
              />
              <button
                onClick={() => {
                  if (videoUrlInput.includes("playlist")) handleAddPlaylist(videoUrlInput);
                  else handleAddVideo(videoUrlInput);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              >
                Add
              </button>
              <button
                onClick={() => setIsAddingVideo(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-white"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Free plan banner */}
          <div className="bg-blue-900 bg-opacity-30 p-6 rounded-lg mb-10 flex justify-between items-center">
            <p className="text-blue-400">
              You're currently on the free plan. Upgrade to **Kozu+** for unlimited videos and playlists!
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors">
              Upgrade to Kozu+
            </button>
          </div>

          {/* Empty Library */}
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
            <div>
              {videos.map((v, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gray-800 rounded-lg mb-4 cursor-pointer hover:bg-gray-700"
                  onClick={() => setSelectedVideo(v)}
                >
                  <h2 className="font-semibold">{v.title}</h2>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
