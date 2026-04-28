import { DAYS } from "../../constatnts/scheduleDefaults";
import "./WorkingHours.css";

function WorkingHours({ schedule, handlers }) {
  return (
    <section className="form-section">
      <h2>Working Hours</h2>

      <div className="schedule-container">
        {DAYS.map((day) => (
          <div key={day} className="schedule-row">
            <div className="day-label">
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </div>

            <div className="shifts-area">
              {schedule[day].length === 0 ? (
                <div className="closed-text">
                  Closed
                  <button
                    type="button"
                    className="add-shift-btn"
                    onClick={() => handlers.addTimeSlot(day)}
                    style={{ marginLeft: "10px" }}
                  >
                    + Add Hours
                  </button>
                </div>
              ) : (
                <>
                  {schedule[day].map((slot, idx) => (
                    <div key={idx} className="shift-group">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) =>
                          handlers.updateSchedule(
                            day,
                            idx,
                            "start",
                            e.target.value,
                          )
                        }
                        className="shift-input"
                      />

                      <span className="shift-arrow">→</span>

                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) =>
                          handlers.updateSchedule(
                            day,
                            idx,
                            "end",
                            e.target.value,
                          )
                        }
                        className="shift-input"
                      />

                      <button
                        type="button"
                        className="shift-remove"
                        onClick={() => handlers.removeTimeSlot(day, idx)}
                      >
                        <i className="fas fa-times"></i> {/* RESTORED */}
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="add-shift-btn"
                    onClick={() => handlers.addTimeSlot(day)}
                  >
                    + Add
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default WorkingHours;
