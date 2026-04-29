import moment from "moment-timezone";
import "./AppointmentTable.css";
import { formatPhoneNumber } from "../../utils/phone";

// Import the new reusable components
import CallButton from "../buttons/CallButton";
import WhatsAppButton from "../buttons/WhatsAppButton";

export default function AppointmentTable({ appointments, timezone }) {
  if (appointments.length === 0) {
    return (
      <p className="empty-state">
        No upcoming appointments for this selection.
      </p>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="appt-table">
        <thead>
          <tr>
            <th className="th-center">Date</th>
            <th>Client</th>
            <th>Service</th>
            <th>Phone</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((app) => (
            <tr key={app._id}>
              <td className="td-date">
                <div className="date-line1">
                  {moment.utc(app.startTime).tz(timezone).format("ddd DD MMM")}
                </div>
                <div className="date-line2">
                  {moment.utc(app.startTime).tz(timezone).format("HH:mm")} -{" "}
                  {moment.utc(app.endTime).tz(timezone).format("HH:mm")}
                </div>
              </td>
              <td className="td-client-info">
                <div className="client-name">{app.clientName}</div>
                <div className="staff-name">{app.staffName}</div>
              </td>
              <td className="td-service">
                <div className="svc-line1">{app.serviceName}</div>
                <div className="svc-line2">
                  {app.totalDuration || app.serviceDuration} min | ${" "}
                  {app.totalPrice}
                </div>
              </td>

              <td className="td-phone">
                <div className="phone-number">
                  {formatPhoneNumber(app.clientPhone)}
                </div>
                <div className="phone-icons">
                  {/* Using the new clean components here */}
                  <CallButton phoneNumber={app.clientPhone} />
                  <WhatsAppButton phoneNumber={app.clientPhone} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
