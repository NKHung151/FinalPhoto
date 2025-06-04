import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TextField, Button, Box, Alert, Grid, Typography } from "@mui/material";
import axios from "axios";
import "./styles.css";

function LoginRegister({ onLogin }) {
  const [formData, setFormData] = useState({
    login_name: "",
    password: "",
    first_name: "",
    last_name: "",
    location: "",
    description: "",
    occupation: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const isRegister = location.pathname === "/register";

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const {
      login_name,
      password,
      first_name,
      last_name,
      location,
      description,
      occupation,
    } = formData;

    if (isRegister) {
      if (
        !login_name ||
        !password ||
        !confirmPassword ||
        !first_name ||
        !last_name ||
        !location ||
        !description ||
        !occupation
      ) {
        setError("Please fill in all fields.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    } else {
      if (!login_name || !password) {
        setError("Login name and password are required.");
        return;
      }
    }

    try {
      const url = isRegister ? "/user" : "/admin/login";
      const response = await axios.post(
        `http://localhost:8081${url}`,
        {
          login_name: login_name.trim(),
          password: password.trim(),
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          location: location.trim(),
          description: description.trim(),
          occupation: occupation.trim(),
        },
        { withCredentials: true }
      );

      if (!isRegister) {
        if (response.data?._id) {
          sessionStorage.setItem("user", JSON.stringify(response.data));
          window.dispatchEvent(new Event("storage"));
          onLogin?.(response.data);
          navigate(`/user/${response.data._id}`, { replace: true });
        } else {
          setError("Login failed. Please check your credentials.");
        }
      } else {
        setFormData({
          login_name: "",
          password: "",
          first_name: "",
          last_name: "",
          location: "",
          description: "",
          occupation: "",
        });
        setConfirmPassword("");
        navigate("/login");
        alert("Registration successful. Please log in.");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (isRegister ? "Registration failed." : "Login failed.")
      );
    }
  };

  const renderField = (label, name, type = "text", value, onChange) => (
    <Grid container alignItems="center" spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={4}>
        <Typography>{label}</Typography>
      </Grid>
      <Grid item xs={8}>
        <TextField
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          fullWidth
          variant="outlined"
          size="small"
        />
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 4 }}>
      <form onSubmit={handleSubmit}>
        {renderField(
          "Login Name",
          "login_name",
          "text",
          formData.login_name,
          handleChange
        )}
        {renderField(
          "Password",
          "password",
          "password",
          formData.password,
          handleChange
        )}
        {isRegister && (
          <>
            {renderField(
              "Confirm Password",
              "",
              "password",
              confirmPassword,
              (e) => setConfirmPassword(e.target.value)
            )}
            {renderField(
              "First Name",
              "first_name",
              "text",
              formData.first_name,
              handleChange
            )}
            {renderField(
              "Last Name",
              "last_name",
              "text",
              formData.last_name,
              handleChange
            )}
            {renderField(
              "Location",
              "location",
              "text",
              formData.location,
              handleChange
            )}
            {renderField(
              "Description",
              "description",
              "text",
              formData.description,
              handleChange
            )}
            {renderField(
              "Occupation",
              "occupation",
              "text",
              formData.occupation,
              handleChange
            )}
          </>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3 }}
        >
          {isRegister ? "Register" : "Login"}
        </Button>
      </form>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

export default LoginRegister;
