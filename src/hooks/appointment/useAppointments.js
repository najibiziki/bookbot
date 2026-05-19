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

const STORAGE_KEYS = {
  STAFF: "filterStaff",
  DAY: "filterDay",
  VIEW: "filterView",
};

const getStored = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : fallback;
  } catch {
    return fallback;
  }
};

const storeFilters = (filters) => {
  try {
    Object.entries(filters).forEach(([key, value]) => {
      localStorage.setItem(key, value ?? "");
    });
  } catch {
    // Storage unavailable - fail silently
  }
};

export const useAppointments = (token) => {
  const [appointments, setAppointments] = useState([]);
  const [timezone, setTimezone] = useState("UTC");
  const [workingPeriods, setWorkingPeriods] = useState(null);
  const [staffData, setStaffData] = useState([]);
  const [servicesData, setServicesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedStaff, setSelectedStaff] = useState(() =>
    getStored(STORAGE_KEYS.STAFF, null),
  );
  const [selectedDay, setSelectedDay] = useState(() =>
    getStored(STORAGE_KEYS.DAY, new Date().toLocaleDateString("en-CA")),
  );
  const [viewMode, setViewMode] = useState(() =>
    getStored(STORAGE_KEYS.VIEW, "calendar"),
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedFreeSlot, setSelectedFreeSlot] = useState(null);

  const dropdownRef = useRef(null);

  const isCalendarDisabled = selectedStaff === "all";

  // Persist filters
  useEffect(() => {
    storeFilters({
      [STORAGE_KEYS.STAFF]: selectedStaff,
      [STORAGE_KEYS.DAY]: selectedDay,
      [STORAGE_KEYS.VIEW]: viewMode,
    });
  }, [selectedStaff, selectedDay, viewMode]);

  // Auto-select first staff member
  useEffect(() => {
    const staffList = getStaffList(staffData, appointments);
    if (staffList.length > 0 && selectedStaff === null) {
      setSelectedStaff(staffList[0]);
    }
  }, [staffData, appointments, selectedStaff]);

  // Fall back to table view when "all" staff selected
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

  // Data fetching
  const fetchInitialData = useCallback(async () => {
    if (!token) return;
    setLoading(true);

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
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Derived data
  const staffList = useMemo(
    () => getStaffList(staffData, appointments),
    [staffData, appointments],
  );

  const selectedStaffData = useMemo(() => {
    if (!selectedStaff || selectedStaff === "all") return null;
    return staffData.find((s) => s.name === selectedStaff) ?? null;
  }, [selectedStaff, staffData]);

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

    const { filtered: byDate } = filterAppointmentsByDate(
      byStaff,
      selectedDay,
      timezone,
      viewMode,
    );

    const finalFiltered = searchQuery.trim()
      ? byDate.filter((a) =>
          a.clientName?.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : byDate;

    return [...finalFiltered].sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime),
    );
  }, [
    appointments,
    selectedStaff,
    selectedDay,
    timezone,
    viewMode,
    searchQuery,
  ]);

  const calendarLayoutData = useMemo(() => {
    if (!workingPeriods || !selectedDay || isCalendarDisabled) return null;

    const startDay = moment(selectedDay).startOf("isoWeek");
    const weekDays = Array.from({ length: 7 }, (_, i) =>
      startDay.clone().add(i, "days"),
    );

    const weeklyOff = selectedStaffData?.weeklyOff || [];
    const vacations = selectedStaffData?.vacations || [];
    const weekFreeDays = getWeekFreeDays(weekDays, weeklyOff, vacations);
    const templateSegments = extractTemplateSegments(workingPeriods);

    const appointmentsByDay = groupAppointmentsByDay(
      sortedAppointments,
      timezone,
    );

    return {
      freeTimeColor: "#e2e8f0",
      weekDays,
      weekFreeDays,
      normalLayout: createCalendarLayout(
        workingPeriods,
        getDayKey(moment(selectedDay)),
        "#e2e8f0",
      ),
      ...classifyWeekDays(weekDays, workingPeriods, templateSegments),
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

  // Handlers
  const handleSelect = useCallback((staff) => {
    setSelectedStaff(staff);
    setIsDropdownOpen(false);
  }, []);

  const handleFreeSlotClick = useCallback((slotData) => {
    setSelectedFreeSlot(slotData);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedFreeSlot(null);
  }, []);

  const handleAddAppointment = useCallback(
    async (payload) => {
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
          return {
            success: false,
            error: data.message || "Failed to create appointment",
          };
        }

        handleCloseModal();
        await fetchInitialData();
        return { success: true };
      } catch (error) {
        console.error("Error saving appointment:", error);
        return { success: false, error: "Something went wrong while booking." };
      }
    },
    [token, handleCloseModal, fetchInitialData],
  );

  const handleDeleteAppointment = useCallback(
    async (appId) => {
      try {
        const response = await fetch(`${API_URL}/api/appointments/${appId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          return {
            success: false,
            error: data.message || "Failed to delete appointment",
          };
        }

        await fetchInitialData();
        return { success: true };
      } catch (error) {
        console.error("Error deleting appointment:", error);
        return {
          success: false,
          error: "Something went wrong while deleting.",
        };
      }
    },
    [token, fetchInitialData],
  );

  const calculateFreeSlots = useCallback(
    (dayShifts, dayApps) => {
      if (!dayShifts?.length) return [];

      const freeSlots = [];

      for (const { startMins: shiftStart, endMins: shiftEnd } of dayShifts) {
        const appsInShift = dayApps
          .map((app) => ({
            startMins: getTimeMins(app.startTime, timezone),
            endMins: getTimeMins(app.endTime, timezone),
          }))
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

  return {
    // Data
    loading,
    timezone,
    workingPeriods,
    staffList,
    servicesList: servicesData,
    sortedAppointments,
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
    searchQuery,
    setSearchQuery,

    // Dropdown
    isDropdownOpen,
    setIsDropdownOpen,
    dropdownRef,
    handleSelect,

    // Calendar
    calculateFreeSlots,

    // Modal
    showModal,
    selectedFreeSlot,
    handleFreeSlotClick,
    handleCloseModal,

    // Actions
    handleAddAppointment,
    handleDeleteAppointment,
  };
};

// Helper functions
function getStaffList(staffData, appointments) {
  const bizStaffNames = (staffData || []).map((s) => s.name).filter(Boolean);
  const appointmentStaffNames = appointments
    .map((a) => a.staffName)
    .filter(Boolean);
  return [...new Set([...bizStaffNames, ...appointmentStaffNames])].sort();
}

function filterAppointmentsByDate(
  appointments,
  selectedDay,
  timezone,
  viewMode,
) {
  const startOfSelectedWeek = moment(selectedDay).startOf("isoWeek");
  const startOfCurrentWeek = moment().tz(timezone).startOf("isoWeek");
  const endOfWeek = startOfSelectedWeek.clone().add(6, "days").endOf("day");
  const isPastWeek = startOfSelectedWeek.isBefore(startOfCurrentWeek, "day");

  const filtered = appointments.filter((a) => {
    const appDate = moment.utc(a.startTime).tz(timezone);

    if (viewMode === "calendar") {
      if (isPastWeek) return false;
      return (
        appDate.isSameOrAfter(startOfSelectedWeek, "day") &&
        appDate.isSameOrBefore(endOfWeek, "day")
      );
    }

    return appDate.format("YYYY-MM-DD") === selectedDay;
  });

  return { filtered };
}

function groupAppointmentsByDay(appointments, timezone) {
  return appointments.reduce((acc, app) => {
    const dayId = moment.utc(app.startTime).tz(timezone).format("YYYY-MM-DD");
    (acc[dayId] ??= []).push(app);
    return acc;
  }, {});
}

function getTimeMins(dateString, timezone) {
  const m = moment.utc(dateString).tz(timezone);
  return m.hours() * 60 + m.minutes();
}
