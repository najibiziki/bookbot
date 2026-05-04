import { useState } from "react";
import FilterBar from "../../components/filterBar/FilterBar";
import AppointmentTable from "../../components/appointmentTable/AppointmentTable";
import AppointmentCalendar from "../../components/appointmentCalendar/AppointmentCalendar";
import AppointmentStats from "../../components/appointmentStats/AppointmentStats";
import LoadingPage from "../../components/loadingPage/LoadingPage";
import AddAppointmentModal from "../../components/addAppointmentModal/AddApointmentModal";
import { useAppointments } from "../../hooks/appointment/useAppointments";
import "./Dashboard.css";
import API_URL from "../../api";

export default function Dashboard() {
  const token = JSON.parse(localStorage.getItem("userInfo"))?.token;

  const {
    loading,
    timezone,
    workingPeriods,
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
    calendarLayoutData, // <-- 1. ADD THIS
    calculateFreeSlots, // <-- 2. ADD THIS
  } = useAppointments(token);

  const [selectedFreeSlot, setSelectedFreeSlot] = useState(null);
  const [showModal, setShowModal] = useState(false);

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
    } catch (error) {
      console.error("Error saving appointment:", error);
      alert(error.message || "Something went wrong while booking.");
    }
  };

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
              onFreeSlotClick={handleFreeSlotClick} // <-- 3. FIX TYPO HERE
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
