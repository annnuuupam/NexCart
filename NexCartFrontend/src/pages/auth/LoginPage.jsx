import React, { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStoreName } from "../../hooks/useStoreName";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { ThemeToggle } from "../../components/layout/ThemeToggle";
import ForgotPasswordModal from "../../components/auth/ForgotPasswordModal";
import DemoAccountsCard from "../../components/auth/DemoAccountsCard";
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

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [showForgot, setShowForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const storeName = useStoreName();

  const navigate = useNavigate();

  /**
   * Core login logic — shared by the form submit and demo login buttons.
   * Accepts explicit credentials so it can be called programmatically.
   */
  const performLogin = useCallback(async (loginUsername, loginPassword) => {
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
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
  }, [navigate]);

  /** Handles regular form submission */
  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await performLogin(username, password);
    } finally {
      setLoading(false);
    }
  };

  /** Called by DemoAccountsCard when a demo button is clicked */
  const handleDemoLogin = async (demoUsername, demoPassword) => {
    // Reflect the demo credentials in the form fields for visual feedback
    setUsername(demoUsername);
    setPassword(demoPassword);
    setDemoLoading(true);
    try {
      await performLogin(demoUsername, demoPassword);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="login-page">
      <nav className="login-navbar">
        <div className="login-brand" onClick={() => navigate("/")}>
          <img src={logo} alt={storeName} />
          <span>{storeName}</span>
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
          <div className="login-right-inner">
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
                Sign in to continue to {storeName}
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
                  <div className="password-input-wrap">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </motion.div>
                <motion.div custom={4} initial="hidden" animate="visible" variants={rightVariants}>
                  <button type="submit" className="login-btn" disabled={loading || demoLoading}>
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </motion.div>
                <button
                  type="button"
                  className="login-forgot"
                  onClick={() => setShowForgot(true)}
                >
                  Forgot password?
                </button>
              </form>
            </motion.div>

            {/* Demo Accounts Section */}
            <DemoAccountsCard
              onDemoLogin={handleDemoLogin}
              isLoading={demoLoading}
            />
          </div>
        </div>
      </div>
      <ForgotPasswordModal open={showForgot} onClose={() => setShowForgot(false)} />
    </div>
  );
}
