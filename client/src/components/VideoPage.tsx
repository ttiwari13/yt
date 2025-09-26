import React, { useRef, useEffect, useState, useCallback } from "react";
import { useVideos, type Video as ContextVideoType } from "../context/videoContext"; 

interface Chapter {
    title: string;
    start_time: number;
    end_time: number | null;
}
interface VideoPageProps {
    video: ContextVideoType & { chapters?: Chapter[] }; 
    onBack: () => void;
}

const VideoPage: React.FC<VideoPageProps> = ({ video, onBack }) => {
    const playerRef = useRef<any>(null);
    const intervalRef = useRef<number | ReturnType<typeof setInterval> | null>(null);
    const savedTimeRef = useRef(video.currentTimestamp || 0); 
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentTime, setCurrentTime] = useState(video.currentTimestamp || 0);
    const [duration, setDuration] = useState(0);
    const [progress, setProgress] = useState((video.progress || 0) * 100);
    const { updateVideoProgress } = useVideos();
    const SAVE_INTERVAL_SECONDS = 30; 
    const saveProgressToBackend = useCallback((current: number, total: number) => {
        const progressDecimal = current / total;
        updateVideoProgress(video.youtube_id, progressDecimal, Math.floor(current));
        savedTimeRef.current = Math.floor(current);
    }, [video.youtube_id, updateVideoProgress]);
    const updateProgressState = useCallback((current: number, total: number) => {
        if (total > 0) {
            const progressDecimal = current / total;
            const progressPercent = progressDecimal * 100;
            
            setCurrentTime(current);
            setProgress(progressPercent);
            if (Math.abs(current - savedTimeRef.current) >= SAVE_INTERVAL_SECONDS) {
                saveProgressToBackend(current, total);
            }
        }
    }, [saveProgressToBackend]);
    const trackProgress = useCallback(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            try {
                const current = playerRef.current.getCurrentTime();
                const total = playerRef.current.getDuration();
                updateProgressState(current, total);
            } catch (error) {
            }
        }
    }, [updateProgressState]);

    const stopProgressTracking = useCallback(() => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const startProgressTracking = useCallback(() => {
        stopProgressTracking(); 
        intervalRef.current = setInterval(trackProgress, 100); 
    }, [stopProgressTracking, trackProgress]);

    const seekToTime = (time: number) => {
        if (playerRef.current && isLoaded && duration > 0) {
            playerRef.current.seekTo(time, true);
            updateProgressState(time, duration);
            saveProgressToBackend(time, duration);
        }
    };
    useEffect(() => {
        let player: any = null;

        const initializePlayer = () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }

            player = new (window as any).YT.Player('youtube-player', {
                height: '500',
                width: '100%',
                videoId: video.youtube_id, 
                playerVars: {
                    'enablejsapi': 1,
                    'origin': window.location.origin
                },
                events: {
                    'onReady': (event: any) => {
                        playerRef.current = event.target;
                        setIsLoaded(true);
                        
                        const videoDuration = event.target.getDuration();
                        setDuration(videoDuration);
                        
                        const savedTime = video.currentTimestamp || 0;
                        if (savedTime > 0) {
                            event.target.seekTo(savedTime, true);
                        }
                        setCurrentTime(savedTime); 
                        startProgressTracking();
                    },
                    'onStateChange': (event: any) => {
                        if (event.data === 1) {
                            startProgressTracking();
                        } else if (event.data === 2) { 
                            stopProgressTracking();
                            setTimeout(() => {
                                trackProgress();
                                if (playerRef.current) {
                                    saveProgressToBackend(playerRef.current.getCurrentTime(), playerRef.current.getDuration());
                                }
                            }, 100);
                        } else if (event.data === 0) { 
                            setProgress(100);
                            saveProgressToBackend(duration, duration);
                            stopProgressTracking();
                        }
                    }
                }
            });
        };
        if (!(window as any).YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

            (window as any).onYouTubeIframeAPIReady = initializePlayer;
        } else {
            initializePlayer();
        }

        return () => {
            stopProgressTracking();
            if (playerRef.current && playerRef.current.destroy) {
                playerRef.current.destroy();
            }
        };
    }, [video.youtube_id, startProgressTracking, stopProgressTracking, saveProgressToBackend, updateProgressState, duration]); 

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getChapterSource = () => {
        if (!video.chapters || video.chapters.length === 0) return null;
        
        const isUniform = video.chapters.some(c => c.title.startsWith('Chapter '));
        
        return isUniform 
            ? <span className="text-xs text-yellow-500">(Auto-Generated)</span>
            : <span className="text-xs text-green-500">(From Video Description)</span>;
    };

    return (
        <div className="p-6 bg-gray-900 text-white min-h-screen">
            <button onClick={onBack} className="mb-4 text-blue-400 hover:text-blue-300">
                ← Back to Library
            </button>
            
            <h1 className="text-2xl font-bold mb-4">{video.title}</h1>
            

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2">
                    <div id="youtube-player" className="w-full mb-4"></div>
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span>{formatTime(currentTime)}</span>
                            <span>Progress: {Math.floor(progress)}%</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                        <div 
                            className="h-2 bg-gray-700 rounded-full cursor-pointer"
                            onClick={(e) => {
                                if (duration > 0) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const clickX = e.clientX - rect.left;
                                    const percentage = clickX / rect.width;
                                    const newTime = percentage * duration;
                                    seekToTime(newTime);
                                }
                            }}
                        >
                            <div 
                                className="h-2 bg-blue-500 rounded-full"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
                {video.chapters && video.chapters.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded">
                        <h3 className="text-lg font-bold mb-3 flex justify-between items-center">
                            Chapters
                            {getChapterSource()}
                        </h3>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {video.chapters.map((chapter, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => seekToTime(chapter.start_time)}
                                    className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition-colors"
                                >
                                    <div className="text-sm font-medium">{chapter.title}</div>
                                    <div className="text-xs text-gray-400">
                                        {formatTime(chapter.start_time)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-6 p-4 bg-gray-800 rounded">
                <label className="block text-sm font-medium mb-2">Set Deadline:</label>
                <input
                    type="date"
                    className="px-3 py-2 bg-gray-700 text-white rounded"
                />
            </div>
        </div>
    );
};

export default VideoPage;