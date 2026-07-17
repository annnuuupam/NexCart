import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Static demo account definitions ───────────────────────────────────────
const DEMO_ACCOUNTS = [
  {
    id: "admin",
    role: "Administrator",
    roleLabel: "Admin",
    username: "admin",
    password: "Admin@123",
    description: "Full access to the Admin Dashboard, products, orders & users.",
    icon: "🛡️",
    buttonLabel: "Login as Admin",
    colorClass: "demo-login-btn--admin",
  },
  {
    id: "customer",
    role: "Customer",
    roleLabel: "Customer",
    username: "demo_user",
    password: "Demo@123",
    description: "Browse products, manage cart, place orders & view history.",
    icon: "🛍️",
    buttonLabel: "Login as Customer",
    colorClass: "demo-login-btn--customer",
  },
];

// ─── Single account card ────────────────────────────────────────────────────
function DemoAccountItem({ account, showCreds, onLogin, isLoading }) {
  return (
    <div className="demo-account-item">
      <div className="demo-account-header">
        <span className="demo-account-icon">{account.icon}</span>
        <div className="demo-account-meta">
          <span className="demo-role-badge">{account.roleLabel}</span>
          <p className="demo-account-desc">{account.description}</p>
        </div>
      </div>

      <AnimatePresence>
        {showCreds && (
          <motion.div
            className="demo-creds"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="demo-cred-row">
              <span className="demo-cred-label">Username</span>
              <code className="demo-cred-value">{account.username}</code>
            </div>
            <div className="demo-cred-row">
              <span className="demo-cred-label">Password</span>
              <code className="demo-cred-value">{account.password}</code>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        className={`demo-login-btn ${account.colorClass}`}
        onClick={() => onLogin(account.username, account.password)}
        disabled={isLoading}
        aria-label={account.buttonLabel}
      >
        {isLoading ? (
          <span className="demo-btn-loading">
            <svg className="demo-spinner" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
            </svg>
            Signing in…
          </span>
        ) : (
          <>
            <span className="demo-btn-icon">{account.icon}</span>
            {account.buttonLabel}
          </>
        )}
      </button>
    </div>
  );
}

// ─── Main exported component ────────────────────────────────────────────────
export default function DemoAccountsCard({ onDemoLogin, isLoading }) {
  const [showCreds, setShowCreds] = useState(false);
  const [activeAccount, setActiveAccount] = useState(null);

  const handleLogin = (username, password) => {
    setActiveAccount(username);
    onDemoLogin(username, password);
  };

  return (
    <motion.div
      className="demo-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {/* Header */}
      <div className="demo-card-header">
        <div className="demo-card-title-row">
          <span className="demo-card-rocket">🚀</span>
          <div>
            <h3 className="demo-card-title">Explore NexCart Instantly</h3>
            <p className="demo-card-subtitle">
              Use the demo accounts below to explore the application.
            </p>
          </div>
        </div>

        {/* Toggle credentials */}
        <button
          type="button"
          className={`demo-toggle-btn ${showCreds ? "demo-toggle-btn--active" : ""}`}
          onClick={() => setShowCreds((v) => !v)}
          aria-expanded={showCreds}
          aria-label={showCreds ? "Hide demo credentials" : "Show demo credentials"}
        >
          <svg
            className={`demo-toggle-icon ${showCreds ? "demo-toggle-icon--rotated" : ""}`}
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {showCreds ? (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
          {showCreds ? "Hide Credentials" : "Show Credentials"}
        </button>
      </div>

      {/* Divider */}
      <div className="demo-card-divider" />

      {/* Account cards */}
      <div className="demo-accounts-grid">
        {DEMO_ACCOUNTS.map((account) => (
          <DemoAccountItem
            key={account.id}
            account={account}
            showCreds={showCreds}
            onLogin={handleLogin}
            isLoading={isLoading && activeAccount === account.username}
          />
        ))}
      </div>
    </motion.div>
  );
}
