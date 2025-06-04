const express = require("express");
const router = express.Router();
const { Photo } = require("../db/photoModel");

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

//Thêm cmt
router.post("/:id", requireLogin, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    console.log("Comment request:", {
      id,
      comment,
      user: req.session.user?._id,
    });

    if (!comment) {
      return res.status(400).json({ error: "Bình luận không được để trống" });
    }

    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ error: "Không tìm thấy ảnh" });
    }

    const newComment = {
      user_id: req.session.user._id,
      comment,
      date_time: new Date(),
    };

    photo.comments.push(newComment);
    await photo.save();

    await photo.populate({
      path: "comments.user_id",
      select: "_id first_name last_name",
    });

    console.log("Comment added to photo:", id);
    res.json({ message: "Bình luận thành công", comments: photo.comments });
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ error: "Không thể thêm bình luận" });
  }
});

//Xóa cmt
router.delete("/:photoId/:commentId", requireLogin, async (req, res) => {
  try {
    const { photoId, commentId } = req.params;
    const user = req.session.user;

    const photo = await Photo.findById(photoId);
    if (!photo) return res.status(404).json({ error: "Ảnh không tồn tại" });

    const comment = photo.comments.id(commentId);
    if (!comment)
      return res.status(404).json({ error: "Bình luận không tồn tại" });

    if (comment.user_id.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền thu hồi bình luận này" });
    }

    photo.comments.pull({ _id: commentId });
    await photo.save();

    await photo.populate({
      path: "comments.user_id",
      select: "_id first_name last_name",
    });

    res.json({
      message: "Bình luận đã được thu hồi",
      comments: photo.comments,
    });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ error: err.message });
  }
});

//Sửa cmt
router.put("/:photoId/:commentId", requireLogin, async (req, res) => {
  try {
    const { photoId, commentId } = req.params;
    const { comment } = req.body;
    const user = req.session.user;

    if (!comment) {
      return res.status(400).json({ error: "Bình luận không được để trống" });
    }

    const photo = await Photo.findById(photoId);
    if (!photo) return res.status(404).json({ error: "Ảnh không tồn tại" });

    const commentToEdit = photo.comments.id(commentId);
    if (!commentToEdit)
      return res.status(404).json({ error: "Bình luận không tồn tại" });

    if (commentToEdit.user_id.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền chỉnh sửa bình luận này" });
    }

    commentToEdit.comment = comment;
    commentToEdit.date_time = new Date();
    await photo.save();

    await photo.populate({
      path: "comments.user_id",
      select: "_id first_name last_name",
    });

    res.json({
      message: "Bình luận đã được chỉnh sửa",
      comments: photo.comments,
    });
  } catch (err) {
    console.error("Edit comment error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 