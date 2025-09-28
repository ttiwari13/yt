import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import SignupModal from "../pages/SignupModal";
import LoginModal from "../pages/LoginModal";
import API from "../api";
import axios from 'axios';
import { useVideos, type Video } from "../context/videoContext";
import { useAuth } from '../context/authContext';
import VideoPage from "./VideoPage";
const formatTime = (totalSeconds: number) => {
    if (!totalSeconds || totalSeconds < 0) return "0:00";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
        // Show HH:MM:SS format when hours are present
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        // Show MM:SS format when no hours
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
};

const getHiddenVideos = (): Set<string> => {
    try {
        const hidden = localStorage.getItem('hiddenVideos');
        return hidden ? new Set(JSON.parse(hidden)) : new Set();
    } catch (error) {
        console.error('Error reading hidden videos from localStorage:', error);
        return new Set();
    }
};

const setHiddenVideos = (hiddenVideos: Set<string>): void => {
    try {
        localStorage.setItem('hiddenVideos', JSON.stringify([...hiddenVideos]));
    } catch (error) {
        console.error('Error saving hidden videos to localStorage:', error);
    }
};

const Library: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const userName = user?.username || user?.username || "Learner";

    const { videos, fetchVideos } = useVideos();
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isAddingVideo, setIsAddingVideo] = useState(false);
    const [videoUrlInput, setVideoUrlInput] = useState("");
    const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
    const [hiddenVideos, setHiddenVideosState] = useState<Set<string>>(getHiddenVideos());
    
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem("token");
    const visibleVideos = videos.filter(video => !hiddenVideos.has(video.id));
    const handleSaveDeadline = useCallback((videoId: string, date: string) => {
        console.log(`[API MOCK] Saving deadline for video ${videoId}: ${date}`);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchVideos();
        }
    }, [isAuthenticated, fetchVideos]);
    useEffect(() => {
        setHiddenVideosState(getHiddenVideos());
    }, []);

    const updateHiddenVideos = (newHiddenVideos: Set<string>) => {
        setHiddenVideosState(newHiddenVideos);
        setHiddenVideos(newHiddenVideos);
    };

    const handleDeleteVideo = async (videoId: string, youtubeId: string, event: React.MouseEvent) => {
        event.stopPropagation(); 
        
        if (!confirm("Are you sure you want to remove this video from your library view?")) {
            return;
        }

        setDeletingVideoId(videoId);
        setTimeout(() => {
            const newHiddenVideos = new Set(hiddenVideos).add(videoId);
            updateHiddenVideos(newHiddenVideos);
            setDeletingVideoId(null);
        }, 500);
    };

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
            const newHiddenVideos = new Set(hiddenVideos);
            newHiddenVideos.delete(newVideo.id);
            updateHiddenVideos(newHiddenVideos);
            
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
        if (!isAuthenticated) setIsSignupModalOpen(true);
        else setIsAddingVideo(true);
    };

    const handleSignupSuccess = () => {
        setIsSignupModalOpen(false);
    };

    const handleLoginSuccess = () => {
        setIsLoginModalOpen(false);
        setIsAddingVideo(true);
    };

    const switchToLogin = () => {
        setIsSignupModalOpen(false);
        setIsLoginModalOpen(true);
    };

    const switchToSignup = () => {
        setIsLoginModalOpen(false);
        setIsSignupModalOpen(true);
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

    if (authLoading) {
        return (
            <div className="flex bg-gray-900 min-h-screen text-white items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return (
            <div className="flex bg-gray-900 min-h-screen text-white items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-6">Welcome to Kozmic</h1>
                    <p className="text-gray-400 mb-8">Please sign in to access your video library</p>
                    <div className="space-x-4">
                        <button
                            onClick={() => setIsLoginModalOpen(true)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setIsSignupModalOpen(true)}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                        >
                            Sign Up
                        </button>
                    </div>

                </div>

                <SignupModal
                    isOpen={isSignupModalOpen}
                    onClose={() => setIsSignupModalOpen(false)}
                    onSuccess={handleSignupSuccess}
                    onSwitchToLogin={switchToLogin}
                />
                <LoginModal
                    isOpen={isLoginModalOpen}
                    onClose={() => setIsLoginModalOpen(false)}
                    onSuccess={handleLoginSuccess}
                    onSwitchToSignup={switchToSignup}
                />
            </div>
        );
    }
    
    return (
        <div className="flex bg-gray-900 min-h-screen text-white">
            {selectedVideo ? (
                <VideoPage
                    video={selectedVideo}
                    onBack={() => {
                        setSelectedVideo(null);
                        fetchVideos();
                    }}
                    onSaveDeadline={handleSaveDeadline}
                />
            ) : (
                <div className="flex-1 p-10">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold">Hello, {userName}</h1>
                        
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

                    {visibleVideos.length === 0 ? (
                        <div className="text-white">Your Library is Empty.</div>
                    ) : (
                        <div>
                            {visibleVideos.map((v) => (
                                <div
                                    key={v.id}
                                    className="p-4 bg-gray-800 rounded-lg mb-4 cursor-pointer hover:bg-gray-700 group relative"
                                    onClick={() => handleSelectVideo(v)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-4">
                                            <h2 className="font-semibold">{v.title}</h2>
                                            <div className="text-sm text-gray-400 mt-1">
                                                • Progress: {Math.floor((v.progress || 0) * 100)}%
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={(e) => handleDeleteVideo(v.id, v.youtube_id, e)}
                                            disabled={deletingVideoId === v.id}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg"
                                            title="Remove from library view"
                                        >
                                            {deletingVideoId === v.id ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </div>
                                    
                                    <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                onSwitchToLogin={switchToLogin}
            />
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onSuccess={handleLoginSuccess}
                onSwitchToSignup={switchToSignup}
            />
        </div>
    );
};

export default Library;