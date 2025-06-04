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

// CORS middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

// Static files middleware
app.use("/images", express.static("public/images"));

// Auth middleware
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

// Routes
app.use("/user", UserRouter);
app.use("/photo", PhotoRouter);
app.use("/admin", AdminRouter);
app.use("/comment", CommentRouter);

// Root route
app.get("/", (req, res) => {
  res.send({ message: "Hello from photo-sharing app API!" });
});

// Start server
app.listen(8081, () => {
  console.log("server listening on port http://localhost:8081");
});
