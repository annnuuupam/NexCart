import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { ThemeToggle } from "../../components/layout/ThemeToggle";
import logo from "../../assets/images/logo.png";
import "../../styles/LoginPage.css";
import API_BASE_URL from '../../config/api';

const leftVariants = {
  hidden: { opacity: 0, x: -40 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.12 + 0.2, duration: 0.5, ease: [0.22, 0.61, 0.36, 1] },
  }),
};

const rightVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08 + 0.15, duration: 0.4, ease: [0.22, 0.61, 0.36, 1] },
  }),
};

const normalizeRole = (role) => String(role || "").toUpperCase();

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const sessionMessage = location?.state?.message;
    if (sessionMessage) {
      setError(sessionMessage);
    }
  }, [location]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || "Something went wrong. Please try again.");
      }

      const role = normalizeRole(data.role);
      if (!role.includes("ADMIN")) {
        setError("This account does not have admin access.");
        return;
      }

      navigate("/admindashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unexpected error occurred");
    }
  };

  return (
    <div className="login-page">
      <nav className="login-navbar">
        <div
          className="login-brand"
          onClick={() => navigate("/")}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <img
            src={logo}
            alt="NexCart"
            style={{ height: '38px', width: '38px', objectFit: 'cover', borderRadius: '10px' }}
          />
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', userSelect: 'none' }}>
            NexCart Admin
          </span>
        </div>
        <div className="login-navbar-actions">
          <Link to="/" className="login-navbar-link">
            Customer Login
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="login-layout">
        <div className="login-left">
          <div className="login-left-content">
            <motion.h1 className="login-hero-title" custom={0} initial="hidden" animate="visible" variants={leftVariants}>
              Control your store.
              <br />
              Drive growth daily.
            </motion.h1>
            <motion.p className="login-hero-tagline" custom={1} initial="hidden" animate="visible" variants={leftVariants}>
              Manage products, users, and business analytics from one high-clarity operations dashboard.
            </motion.p>
            <motion.div className="login-lottie-wrap" custom={2} initial="hidden" animate="visible" variants={leftVariants}>
              <DotLottieReact
                autoplay
                loop
                src="https://lottie.host/858d304e-3ea4-45e7-bda7-7cc127ddfccf/NM4A7iFDrE.lottie"
                style={{ height: "360px", width: "400px", maxWidth: "100%" }}
              />
            </motion.div>
          </div>
        </div>

        <div className="login-right">
          <motion.div
            className="login-form-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <motion.h2 className="login-form-title" custom={0} initial="hidden" animate="visible" variants={rightVariants}>
              Admin sign in
            </motion.h2>
            <motion.p className="login-form-subtitle" custom={1} initial="hidden" animate="visible" variants={rightVariants}>
              Enter your admin credentials to continue
            </motion.p>

            {error && (
              <motion.p className="login-error" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                {error}
              </motion.p>
            )}

            <form onSubmit={handleSignIn} className="login-form">
              <motion.div className="input-wrap" custom={2} initial="hidden" animate="visible" variants={rightVariants}>
                <label htmlFor="admin-username">Username</label>
                <input
                  id="admin-username"
                  type="text"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </motion.div>
              <motion.div className="input-wrap" custom={3} initial="hidden" animate="visible" variants={rightVariants}>
                <label htmlFor="admin-password">Password</label>
                <input
                  id="admin-password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </motion.div>
              <motion.div custom={4} initial="hidden" animate="visible" variants={rightVariants}>
                <button type="submit" className="login-btn">
                  Enter Admin Console
                </button>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


