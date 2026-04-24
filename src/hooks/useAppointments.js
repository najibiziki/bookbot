import { useState, useEffect, useRef } from "react"; // Added useRef
import API_URL from "../api"; // Adjust path based on where you put this hook

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState("all");

  // --- MOVED DROPDOWN LOGIC HERE ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token = userInfo ? userInfo.token : null;

  // Fetch Appointments
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

  // Close dropdown if clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle selecting a staff member from the custom dropdown
  const handleSelect = (staff) => {
    setSelectedStaff(staff);
    setIsDropdownOpen(false);
  };
  // ---------------------------------

  // Extract unique staff names
  const staffList = [...new Set(appointments.map((app) => app.staffName))]
    .filter(Boolean)
    .sort();

  // Filter by selected staff
  const filteredAppointments =
    selectedStaff === "all"
      ? appointments
      : appointments.filter((app) => app.staffName === selectedStaff);

  // Filter ONLY future appointments
  const futureAppointments = filteredAppointments.filter(
    (app) => new Date(app.startTime) >= new Date(),
  );

  // Sort upcoming soonest first
  const sortedAppointments = [...futureAppointments].sort(
    (a, b) => new Date(a.startTime) - new Date(b.startTime),
  );

  // Phone formatting utilities
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
    isDropdownOpen,
    setIsDropdownOpen,
    selectedStaff,
    dropdownRef,
    handleSelect,
    loading,
    formatPhoneNumber,
    getCleanPhone,
    timezone,
  };
};
