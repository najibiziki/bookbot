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

const getMomentAtMins = (day, mins) =>
  day.clone().startOf("day").add(mins, "minutes");

export default function AppointmentCalendar({
  calendarLayoutData,
  calculateFreeSlots,
  timezone,
  staff,
  services = [],
  onFreeSlotClick,
  onDeleteAppointment,
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
    exceptionDays,
    appointmentsByDay,
    workingPeriods,
  } = calendarLayoutData;

  const handleFreeSlotClick = (e, slotData) => {
    e.stopPropagation();
    setActiveTooltip(null);
    onFreeSlotClick?.(slotData);
  };

  const getTooltipPosition = (leftPercent) => {
    if (leftPercent <= 15) return "right";
    if (leftPercent >= 75) return "left";
    return "center";
  };

  const getFreeDayClass = (isStaffFreeDay, freeDayType) => {
    if (!isStaffFreeDay) return "";
    return freeDayType === "vacation" ? "is-vacation" : "is-weekly-off";
  };

  const getSlotPayload = (day, slot) => ({
    date: day.format("YYYY-MM-DD"),
    dateMoment: day.clone(),
    startTime: toTimeStr(slot.startMins),
    endTime: toTimeStr(slot.endMins),
    startMins: slot.startMins,
    endMins: slot.endMins,
    duration: slot.endMins - slot.startMins,
    timezone,
    services,
    staff,
  });

  const renderDayRow = (day, layout, isStaffFreeDay, freeDayType) => {
    const dayKey = getDayKey(day);
    const dayId = day.format("YYYY-MM-DD");
    const dayShifts = layout.getShiftsForDay(dayKey);
    const isFullyOff = !dayShifts.length || isStaffFreeDay;
    const dayApps = appointmentsByDay[dayId] || [];
    const freeSlots = calculateFreeSlots(dayShifts, dayApps, dayId);

    return (
      <div
        className={`h-cal-row ${day.isSame(moment(), "day") ? "is-today" : ""} ${getFreeDayClass(isStaffFreeDay, freeDayType)}`}
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
            backgroundColor: isFullyOff ? "#111827" : "transparent",
          }}
        >
          {!isFullyOff &&
            freeSlots.map((slot, index) => {
              const slotStart = getMomentAtMins(day, slot.startMins);
              const slotEnd = getMomentAtMins(day, slot.endMins);
              const duration = slot.endMins - slot.startMins;
              const isDisabled = slotEnd.isBefore(moment()) || duration < 15;
              const styles = layout.getStyle(slotStart, slotEnd);

              return (
                <div
                  key={`${dayId}-free-${index}`}
                  className={`h-cal-free-slot ${isDisabled ? "is-past-slot" : ""}`}
                  style={{ left: styles.left, width: styles.width }}
                  onClick={(e) => {
                    if (isDisabled) return;
                    handleFreeSlotClick(e, getSlotPayload(day, slot));
                  }}
                >
                  {!isDisabled && <div className="h-cal-free-slot-icon">+</div>}
                </div>
              );
            })}

          {!isFullyOff &&
            dayApps.map((app) => {
              const appStart = moment.utc(app.startTime).tz(timezone);
              const appEnd = moment.utc(app.endTime).tz(timezone);
              const styles = layout.getStyle(appStart, appEnd);
              const leftPercent = parseFloat(styles.left) || 0;
              const isActive = activeTooltip === app._id;

              return (
                <div
                  key={app._id}
                  className="h-cal-appointment-wrapper"
                  style={{ left: styles.left, width: styles.width }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTooltip(isActive ? null : app._id);
                  }}
                >
                  <div className="h-cal-appointment">
                    <span className="h-cal-app-name">{app.clientName}</span>
                    {styles.duration >= 40 && (
                      <span className="h-cal-app-time">
                        {appStart.format("HH:mm")}...
                      </span>
                    )}
                  </div>

                  {isActive && (
                    <AppointmentTooltip
                      app={app}
                      appStart={appStart}
                      appEnd={appEnd}
                      position={getTooltipPosition(leftPercent)}
                      onDelete={onDeleteAppointment}
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

        const freeDayType = isStaffFreeDay
          ? staff?.weeklyOff?.includes(getDayKey(day))
            ? "weeklyOff"
            : "vacation"
          : null;

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
          !isOffDay && layoutSignature !== lastLayoutSignatureRef.current;
        if (!isOffDay) {
          lastLayoutSignatureRef.current = layoutSignature;
        }

        return (
          <div key={dayId}>
            {shouldShowHeader && <CalendarHourHeader layout={currentLayout} />}
            {renderDayRow(day, currentLayout, isStaffFreeDay, freeDayType)}
          </div>
        );
      })}
    </div>
  );
}
