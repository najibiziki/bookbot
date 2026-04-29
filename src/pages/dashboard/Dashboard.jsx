import FilterBar from "../../components/filterBar/FilterBar";
import AppointmentTable from "../../components/appointmentTable/AppointmentTable";
import AppointmentCalendar from "../../components/appointmentCalendar/AppointmentCalendar";
import AppointmentStats from "../../components/appointmentStats/AppointmentStats";
import LoadingPage from "../../components/loadingPage/LoadingPage";
import { useAppointments } from "../../hooks/appointment/useAppointments";
import "./Dashboard.css";

export default function Dashboard() {
  const token = JSON.parse(localStorage.getItem("userInfo"))?.token;

  const {
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
  } = useAppointments(token);

  if (loading) return <LoadingPage />;

  return (
    <div className="page-wrapper">
      <div className="layout-grid">
        <div className="sidebar-left">
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

          <AppointmentStats
            dayCount={sortedAppointments.length}
            weekCount={weekAppointments}
            selectedDay={selectedDay}
          />
        </div>

        <div className="table-container">
          {viewMode === "table" ? (
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
              staff={selectedStaffData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
