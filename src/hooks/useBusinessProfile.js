import { useState, useEffect, useCallback } from "react";
import API_URL from "../api";
import { defaultSchedule } from "../constatnts/scheduleDefaults";

export const useBusinessProfile = (token, id) => {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Grouped Form State
  const [formData, setFormData] = useState({
    name: "",
    owner: "",
    phoneNumber: "",
    phoneId: "",
    description: "",
    timezone: "UTC",
    slotStep: "",
  });

  const [schedule, setSchedule] = useState(defaultSchedule);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);

  // --- Fetch Data ---
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
          setSchedule(data.workingPeriods || defaultSchedule);
          setStaff(
            (data.staff || []).map((s) => ({
              ...s,
              price: s.price ? String(s.price) : "",
              role: s.role || "",
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

  // --- Handlers ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimezoneChange = (tz) => {
    setFormData((prev) => ({ ...prev, timezone: tz.value }));
  };

  // Schedule Helpers
  const updateSchedule = useCallback((day, index, field, value) => {
    setSchedule((prev) => {
      const newDaySchedule = [...prev[day]];
      newDaySchedule[index][field] = value;
      return { ...prev, [day]: newDaySchedule };
    });
  }, []);

  const addTimeSlot = useCallback((day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: [...prev[day], { start: "09:00", end: "17:00" }],
    }));
  }, []);

  const removeTimeSlot = useCallback((day, index) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  }, []);

  // Staff Helpers
  const updateStaff = useCallback((index, field, value) => {
    setStaff((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }, []);

  const addStaff = useCallback(() => {
    setStaff((prev) => [...prev, { name: "", role: "", price: "" }]);
  }, []);

  const removeStaff = useCallback((index) => {
    setStaff((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Services Helpers
  const updateService = useCallback((index, field, value) => {
    setServices((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }, []);

  const addService = useCallback(() => {
    setServices((prev) => [...prev, { name: "", duration: "", price: "" }]);
  }, []);

  const removeService = useCallback((index) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const parseNum = (val) => (val === "" ? 0 : Number(val));

    const payload = {
      ...formData,
      slotStepMinutes: Number(formData.slotStep),
      workingPeriods: schedule,
      staff: staff.map((s) => ({ ...s, price: parseNum(s.price) })),
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
    error,
    success,
    business,
    formData,
    schedule,
    staff,
    services,
    handlers: {
      handleFormChange,
      handleTimezoneChange,
      updateSchedule,
      addTimeSlot,
      removeTimeSlot,
      updateStaff,
      addStaff,
      removeStaff,
      updateService,
      addService,
      removeService,
      handleSubmit,
    },
  };
};
