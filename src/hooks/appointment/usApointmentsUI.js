import { useState, useRef, useEffect } from "react";

export const useAppointmentsUI = () => {
  const [selectedStaff, setSelectedStaff] = useState("all");
  const [selectedDay, setSelectedDay] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [viewMode, setViewMode] = useState("table");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  const isCalendarDisabled = selectedStaff === "all";
  const handleSelect = (staff) => {
    setSelectedStaff(staff);
    setIsDropdownOpen(false);
  };
  useEffect(() => {
    if (isCalendarDisabled && viewMode === "calendar") {
      setViewMode("table");
    }
  }, [isCalendarDisabled, viewMode]);

  return {
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
