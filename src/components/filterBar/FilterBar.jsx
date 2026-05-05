import React from "react";
import "./FilterBar.css";

export default function FilterBar({
  staffList,
  selectedStaff,
  setSelectedStaff,
  isDropdownOpen,
  setIsDropdownOpen,
  dropdownRef,
  handleSelect,
  selectedDay,
  setSelectedDay,
  viewMode,
  setViewMode,
  isCalendarDisabled,
}) {
  // Get today's date in YYYY-MM-DD format to block past dates
  const today = new Date().toLocaleDateString("en-CA");

  return (
    <div className="staff-filter">
      {/* STAFF */}
      {staffList.length > 0 && (
        <div className="staff-filter-group">
          <label>Staff</label>

          <div className="custom-select" ref={dropdownRef}>
            <div
              className="select-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>
                {selectedStaff === "all" ? "All Staff" : selectedStaff}
              </span>

              <svg width="12" height="12" viewBox="0 0 16 16" fill="#333">
                <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
              </svg>
            </div>

            {isDropdownOpen && (
              <ul className="select-options">
                <li
                  className={selectedStaff === "all" ? "active" : ""}
                  onClick={() => handleSelect("all")}
                >
                  All Staff
                </li>

                {staffList.map((staff) => (
                  <li
                    key={staff}
                    className={selectedStaff === staff ? "active" : ""}
                    onClick={() => handleSelect(staff)}
                  >
                    {staff}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* DAY */}
      <div className="staff-filter-group">
        <label>Day</label>
        <input
          type="date"
          className="week-input"
          value={selectedDay}
          min={today} // <--- ADDED THIS: Blocks past dates in the picker
          onChange={(e) => setSelectedDay(e.target.value)}
        />
      </div>

      {/* VIEW - CALENDAR FIRST */}
      <div className="staff-filter-group">
        <label>View</label>

        <div className="view-toggle">
          {/* CALENDAR ICON (NOW FIRST) */}
          <button
            disabled={isCalendarDisabled}
            className={viewMode === "calendar" ? "active" : ""}
            onClick={() => setViewMode("calendar")}
            style={{
              opacity: isCalendarDisabled ? 0.5 : 1,
              cursor: isCalendarDisabled ? "not-allowed" : "pointer",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>

          {/* TABLE ICON (NOW SECOND) */}
          <button
            className={viewMode === "table" ? "active" : ""}
            onClick={() => setViewMode("table")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
