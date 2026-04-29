import { useState, useRef, useEffect, useMemo } from "react";
import moment from "moment-timezone";
import API_URL from "../../api";

export const useAppointments = (token) => {
  // ==========================================
  // STATES
  // ==========================================
  const [appointments, setAppointments] = useState([]);
  const [timezone, setTimezone] = useState("UTC");
  const [workingPeriods, setWorkingPeriods] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDay, setSelectedDay] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [viewMode, setViewMode] = useState("calendar");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  // ==========================================
  // FETCH DATA
  // ==========================================
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
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // ==========================================
  // STAFF LIST
  // ==========================================
  const staffList = useMemo(() => {
    return [...new Set(appointments.map((a) => a.staffName))]
      .filter(Boolean)
      .sort();
  }, [appointments]);

  // ==========================================
  // SET DEFAULT STAFF (first one)
  // ==========================================
  useEffect(() => {
    if (staffList.length > 0 && selectedStaff === null) {
      setSelectedStaff(staffList[0]);
    }
  }, [staffList, selectedStaff]);

  // ==========================================
  // DERIVED VALUES
  // ==========================================
  const isCalendarDisabled = selectedStaff === "all";

  // ==========================================
  // FILTER & SORT APPOINTMENTS
  // ==========================================
  const sortedAppointments = useMemo(() => {
    if (!selectedStaff) return [];

    const byStaff =
      selectedStaff === "all"
        ? appointments
        : appointments.filter((a) => a.staffName === selectedStaff);

    const future = byStaff.filter((a) => new Date(a.startTime) >= new Date());

    const byDay = selectedDay
      ? future.filter((a) => {
          const date = moment
            .utc(a.startTime)
            .tz(timezone)
            .format("YYYY-MM-DD");
          return date === selectedDay;
        })
      : future;

    return [...byDay].sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime),
    );
  }, [appointments, selectedStaff, selectedDay, timezone]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleSelect = (staff) => {
    setSelectedStaff(staff);
    setIsDropdownOpen(false);
  };

  // ==========================================
  // SIDE EFFECTS
  // ==========================================
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

  // ==========================================
  // RETURN
  // ==========================================
  return {
    loading,
    timezone,
    workingPeriods,
    staffList,
    sortedAppointments,
    selectedStaff,
    setSelectedStaff,
    selectedDay,
    setSelectedDay,
    viewMode,
    setViewMode,
    isDropdownOpen,
    setIsDropdownOpen,
    dropdownRef,
    isCalendarDisabled,
    handleSelect,
  };
};
