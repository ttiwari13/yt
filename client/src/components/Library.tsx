import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import SignupModal from "../pages/SignupModal";
import LoginModal from "../pages/LoginModal";
import API from "../api"; 
import axios from 'axios'; 
import { useVideos, type Video } from "../context/videoContext"; 
import VideoPage from "./VideoPage"; 

const Library: React.FC = () => {
    const { videos, fetchVideos } = useVideos();
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null); 
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isAddingVideo, setIsAddingVideo] = useState(false);
    const [videoUrlInput, setVideoUrlInput] = useState("");
    const navigate = useNavigate();

    const handleAddVideo = async (url: string) => {
        try {
            const res = await API.post("/api/videos/add", { youtubeUrl: url }); 
            const { videoId } = res.data; 

            const videoRes = await API.get(`/api/videos/${videoId}`);
            const videoData = videoRes.data; 

            await fetchVideos(); 
            const userVideoData = videos.find(v => v.youtube_id === videoId);

            const newVideo: Video = {
                id: userVideoData?.id || videoData.id, 
                youtube_id: videoId,
                title: videoData.title,
                url: `https://www.youtube.com/watch?v=${videoId}`, 
                thumbnail_url: videoData.thumbnail_url,
                duration: videoData.duration,
                
                progress: userVideoData?.progress || 0, 
                currentTimestamp: userVideoData?.currentTimestamp || 0, 
                
                chapters: videoData.chapters, 
                current_timestamp: userVideoData?.current_timestamp || 0, 
                added_at: userVideoData?.added_at || videoData.published_at, 
                addedDate: userVideoData?.addedDate || videoData.published_at, 
            };
            
            setSelectedVideo(newVideo); 
            setIsAddingVideo(false);
            setVideoUrlInput("");
            
        } catch (err) {
            console.error("Error adding video:", err);
            let message = "Failed to add video. Check URL or network.";
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                message = err.response.data.message;
            }
            alert(message);
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
        fetchVideos();
    };
    const handleSelectVideo = async (v: Video) => {
        if (!v.chapters || v.chapters.length === 0 || !v.chapters[0].title) {
            try {
                const videoRes = await API.get(`/api/videos/${v.youtube_id}`);
                const videoData = videoRes.data; 

                const detailedVideo: Video = {
                    ...v,
                    chapters: videoData.chapters,
                };
                setSelectedVideo(detailedVideo);
                return;
            } catch (error) {
                console.error("Failed to fetch detailed video chapters:", error);
            }
        }
        setSelectedVideo(v);
    };

    return (
        <div className="flex bg-gray-900 min-h-screen text-white">
            {selectedVideo ? (
                <VideoPage 
                    video={selectedVideo} 
                    onBack={() => {
                        setSelectedVideo(null);
                        fetchVideos();
                    }} 
                />
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

                    {videos.length === 0 ? (
                        <div className="text-white">Your Library is Empty.</div>
                    ) : (
                        <div>
                            {videos.map((v) => (
                                <div
                                    key={v.id}
                                    className="p-4 bg-gray-800 rounded-lg mb-4 cursor-pointer hover:bg-gray-700"
                                    onClick={() => handleSelectVideo(v)} 
                                >
                                    <div className="flex justify-between items-center">
                                        <h2 className="font-semibold">{v.title}</h2>
                                        <div className="text-sm text-gray-400">
                                            Progress: {Math.floor((v.progress || 0) * 100)}%
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${(v.progress || 0) * 100}%` }}
                                        ></div>
                                    </div>
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