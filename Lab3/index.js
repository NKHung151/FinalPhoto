const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const models = require("./modelData/models");
const { ObjectId } = require("mongodb");
const { Photo } = require("./db/photoModel");
const User = require("./db/userModel");
const multer = require("multer");
const path = require("path");

dbConnect();
// Sửa lại storage để lưu vào ./public/images// ĐẶT STATIC Ở ĐÂY, TRƯỚC MIDDLEWARE KIỂM TRA ĐĂNG NHẬP
app.use("/images", express.static("public/images"));
const storage = multer.diskStorage({
  destination: "./public/images/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use("/api/user", UserRouter);
app.use("/api/photo", PhotoRouter);
app.use(express.json());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use((req, res, next) => {
  if (req.method === "GET") {
    return next();
  }
  if (
    req.path.startsWith("/admin") ||
    req.path === "/" ||
    req.path === "/user"
  ) {
    return next();
  }
  if (!req.session.user) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  next();
});

//Đăng nhập
app.post("/admin/login", async (req, res) => {
  console.log("Received login request");
  try {
    const { login_name, password } = req.body;
    console.log("Login attempt:", { login_name });
    console.log("Entered password:", password, "| Type:", typeof password);

    const user = await User.findOne({ login_name });

    if (!user) {
      console.log("Login failed: User not found");
      return res.status(401).json({ error: "Invalid login name or password" });
    }

    console.log(
      "Stored password in DB:",
      user.password,
      "| Type:",
      typeof user.password
    );

    // Ép kiểu và so sánh
    if (String(user.password) !== String(password)) {
      console.log("Login failed: Incorrect password");
      return res.status(401).json({ error: "Invalid login name or password" });
    }

    req.session.user = user;
    console.log("User logged in:", user._id);

    res.json({
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      location: user.location,
      description: user.description,
      occupation: user.occupation,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

//Đăng xuất
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

//Thêm cmt
app.post("/photos/:id/comment", requireLogin, async (req, res) => {
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
      user_id: req.session.user._id, // ĐÚNG TÊN TRƯỜNG
      comment,
      date_time: new Date(),
    };

    photo.comments.push(newComment);
    await photo.save();

    await photo.populate({
      path: "comments.user_id", // ĐÚNG TÊN TRƯỜNG
      select: "_id first_name last_name",
    });

    console.log("Comment added to photo:", id);
    res.json({ message: "Bình luận thành công", comments: photo.comments });
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ error: "Không thể thêm bình luận" });
  }
});

//Thêm ảnh
app.post(
  "/photos/new",
  requireLogin,
  upload.single("photo"),
  async (req, res) => {
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
  }
);

//Đăng ký
app.post("/user", async (req, res) => {
  try {
    const {
      login_name,
      password,
      first_name,
      last_name,
      location,
      description,
      occupation,
    } = req.body;
    console.log("Received registration data:", req.body);

    // Kiểm tra tất cả các trường bắt buộc
    if (
      !login_name?.trim() ||
      !password?.trim() ||
      !first_name?.trim() ||
      !last_name?.trim() ||
      !location?.trim() ||
      !description?.trim() ||
      !occupation?.trim()
    ) {
      return res.status(400).json({
        error:
          "All fields (Login Name, Password, First Name, Last Name, Location, Description, Occupation) are required",
      });
    }

    // Chỉ kiểm tra login_name không trùng, KHÔNG kiểm tra định dạng email
    const existingUser = await User.findOne({ login_name });
    if (existingUser) {
      return res.status(400).json({ error: "Login name already exists" });
    }

    const user = new User({
      login_name: login_name.trim(),
      password: password.trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      location: location.trim(),
      description: description.trim(),
      occupation: occupation.trim(),
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.delete(
  "/photos/:photoId/comment/:commentId",
  requireLogin,
  async (req, res) => {
    try {
      const { photoId, commentId } = req.params;
      const user = req.session.user;

      const photo = await Photo.findById(photoId);
      if (!photo) return res.status(404).json({ error: "Ảnh không tồn tại" });

      const comment = photo.comments.id(commentId);
      if (!comment)
        return res.status(404).json({ error: "Bình luận không tồn tại" });

      // Kiểm tra quyền xóa
      if (comment.user_id.toString() !== user._id.toString()) {
        return res
          .status(403)
          .json({ error: "Bạn không có quyền thu hồi bình luận này" });
      }

      // SỬA Ở ĐÂY: dùng pull thay cho remove/deleteOne để xóa comment
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
  }
);

// Route chỉnh sửa bình luận
app.put(
  "/photos/:photoId/comment/:commentId",
  requireLogin,
  async (req, res) => {
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

      // SỬA Ở ĐÂY: dùng commentToEdit.user_id thay vì commentToEdit.user
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
  }
);

app.get("/", (req, res) => {
  res.send({ message: "Hello from photo-sharing app API!" });
});

app.listen(8081, () => {
  console.log("server listening on port http://localhost:8081");
});
