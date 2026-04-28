import React from "react";
import "./LoadingPage.css";

export default function LoadingPage() {
  return (
    <div className="loading-page-container">
      <div className="loading-spinner"></div>
      <p className="loading-text">Loading...</p>
    </div>
  );
}
