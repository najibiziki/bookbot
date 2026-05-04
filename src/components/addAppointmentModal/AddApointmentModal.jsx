import "./AddAppointmentModal.css";
import useAppointmentFormLogic from "../../hooks/appointment/useAddApointment";

export default function AddAppointmentModal({
  slotData,
  services = [],
  onClose,
  onSubmit,
}) {
  if (!slotData) return null;

  const {
    date,
    clientName,
    clientPhone,
    selectedServiceId,
    startTime,
    isSubmitting,
    isTimeInvalid,
    selectedService,
    pricing,
    timeHint,
    isTimeValid,
    calculatedEndTime,
    customDuration,
    setClientName,
    setClientPhone,
    setSelectedServiceId,
    setCustomDuration,
    handleTimeChange,
    handleSubmit,
  } = useAppointmentFormLogic(slotData, services, onSubmit);

  const baseDurationText = selectedService
    ? selectedService.duration || selectedService.serviceDuration || 0
    : 0;

  const extraTime = Number(slotData.staff?.extraTime || 0);
  const totalDefaultDuration = baseDurationText + extraTime;

  // CLEAN LOGIC: null = show default, "" = show empty (user cleared it), "25" = show 25
  const durationInputValue =
    customDuration !== null
      ? customDuration
      : selectedService
        ? totalDefaultDuration
        : "";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-title">New Appointment</h2>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-line-one">
            <div className="addapointment-form-group">
              <label>Client Name</label>
              <input
                type="text"
                placeholder="Najib IZIKI"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
            <div className="addapointment-form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="+212611693494"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-line-two">
            <div className="addapointment-form-group">
              <label>Staff</label>
              <input
                type="text"
                value={slotData.staff?.name || "Any"}
                disabled
                className="input-disabled"
              />
            </div>

            <div className="addapointment-form-group">
              <label>Service</label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                required
                className="input-select"
              >
                <option value="" disabled>
                  Select...
                </option>
                {services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="addapointment-form-group">
              <label>Duration (m)</label>
              <input
                type="number"
                inputMode="numeric"
                min="5"
                value={durationInputValue}
                onChange={(e) => setCustomDuration(e.target.value)}
                className="input-select"
              />
            </div>

            <div className="addapointment-form-group">
              <label>Price</label>
              {pricing ? (
                <div className="price-badge">
                  <span className="price-main">${pricing.total}</span>
                  {pricing.extra > 0 && (
                    <span className="price-sub">+${pricing.extra} extra</span>
                  )}
                </div>
              ) : (
                <div className="price-badge price-empty">$0.00</div>
              )}
            </div>
          </div>

          <div className="modal-line-three">
            <div className="addapointment-form-group">
              <label>Date</label>
              <input
                type="date"
                value={date}
                disabled
                className="input-disabled"
              />
            </div>

            <div className="addapointment-form-group">
              <label>Start Time</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="HH:mm"
                maxLength={5}
                value={startTime}
                className={isTimeInvalid ? "addapointment-input-error" : ""}
                onChange={handleTimeChange}
                required
              />
              <span className="addapointment-time-hint">{timeHint}</span>
            </div>

            <div className="addapointment-form-group">
              <label>End Time</label>
              <input
                type="text"
                value={calculatedEndTime}
                disabled
                className="input-disabled"
              />
            </div>
          </div>

          <button
            type="submit"
            className="modal-submit-btn"
            disabled={!selectedServiceId || isSubmitting || !isTimeValid}
          >
            {isSubmitting ? "Saving..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}
