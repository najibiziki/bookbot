import { useState, useRef, useEffect, useMemo } from "react";
import moment from "moment-timezone";
import API_URL from "../../api";

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
  };
};
