import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface Chapter {
  title: string;
  start_time: number;
  end_time: number | null;
}

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVideo: (url: string) => void;
  onAddPlaylist: (url: string) => void;
  videoData?: {
    id: string;
    title: string;
    chapters?: Chapter[];
  };
}

const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  onAddVideo,
  onAddPlaylist,
  videoData,
}) => {
  const [url, setUrl] = useState("");
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      window.document.body.appendChild(tag);
    }

    // API ready callback
    (window as any).onYouTubeIframeAPIReady = () => {
      if (playerContainerRef.current && videoData?.id) {
        playerRef.current = new window.YT.Player(playerContainerRef.current, {
          videoId: videoData.id,
          events: {
            onReady: () => console.log("Player ready"),
          },
        });
      }
    };
  }, [videoData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.includes("playlist")) {
      onAddPlaylist(url);
    } else {
      onAddVideo(url);
    }
    setUrl("");
  };

  const handleSeek = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, true);
      playerRef.current.playVideo();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-5xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        {/* URL input form */}
        <h2 className="text-2xl font-bold text-white mb-4">
          Add Video or Playlist
        </h2>
        <form onSubmit={handleSubmit} className="mb-6">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g., https://www.youtube.com/watch?v=..."
            className="w-full p-3 mb-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
          >
            Add
          </button>
        </form>

        {videoData && (
          <div className="flex gap-6">
            {/* Video Player */}
            <div className="flex-1 bg-gray-900 p-4 rounded-lg">
              <div
                ref={playerContainerRef}
                className="w-full h-[500px] rounded-lg"
              />
              <h2 className="text-xl font-semibold mt-4">{videoData.title}</h2>
            </div>

            {/* Chapters */}
            <div className="w-72 bg-gray-800 p-4 rounded-lg overflow-y-auto max-h-[500px]">
              <h3 className="text-lg font-bold mb-3">Chapters</h3>
              <ul className="space-y-2">
                {videoData.chapters?.map((ch, idx) => (
                  <li
                    key={idx}
                    className="p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
                    onClick={() => handleSeek(ch.start_time)}
                  >
                    {ch.title} (
                    {Math.floor(ch.start_time / 60)}:
                    {(ch.start_time % 60).toString().padStart(2, "0")})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoModal;
