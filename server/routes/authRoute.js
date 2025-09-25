const express = require("express");
const bcrypt=require("bcryptjs");
const { registerUser, loginUser } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddlware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);


router.get("/me", protect, (req, res) => {
  res.json({ message: "This is protected", user: req.user });
});

module.exports = router;
