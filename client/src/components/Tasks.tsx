import React from "react";
import { BookOpen, CheckCircle, Clock } from "lucide-react";
import { useVideos, type Video } from "../context/videoContext"; 

interface TasksProps {
    onSelectVideo: (video: Video) => void;
}
const getHiddenVideos = (): Set<string> => {
    try {
        const hidden = localStorage.getItem('hiddenVideos');
        return hidden ? new Set(JSON.parse(hidden)) : new Set();
    } catch (error) {
        console.error('Error reading hidden videos from localStorage:', error);
        return new Set();
    }
};

const Tasks: React.FC<TasksProps> = ({ onSelectVideo }) => {
    const { videos } = useVideos();
    const COMPLETION_THRESHOLD = 1.0;
    const hiddenVideos = getHiddenVideos();
    const visibleVideos = videos.filter(video => !hiddenVideos.has(video.id));
    const inProgress: Video[] = [];
    const completed: Video[] = [];
    const notStarted: Video[] = [];
    visibleVideos.forEach(v => {
        const progress = v.progress || 0; 
        
        if (progress >= COMPLETION_THRESHOLD) {
            completed.push(v);
        } else if (progress > 0 && progress < COMPLETION_THRESHOLD) {
            inProgress.push(v);
        } else {
            notStarted.push(v);
        }
    });

    const handleSelectVideo = (video: Video) => {
        onSelectVideo(video);
    };
    
    const renderVideoList = (videoList: Video[], color: string, border: string) => (
        videoList.map(v => (
            <div
                key={v.id}
                className={`p-4 mb-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors border-l-4 ${border}`}
                onClick={() => handleSelectVideo(v)}
            >
                <div className="font-medium truncate">{v.title}</div>
                <div className={`text-sm ${color} mt-1`}>
                    Progress: {Math.floor((v.progress || 0) * 100)}% 
                </div>
                <div className="text-xs text-gray-500">
                    Left off at: {Math.floor(v.currentTimestamp || 0)} seconds
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div
                        className={`${border.replace('border-', 'bg-')} h-2 rounded-full`}
                        style={{ width: `${(v.progress || 0) * 100}%` }}
                    ></div>
                </div>
            </div>
        ))
    );

    return (
        <div className="flex-1 p-6 bg-gray-900 min-h-screen text-white">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
                <BookOpen className="mr-2" size={24} /> Your Learning Tasks
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* --- NOT STARTED SECTION --- */}
                <div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-400 flex items-center">
                        <Clock className="mr-2" size={20} /> Not Started ({notStarted.length})
                    </h3>
                    {notStarted.length === 0 ? (
                        <p className="text-gray-400 p-4 bg-gray-800 rounded-lg">
                            No unstarted videos. Great job!
                        </p>
                    ) : (
                        renderVideoList(notStarted, 'text-gray-400', 'border-gray-500')
                    )}
                </div>

                {/* --- IN PROGRESS SECTION --- */}
                <div>
                    <h3 className="text-xl font-semibold mb-3 text-blue-400 flex items-center">
                        <BookOpen className="mr-2" size={20} /> In Progress ({inProgress.length})
                    </h3>
                    {inProgress.length === 0 ? (
                        <p className="text-gray-400 p-4 bg-gray-800 rounded-lg">
                            No videos currently in progress. Start one now!
                        </p>
                    ) : (
                        renderVideoList(inProgress, 'text-blue-400', 'border-blue-600')
                    )}
                </div>

                {/* --- COMPLETED SECTION --- */}
                <div>
                    <h3 className="text-xl font-semibold mb-3 text-green-400 flex items-center">
                        <CheckCircle className="mr-2" size={20} /> Completed ({completed.length})
                    </h3>
                    {completed.length === 0 ? (
                        <p className="text-gray-400 p-4 bg-gray-800 rounded-lg">
                            No videos completed yet. Keep learning!
                        </p>
                    ) : (
                        completed.map(v => (
                            <div
                                key={v.id}
                                className="p-4 mb-3 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg cursor-pointer hover:bg-green-800 hover:bg-opacity-30 transition-colors flex items-center"
                                onClick={() => handleSelectVideo(v)}
                            >
                                <CheckCircle className="text-green-400 mr-3 flex-shrink-0" size={20} />
                                <div className="flex-1">
                                    <div className="font-medium truncate">{v.title}</div>
                                    <div className="text-sm text-green-400 mt-1">
                                        Completed 100%
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Tasks;