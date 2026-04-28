import "./Services.css";

function Services({ services, handlers }) {
  return (
    <section className="form-section">
      <h2>Services</h2>

      {services.map((service, idx) => (
        <div key={idx} className="mini-list-item">
          <div className="input-group">
            <label className="input-label">Service Name</label>
            <input
              type="text"
              value={service.name}
              onChange={(e) =>
                handlers.updateService(idx, "name", e.target.value)
              }
              required
              className="staff-input"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Duration (min)</label>
            <input
              type="number"
              value={service.duration}
              onChange={(e) =>
                handlers.updateService(idx, "duration", e.target.value)
              }
              className="staff-input"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Base Price ($)</label>
            <input
              type="number"
              value={service.price}
              onChange={(e) =>
                handlers.updateService(idx, "price", e.target.value)
              }
              className="staff-input"
            />
          </div>

          <div className="staff-delete-row">
            <button
              type="button"
              className="staff-delete-btn"
              onClick={() => handlers.removeService(idx)}
            >
              <i className="fas fa-trash-alt"></i> {/* RESTORED */} Delete
              Service
            </button>
          </div>
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
  );
}

export default Services;
