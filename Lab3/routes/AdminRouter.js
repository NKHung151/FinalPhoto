const express = require("express");
const router = express.Router();
const User = require("../db/userModel");

//Đăng nhập
router.post("/login", async (req, res) => {
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
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

//Đăng ký
router.post("/register", async (req, res) => {
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

module.exports = router; 