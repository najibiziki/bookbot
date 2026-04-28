import { useState, useEffect } from "react";
import API_URL from "../../api";
import { defaultSchedule } from "../../constatnts/scheduleDefaults";
import { useScheduleManager } from "./useScheduleManager";
import { useStaffManager } from "./useStaffManager";
import { useServicesManager } from "./useServicesManager";

export const useBusinessProfile = (token, id) => {
  // Core UI State
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notification, setNotification] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    owner: "",
    phoneNumber: "",
    phoneId: "",
    description: "",
    timezone: "UTC",
    slotStep: "",
  });

  // --- HIRE THE WORKERS ---
  const { schedule, setSchedule, scheduleHandlers } = useScheduleManager();
  const { staff, setStaff, staffHandlers } = useStaffManager();
  const { services, setServices, serviceHandlers } = useServicesManager();

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const endpoint = id
          ? `${API_URL}/api/business/${id}`
          : `${API_URL}/api/business/mybusiness`;
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok) {
          setBusiness(data);
          setFormData({
            name: data.name || "",
            owner: data.owner || "",
            phoneNumber: data.phoneNumber || "",
            phoneId: data.phoneId || "",
            description: data.description || "",
            timezone: data.timezone || "UTC",
            slotStep: data.slotStepMinutes ? String(data.slotStepMinutes) : "",
          });

          // INJECT DATA INTO WORKERS
          setSchedule(data.workingPeriods || defaultSchedule);
          setStaff(
            (data.staff || []).map((s) => ({
              ...s,
              price: s.price ? String(s.price) : "",
              role: s.role || "",
              weeklyOff: s.weeklyOff || [],
              vacations: s.vacations || [],
              extraTime: s.extraTime ? String(s.extraTime) : "",
            })),
          );
          setServices(
            (data.services || []).map((s) => ({
              ...s,
              duration: s.duration ? String(s.duration) : "",
              price: s.price ? String(s.price) : "",
            })),
          );
        } else {
          const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setFormData((prev) => ({ ...prev, timezone: detected }));
          setBusiness(null);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [token, id]);

  // --- NOTIFICATION TIMERS ---
  useEffect(() => {
    if (error) {
      setNotification({ message: error, type: "error" });
      const timer = setTimeout(() => {
        setNotification(null);
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      setNotification({ message: success, type: "success" });
      const timer = setTimeout(() => {
        setNotification(null);
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // --- BASIC FORM HANDLERS ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimezoneChange = (tz) => {
    setFormData((prev) => ({ ...prev, timezone: tz.value }));
  };

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const parseNum = (val) => (val === "" ? 0 : Number(val));

    const payload = {
      ...formData,
      slotStepMinutes: Number(formData.slotStep),
      workingPeriods: schedule,
      staff: staff.map((s) => ({
        ...s,
        price: parseNum(s.price),
        extraTime: parseNum(s.extraTime),
      })),
      services: services.map((s) => ({
        ...s,
        duration: parseNum(s.duration),
        price: parseNum(s.price),
      })),
    };

    const url = business
      ? `${API_URL}/api/business/${business._id}`
      : `${API_URL}/api/business`;
    const method = business ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("Business saved successfully!");
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (!business) setBusiness(data);
      } else {
        setError(data.message || "Failed to save");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return {
    loading,
    notification,
    business,
    formData,
    schedule,
    staff,
    services,
    handlers: {
      ...scheduleHandlers,
      ...staffHandlers,
      ...serviceHandlers,
      handleFormChange,
      handleTimezoneChange,
      handleSubmit,
    },
  };
};
