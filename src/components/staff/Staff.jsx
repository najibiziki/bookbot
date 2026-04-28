import "./Staff.css";

function Staff({ staff, handlers }) {
  return (
    <section className="form-section">
      <h2>Staff</h2>

      {staff.map((member, idx) => (
        <div key={idx} className="staff-card">
          <div className="staff-main-row">
            <div className="input-group">
              <label className="input-label">Name</label>
              <input
                type="text"
                placeholder="e.g. John"
                value={member.name}
                onChange={(e) =>
                  handlers.updateStaff(idx, "name", e.target.value)
                }
                required
                className="staff-input"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Role</label>
              <input
                type="text"
                placeholder="e.g. Barber"
                value={member.role}
                onChange={(e) =>
                  handlers.updateStaff(idx, "role", e.target.value)
                }
                className="staff-input"
              />
            </div>

            <div className="staff-sub-row">
              <div className="input-group">
                <label className="input-label">Add-ons ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={member.price}
                  onChange={(e) =>
                    handlers.updateStaff(idx, "price", e.target.value)
                  }
                  className="staff-input-sm"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Extra Time (min)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={member.extraTime}
                  onChange={(e) =>
                    handlers.updateStaff(idx, "extraTime", e.target.value)
                  }
                  className="staff-input-sm"
                />
              </div>
            </div>
          </div>

          <div className="staff-section-label">Weekly Days Off</div>

          <div className="days-off-container">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
              const dayVal = day.toLowerCase();
              const isSelected = member.weeklyOff?.includes(dayVal);

              return (
                <div
                  key={day}
                  onClick={() =>
                    handlers.handleStaffDayOff(idx, dayVal, !isSelected)
                  }
                  className={`day-off-pill ${isSelected ? "active" : ""}`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <div className="vacation-box">
            <div className="vacation-title-row">
              <span className="vacation-title">
                <i className="fas fa-plane-departure"></i> {/* RESTORED */}{" "}
                Vacations
              </span>

              <button
                type="button"
                onClick={() => handlers.addStaffVacation(idx)}
                className="vacation-add-icon"
                title="Add vacation"
              >
                <i className="fas fa-plus"></i> {/* RESTORED */}
              </button>
            </div>

            {member.vacations?.length > 0 && (
              <div className="vacation-grid">
                {member.vacations.map((vac, vacIdx) => (
                  <div key={vacIdx} className="vacation-item">
                    <input
                      type="date"
                      value={vac.start ? vac.start.split("T")[0] : ""}
                      onChange={(e) =>
                        handlers.updateStaffVacation(
                          idx,
                          vacIdx,
                          "start",
                          e.target.value,
                        )
                      }
                      className="vacation-input"
                    />

                    <span className="vacation-separator">→</span>

                    <input
                      type="date"
                      value={vac.end ? vac.end.split("T")[0] : ""}
                      onChange={(e) =>
                        handlers.updateStaffVacation(
                          idx,
                          vacIdx,
                          "end",
                          e.target.value,
                        )
                      }
                      className="vacation-input"
                    />

                    <button
                      type="button"
                      onClick={() => handlers.removeStaffVacation(idx, vacIdx)}
                      className="vacation-del-icon"
                    >
                      <i className="fas fa-trash-alt"></i> {/* RESTORED */}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {(!member.vacations || member.vacations.length === 0) && (
              <div className="vacation-empty">No vacations added</div>
            )}
          </div>

          <div className="staff-delete-row">
            <button
              type="button"
              className="staff-delete-btn"
              onClick={() => handlers.removeStaff(idx)}
            >
              <i className="fas fa-trash-alt"></i> {/* RESTORED */} Delete Staff
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="btn-secondary btn-block"
        onClick={handlers.addStaff}
      >
        + Add Staff
      </button>
    </section>
  );
}

export default Staff;
