import { useState } from "react";
import moment from "moment-timezone";
import "./AppointmentCalendar.css";

import {
  createCalendarLayout,
  classifyWeekDays,
  getDaySignature,
  extractTemplateSegments,
  getDayKey,
} from "../../utils/calendarLogic";

import CalendarHourHeader from "../calendarHeader/CalendarHourHeader";
import AppointmentTooltip from "./AppointmentTooltip";

export default function AppointmentCalendar({
  appointments,
  selectedDay,
  timezone,
  workingPeriods,
}) {
  const freeTimeColor = "#e2e8f0";
  const [activeTooltip, setActiveTooltip] = useState(null);

  const startOfWeek = moment(selectedDay).startOf("isoWeek");
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    startOfWeek.clone().add(i, "days"),
  );

  const selectedDayKey = getDayKey(moment(selectedDay));
  const normalLayout = createCalendarLayout(
    workingPeriods,
    selectedDayKey,
    freeTimeColor,
  );
  const rawTemplate = extractTemplateSegments(workingPeriods);
  const { normalDays, exceptionDays } = classifyWeekDays(
    weekDays,
    workingPeriods,
    rawTemplate,
  );

  const renderDayRow = (day, layout) => {
    const dayKey = getDayKey(day);
    const dayShifts = layout.getShiftsForDay(dayKey);
    const isOff = !dayShifts.length;
    const dayId = day.format("YYYY-MM-DD");

    const dayApps = appointments.filter(
      (a) =>
        moment.utc(a.startTime).tz(timezone).format("YYYY-MM-DD") === dayId,
    );

    return (
      <div
        className={`h-cal-row ${day.isSame(moment(), "day") ? "is-today" : ""}`}
      >
        <div className="h-cal-day-label">
          <div className="h-cal-day-name">{day.format("ddd")}</div>
          <div className="h-cal-day-num">{day.format("DD")}</div>
        </div>

        <div
          className="h-cal-time-track"
          style={{
            backgroundImage: layout.buildBackground(dayShifts),
            backgroundColor: isOff ? freeTimeColor : "transparent",
          }}
        >
          {dayApps.map((app, index) => {
            const appStart = moment.utc(app.startTime).tz(timezone);
            const appEnd = moment.utc(app.endTime).tz(timezone);
            const styles = layout.getStyle(appStart, appEnd);

            // FOOLPROOF POSITIONING BASED ON PHYSICAL LOCATION
            const leftPercent = parseFloat(styles.left) || 0;
            let tooltipPosition = "center";

            if (leftPercent <= 15) {
              // Block is on the far left edge -> stretch popup to the right
              tooltipPosition = "right";
            } else if (leftPercent >= 75) {
              // Block is on the far right edge -> stretch popup to the left
              tooltipPosition = "left";
            }

            return (
              <div
                key={app._id}
                className="h-cal-appointment-wrapper"
                style={{ left: styles.left, width: styles.width }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltip(activeTooltip === app._id ? null : app._id);
                }}
              >
                <div className="h-cal-appointment">
                  <span className="h-cal-app-name">{app.clientName}</span>
                  {styles.duration >= 40 && (
                    <span className="h-cal-app-time">
                      {appStart.format("HH:mm")}-{appEnd.format("HH:mm")}
                    </span>
                  )}
                </div>

                {activeTooltip === app._id && (
                  <AppointmentTooltip
                    app={app}
                    appStart={appStart}
                    appEnd={appEnd}
                    position={tooltipPosition}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (normalLayout.isFullyEmpty) {
    return (
      <div
        className="h-calendar-container"
        style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}
      >
        No working hours set
      </div>
    );
  }

  let lastLayoutSignature = null;

  return (
    <div
      className="h-calendar-container"
      onClick={() => setActiveTooltip(null)}
    >
      {weekDays.map((day) => {
        const dayId = day.format("YYYY-MM-DD");
        const isException = exceptionDays.has(dayId);
        const layoutSignature = getDaySignature(day, workingPeriods);
        const isOffDay = layoutSignature === "off";
        let currentLayout = normalLayout;

        if (isException) {
          const dayKey = getDayKey(day);
          currentLayout = createCalendarLayout(
            { [dayKey]: workingPeriods[dayKey] },
            dayKey,
            freeTimeColor,
          );
        }

        const shouldShowHeader =
          layoutSignature !== lastLayoutSignature && !isOffDay;
        lastLayoutSignature = layoutSignature;

        return (
          <div key={dayId}>
            {shouldShowHeader && <CalendarHourHeader layout={currentLayout} />}
            {renderDayRow(day, currentLayout)}
          </div>
        );
      })}
    </div>
  );
}
