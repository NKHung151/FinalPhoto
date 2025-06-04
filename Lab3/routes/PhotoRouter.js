const express = require("express");
const router = express.Router();
const { Photo } = require("../db/photoModel");
const User = require("../db/userModel");

//GET: Lấy toàn bộ thông tin về ảnh
router.get("/", async (req, res) => {
  try {
    const photos = await Photo.find({}).exec();
    res.json(photos);
  } catch (err) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// routes/photo.js hoặc trong user routes
// router.get("/:user_id", async (req, res) => {
//   const { user_id } = req.params;

//   try {
//     const photos = await Photo.find({ user_id: user_id }).exec();

//     if (!photos || photos.length === 0) {
//       return res.status(404).json({ message: "No photos found for this user" });
//     }

//     res.json(photos);
//   } catch (error) {
//     console.error("Error fetching photos by user ID:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const photos = await Photo.find({ user_id: user_id }).exec();

    if (!photos || photos.length === 0) {
      return res.status(404).json({ message: "No photos found for this user" });
    }

    // Thêm trường comment_count cho mỗi ảnh
    const photosWithCommentCount = photos.map((photo) => {
      const obj = photo.toObject();
      obj.comment_count = photo.comments.length;
      return obj;
    });

    res.json(photosWithCommentCount);
  } catch (error) {
    console.error("Error fetching photos by user ID:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
