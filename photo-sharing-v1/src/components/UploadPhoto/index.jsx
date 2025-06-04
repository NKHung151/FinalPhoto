import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Alert } from "@mui/material";
import axios from "axios";
import "./styles.css";

function UploadPhoto({ user }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an image to upload");
      return;
    }

    if (!user) {
      setError("Please log in to upload photos");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await axios.post(
        "http://localhost:8081/photos/new",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setSuccess(response.data.message);
      setFile(null);
      // Wait 1 second before redirecting so the user can see the success message
      setTimeout(() => navigate(`/photos/${user._id}`), 1000);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to upload photo");
      console.error("Upload error:", err); // Log detailed error
    }
  };

  return (
    <div className="upload-photo-container">
      <Typography variant="h5" gutterBottom>
        Upload Photo
      </Typography>
      <form onSubmit={handleSubmit}>
        <input
          className="upload-photo-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          className="upload-photo-btn"
        >
          Upload
        </Button>
      </form>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </div>
  );
}

export default UploadPhoto;
