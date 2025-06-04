const express = require("express");
const User = require("../db/userModel");
const router = express.Router();

// Lấy tất cả user (chỉ trả về _id, first_name, last_name)
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}, "_id first_name last_name").exec();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Lấy user theo id (trả về đầy đủ thông tin trừ password)
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id, "-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
