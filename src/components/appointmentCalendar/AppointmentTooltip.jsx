import "./AppointmentTooltip.css";
import CallButton from "../buttons/CallButton";
import WhatsAppButton from "../buttons/WhatsAppButton";

export default function AppointmentTooltip({
  app,
  appStart,
  appEnd,
  position = "center",
}) {
  let tooltipStyle = {};

  if (position === "left") {
    tooltipStyle = {
      right: "0",
      left: "auto",
      transform: "none",
      "--arrow-left": "auto",
      "--arrow-right": "8px",
      "--arrow-transform": "none",
    };
  } else if (position === "right") {
    tooltipStyle = {
      left: "0",
      right: "auto",
      transform: "none",
      "--arrow-left": "8px",
      "--arrow-right": "auto",
      "--arrow-transform": "none",
    };
  } else {
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
      style={tooltipStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="h-cal-tooltip-info">
        <div className="h-cal-tooltip-name">{app.clientName}</div>
        <div className="h-cal-tooltip-time">
          {appStart.format("HH:mm")}-{appEnd.format("HH:mm")} | $
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
