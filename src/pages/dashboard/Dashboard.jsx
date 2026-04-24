import { useState, useEffect } from "react";
import moment from "moment-timezone";
import API_URL from "../../api";
import "./Dashboard.css";

export default function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState("all");

  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token = userInfo ? userInfo.token : null;

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch(`${API_URL}/api/business/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setAppointments(data.appointments);
          setTimezone(data.timezone);
        }
      } catch (err) {
        console.error("Failed to fetch");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [token]);

  // Extract unique staff names
  const staffList = [...new Set(appointments.map((app) => app.staffName))]
    .filter(Boolean)
    .sort();

  // Filter appointments by selected staff
  const filteredAppointments =
    selectedStaff === "all"
      ? appointments
      : appointments.filter((app) => app.staffName === selectedStaff);

  // Format phone number (Moroccan format: +212 6 11 69 34 94)
  const formatPhoneNumber = (phone) => {
    if (!phone) return "";
    const cleaned = phone.replace(/[+\s\-()]/g, "");

    // Handle Moroccan numbers
    if (cleaned.startsWith("06")) {
      return `+212 ${cleaned.slice(1, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
    }
    if (cleaned.startsWith("6") && cleaned.length === 9) {
      return `+212 ${cleaned.slice(0, 1)} ${cleaned.slice(1, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;
    }
    if (cleaned.startsWith("2126") && cleaned.length === 12) {
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
    }
    // Default: add + if not present
    return phone.startsWith("+") ? phone : `+${phone}`;
  };

  // Sort by importance: upcoming first (soonest), then past (most recent)
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const now = new Date();
    const dateA = new Date(a.startTime);
    const dateB = new Date(b.startTime);

    const isUpcomingA = dateA >= now;
    const isUpcomingB = dateB >= now;

    // Upcoming before past
    if (isUpcomingA && !isUpcomingB) return -1;
    if (!isUpcomingA && isUpcomingB) return 1;

    // Within same category: soonest first
    return dateA - dateB;
  });

  if (loading)
    return <div className="table-container">Loading schedule...</div>;

  return (
    <div className="table-container">
      <h2>Appointment Schedule</h2>

      {/* Staff Filter Dropdown */}
      {staffList.length > 0 && (
        <div className="staff-filter">
          <label htmlFor="staff-select">Staff:</label>
          <select
            id="staff-select"
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
          >
            <option value="all">All Staff</option>
            {staffList.map((staff) => (
              <option key={staff} value={staff}>
                {staff}
              </option>
            ))}
          </select>
        </div>
      )}

      {sortedAppointments.length === 0 ? (
        <p className="empty-state">No appointments found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="appt-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Client</th>
                <th>Phone</th>
                <th>Service</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedAppointments.map((app) => (
                <tr key={app._id}>
                  <td className="td-datetime">
                    <div className="date-text">
                      {moment
                        .utc(app.startTime)
                        .tz(timezone)
                        .format("ddd, DD MMM")}
                    </div>
                    <div className="time-text">
                      {moment.utc(app.startTime).tz(timezone).format("HH:mm")} -{" "}
                      {moment.utc(app.endTime).tz(timezone).format("HH:mm")}
                    </div>
                  </td>
                  <td className="td-name">{app.clientName}</td>
                  <td>
                    <a href={`tel:${app.clientPhone}`} className="phone-link">
                      {formatPhoneNumber(app.clientPhone)}
                    </a>
                  </td>
                  <td className="td-service">{app.serviceName}</td>
                  <td className="td-duration">
                    {app.totalDuration || app.serviceDuration}m
                  </td>
                  <td className="td-price">${app.totalPrice}</td>
                  <td>
                    <span className={`status-badge status-${app.status}`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
