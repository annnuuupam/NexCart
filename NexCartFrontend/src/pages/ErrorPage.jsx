import React from "react";
import "../styles/LoginPage.css";

export default function ErrorPage() {
  return (
    <div className="login-page notfound-page error-page">
      <div className="notfound-shell">
        <div className="notfound-card">
          <p className="notfound-kicker">Error</p>
          <h1>Something went wrong</h1>
          <p className="notfound-subtext">
            We hit an unexpected issue. Please reload the page or return to the home screen.
          </p>
          <div className="notfound-actions">
            <button type="button" className="login-btn notfound-btn" onClick={() => window.location.reload()}>
              Reload page
            </button>
            <a className="notfound-link" href="/">
              Go to login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
