import { useState, useCallback } from "react";

export const useStaffManager = (initialData = []) => {
  const [staff, setStaff] = useState(initialData);

  const updateStaff = useCallback((index, field, value) => {
    setStaff((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }, []);

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

  const removeStaff = useCallback((index) => {
    setStaff((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleStaffDayOff = useCallback((idx, day, isChecked) => {
    setStaff((prev) => {
      const updated = [...prev];
      const currentOff = updated[idx].weeklyOff || [];
      if (isChecked) {
        if (!currentOff.includes(day))
          updated[idx].weeklyOff = [...currentOff, day];
      } else {
        updated[idx].weeklyOff = currentOff.filter((d) => d !== day);
      }
      return updated;
    });
  }, []);

  const addStaffVacation = useCallback((idx) => {
    setStaff((prev) => {
      const updated = [...prev];
      if (!updated[idx].vacations) updated[idx].vacations = [];
      const hasEmpty = updated[idx].vacations.some((v) => !v.start && !v.end);
      if (!hasEmpty) updated[idx].vacations.push({ start: "", end: "" });
      return updated;
    });
  }, []);

  const updateStaffVacation = useCallback((idx, vacIdx, field, value) => {
    setStaff((prev) => {
      const updated = [...prev];
      updated[idx].vacations[vacIdx][field] = value;
      return updated;
    });
  }, []);

  const removeStaffVacation = useCallback((idx, vacIdx) => {
    setStaff((prev) => {
      const updated = [...prev];
      updated[idx].vacations = updated[idx].vacations.filter(
        (_, i) => i !== vacIdx,
      );
      return updated;
    });
  }, []);

  return {
    staff,
    setStaff,
    staffHandlers: {
      updateStaff,
      addStaff,
      removeStaff,
      handleStaffDayOff,
      addStaffVacation,
      updateStaffVacation,
      removeStaffVacation,
    },
  };
};
