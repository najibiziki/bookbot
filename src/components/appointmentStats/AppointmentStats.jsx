import React from "react";
import moment from "moment-timezone";
import "./AppointmentStats.css";

export default function AppointmentStats({ dayCount, weekCount, selectedDay }) {
  const isToday = moment().format("YYYY-MM-DD") === selectedDay;
  const dayLabel = isToday ? "Today" : "This Day";

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <span className="stat-number">{dayCount}</span>
        <span className="stat-label">{dayLabel}</span>
      </div>

      <div className="stat-divider" />

      <div className="stat-item">
        <span className="stat-number">{weekCount}</span>
        <span className="stat-label">Next 7 Days</span>
      </div>
    </div>
  );
}
