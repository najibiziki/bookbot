import { useState, useRef } from "react";
import moment from "moment-timezone";
import "./AppointmentCalendar.css";

import {
  createExceptionDayLayout,
  getDaySignature,
  getDayKey,
  toTimeStr,
} from "../../utils/calendarLogic";

import CalendarHourHeader from "../calendarHeader/CalendarHourHeader";
import AppointmentTooltip from "./AppointmentTooltip";

export default function AppointmentCalendar({
  calendarLayoutData,
  calculateFreeSlots,
  timezone,
  staff,
  services = [],
  onFreeSlotClick,
}) {
  const [activeTooltip, setActiveTooltip] = useState(null);
  const lastLayoutSignatureRef = useRef(null);

  if (!calendarLayoutData) {
    return (
      <div
        className="h-calendar-container"
        style={{ padding: 20, textAlign: "center", color: "#9ca3af" }}
      >
        No working hours set
      </div>
    );
  }

  const {
    freeTimeColor,
    weekDays,
    weekFreeDays,
    normalLayout,
    normalDays,
    exceptionDays,
    appointmentsByDay,
    workingPeriods, // <--- ADD THIS HERE
  } = calendarLayoutData;

  const handleFreeSlotClick = (e, slotData) => {
    e.stopPropagation();
    setActiveTooltip(null);
    if (onFreeSlotClick) onFreeSlotClick(slotData);
  };

  const renderDayRow = (day, layout, isOff, isStaffFreeDay, freeDayType) => {
    const dayKey = getDayKey(day);
    const dayShifts = layout.getShiftsForDay(dayKey);
    const isFullyOff = !dayShifts.length || isStaffFreeDay;
    const dayId = day.format("YYYY-MM-DD");

    const dayApps = appointmentsByDay[dayId] || [];
    const freeSlots = calculateFreeSlots(dayShifts, dayApps);

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
            freeSlots.map((slot, index) => {
              const slotStartMoment = day
                .clone()
                .startOf("day")
                .add(slot.startMins, "minutes");
              const slotEndMoment = day
                .clone()
                .startOf("day")
                .add(slot.endMins, "minutes");
              const styles = layout.getStyle(slotStartMoment, slotEndMoment);
              const slotId = `${dayId}-free-${index}`;
              const duration = slot.endMins - slot.startMins;

              return (
                <div
                  key={slotId}
                  className="h-cal-free-slot"
                  style={{ left: styles.left, width: styles.width }}
                  onClick={(e) =>
                    handleFreeSlotClick(e, {
                      date: dayId,
                      dateMoment: day.clone(),
                      startTime: toTimeStr(slot.startMins),
                      endTime: toTimeStr(slot.endMins),
                      startMins: slot.startMins,
                      endMins: slot.endMins,
                      duration,
                      timezone,
                      services,
                      staff,
                    })
                  }
                >
                  <div className="h-cal-free-slot-icon">+</div>
                </div>
              );
            })}

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
          freeDayType = staff?.weeklyOff?.includes(getDayKey(day))
            ? "weeklyOff"
            : "vacation";
        }

        // FIX: Pass workingPeriods as the 2nd argument, and templateSegments as the 3rd
        const layoutSignature = getDaySignature(
          day,
          workingPeriods,
          normalLayout.templateSegments,
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
          layoutSignature !== lastLayoutSignatureRef.current && !isOffDay;
        if (!isOffDay) lastLayoutSignatureRef.current = layoutSignature;

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
