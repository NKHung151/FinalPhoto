import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Typography, Divider, TextField, Button } from "@mui/material";
import fetchModel from "../../lib/fetchModelData";
import "./styles.css";

function UserPhotos({ user }) {
  const { userId } = useParams();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCache, setUserCache] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    fetchModel(`/photo/${userId}`)
      .then((data) => {
        setPhotos(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load photos.");
        setLoading(false);
      });
  }, [userId]);
 

  const fetchUserIfNeeded = async (id) => {
    if (userCache[id]) return userCache[id];
    try {
      const user = await fetchModel(`/user/${id}`);
      setUserCache((prev) => ({ ...prev, [id]: user }));
      return user;
    } catch {
      return null;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleInputChange = (photoId, value) => {
    setCommentInputs((prev) => ({ ...prev, [photoId]: value }));
  };

  const handleCommentSubmit = async (photoId) => {
    const comment = commentInputs[photoId]?.trim();
    if (!comment) {
      setError("Comment cannot be empty");
      return;
    }
    try {
      setSubmitting((prev) => ({ ...prev, [photoId]: true }));
      const response = await axios.post(
        `http://localhost:8081/comment/${photoId}`,
        { comment },
        { withCredentials: true }
      );
      setPhotos((prev) =>
        prev.map((photo) =>
          photo._id === photoId
            ? { ...photo, comments: response.data.comments }
            : photo
        )
      );
      setCommentInputs((prev) => ({ ...prev, [photoId]: "" }));
      setError("");
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      setError(`Failed to submit comment: ${errorMessage}`);
      console.error("Comment submit error:", err);
    } finally {
      setSubmitting((prev) => ({ ...prev, [photoId]: false }));
    }
  };

  const handleDeleteComment = async (photoId, commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;
    try {
      await axios.delete(
        `http://localhost:8081/comment/${photoId}/${commentId}`,
        { withCredentials: true }
      );
      setPhotos((prev) =>
        prev.map((photo) =>
          photo._id === photoId
            ? {
                ...photo,
                comments: photo.comments.filter((c) => c._id !== commentId),
              }
            : photo
        )
      );
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete comment");
    }
  };

  const handleEditComment = (photoId, comment) => {
    setEditingComment({ photoId, commentId: comment._id });
    setEditValue(comment.comment);
  };

  const handleSaveEdit = async () => {
    const { photoId, commentId } = editingComment;
    if (!editValue.trim()) {
      setError("Comment cannot be empty");
      return;
    }
    try {
      await axios.put(
        `http://localhost:8081/comment/${photoId}/${commentId}`,
        { comment: editValue },
        { withCredentials: true }
      );
      setPhotos((prev) =>
        prev.map((photo) =>
          photo._id === photoId
            ? {
                ...photo,
                comments: photo.comments.map((c) =>
                  c._id === commentId
                    ? { ...c, comment: editValue, date_time: new Date() }
                    : c
                ),
              }
            : photo
        )
      );
      setEditingComment(null);
      setEditValue("");
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to edit comment");
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditValue("");
  };

  if (loading) return <Typography>Loading photos...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!photos.length)
    return <Typography>No photos available for this user.</Typography>;

  return (
    <div className="user-photos">
      <Typography variant="h4" gutterBottom>
        Photos of the User
      </Typography>
      {photos.map((photo) => (
        <div key={photo._id} className="photo-block">
          <img
            src={`http://localhost:8081/images/${photo.file_name}`}
            alt="User Photo"
            style={{ width: "300px", borderRadius: "8px" }}
          />
          <Typography variant="body1">
            Created on: {formatDate(photo.date_time)}
          </Typography>
          <Typography variant="subtitle2" color="primary">
            Total number of comments: {photo.comment_count}
          </Typography>
          <Typography variant="h6">Comments:</Typography>
          {photo.comments && photo.comments.length > 0 ? (
            <ul>
              {photo.comments.map((comment) => (
                <li key={comment._id}>
                  {editingComment &&
                  editingComment.photoId === photo._id &&
                  editingComment.commentId === comment._id ? (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <TextField
                        size="small"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        variant="outlined"
                        fullWidth
                      />
                      <Button
                        size="small"
                        onClick={handleSaveEdit}
                        variant="contained"
                      >
                        Save
                      </Button>
                      <Button
                        size="small"
                        onClick={handleCancelEdit}
                        variant="outlined"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Typography variant="body2">{comment.comment}</Typography>
                      <CommentUser
                        comment={comment}
                        fetchUserIfNeeded={fetchUserIfNeeded}
                        formatDate={formatDate}
                      />
                      {user &&
                        String(comment.user_id?._id || comment.user_id) ===
                          String(user._id) && (
                          <div style={{ marginTop: 4 }}>
                            <Button
                              size="small"
                              onClick={() =>
                                handleEditComment(photo._id, comment)
                              }
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              onClick={() =>
                                handleDeleteComment(photo._id, comment._id)
                              }
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                    </>
                  )}
                  <Divider />
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant="body1">No comments available.</Typography>
          )}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 8,
              alignItems: "center",
              maxWidth: 350,
            }}
          >
            <TextField
              size="small"
              variant="outlined"
              placeholder="Add a comment..."
              value={commentInputs[photo._id] || ""}
              onChange={(e) => handleInputChange(photo._id, e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              color="primary"
              disabled={submitting[photo._id]}
              onClick={() => handleCommentSubmit(photo._id)}
            >
              Submit
            </Button>
          </div>
          <br />
        </div>
      ))}
    </div>
  );
}

function CommentUser({ comment, fetchUserIfNeeded, formatDate }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userId = comment.user_id?._id || comment.user_id;
    if (userId) {
      fetchUserIfNeeded(userId).then((u) => setUser(u));
    }
  }, [comment.user_id]);

  if (!user) {
    return (
      <Typography variant="body2" color="textSecondary">
        Loading commenter info...
      </Typography>
    );
  }

  return (
    <>
      <Typography variant="body2">
        <strong>
          {user.first_name} {user.last_name}
        </strong>{" "}
        - {formatDate(comment.date_time)}
      </Typography>
      <Link to={`/user/${user._id}`} color="primary">
        View commenter profile
      </Link>
    </>
  );
}

export default UserPhotos;
