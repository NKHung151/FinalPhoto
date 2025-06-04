const express = require("express");
const router = express.Router();
const { Photo } = require("../db/photoModel");
const User = require("../db/userModel");
const multer = require("multer");
const path = require("path");

// Middleware kiểm tra đăng nhập
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Cấu hình multer cho upload ảnh
const storage = multer.diskStorage({
  destination: "./public/images/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

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

// Upload ảnh mới
router.post("/new", requireLogin, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No photo uploaded" });
    }

    const photo = new Photo({
      user_id: req.session.user._id,
      file_name: req.file.filename,
      date_time: new Date(),
      comments: [],
    });

    await photo.save();
    console.log("Photo uploaded:", photo._id);

    res.json({
      message: "Photo uploaded successfully",
      photo: {
        _id: photo._id,
        file_name: photo.file_name,
        date_time: photo.date_time,
        user_id: photo.user_id,
      },
    });
  } catch (err) {
    console.error("Photo upload error:", err);
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

// Xóa ảnh
router.delete("/:photoId", requireLogin, async (req, res) => {
  try {
    const { photoId } = req.params;
    const user = req.session.user;

    // Tìm ảnh theo ID
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ error: "Không tìm thấy ảnh" });
    }

    // Kiểm tra quyền xóa ảnh
    if (photo.user_id.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "Bạn không có quyền xóa ảnh này" });
    }

    // Xóa file ảnh từ thư mục
    const fs = require('fs');
    const filePath = path.join(__dirname, '..', 'public', 'images', photo.file_name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Xóa ảnh từ database
    await Photo.findByIdAndDelete(photoId);

    res.json({ message: "Ảnh đã được xóa thành công" });
  } catch (err) {
    console.error("Delete photo error:", err);
    res.status(500).json({ error: "Không thể xóa ảnh" });
  }
});

// Lấy ảnh theo user ID
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const photos = await Photo.find({ user_id: userId })
      .sort({ date_time: -1 })
      .populate({
        path: "comments.user_id",
        select: "_id first_name last_name",
      });
    res.json(photos);
  } catch (err) {
    console.error("Get photos error:", err);
    res.status(500).json({ error: "Failed to get photos" });
  }
});

module.exports = router;
