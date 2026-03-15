import React, { useEffect, useMemo, useState } from "react";
import API_BASE_URL from "../../config/api";

const getSupportTip = (value) => {
  if (!value) return "";
  if (value.includes("@")) return "We will email a reset link if this account exists.";
  return "We will send a reset link to the email on file for this username.";
};

export default function ForgotPasswordModal({ open, onClose }) {
  const [identifier, setIdentifier] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const helperText = useMemo(() => getSupportTip(identifier.trim()), [identifier]);

  const loadCaptcha = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/captcha`);
      const data = await response.json().catch(() => ({}));
      setCaptchaId(data.captchaId || "");
      setCaptchaQuestion(data.question || "Solve the captcha");
      setCaptchaAnswer("");
    } catch {
      setCaptchaQuestion("Solve the captcha");
    }
  };

  useEffect(() => {
    if (open) {
      loadCaptcha();
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, captchaId, captchaAnswer }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to process request");
      setResetToken(data.resetToken || "");
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Unable to process request");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIdentifier("");
    setSubmitted(false);
    setResetToken("");
    setError("");
    setCaptchaId("");
    setCaptchaQuestion("");
    setCaptchaAnswer("");
    onClose?.();
  };

  return (
    <div className="login-modal-backdrop" role="dialog" aria-modal="true">
      <div className="login-modal-card">
        <div className="login-modal-header">
          <h3>Reset your password</h3>
          <button type="button" className="login-modal-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="login-modal-body">
            <p>
              Enter your email address or username. We’ll send a reset link if an account is found.
            </p>
            <label className="login-modal-label" htmlFor="forgot-identifier">
              Email or username
              <input
                id="forgot-identifier"
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="you@example.com or username"
                required
              />
            </label>
            <div className="login-modal-captcha">
              <label className="login-modal-label" htmlFor="forgot-captcha">
                {captchaQuestion || "Captcha"}
                <input
                  id="forgot-captcha"
                  type="text"
                  value={captchaAnswer}
                  onChange={(event) => setCaptchaAnswer(event.target.value)}
                  placeholder="Answer"
                  required
                />
              </label>
              <button type="button" className="login-modal-refresh" onClick={loadCaptcha}>
                Refresh captcha
              </button>
            </div>
            {helperText && <span className="login-modal-helper">{helperText}</span>}
            {error && <span className="login-modal-error">{error}</span>}
            <button type="submit" className="login-btn login-modal-btn">
              {loading ? "Sending..." : "Send reset link"}
            </button>
            <p className="login-modal-footer">
              Need help? Visit <a href="/support/contact-us">support</a>.
            </p>
          </form>
        ) : (
          <div className="login-modal-body">
            <p className="login-modal-success">If an account exists, we’ve sent a reset link.</p>
            {resetToken ? (
              <div className="login-modal-token">
                <p className="login-modal-helper">Local dev token (use to reset):</p>
                <code>{resetToken}</code>
                <a className="login-modal-link" href={`/reset-password?token=${resetToken}`}>
                  Reset password now
                </a>
              </div>
            ) : (
              <p className="login-modal-footer">
                Check spam/junk folders or contact <a href="/support/contact-us">support</a>.
              </p>
            )}
            <button type="button" className="login-btn login-modal-btn" onClick={handleClose}>
              Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
