import React from "react";
import "./CalendarHourHeader.css";
export default function CalendarHourHeader({ layout }) {
  return (
    <div className="h-cal-header">
      <div className="h-cal-day-label h-cal-header-spacer"></div>
      <div className="h-cal-time-track">
        {layout.hourMarkers.map((m, i) => {
          const leftPercent = layout.timeToPercent(m.time);
          const isAtEnd = leftPercent >= 99; // Prevent end hour from hanging off screen

          return (
            <span
              key={i}
              className="h-cal-hour-marker"
              style={{
                left: `${leftPercent}%`,
                transform: m.isStart
                  ? "translateX(0)"
                  : isAtEnd
                    ? "translateX(-100%)"
                    : "translateX(-50%)",
                paddingLeft: m.isStart ? "3px" : "0",
                paddingRight: isAtEnd ? "3px" : "0",
              }}
            >
              {m.time}
            </span>
          );
        })}
      </div>
    </div>
  );
}
