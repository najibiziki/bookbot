import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import moment from "moment-timezone";
import API_URL from "../../api";
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

const STORAGE_KEYS = {
  STAFF: "filterStaff",
  DAY: "filterDay",
  VIEW: "filterView",
};

export const useAppointments = (token) => {
  // Data state
  const [appointments, setAppointments] = useState([]);
  const [timezone, setTimezone] = useState("UTC");
  const [workingPeriods, setWorkingPeriods] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [servicesData, setServicesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedStaff, setSelectedStaff] = useState(() =>
    getStored(STORAGE_KEYS.STAFF, null),
  );
  const [selectedDay, setSelectedDay] = useState(() =>
    getStored(STORAGE_KEYS.DAY, new Date().toLocaleDateString("en-CA")),
  );
  const [viewMode, setViewMode] = useState(() =>
    getStored(STORAGE_KEYS.VIEW, "calendar"),
  );

  // UI state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedFreeSlot, setSelectedFreeSlot] = useState(null);

  // Sync filters to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAFF, selectedStaff || "");
    localStorage.setItem(STORAGE_KEYS.DAY, selectedDay);
    localStorage.setItem(STORAGE_KEYS.VIEW, viewMode);
  }, [selectedStaff, selectedDay, viewMode]);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    if (!token) return;

    try {
      const [appRes, bizRes] = await Promise.all([
        fetch(`${API_URL}/api/business/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/business/mybusiness`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [appData, bizData] = await Promise.all([
        appRes.json(),
        bizRes.json(),
      ]);

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
  }, [token]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Derived data
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

  // Set default staff when list is available
  useEffect(() => {
    if (staffList.length > 0 && selectedStaff === null) {
      setSelectedStaff(staffList[0]);
    }
  }, [staffList, selectedStaff]);

  // Fall back to table view when calendar is disabled
  useEffect(() => {
    if (isCalendarDisabled && viewMode === "calendar") {
      setViewMode("table");
    }
  }, [isCalendarDisabled, viewMode]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered and sorted appointments
  const sortedAppointments = useMemo(() => {
    if (!selectedStaff) return [];

    const byStaff =
      selectedStaff === "all"
        ? appointments
        : appointments.filter((a) => a.staffName === selectedStaff);

    if (!selectedDay) {
      return byStaff
        .filter((a) => new Date(a.startTime) >= new Date())
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }

    const filteredByDate = byStaff.filter((a) => {
      const appDate = moment.utc(a.startTime).tz(timezone);

      if (viewMode === "calendar") {
        const startOfSelectedWeek = moment(selectedDay).startOf("isoWeek");
        const startOfCurrentWeek = moment().tz(timezone).startOf("isoWeek");

        if (startOfSelectedWeek.isBefore(startOfCurrentWeek, "day")) {
          return false;
        }

        const endOfWeek = startOfSelectedWeek
          .clone()
          .add(6, "days")
          .endOf("day");

        return (
          appDate.isSameOrAfter(startOfSelectedWeek, "day") &&
          appDate.isSameOrBefore(endOfWeek, "day")
        );
      }

      return appDate.format("YYYY-MM-DD") === selectedDay;
    });

    return [...filteredByDate].sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime),
    );
  }, [appointments, selectedStaff, selectedDay, timezone, viewMode]);

  // Count appointments for the week
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

  // Calendar layout data
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

  // Calculate free slots for a given day
  const calculateFreeSlots = useCallback(
    (dayShifts, dayApps) => {
      if (!dayShifts?.length) return [];

      const freeSlots = [];

      for (const shift of dayShifts) {
        const { startMins: shiftStart, endMins: shiftEnd } = shift;
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
    },
    [timezone],
  );

  // Handlers
  const handleSelect = (staff) => {
    setSelectedStaff(staff);
    setIsDropdownOpen(false);
  };

  const handleFreeSlotClick = (slotData) => {
    setSelectedFreeSlot(slotData);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFreeSlot(null);
  };

  const handleAddAppointment = async (payload) => {
    try {
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create appointment");
      }

      handleCloseModal();
      await fetchInitialData();
    } catch (error) {
      console.error("Error saving appointment:", error);
      alert(error.message || "Something went wrong while booking.");
    }
  };

  return {
    // Data
    loading,
    timezone,
    workingPeriods,
    staffList,
    servicesList: servicesData,

    // Filtered data
    sortedAppointments,
    weekAppointments,
    calendarLayoutData,

    // Filters
    selectedStaff,
    setSelectedStaff,
    selectedStaffData,
    selectedDay,
    setSelectedDay,
    viewMode,
    setViewMode,
    isCalendarDisabled,

    // UI
    isDropdownOpen,
    setIsDropdownOpen,
    dropdownRef,

    // Handlers
    handleSelect,
    calculateFreeSlots,

    // Modal
    showModal,
    selectedFreeSlot,
    handleFreeSlotClick,
    handleCloseModal,
    handleAddAppointment,
  };
};
