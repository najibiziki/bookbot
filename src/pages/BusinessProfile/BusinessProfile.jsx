import TimezoneSelect from "react-timezone-select";
import { useParams } from "react-router-dom";
import { useBusinessProfile } from "../../hooks/businessProfile/useBusinessProfile";
import "./BusinessProfile.css";

import BasicInfo from "../../components/basicInfo/BasicInfo";
import WorkingHours from "../../components/workingHours/WorkingHours";
import Staff from "../../components/staff/Staff";
import Services from "../../components/services/Services";
import LoadingPage from "../../components/loadingPage/LoadingPage";

function BusinessProfile() {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token = userInfo ? userInfo.token : null;
  const isAdmin = userInfo && userInfo.isAdmin;
  const { id } = useParams();

  const {
    loading,
    notification,
    business,
    formData,
    schedule,
    staff,
    services,
    handlers,
  } = useBusinessProfile(token, id);

  if (loading) return <LoadingPage />;

  return (
    <div className="profile-container">
      {notification && (
        <div className={`auth-message ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <form onSubmit={handlers.handleSubmit} className="business-form">
        <BasicInfo formData={formData} handlers={handlers} isAdmin={isAdmin} />
        <WorkingHours schedule={schedule} handlers={handlers} />
        <Staff staff={staff} handlers={handlers} />
        <Services services={services} handlers={handlers} />

        <button type="submit" className="btn-primary btn-full">
          {business ? "Update Business" : "Create Business"}
        </button>
      </form>
    </div>
  );
}

export default BusinessProfile;
