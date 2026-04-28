import FilterBar from "../../components/filterBar/FilterBar";
import AppointmentTable from "../../components/appointmentTable/AppointmentTable";
import AppointmentCalendar from "../../components/appointmentCalendar/AppointmentCalendar";
import "./Dashboard.css";

import { useAppointmentsData } from "../../hooks/appointment/useAppointmentsData";
import { useAppointmentsFilters } from "../../hooks/appointment/useAppointmentsFilters";
import { useAppointmentsUI } from "../../hooks/appointment/usApointmentsUI";
import LoadingPage from "../../components/loadingPage/LoadingPage";
export default function Dashboard() {
  const ui = useAppointmentsUI();

  const {
    selectedStaff,
    selectedDay,
    viewMode,
    setViewMode,
    isDropdownOpen,
    setIsDropdownOpen,
    dropdownRef,
    setSelectedStaff,
    setSelectedDay,
    isCalendarDisabled,
    handleSelect,
  } = ui;

  const token = JSON.parse(localStorage.getItem("userInfo"))?.token;

  const { appointments, timezone, workingPeriods, loading } =
    useAppointmentsData(token);

  const { staffList, sortedAppointments } = useAppointmentsFilters({
    appointments,
    selectedStaff,
    selectedDay,
    timezone,
  });

  if (loading) return <LoadingPage />;

  const isTableView = viewMode === "table";

  return (
    <div className="page-wrapper">
      {/* NEW WRAPPER FOR GRID LAYOUT */}
      <div className="layout-grid">
        {/* 1. FILTERBAR (Now sits next to the table on big screens) */}
        <FilterBar
          staffList={staffList}
          selectedStaff={selectedStaff}
          setSelectedStaff={setSelectedStaff}
          isDropdownOpen={isDropdownOpen}
          setIsDropdownOpen={setIsDropdownOpen}
          dropdownRef={dropdownRef}
          handleSelect={handleSelect}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isCalendarDisabled={isCalendarDisabled}
        />

        {/* 2. TABLE/CALENDAR CONTAINER */}
        <div className="table-container">
          {isTableView ? (
            <AppointmentTable
              appointments={sortedAppointments}
              timezone={timezone}
            />
          ) : (
            <AppointmentCalendar
              appointments={sortedAppointments}
              selectedDay={selectedDay}
              timezone={timezone}
              workingPeriods={workingPeriods}
            />
          )}
        </div>
      </div>
    </div>
  );
}
