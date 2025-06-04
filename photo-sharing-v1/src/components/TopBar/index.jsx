import React, { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useLocation } from "react-router-dom";
import "./styles.css";
import { useNavigate } from "react-router-dom";

function TopBar({ user, onLogout }) {
  const location = useLocation();
  const [title, setTitle] = useState("Photo App");
  const navigate = useNavigate();
  useEffect(() => {
    if (
      location.pathname.startsWith("/users/") ||
      location.pathname.startsWith("/photos/")
    ) {
      setTitle("Photo App");
    } else {
      setTitle("Photo App");
    }
  }, [location.pathname]);

  return (
    <AppBar className="topbar-appBar" position="absolute">
      <Toolbar>
        {user && (
          <Typography variant="body1" sx={{ marginRight: 2 }}>
            Hi {user.first_name}
          </Typography>
        )}
        {/* {viewingUser && (!user || viewingUser._id !== user._id) && (
          <Typography variant="body2" sx={{ marginRight: 2 }}>
            Đang xem profile của {viewingUser.first_name}{" "}
            {viewingUser.last_name}
          </Typography>
        )} */}
        <Box sx={{ flexGrow: 1 }} />
        {user ? (
          <>
            <Button
              color="inherit"
              sx={{ textTransform: "none" }}
              onClick={() => navigate("/upload")}
            >
              Add Photo
            </Button>
            <Button
              color="inherit"
              sx={{ textTransform: "none" }}
              onClick={onLogout}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button
              color="inherit"
              sx={{ textTransform: "none" }}
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
            <Button
              color="inherit"
              sx={{ textTransform: "none" }}
              onClick={() => navigate("/register")}
            >
              Register
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
