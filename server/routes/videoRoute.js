const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");


router.post("/add", videoController.addVideo);
router.get("/:youtubeId", videoController.getVideo);

module.exports = router;
