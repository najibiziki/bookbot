import { Link } from "react-router-dom";
import useAdminDashboard from "../../hooks/useAdminDashBoard";
import "./AdminDashboard.css";

function AdminDashboard() {
  const {
    businesses,
    loading,
    accessToken,
    setAccessToken,
    handleTokenUpdate,
    handleDelete,
    handleToggleStatus,
  } = useAdminDashboard();

  if (loading) return <div className="admin-container">Loading...</div>;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>

      {/* Global Token Update Section */}
      <div className="token-update-card">
        <h3>Global Access Token</h3>
        <p>Update the WhatsApp Access Token for all businesses at once.</p>
        <form onSubmit={handleTokenUpdate} className="token-form">
          <input
            type="text"
            placeholder="Paste new Access Token here..."
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
          />
          <button type="submit" className="btn-update-token">
            Update All
          </button>
        </form>
      </div>

      {/* Business Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Owner</th>
              <th>Phone Number</th>
              <th>Status</th>
              <th>Trial</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((biz) => {
              const showPaidDate =
                biz.ownerId?.paidUntil && biz.ownerId?.isActive;
              const showTrialDate =
                biz.ownerId?.isOnTrial && biz.ownerId?.trialEndsAt;

              return (
                <tr key={biz._id}>
                  <td data-label="Owner">{biz.owner || "N/A"}</td>
                  <td data-label="Phone">{biz.phoneNumber || "N/A"}</td>

                  {/* Status Column */}
                  <td data-label="Status" className="status-cell">
                    <button
                      className={`toggle-btn ${biz.ownerId?.isActive ? "active-green" : "inactive-red"}`}
                      onClick={() =>
                        handleToggleStatus(
                          biz.ownerId?._id,
                          "isActive",
                          !biz.ownerId?.isActive,
                        )
                      }
                    >
                      {biz.ownerId?.isActive ? "Active" : "Inactive"}
                    </button>
                    <div className="date-info">
                      {showPaidDate && (
                        <small>
                          Paid until: {formatDate(biz.ownerId.paidUntil)}
                        </small>
                      )}
                      {showTrialDate && (
                        <small>
                          Trial ends: {formatDate(biz.ownerId.trialEndsAt)}
                        </small>
                      )}
                    </div>
                  </td>

                  {/* Trial Column */}
                  <td data-label="Trial">
                    <button
                      className={`toggle-btn ${biz.ownerId?.isOnTrial ? "trial-active" : "trial-inactive"}`}
                      onClick={() =>
                        handleToggleStatus(
                          biz.ownerId?._id,
                          "isOnTrial",
                          !biz.ownerId?.isOnTrial,
                        )
                      }
                    >
                      {biz.ownerId?.isOnTrial ? "On Trial" : "Enable"}
                    </button>
                  </td>

                  {/* Actions Column */}
                  <td data-label="Action" className="action-cell">
                    <Link
                      to={`/admin/edit/${biz._id}`}
                      className="btn-edit-admin"
                    >
                      <i className="fas fa-pen"></i>
                    </Link>
                    <button
                      className="btn-delete-admin"
                      onClick={() => handleDelete(biz._id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;
