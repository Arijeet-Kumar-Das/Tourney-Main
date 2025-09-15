import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, Button, Stack, TextField, Card, IconButton, CircularProgress, Snackbar, Alert } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import { AdminContext } from "../../../../../Contexts/AdminContext/AdminContext";

const API_BASE_URL = "http://localhost:8000";

const SliderUpdate = () => {
  const { token, isLoggedIn } = useContext(AdminContext);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const apiRequest = async (endpoint, options = {}) => {
    const isForm = options.body instanceof FormData;
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(!isForm && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: "include",
      ...options,
    };
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  };

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/admin/slider");
      setImages(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchImages();
    // eslint-disable-next-line
  }, [isLoggedIn, token]);

  const handleUpload = async () => {
    if (!file) return setSnackbar({ open: true, message: "Select an image", severity: "warning" });
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("image", file);
      formData.append("title", title);
      formData.append("subtitle", subtitle);
      await apiRequest("/admin/slider/upload", {
        method: "POST",
        body: formData,
      });
      setFile(null);
      setTitle("");
      setSubtitle("");
      setSnackbar({ open: true, message: "Uploaded", severity: "success" });
      fetchImages();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete image?")) return;
    try {
      await apiRequest(`/admin/slider/${id}`, { method: "DELETE" });
      setSnackbar({ open: true, message: "Deleted", severity: "info" });
      setImages(images.filter((img) => img._id !== id));
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await apiRequest(`/admin/slider/${id}/toggle`, { method: "POST" });
      setImages(images.map((img) => (img._id === id ? res.data : img)));
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  if (!isLoggedIn) return <Typography>Please login</Typography>;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Slider Images
      </Typography>

      {/* Upload form */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
        <Button variant="contained" component="label">
          Select Image
          <input hidden type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        </Button>
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField label="Subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        <Button variant="contained" onClick={handleUpload} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Upload"}
        </Button>
      </Stack>

      {/* Images list */}
      {loading ? (
        <CircularProgress />
      ) : (
        <Stack spacing={2}>
          {images.map((img) => (
            <Card key={img._id} sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <img src={img.url} alt="slider" style={{ width: 120, height: 60, objectFit: "cover" }} />
                <Box>
                  <Typography>{img.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {img.subtitle}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1}>
                <IconButton onClick={() => handleToggle(img._id)}>
                  {img.isActive ? <ToggleOnIcon color="success" /> : <ToggleOffIcon color="disabled" />}
                </IconButton>
                <IconButton onClick={() => handleDelete(img._id)}>
                  <DeleteIcon color="error" />
                </IconButton>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SliderUpdate