import { useState, useEffect } from "react";
import API_URL from "../api";

export default function useAdminDashboard() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token = userInfo ? userInfo.token : null;

  const fetchBusinesses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/businesses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setBusinesses(data);
      else setError(data.message);
    } catch (err) {
      setError("Server connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [token]);

  const handleTokenUpdate = async (e) => {
    e.preventDefault();
    if (!accessToken) return alert("Please enter a token");

    try {
      const res = await fetch(`${API_URL}/api/admin/token`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accessToken }),
      });

      const data = await res.json();
      if (res.ok) alert(data.message);
      else alert(data.message || "Failed to update");
    } catch (err) {
      alert("Server error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/businesses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setBusinesses(businesses.filter((b) => b._id !== id));
      } else {
        alert("Failed to delete");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  const handleToggleStatus = async (ownerId, field, value) => {
    if (!ownerId) return alert("Owner ID missing");

    try {
      const res = await fetch(`${API_URL}/api/admin/status/${ownerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (res.ok) {
        fetchBusinesses();
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  return {
    businesses,
    loading,
    error,
    accessToken,
    setAccessToken,
    handleTokenUpdate,
    handleDelete,
    handleToggleStatus,
  };
}
