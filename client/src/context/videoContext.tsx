import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
export interface Video {
    id: string; 
    youtube_id: string; 
    title: string;
    url: string; 
    thumbnail_url: string; 
    duration: string;
    progress: number;
    current_timestamp: number; 
    added_at: string; 
    chapters?: any[]; 
    currentTimestamp: number; 
    addedDate: string; 
}


interface VideoContextType {
    videos: Video[];
    fetchVideos: () => Promise<void>;
    updateVideoProgress: (youtubeId: string, progress: number, currentTimestamp: number) => Promise<void>;
    isLoading: boolean;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);
const API_BASE_URL = 'http://localhost:5000/api/videos'; 

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchVideos = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setIsLoading(true);
        try {
            const response = await fetch(API_BASE_URL, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                }
            });

            if (response.ok) {
                const rawData: any[] = await response.json(); 
                const formattedVideos: Video[] = rawData.map(v => ({
                    ...v,
                    url: `https://www.youtube.com/watch?v=${v.youtube_id}`,
                    currentTimestamp: v.current_timestamp, 
                    addedDate: v.added_at, 
                }));

                setVideos(formattedVideos);
            } else if (response.status === 401) {
                setVideos([]); 
            }
        } catch (error) {
            console.error('Network or parsing error while fetching user videos:', error);
        } finally {
            setIsLoading(false);
        }
    }, []); 

    useEffect(() => {
        fetchVideos(); 
    }, [fetchVideos]);

    const updateVideoProgress = useCallback(async (youtubeId: string, progress: number, currentTimestamp: number) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/progress/${youtubeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ progress, currentTimestamp })
            });

            if (!response.ok) {
                throw new Error(`Failed to update progress. Status: ${response.status}`);
            }

            // Update the local state
            setVideos(prevVideos => 
                prevVideos.map(video => 
                    video.youtube_id === youtubeId 
                        ? { ...video, progress, current_timestamp: currentTimestamp, currentTimestamp: currentTimestamp } 
                        : video
                )
            );

        } catch (error) {
            console.error('Error updating video progress:', error);
        }
    }, []);


    return (
        <VideoContext.Provider value={{ videos, fetchVideos, updateVideoProgress, isLoading }}>
            {children}
        </VideoContext.Provider>
    );
};

export const useVideos = () => {
    const context = useContext(VideoContext);
    if (context === undefined) {
        throw new Error('useVideos must be used within a VideoProvider');
    }
    return context;
};