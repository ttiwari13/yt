
const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddlware"); 
const videoController = require("../controllers/videoController");

const { getUserVideos, updateVideoProgress } = require("../controllers/videoController"); 
router.post("/add", protect, videoController.addVideo); 
router.get("/", protect, getUserVideos);
router.get("/:youtubeId", videoController.getVideo);
router.put("/progress/:youtubeId", protect, updateVideoProgress); 

module.exports = router;