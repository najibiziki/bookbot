import TimezoneSelect from "react-timezone-select";
import { useParams } from "react-router-dom";
import { useBusinessProfile } from "../../hooks/useBusinessProfile";
import { DAYS } from "../../constatnts/scheduleDefaults";
import "./BusinessProfile.css";

function BusinessProfile() {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token = userInfo ? userInfo.token : null;
  const isAdmin = userInfo && userInfo.isAdmin;
  const { id } = useParams();

  const {
    loading,
    error,
    success,
    business,
    formData,
    schedule,
    staff,
    services,
    handlers,
  } = useBusinessProfile(token, id);

  if (loading) return <div className="profile-container">Loading...</div>;

  return (
    <div className="profile-container">
      <h1>{business ? "Edit Business" : "Create Business"}</h1>

      {error && <div className="auth-message error">{error}</div>}
      {success && <div className="auth-message success">{success}</div>}

      <form onSubmit={handlers.handleSubmit} className="business-form">
        {/* Basic Info */}
        <section className="form-section">
          <h2>Basic Information</h2>

          <div className="contact-grid">
            <div className="form-group">
              <label>Owner Name</label>
              <input
                type="text"
                name="owner"
                placeholder="e.g. Alexandra"
                value={formData.owner}
                onChange={handlers.handleFormChange}
              />
            </div>

            <div className="form-group">
              <label>Business Name *</label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Joe's Barber Shop"
                value={formData.name}
                onChange={handlers.handleFormChange}
                required
              />
            </div>
          </div>

          <div className="contact-grid">
            <div className="form-group">
              <label>Contact Phone</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handlers.handleFormChange}
                placeholder="Public contact number"
              />
            </div>

            <div className="form-group admin-field">
              <label>WhatsApp Phone ID </label>
              <input
                type="text"
                name="phoneId"
                value={formData.phoneId}
                onChange={handlers.handleFormChange}
                placeholder="ID from Meta Dashboard"
                disabled={!isAdmin}
              />
              {!isAdmin && <small className="helper-text">Read-only</small>}
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handlers.handleFormChange}
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Timezone</label>
              <TimezoneSelect
                value={formData.timezone}
                onChange={handlers.handleTimezoneChange}
                styles={{
                  control: (provided) => ({
                    ...provided,
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "2px",
                    backgroundColor: "#f9fafb",
                  }),
                }}
              />
              <small className="helper-text">
                Booking times will be saved in this timezone.
              </small>
            </div>
            <div className="form-group">
              <label>Booking Interval (min)</label>
              <input
                type="number"
                name="slotStep"
                placeholder="e.g. 5"
                value={formData.slotStep}
                onChange={handlers.handleFormChange}
              />
            </div>
          </div>
        </section>

        {/* Working Hours */}
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
                            <i className="fas fa-times"></i>
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

        {/* Staff & Services */}
        <div className="grid-2-col">
          <section className="form-section">
            <h2>Staff</h2>
            {staff.map((member, idx) => (
              <div key={idx} className="mini-list-item">
                <input
                  type="text"
                  placeholder="Name"
                  value={member.name}
                  onChange={(e) =>
                    handlers.updateStaff(idx, "name", e.target.value)
                  }
                  required
                />
                <input
                  type="text"
                  placeholder="Role (e.g. Barber)"
                  value={member.role}
                  onChange={(e) =>
                    handlers.updateStaff(idx, "role", e.target.value)
                  }
                />
                <input
                  type="number"
                  placeholder="Price ($)"
                  value={member.price}
                  onChange={(e) =>
                    handlers.updateStaff(idx, "price", e.target.value)
                  }
                />
                <button
                  type="button"
                  className="btn-icon-remove"
                  onClick={() => handlers.removeStaff(idx)}
                >
                  <i className="fas fa-trash"></i>
                </button>
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

          <section className="form-section">
            <h2>Services</h2>
            {services.map((service, idx) => (
              <div key={idx} className="mini-list-item">
                <input
                  type="text"
                  placeholder="Service Name"
                  value={service.name}
                  onChange={(e) =>
                    handlers.updateService(idx, "name", e.target.value)
                  }
                  required
                />
                <input
                  type="number"
                  placeholder="Duration (min)"
                  value={service.duration}
                  onChange={(e) =>
                    handlers.updateService(idx, "duration", e.target.value)
                  }
                />
                <input
                  type="number"
                  placeholder="Price ($)"
                  value={service.price}
                  onChange={(e) =>
                    handlers.updateService(idx, "price", e.target.value)
                  }
                />
                <button
                  type="button"
                  className="btn-icon-remove"
                  onClick={() => handlers.removeService(idx)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn-secondary btn-block"
              onClick={handlers.addService}
            >
              + Add Service
            </button>
          </section>
        </div>

        <button type="submit" className="btn-primary btn-full">
          {business ? "Update Business" : "Create Business"}
        </button>
      </form>
    </div>
  );
}

export default BusinessProfile;
