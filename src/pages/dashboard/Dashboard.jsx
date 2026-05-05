import FilterBar from "../../components/filterBar/FilterBar";
import AppointmentTable from "../../components/appointmentTable/AppointmentTable";
import AppointmentCalendar from "../../components/appointmentCalendar/AppointmentCalendar";
import AppointmentStats from "../../components/appointmentStats/AppointmentStats";
import LoadingPage from "../../components/loadingPage/LoadingPage";
import AddAppointmentModal from "../../components/addAppointmentModal/AddApointmentModal";
import { useAppointments } from "../../hooks/appointment/useAppointments";
import "./Dashboard.css";

export default function Dashboard() {
  const token = JSON.parse(localStorage.getItem("userInfo"))?.token;

  const {
    loading,
    timezone,
    staffList,
    servicesList,
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
    calendarLayoutData,
    calculateFreeSlots,
    showModal,
    selectedFreeSlot,
    handleFreeSlotClick,
    handleCloseModal,
    handleAddAppointment,
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
              calendarLayoutData={calendarLayoutData}
              calculateFreeSlots={calculateFreeSlots}
              timezone={timezone}
              staff={selectedStaffData}
              services={servicesList}
              onFreeSlotClick={handleFreeSlotClick}
            />
          )}
        </div>
      </div>

      {showModal && selectedFreeSlot && (
        <AddAppointmentModal
          slotData={selectedFreeSlot}
          services={servicesList || []}
          onClose={handleCloseModal}
          onSubmit={handleAddAppointment}
        />
      )}
    </div>
  );
}
