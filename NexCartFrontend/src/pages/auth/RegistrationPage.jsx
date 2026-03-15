import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export default function RegistrationPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Customer");
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const roleDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setIsRoleOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, role: role.toUpperCase() }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        navigate("/", { replace: true });
      } else {
        throw new Error(data.error || data.message || "Registration failed");
      }
    } catch (err) {
      setError(err.message || "Unable to create account. Please try again.");
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
          <Link to="/" className="login-navbar-link">
            Sign in
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
              Join NexCart.
              <br />
              Start shopping today.
            </motion.h1>
            <motion.p
              className="login-hero-tagline"
              custom={1}
              initial="hidden"
              animate="visible"
              variants={leftVariants}
            >
              Create your account in seconds and discover a cleaner, faster shopping experience.
            </motion.p>
            <motion.div
              className="login-badges"
              custom={2}
              initial="hidden"
              animate="visible"
              variants={leftVariants}
            >
              <span className="login-badge">🚀 Quick Setup</span>
              <span className="login-badge">🔒 Secure Account</span>
              <span className="login-badge">🛍️ Best Deals</span>
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
              Create account
            </motion.h2>
            <motion.p className="login-form-subtitle" custom={1} initial="hidden" animate="visible" variants={rightVariants}>
              Register to continue with NexCart
            </motion.p>

            {error && (
              <motion.p className="login-error" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
                {error}
              </motion.p>
            )}

            <form onSubmit={handleSignUp} className="login-form">
              <motion.div className="input-wrap" custom={2} initial="hidden" animate="visible" variants={rightVariants}>
                <label htmlFor="register-username">Username</label>
                <input
                  id="register-username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </motion.div>
              <motion.div className="input-wrap" custom={3} initial="hidden" animate="visible" variants={rightVariants}>
                <label htmlFor="register-email">Email</label>
                <input
                  id="register-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </motion.div>
              
              <motion.div className="input-wrap" custom={4} initial="hidden" animate="visible" variants={rightVariants}>
                <label htmlFor="register-password">Password</label>
                <input
                  id="register-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </motion.div>

              <motion.div className="input-wrap" custom={5} initial="hidden" animate="visible" variants={rightVariants} style={{ position: 'relative' }} ref={roleDropdownRef}>
                <label>Role</label>
                <button
                  type="button"
                  className="login-dropdown-trigger"
                  onClick={() => setIsRoleOpen(!isRoleOpen)}
                  aria-expanded={isRoleOpen}
                >
                  {role}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isRoleOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--text-muted)' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                {isRoleOpen && (
                  <div className="login-dropdown-menu">
                    {["Customer"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        className="login-dropdown-item"
                        onClick={() => {
                          setRole(option);
                          setIsRoleOpen(false);
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div custom={6} initial="hidden" animate="visible" variants={rightVariants}>
                <button type="submit" className="login-btn">
                  Create account
                </button>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
