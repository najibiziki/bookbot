import { useState, useRef, useEffect, useMemo } from "react";
import moment from "moment-timezone";
import API_URL from "../../api";

// Add your calendar logic imports here
import {
  createCalendarLayout,
  classifyWeekDays,
  extractTemplateSegments,
  getDayKey,
  getWeekFreeDays,
} from "../../utils/calendarLogic";

const getStored = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch {
    return fallback;
  }
};

export const useAppointments = (token) => {
  const [appointments, setAppointments] = useState([]);
  const [timezone, setTimezone] = useState("UTC");
  const [workingPeriods, setWorkingPeriods] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servicesData, setServicesData] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  const [selectedStaff, setSelectedStaff] = useState(() =>
    getStored("filterStaff", null),
  );
  const [selectedDay, setSelectedDay] = useState(() =>
    getStored("filterDay", new Date().toLocaleDateString("en-CA")),
  );
  const [viewMode, setViewMode] = useState(() =>
    getStored("filterView", "calendar"),
  );

  useEffect(() => {
    localStorage.setItem("filterStaff", selectedStaff || "");
  }, [selectedStaff]);
  useEffect(() => {
    localStorage.setItem("filterDay", selectedDay);
  }, [selectedDay]);
  useEffect(() => {
    localStorage.setItem("filterView", viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [appRes, bizRes] = await Promise.all([
          fetch(`${API_URL}/api/business/appointments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/business/mybusiness`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const appData = await appRes.json();
        const bizData = await bizRes.json();

        if (appRes.ok) {
          setAppointments(appData.appointments || []);
          setTimezone(appData.timezone || "UTC");
        }

        if (bizRes.ok) {
          setWorkingPeriods(bizData.workingPeriods || null);
          setStaffData(bizData.staff || []);
          setServicesData(bizData.services || []);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const staffList = useMemo(() => {
    return [...new Set(appointments.map((a) => a.staffName))]
      .filter(Boolean)
      .sort();
  }, [appointments]);

  const selectedStaffData = useMemo(() => {
    if (!selectedStaff || selectedStaff === "all") return null;
    return staffData.find((s) => s.name === selectedStaff) || null;
  }, [selectedStaff, staffData]);

  const isCalendarDisabled = selectedStaff === "all";

  useEffect(() => {
    if (staffList.length > 0 && selectedStaff === null) {
      setSelectedStaff(staffList[0]);
    }
  }, [staffList, selectedStaff]);

  const sortedAppointments = useMemo(() => {
    if (!selectedStaff) return [];

    const byStaff =
      selectedStaff === "all"
        ? appointments
        : appointments.filter((a) => a.staffName === selectedStaff);

    const future = byStaff.filter((a) => new Date(a.startTime) >= new Date());

    if (!selectedDay) return future;

    const filteredByDate = future.filter((a) => {
      const appDate = moment.utc(a.startTime).tz(timezone);

      if (viewMode === "calendar") {
        const startOfWeek = moment(selectedDay).startOf("isoWeek");
        const endOfWeek = startOfWeek.clone().add(6, "days").endOf("day");
        return (
          appDate.isSameOrAfter(startOfWeek, "day") &&
          appDate.isSameOrBefore(endOfWeek, "day")
        );
      }

      return appDate.format("YYYY-MM-DD") === selectedDay;
    });

    return [...filteredByDate].sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime),
    );
  }, [appointments, selectedStaff, selectedDay, timezone, viewMode]);

  const weekAppointments = useMemo(() => {
    if (!selectedStaff) return 0;

    const byStaff =
      selectedStaff === "all"
        ? appointments
        : appointments.filter((a) => a.staffName === selectedStaff);

    const start = moment(selectedDay).startOf("day");
    const end = moment(selectedDay).add(6, "days").endOf("day");

    return byStaff.filter((a) => {
      const date = moment.utc(a.startTime).tz(timezone);
      return date.isSameOrAfter(start) && date.isSameOrBefore(end);
    }).length;
  }, [appointments, selectedStaff, selectedDay, timezone]);

  // ==========================================
  // MOVED CALENDAR LOGIC HERE
  // ==========================================

  const calendarLayoutData = useMemo(() => {
    if (!workingPeriods || !selectedDay || isCalendarDisabled) return null;

    const freeTimeColor = "#e2e8f0";
    const startDay = moment(selectedDay).startOf("isoWeek");
    const weekDays = Array.from({ length: 7 }, (_, i) =>
      startDay.clone().add(i, "days"),
    );

    const weeklyOff = selectedStaffData?.weeklyOff || [];
    const vacations = selectedStaffData?.vacations || [];
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

    // Performance fix: Group appointments by day once
    const appointmentsByDay = {};
    sortedAppointments.forEach((app) => {
      const dayId = moment.utc(app.startTime).tz(timezone).format("YYYY-MM-DD");
      if (!appointmentsByDay[dayId]) appointmentsByDay[dayId] = [];
      appointmentsByDay[dayId].push(app);
    });

    return {
      freeTimeColor,
      weekDays,
      weekFreeDays,
      normalLayout,
      normalDays,
      exceptionDays,
      appointmentsByDay,
      workingPeriods,
    };
  }, [
    workingPeriods,
    selectedDay,
    selectedStaffData,
    sortedAppointments,
    timezone,
    isCalendarDisabled,
  ]);

  const calculateFreeSlots = (dayShifts, dayApps) => {
    if (!dayShifts?.length) return [];
    const freeSlots = [];

    for (const shift of dayShifts) {
      const shiftStart = shift.startMins;
      const shiftEnd = shift.endMins;

      const appsInShift = dayApps
        .map((app) => {
          const appStart = moment.utc(app.startTime).tz(timezone);
          const appEnd = moment.utc(app.endTime).tz(timezone);
          return {
            startMins: appStart.hours() * 60 + appStart.minutes(),
            endMins: appEnd.hours() * 60 + appEnd.minutes(),
          };
        })
        .filter((a) => a.startMins < shiftEnd && a.endMins > shiftStart)
        .sort((a, b) => a.startMins - b.startMins);

      let currentMins = shiftStart;

      for (const app of appsInShift) {
        if (app.startMins > currentMins) {
          freeSlots.push({ startMins: currentMins, endMins: app.startMins });
        }
        currentMins = Math.max(currentMins, app.endMins);
      }

      if (currentMins < shiftEnd) {
        freeSlots.push({ startMins: currentMins, endMins: shiftEnd });
      }
    }
    return freeSlots;
  };

  // ==========================================
  // END MOVED CALENDAR LOGIC
  // ==========================================

  const handleSelect = (staff) => {
    setSelectedStaff(staff);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    if (isCalendarDisabled && viewMode === "calendar") {
      setViewMode("table");
    }
  }, [isCalendarDisabled, viewMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return {
    loading,
    timezone,
    workingPeriods,
    staffList,
    servicesList: servicesData,
    sortedAppointments,
    weekAppointments,
    selectedStaff,
    setSelectedStaff,
    selectedStaffData,
    selectedDay,
    setSelectedDay,
    viewMode,
    setViewMode,
    isDropdownOpen,
    setIsDropdownOpen,
    dropdownRef,
    isCalendarDisabled,
    handleSelect,
    // Return new calendar data here
    calendarLayoutData,
    calculateFreeSlots,
  };
};
