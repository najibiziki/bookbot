import TimezoneSelect from "react-timezone-select";
import "./BasicInfo.css";

function BasicInfo({ formData, handlers, isAdmin }) {
  return (
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
            placeholder="Public contact number"
            value={formData.phoneNumber}
            onChange={handlers.handleFormChange}
          />
        </div>

        <div className="form-group admin-field">
          <label>WhatsApp Phone ID</label>
          <input
            type="text"
            name="phoneId"
            placeholder="ID from Meta Dashboard"
            value={formData.phoneId}
            onChange={handlers.handleFormChange}
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
  );
}

export default BasicInfo;
