import React, { useState, useEffect } from "react";
import { Grid, Paper } from "@mui/material";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
} from "react-router-dom";

import TopBar from "./components/TopBar";
import UserDetail from "./components/UserDetail";
import UserList from "./components/UserList";
import UserPhotos from "./components/UserPhotos";
import LoginRegister from "./components/LoginRegister";
import UploadPhoto from "./components/UploadPhoto";

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppContent() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Kiểm tra session khi load lại trang
  useEffect(() => {
    fetch("http://localhost:8081/admin/check", {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUser(data);
      });
  }, []);

  const handleLogout = async () => {
    await fetch("http://localhost:8081/admin/logout", { method: "POST", credentials: "include" });
    setUser(null);
  };

  // Khi đăng nhập thành công, chuyển hướng sang trang chi tiết user
  const handleLogin = (userInfo) => {
    setUser(userInfo);
    navigate(`/user/${userInfo._id}`);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TopBar user={user} onLogout={handleLogout} />
      </Grid>
      <div className="main-topbar-buffer" />
      <Grid item sm={3}>
        <Paper className="main-grid-item">{user ? <UserList /> : null}</Paper>
      </Grid>
      <Grid item sm={9}>
        <Paper className="main-grid-item">
          <Routes>
            <Route
              path="/user/:userId"
              element={
                <ProtectedRoute user={user}>
                  <UserDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/photo/:userId"
              element={
                <ProtectedRoute user={user}>
                  {/* <UserPhotos /> */}
                  <UserPhotos user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user"
              element={
                <ProtectedRoute user={user}>
                  <UserList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to={`/user/${user._id}`} replace />
                ) : (
                  <LoginRegister onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="*"
              element={
                user ? (
                  <Navigate to={`/user/${user._id}`} replace />
                ) : (
                  <LoginRegister onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/upload"
              element={
                user ? <UploadPhoto user={user} /> : <Navigate to="/" replace />
              }
            />
          </Routes>
        </Paper>
      </Grid>
    </Grid>
  );
}

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
