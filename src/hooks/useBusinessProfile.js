import { useState, useEffect, useCallback } from "react";
import API_URL from "../api";
import { defaultSchedule } from "../constatnts/scheduleDefaults";

// Custom hook to manage business profile state and logic
export const useBusinessProfile = (token, id) => {
  // Core state
  const [business, setBusiness] = useState(null); // current business data
  const [loading, setLoading] = useState(true); // loading state for API calls
  const [error, setError] = useState(""); // error messages
  const [success, setSuccess] = useState(""); // success messages

  // Form state (basic business info)
  const [formData, setFormData] = useState({
    name: "",
    owner: "",
    phoneNumber: "",
    phoneId: "",
    description: "",
    timezone: "UTC",
    slotStep: "",
  });

  // Complex state
  const [schedule, setSchedule] = useState(defaultSchedule); // working hours
  const [staff, setStaff] = useState([]); // staff list
  const [services, setServices] = useState([]); // services list

  // Fetch business data on mount or when token/id changes
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        // Choose endpoint depending on whether id is provided
        const endpoint = id
          ? `${API_URL}/api/business/${id}`
          : `${API_URL}/api/business/mybusiness`;

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (res.ok) {
          setBusiness(data);

          // Initialize form with fetched data (fallbacks included)
          setFormData({
            name: data.name || "",
            owner: data.owner || "",
            phoneNumber: data.phoneNumber || "",
            phoneId: data.phoneId || "",
            description: data.description || "",
            timezone: data.timezone || "UTC",
            slotStep: data.slotStepMinutes ? String(data.slotStepMinutes) : "",
          });

          // Load schedule or fallback to default
          setSchedule(data.workingPeriods || defaultSchedule);

          // Normalize staff data (convert numbers to strings for inputs)
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

          // Normalize services data
          setServices(
            (data.services || []).map((s) => ({
              ...s,
              duration: s.duration ? String(s.duration) : "",
              price: s.price ? String(s.price) : "",
            })),
          );
        } else {
          // Fallback: detect user timezone if no business found
          const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setFormData((prev) => ({ ...prev, timezone: detected }));
          setBusiness(null);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setBusiness(null);
      } finally {
        setLoading(false); // always stop loading
      }
    };

    fetchBusiness();
  }, [token, id]);

  // --- Handlers ---

  // Generic form input handler
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Timezone selector handler
  const handleTimezoneChange = (tz) => {
    setFormData((prev) => ({ ...prev, timezone: tz.value }));
  };

  // Schedule Helpers

  // Update a specific field in a specific time slot
  const updateSchedule = useCallback((day, index, field, value) => {
    setSchedule((prev) => {
      const newDaySchedule = [...prev[day]];
      newDaySchedule[index][field] = value;
      return { ...prev, [day]: newDaySchedule };
    });
  }, []);

  // Add a new time slot for a day
  const addTimeSlot = useCallback((day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: [...prev[day], { start: "09:00", end: "17:00" }],
    }));
  }, []);

  // Remove a time slot by index
  const removeTimeSlot = useCallback((day, index) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  }, []);

  // Staff Helpers

  // Update a specific staff field
  const updateStaff = useCallback((index, field, value) => {
    setStaff((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }, []);

  // Add new empty staff member
  const addStaff = useCallback(() => {
    setStaff((prev) => [
      ...prev,
      {
        name: "",
        role: "",
        price: "",
        weeklyOff: [],
        vacations: [],
        extraTime: "",
      },
    ]);
  }, []);

  // Remove staff member
  const removeStaff = useCallback((index) => {
    setStaff((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Toggle weekly day off for staff
  const handleStaffDayOff = useCallback((idx, day, isChecked) => {
    setStaff((prev) => {
      const updated = [...prev];
      const currentOff = updated[idx].weeklyOff || [];

      if (isChecked) {
        if (!currentOff.includes(day)) {
          updated[idx].weeklyOff = [...currentOff, day];
        }
      } else {
        updated[idx].weeklyOff = currentOff.filter((d) => d !== day);
      }
      return updated;
    });
  }, []);

  // Add vacation period (avoid duplicate empty entries)
  const addStaffVacation = useCallback((idx) => {
    setStaff((prev) => {
      const updated = [...prev];
      if (!updated[idx].vacations) updated[idx].vacations = [];

      const hasEmpty = updated[idx].vacations.some((v) => !v.start && !v.end);
      if (!hasEmpty) {
        updated[idx].vacations.push({ start: "", end: "" });
      }
      return updated;
    });
  }, []);

  // Update vacation period
  const updateStaffVacation = useCallback((idx, vacIdx, field, value) => {
    setStaff((prev) => {
      const updated = [...prev];
      updated[idx].vacations[vacIdx][field] = value;
      return updated;
    });
  }, []);

  // Remove vacation period
  const removeStaffVacation = useCallback((idx, vacIdx) => {
    setStaff((prev) => {
      const updated = [...prev];
      updated[idx].vacations = updated[idx].vacations.filter(
        (_, i) => i !== vacIdx,
      );
      return updated;
    });
  }, []);

  // Services Helpers

  // Update service field
  const updateService = useCallback((index, field, value) => {
    setServices((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }, []);

  // Add new service
  const addService = useCallback(() => {
    setServices((prev) => [...prev, { name: "", duration: "", price: "" }]);
  }, []);

  // Remove service
  const removeService = useCallback((index) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // --- Submit ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Convert empty string to 0 or number
    const parseNum = (val) => (val === "" ? 0 : Number(val));

    // Prepare payload for API
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

    // Decide between create or update
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
        if (!business) setBusiness(data); // set newly created business
      } else {
        setError(data.message || "Failed to save");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  // Expose state and handlers
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
      handleStaffDayOff,
      addStaffVacation,
      updateStaffVacation,
      removeStaffVacation,
      updateService,
      addService,
      removeService,
      handleSubmit,
    },
  };
};
