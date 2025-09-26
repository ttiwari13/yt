
const pool = require("../configs/db");
const axios = require("axios");
const YT_API_KEY = process.env.YOUTUBE_API_KEY;
function parseDuration(iso) {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function parseTimestamps(description){
    const lines=description.split("\n");
    const regex=/(\d{1,2}:\d{2})(?:\s+)(.+)/;
    let chapters=[];
    for(let line of lines){
        const match=line.match(regex);
        if(match){
            const [_,time,title]=match;
            const [min,sec]=time.split(":").map(Number);
            const start_time=min*60+sec;

            chapters.push({title:title.trim(),start_time});
        }
    }
    for(let i=0;i<chapters.length;i++){
        if(i<chapters.length-1){
            chapters[i].end_time=chapters[i+1].start_time-1;
        }
        else{
            chapters[i].end_time=null;
        }
    }
    return chapters;
}

function generateUniformChapters(durationSeconds,count=5){
    const step=Math.floor(durationSeconds/count);
    let chapters=[];
    for(let i=0;i<count;i++){
        chapters.push({
            title:`Chapter ${i+1}`,
            start_time:i*step,
            end_time:i===count-1?durationSeconds:(i+1)*step-1
        });
    }
    return chapters;
}
const addVideo=async(req,res)=>{
    try{
        const {youtubeUrl}=req.body;
        const userId = req.user.id; 
        
        await pool.query("BEGIN");

        const videoId = youtubeUrl.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
        )?.[1];
        if (!videoId) {
            await pool.query("ROLLBACK");
            return res.status(400).json({ message: "Invalid YouTube URL" });
        }
        
        let videoResult = await pool.query(
            `SELECT id FROM videos WHERE youtube_id=$1`,
            [videoId]
        );
        let videoDbId;

        if (videoResult.rows.length === 0) {
         
            const ytRes = await axios.get(
                `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${YT_API_KEY}`
            );
            
            if (!ytRes.data.items.length) {
                await pool.query("ROLLBACK");
                return res.status(404).json({ message: "Video not found" });
            }
            const video = ytRes.data.items[0];
            const title = video.snippet.title;
            const description = video.snippet.description;
            const thumbnail_url = video.snippet.thumbnails.high.url;
            const published_at = video.snippet.publishedAt;
            const durationISO = video.contentDetails.duration;
            const durationSeconds = parseDuration(durationISO); 
            const duration = formatDuration(durationSeconds);
            let chapters = parseTimestamps(description);
            let has_timestamps = chapters.length > 0;

            if (!has_timestamps) {
                chapters = generateUniformChapters(durationSeconds);
            }

            videoResult = await pool.query(
                `INSERT INTO videos (youtube_id, title, description, thumbnail_url, duration, published_at, has_timestamps)
                VALUES ($1,$2,$3,$4,$5,$6,$7)
                RETURNING id`,
                [videoId, title, description, thumbnail_url, duration, published_at, has_timestamps]
            );
            videoDbId = videoResult.rows[0].id;
            
            for (const ch of chapters) {
                await pool.query(
                    `INSERT INTO chapters (video_id, title, start_time, end_time)
                    VALUES ($1,$2,$3,$4)`,
                    [videoDbId, ch.title, ch.start_time, ch.end_time]
                );
            }
        } else {
            videoDbId = videoResult.rows[0].id;
        }
        const userVideoCheck = await pool.query(
            `SELECT id FROM user_videos WHERE user_id=$1 AND video_id=$2`,
            [userId, videoDbId]
        );

        if (userVideoCheck.rows.length === 0) {
            await pool.query(
                `INSERT INTO user_videos (user_id, video_id, progress_percentage, current_time_sec)
                VALUES ($1, $2, 0, 0)`,
                [userId, videoDbId]
            );
        }

        await pool.query("COMMIT");
        return res.status(201).json({ message: "Video added successfully", videoId });
    }catch(err){
        await pool.query("ROLLBACK");
        console.error(err);
        res.status(500).json({message:"Server error"});
    }
};

const getVideo = async (req, res) => {
    try {
        const { youtubeId } = req.params;
        const videoResult = await pool.query(
            `SELECT * FROM videos WHERE youtube_id=$1`,
            [youtubeId]
        );
        if (!videoResult.rows.length) {
            return res.status(404).json({ message: "Video not found" });
        }
        const video = videoResult.rows[0];
        const chaptersResult = await pool.query(
            `SELECT * FROM chapters WHERE video_id=$1 ORDER BY start_time ASC`,
            [video.id]
        );
        video.chapters = chaptersResult.rows;
        res.json(video);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};


const getUserVideos = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            `SELECT 
                v.youtube_id, v.title, v.thumbnail_url, v.duration, v.published_at,
                uv.id, 
                uv.progress_percentage AS progress, 
                uv.current_time_sec AS current_timestamp, 
                uv.added_at
            FROM user_videos uv
            JOIN videos v ON uv.video_id = v.id
            WHERE uv.user_id = $1
            ORDER BY uv.added_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch user videos" });
    }
};

const updateVideoProgress = async (req, res) => {
    try {
        const { youtubeId } = req.params;
        const { progress, currentTimestamp } = req.body; 
        const userId = req.user.id;

        const videoResult = await pool.query(
            `SELECT id FROM videos WHERE youtube_id = $1`,
            [youtubeId]
        );

        if (!videoResult.rows.length) {
            return res.status(404).json({ message: "Video not found" });
        }
        const videoDbId = videoResult.rows[0].id;
        await pool.query(
            `UPDATE user_videos 
            SET progress_percentage = $1, current_time_sec = $2
            WHERE user_id = $3 AND video_id = $4`,
            [progress, currentTimestamp, userId, videoDbId]
        );

        res.status(200).json({ message: "Progress updated successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update video progress" });
    }
};

module.exports = {
    addVideo,
    getVideo,
    getUserVideos,
    updateVideoProgress,
};