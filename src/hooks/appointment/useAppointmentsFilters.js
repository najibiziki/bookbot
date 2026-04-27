import { useMemo } from "react";
import moment from "moment-timezone";

export const useAppointmentsFilters = ({
  appointments,
  selectedStaff,
  selectedDay,
  timezone,
}) => {
  const staffList = useMemo(() => {
    return [...new Set(appointments.map((a) => a.staffName))]
      .filter(Boolean)
      .sort();
  }, [appointments]);

  const filteredByStaff = useMemo(() => {
    return selectedStaff === "all"
      ? appointments
      : appointments.filter((a) => a.staffName === selectedStaff);
  }, [appointments, selectedStaff]);

  const futureAppointments = useMemo(() => {
    return filteredByStaff.filter((a) => new Date(a.startTime) >= new Date());
  }, [filteredByStaff]);

  const filteredByDay = useMemo(() => {
    if (!selectedDay) return futureAppointments;

    return futureAppointments.filter((a) => {
      const date = moment.utc(a.startTime).tz(timezone).format("YYYY-MM-DD");

      return date === selectedDay;
    });
  }, [futureAppointments, selectedDay, timezone]);

  const sortedAppointments = useMemo(() => {
    return [...filteredByDay].sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime),
    );
  }, [filteredByDay]);

  return {
    staffList,
    sortedAppointments,
  };
};
