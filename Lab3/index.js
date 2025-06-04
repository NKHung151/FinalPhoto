const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const dbConnect = require("./db/dbConnect");
const UserRouter = require("./routes/UserRouter");
const PhotoRouter = require("./routes/PhotoRouter");
const AdminRouter = require("./routes/AdminRouter");
const CommentRouter = require("./routes/CommentRouter");

dbConnect();

// Đặt static cho images
app.use("/images", express.static("public/images"));

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

// Middleware kiểm tra đăng nhập cho các route không phải GET
app.use((req, res, next) => {
  if (req.method === "GET") {
    return next();
  }
  if (
    req.path.startsWith("/admin") ||
    req.path === "/"
  ) {
    return next();
  }
  if (!req.session.user) {
    return res.status(401).send({ error: "Unauthorized" });
  }
  next();
});

// Routes
app.use("/admin", AdminRouter);
app.use("/user", UserRouter);
app.use("/photo", PhotoRouter);
app.use("/comment", CommentRouter);

app.get("/", (req, res) => {
  res.send({ message: "Hello from photo-sharing app API!" });
});

app.listen(8081, () => {
  console.log("server listening on port http://localhost:8081");
});
