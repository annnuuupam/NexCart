import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { ThemeToggle } from "../../components/layout/ThemeToggle";
import logo from "../../assets/images/logo.png";
import "../../styles/LoginPage.css";

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

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://localhost:9090/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || "Login failed");
      }

      const role = normalizeRole(data.role);
      if (role.includes("ADMIN")) {
        navigate("/admindashboard", { replace: true });
        return;
      }

      navigate("/customerhome", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to login. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <nav className="login-navbar">
        <div className="login-brand" onClick={() => navigate("/")}>
          <img src={logo} alt="NexCart" />
          <span>NexCart</span>
        </div>
        <div className="login-navbar-actions">
          <Link to="/register" className="login-navbar-link">
            Register
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="login-layout">
        <div className="login-left">
          <div className="login-left-content">
            <motion.h1
              className="login-hero-title"
              custom={0}
              initial="hidden"
              animate="visible"
              variants={leftVariants}
            >
              Shop smarter.
              <br />
              Grow faster.
            </motion.h1>
            <motion.p
              className="login-hero-tagline"
              custom={1}
              initial="hidden"
              animate="visible"
              variants={leftVariants}
            >
              A modern commerce experience with fast browsing, smooth checkout, and reliable account access.
            </motion.p>
            <motion.div
              className="login-badges"
              custom={2}
              initial="hidden"
              animate="visible"
              variants={leftVariants}
            >
              <span className="login-badge">⚡ Fast Checkout</span>
              <span className="login-badge">🔒 Secure &amp; Private</span>
              <span className="login-badge">✨ Modern UX</span>
            </motion.div>
            <motion.div
              className="login-lottie-wrap"
              custom={3}
              initial="hidden"
              animate="visible"
              variants={leftVariants}
            >
              <DotLottieReact
                autoplay
                loop
                src="https://lottie.host/858d304e-3ea4-45e7-bda7-7cc127ddfccf/NM4A7iFDrE.lottie"
                style={{ height: "320px", width: "100%" }}
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
              Welcome back
            </motion.h2>
            <motion.p className="login-form-subtitle" custom={1} initial="hidden" animate="visible" variants={rightVariants}>
              Sign in to continue to NexCart
            </motion.p>

            {error && (
              <motion.p className="login-error" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                {error}
              </motion.p>
            )}

            <form onSubmit={handleSignIn} className="login-form">
              <motion.div className="input-wrap" custom={2} initial="hidden" animate="visible" variants={rightVariants}>
                <label htmlFor="login-username">Username</label>
                <input
                  id="login-username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </motion.div>
              <motion.div className="input-wrap" custom={3} initial="hidden" animate="visible" variants={rightVariants}>
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </motion.div>
              <motion.div custom={4} initial="hidden" animate="visible" variants={rightVariants}>
                <button type="submit" className="login-btn">
                  Sign in
                </button>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
