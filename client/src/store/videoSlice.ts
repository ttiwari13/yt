
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface Chapter {
  title: string;
  start_time: number;
  end_time: number | null;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  duration: string;
  progress: number;
  addedDate: string;
  chapters?: Chapter[];
}

interface VideosState {
  list: Video[];
  selectedVideo: Video | null;
}

const initialState: VideosState = {
  list: [],
  selectedVideo: null,
};

const videosSlice = createSlice({
  name: "videos",
  initialState,
  reducers: {
    addVideo: (state, action: PayloadAction<Video>) => {
      state.list.push(action.payload);
    },
    setSelectedVideo: (state, action: PayloadAction<Video | null>) => {
      state.selectedVideo = action.payload;
    },
    updateProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
      const video = state.list.find(v => v.id === action.payload.id);
      if (video) video.progress = action.payload.progress;
    },
  },
});

export const { addVideo, setSelectedVideo, updateProgress } = videosSlice.actions;
export default videosSlice.reducer;
