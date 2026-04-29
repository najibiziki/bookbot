import React from "react";
import "./AppointmentTooltip.css";
import CallButton from "../buttons/CallButton";
import WhatsAppButton from "../buttons/WhatsAppButton";

export default function AppointmentTooltip({
  app,
  appStart,
  appEnd,
  position = "center",
}) {
  // BULLETPROOF INLINE STYLES + CSS VARIABLES FOR THE ARROW
  let tooltipStyle = {};

  if (position === "left") {
    // Lock right edge to block, stretch out to the LEFT
    tooltipStyle = {
      right: "0",
      left: "auto",
      transform: "none",
      "--arrow-left": "auto",
      "--arrow-right": "8px",
      "--arrow-transform": "none",
    };
  } else if (position === "right") {
    // Lock left edge to block, stretch out to the RIGHT
    tooltipStyle = {
      left: "0",
      right: "auto",
      transform: "none",
      "--arrow-left": "8px",
      "--arrow-right": "auto",
      "--arrow-transform": "none",
    };
  } else {
    // Stay centered on the block
    tooltipStyle = {
      left: "50%",
      transform: "translateX(-50%)",
      "--arrow-left": "50%",
      "--arrow-right": "auto",
      "--arrow-transform": "translateX(-50%)",
    };
  }

  return (
    <div
      className="h-cal-tooltip"
      style={tooltipStyle} // Injects all positioning directly into HTML
      onClick={(e) => e.stopPropagation()}
    >
      <div className="h-cal-tooltip-info">
        <div className="h-cal-tooltip-name">{app.clientName}</div>
        <div className="h-cal-tooltip-time">
          {appStart.format("HH:mm")}-{appEnd.format("HH:mm")} • ${" "}
          {app.totalPrice}
        </div>
      </div>

      <div className="h-cal-tooltip-divider" />

      <div className="h-cal-tooltip-actions">
        <CallButton phoneNumber={app.clientPhone} />
        <WhatsAppButton phoneNumber={app.clientPhone} />
      </div>
    </div>
  );
}
