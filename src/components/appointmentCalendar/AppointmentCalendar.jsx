import { useState } from "react";
import moment from "moment-timezone";
import "./AppointmentCalendar.css";

import {
  createCalendarLayout,
  createExceptionDayLayout,
  classifyWeekDays,
  getDaySignature,
  extractTemplateSegments,
  getDayKey,
  getWeekFreeDays,
} from "../../utils/calendarLogic";

import CalendarHourHeader from "../calendarHeader/CalendarHourHeader";
import AppointmentTooltip from "./AppointmentTooltip";

export default function AppointmentCalendar({
  appointments,
  selectedDay,
  timezone,
  workingPeriods,
  staff = null,
}) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const freeTimeColor = "#e2e8f0";

  // Default to Monday start if viewing today, otherwise start from selected day
  const todayStr = moment().format("YYYY-MM-DD");
  const isDefaultDay = selectedDay === todayStr;
  const startDay = isDefaultDay
    ? moment(selectedDay).startOf("isoWeek")
    : moment(selectedDay);

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    startDay.clone().add(i, "days"),
  );

  const weeklyOff = staff?.weeklyOff || [];
  const vacations = staff?.vacations || [];
  const weekFreeDays = getWeekFreeDays(weekDays, weeklyOff, vacations);

  const templateSegments = extractTemplateSegments(workingPeriods);
  const normalLayout = createCalendarLayout(
    workingPeriods,
    getDayKey(moment(selectedDay)),
    freeTimeColor,
  );

  const { normalDays, exceptionDays } = classifyWeekDays(
    weekDays,
    workingPeriods,
    templateSegments,
  );

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

  const renderDayRow = (day, layout, isOff, isStaffFreeDay, freeDayType) => {
    const dayKey = getDayKey(day);
    const dayShifts = layout.getShiftsForDay(dayKey);
    const isFullyOff = !dayShifts.length || isStaffFreeDay;
    const dayId = day.format("YYYY-MM-DD");

    const dayApps = appointments.filter(
      (a) =>
        moment.utc(a.startTime).tz(timezone).format("YYYY-MM-DD") === dayId,
    );

    const freeDayClass = isStaffFreeDay
      ? freeDayType === "vacation"
        ? "is-vacation"
        : "is-weekly-off"
      : "";

    return (
      <div
        className={`h-cal-row ${day.isSame(moment(), "day") ? "is-today" : ""} ${freeDayClass}`}
      >
        <div className="h-cal-day-label">
          <div className="h-cal-day-name">{day.format("ddd")}</div>
          <div className="h-cal-day-num">{day.format("DD")}</div>
        </div>

        <div
          className="h-cal-time-track"
          style={{
            backgroundImage: isFullyOff
              ? "none"
              : layout.buildBackground(dayShifts),
            backgroundColor: isFullyOff ? freeTimeColor : "transparent",
          }}
        >
          {!isFullyOff &&
            dayApps.map((app) => {
              const appStart = moment.utc(app.startTime).tz(timezone);
              const appEnd = moment.utc(app.endTime).tz(timezone);
              const styles = layout.getStyle(appStart, appEnd);
              const leftPercent = parseFloat(styles.left) || 0;

              const tooltipPosition =
                leftPercent <= 15
                  ? "right"
                  : leftPercent >= 75
                    ? "left"
                    : "center";

              return (
                <div
                  key={app._id}
                  className="h-cal-appointment-wrapper"
                  style={{ left: styles.left, width: styles.width }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTooltip(
                      activeTooltip === app._id ? null : app._id,
                    );
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

  let lastLayoutSignature = null;

  return (
    <div
      className="h-calendar-container"
      onClick={() => setActiveTooltip(null)}
    >
      {weekDays.map((day) => {
        const dayId = day.format("YYYY-MM-DD");
        const isException = exceptionDays.has(dayId);
        const isStaffFreeDay = weekFreeDays.has(dayId);
        const isOff = !normalDays.has(dayId) && !isException;

        let freeDayType = null;
        if (isStaffFreeDay) {
          freeDayType = weeklyOff.includes(getDayKey(day))
            ? "weeklyOff"
            : "vacation";
        }

        const layoutSignature = getDaySignature(
          day,
          workingPeriods,
          templateSegments,
        );
        const isOffDay = layoutSignature === "off" || isStaffFreeDay;
        let currentLayout = normalLayout;

        if (isException && !isStaffFreeDay) {
          const dayShifts = normalLayout.getShiftsForDay(getDayKey(day));
          if (dayShifts.length > 0) {
            currentLayout = createExceptionDayLayout(dayShifts, freeTimeColor);
          }
        }

        const shouldShowHeader =
          layoutSignature !== lastLayoutSignature && !isOffDay;
        if (!isOffDay) lastLayoutSignature = layoutSignature;

        return (
          <div key={dayId}>
            {shouldShowHeader && <CalendarHourHeader layout={currentLayout} />}
            {renderDayRow(
              day,
              currentLayout,
              isOff,
              isStaffFreeDay,
              freeDayType,
            )}
          </div>
        );
      })}
    </div>
  );
}
