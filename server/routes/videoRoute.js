const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddlware"); 
const { addVideo, getVideo, getUserVideos, updateVideoProgress } = require("../controllers/videoController");
router.post("/add", protect, addVideo); 
router.get("/", protect, getUserVideos);
router.get("/:youtubeId", getVideo);
router.put("/progress/:youtubeId", protect, updateVideoProgress); 

module.exports = router;