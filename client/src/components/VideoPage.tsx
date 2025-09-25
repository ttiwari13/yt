import React, { useRef, useEffect, useState } from "react";

interface Chapter {
  title: string;
  start_time: number;
  end_time: number | null;
}

interface Video {
  id: string;
  title: string;
  url: string;
  chapters?: Chapter[];
}

interface VideoPageProps {
  video: Video;
  onBack: () => void;
}

const VideoPage: React.FC<VideoPageProps> = ({ video, onBack }) => {
  const playerRef = useRef<any>(null);
  const [progress, setProgress] = useState(0);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
    (window as any).onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player("yt-player", {
        videoId: video.id,
        events: {
          onStateChange: (e: any) => {
            if (e.data === (window as any).YT.PlayerState.PLAYING) {
              const interval = setInterval(() => {
                const current = playerRef.current.getCurrentTime();
                const duration = playerRef.current.getDuration();
                setProgress((current / duration) * 100);
              }, 1000);
              return () => clearInterval(interval);
            }
          },
        },
      });
    };
  }, [video.id]);

  const seekTo = (time: number) => {
    playerRef.current.seekTo(time, true);
  };

  return (
    <div className="flex flex-col p-6 bg-gray-900 text-white min-h-screen">
      <button onClick={onBack} className="mb-4 text-blue-500">← Back to Library</button>
      <h1 className="text-3xl font-bold mb-4">{video.title}</h1>
      <div className="flex gap-6">
        <div className="flex-1">
          <div id="yt-player" className="w-full h-[500px] mb-2"></div>
          <div className="h-2 bg-gray-700 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <div className="w-72 bg-gray-800 p-4 rounded-lg overflow-y-auto max-h-[500px]">
          <h2 className="text-lg font-bold mb-3">Chapters</h2>
          <ul className="space-y-2">
            {video.chapters?.map((ch, idx) => (
              <li
                key={idx}
                className="p-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
                onClick={() => seekTo(ch.start_time)}
              >
                {ch.title} ({Math.floor(ch.start_time / 60)}:{(ch.start_time % 60).toString().padStart(2, "0")})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
