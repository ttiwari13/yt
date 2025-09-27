import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useVideos, type Video as ContextVideoType } from "../context/videoContext";

interface Chapter {
    title: string;
    start_time: number;
    end_time: number | null;
}
interface VideoPageProps {
    video: ContextVideoType & { 
        chapters?: Chapter[]; 
        deadline?: string; 
    };
    onBack: () => void;
    onSaveDeadline: (videoId: string, date: string) => void; 
}
const getDaysRemaining = (dateString: string): number | null => {
    try {
        const deadlineDate = new Date(dateString);
        deadlineDate.setHours(0, 0, 0, 0); 
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const diffTime = deadlineDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays;
    } catch (e) {
        return null;
    }
};


const VideoPage: React.FC<VideoPageProps> = ({ video, onBack, onSaveDeadline }) => {
    const playerRef = useRef<any>(null);
    const intervalRef = useRef<number | ReturnType<typeof setInterval> | null>(null);
    const savedTimeRef = useRef(video.currentTimestamp || 0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentTime, setCurrentTime] = useState(video.currentTimestamp || 0);
    const [duration, setDuration] = useState(0);
    const [progress, setProgress] = useState((video.progress || 0) * 100);
    const [deadlineDate, setDeadlineDate] = useState(video.deadline || ''); // 💡 State for deadline
    const { updateVideoProgress } = useVideos();
    const SAVE_INTERVAL_SECONDS = 30;
    const formatTime = (totalSeconds: number) => {
    if (!totalSeconds || totalSeconds < 0) return "0:00";
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
};

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
        intervalRef.current = setInterval(trackProgress, 500); 
    }, [stopProgressTracking, trackProgress]);

    const seekToTime = (time: number) => {
        if (playerRef.current && isLoaded && duration > 0) {
            playerRef.current.seekTo(time, true);
            stopProgressTracking(); 
            startProgressTracking();
            updateProgressState(time, duration);
            saveProgressToBackend(time, duration);
        }
    };
    const remainingDays = useMemo(() => {
        if (!deadlineDate) return null;
        return getDaysRemaining(deadlineDate);
    }, [deadlineDate]);

    const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setDeadlineDate(newDate);
        onSaveDeadline(video.youtube_id, newDate); 
    };

    useEffect(() => {
        let player: any = null;

        const initializePlayer = () => {
            if (playerRef.current && playerRef.current.destroy) {
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
            if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
                const current = playerRef.current.getCurrentTime();
                const total = playerRef.current.getDuration();
                if (total > 0 && Math.abs(current - savedTimeRef.current) > 1) { 
                    saveProgressToBackend(current, total);
                }
            }
            if (playerRef.current && playerRef.current.destroy) {
                playerRef.current.destroy();
            }
        };
    }, [video.youtube_id, startProgressTracking, stopProgressTracking, saveProgressToBackend, updateProgressState, duration, trackProgress]); 
    const getChapterSource = () => {
        if (!video.chapters || video.chapters.length === 0) return null;
        const isUniform = video.chapters.some(c => c.title.startsWith('Chapter '));
        return isUniform 
            ? <span className="text-xs text-yellow-500 font-normal">(Auto-Generated)</span>
            : <span className="text-xs text-green-500 font-normal">(From Description)</span>;
    };

    return (
        <div className="p-6 bg-gray-900 text-white min-h-screen">
            <button 
                onClick={onBack} 
                className="mb-6 text-lg text-blue-400 hover:text-blue-300 font-semibold transition-colors flex items-center"
            >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back to Library
            </button>
            <h1 className="text-3xl font-extrabold mb-6 border-b border-gray-700 pb-3">{video.title}</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                        <div id="youtube-player" className="w-full h-full"></div>
                    </div>
                    <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                        <div className="flex justify-between items-center text-sm font-medium mb-3">
                            <span className="text-blue-400 text-lg">{formatTime(currentTime)}</span> 
                            <span className="text-lg font-bold">
                                {Math.floor(progress) >= 100 ? 
                                    <span className="text-green-400">✅ 100% Complete</span> :
                                    <span className="text-white">Progress: {Math.floor(progress)}%</span>
                                }
                            </span>
                            <span className="text-gray-400 text-lg">{formatTime(duration)}</span> 
                        </div>
                        <div 
                            className="h-3 bg-gray-700 rounded-full cursor-pointer relative group transition-all duration-300 hover:h-4"
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
                                className="h-full bg-blue-500 rounded-full transition-all duration-300 shadow-md"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute top-1/2 -translate-y-1/2 right-0 w-3 h-3 bg-white rounded-full ring-2 ring-blue-500 transition-all duration-300 group-hover:w-4 group-hover:h-4"></div>
                            </div>
                        </div>
                    </div>
                </div>
                {video.chapters && video.chapters.length > 0 && (
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
                        <h3 className="text-xl font-extrabold mb-4 pb-2 border-b border-gray-700 flex justify-between items-center">
                            Video Chapters
                            {getChapterSource()}
                        </h3>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {video.chapters.map((chapter, idx) => {
                                const isActive = currentTime >= chapter.start_time && 
                                                 (chapter.end_time === null || currentTime < chapter.end_time);

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => seekToTime(chapter.start_time)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 
                                            ${isActive 
                                                ? 'bg-blue-600 shadow-lg border-l-4 border-yellow-400' 
                                                : 'bg-gray-700 hover:bg-gray-600'
                                            }`}
                                    >
                                        <div className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-200'}`}>{chapter.title}</div>
                                        <div className={`text-xs ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                                            Start: {formatTime(chapter.start_time)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <div className="flex justify-between items-center">
                    <label htmlFor="deadline-date" className="text-xl font-bold flex items-center">
                        <svg className="w-6 h-6 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Learning Deadline
                    </label>
                    
                    <div className="flex items-center space-x-4">
                        {remainingDays !== null && (
                            <span className={`text-lg font-extrabold px-3 py-1 rounded-full shadow-lg ${
                                remainingDays < 0 ? 'bg-red-700 text-white' : 
                                remainingDays <= 7 ? 'bg-yellow-500 text-gray-900' : 
                                'bg-green-600 text-white'
                            }`}>
                                {remainingDays < 0 ? `${Math.abs(remainingDays)} days OVERDUE` : 
                                 remainingDays === 0 ? `TODAY is the deadline!` :
                                 `${remainingDays} days remaining`}
                            </span>
                        )}
                        
                        <input
                            id="deadline-date"
                            type="date"
                            value={deadlineDate}
                            onChange={handleDeadlineChange}
                            className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow appearance-none"
                            min={new Date().toISOString().split('T')[0]} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPage;