import React from "react";
import { useNavigate } from "react-router-dom";

import logo from "../../assets/images/logo.png";
import "../../styles/styles.css";

export default function Logo() {
  const navigate = useNavigate();

  return (
    <div className="logo-container" onClick={() => navigate("/customerhome")}>
      <img
        src={logo}
        alt="NexCart Logo"
        className="logo-image"
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.background = "linear-gradient(135deg, #0f766e, #6366f1)";
          e.target.style.display = "none";
        }}
      />
      <span className="logo-text">NexCart</span>
    </div>
  );
}
