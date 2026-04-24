import { useState, useEffect, useRef } from "react";
import moment from "moment-timezone"; // REQUIRED FOR DAY MATCHING
import API_URL from "../api"; // Adjust path if needed

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState("all");

  // Specific Day state
  const [selectedDay, setSelectedDay] = useState("");

  // Dropdown logic state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token = userInfo ? userInfo.token : null;

  // Fetch Data
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch(`${API_URL}/api/business/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setAppointments(data.appointments);
          setTimezone(data.timezone);
        }
      } catch (err) {
        console.error("Failed to fetch");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [token]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (staff) => {
    setSelectedStaff(staff);
    setIsDropdownOpen(false);
  };

  // Extract unique staff
  const staffList = [...new Set(appointments.map((app) => app.staffName))]
    .filter(Boolean)
    .sort();

  // Filter by Staff
  const filteredAppointments =
    selectedStaff === "all"
      ? appointments
      : appointments.filter((app) => app.staffName === selectedStaff);

  // Filter ONLY future appointments
  let futureAppointments = filteredAppointments.filter(
    (app) => new Date(app.startTime) >= new Date(),
  );

  // Filter by EXACT Selected Day (Timezone aware)
  if (selectedDay) {
    futureAppointments = futureAppointments.filter((app) => {
      const appDateStr = moment
        .utc(app.startTime)
        .tz(timezone)
        .format("YYYY-MM-DD");
      return appDateStr === selectedDay;
    });
  }

  // Sort soonest first
  const sortedAppointments = [...futureAppointments].sort(
    (a, b) => new Date(a.startTime) - new Date(b.startTime),
  );

  // Phone formatting
  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/[+\s\-()]/g, "");
    if (cleaned.startsWith("06"))
      return `+212 ${cleaned.slice(1, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
    if (cleaned.startsWith("6") && cleaned.length === 9)
      return `+212 ${cleaned.slice(0, 1)} ${cleaned.slice(1, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
    if (cleaned.startsWith("2126") && cleaned.length === 12)
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
    return phone.startsWith("+") ? phone : `+${phone}`;
  };

  const getCleanPhone = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/[+\s\-()]/g, "");
    if (cleaned.startsWith("06")) return `212${cleaned.slice(1)}`;
    if (cleaned.startsWith("6") && cleaned.length === 9) return `212${cleaned}`;
    if (cleaned.startsWith("212")) return cleaned;
    return cleaned;
  };

  return {
    sortedAppointments,
    staffList,
    selectedStaff,
    isDropdownOpen,
    setIsDropdownOpen,
    dropdownRef,
    handleSelect,
    loading,
    formatPhoneNumber,
    getCleanPhone,
    timezone,
    selectedDay,
    setSelectedDay,
  };
};
