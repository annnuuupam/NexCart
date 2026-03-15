import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../../assets/images/logo.png";
import "../../styles/LoginPage.css";
import API_BASE_URL from "../../config/api";

const useQuery = () => new URLSearchParams(useLocation().search);

export default function ResetPasswordPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const tokenFromUrl = query.get("token") || "";
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to reset password");
      setSuccess("Password reset successfully! Redirecting to login…");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/", { replace: true }), 1800);
    } catch (err) {
      setError(err.message || "Unable to reset password. Please request a new link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Navbar */}
      <nav className="login-navbar">
        <div className="login-brand" onClick={() => navigate("/")}>
          <img src={logo} alt="NexCart" />
          <span>NexCart</span>
        </div>
        <div className="login-navbar-actions">
          <Link to="/" className="login-navbar-link">
            Back to Login
          </Link>
        </div>
      </nav>

      <div className="login-layout">
        {/* Left panel — branding */}
        <div className="login-left">
          <div className="login-left-content">
            <motion.h1
              className="login-hero-title"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            >
              Reset your
              <br />
              password.
            </motion.h1>
            <motion.p
              className="login-hero-tagline"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.34, duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            >
              Choose a strong new password to secure your NexCart account. The link expires after 1 hour.
            </motion.p>
            <motion.div
              className="login-badges"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.46, duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <span className="login-badge">🔒 Secure Reset</span>
              <span className="login-badge">✉️ Link from Email</span>
              <span className="login-badge">⏱ 1-Hour Expiry</span>
            </motion.div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="login-right">
          <motion.div
            className="login-form-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <h2 className="login-form-title">Reset password</h2>
            <p className="login-form-subtitle">
              {tokenFromUrl
                ? "Your reset token has been pre-filled. Choose a new password below."
                : "Paste your reset token and enter a new password."}
            </p>

            {error && (
              <motion.p
                className="login-error"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p
                className="login-modal-success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {success}
              </motion.p>
            )}

            <form onSubmit={handleReset} className="login-form">
              <div className="input-wrap">
                <label htmlFor="reset-token">Reset Token</label>
                <input
                  id="reset-token"
                  type="text"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="Paste reset token from email"
                  readOnly={Boolean(tokenFromUrl)}
                  style={tokenFromUrl ? { opacity: 0.7, cursor: "not-allowed" } : {}}
                  required
                />
              </div>
              <div className="input-wrap">
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="input-wrap">
                <label htmlFor="confirm-password">Confirm Password</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                  required
                />
              </div>
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Resetting…" : "Reset Password"}
              </button>
              <Link to="/" className="login-forgot" style={{ textAlign: "center", display: "block", marginTop: "0.5rem" }}>
                ← Back to Login
              </Link>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
