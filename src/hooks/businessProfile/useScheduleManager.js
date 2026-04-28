import { useState, useCallback } from "react";
import { defaultSchedule } from "../../constatnts/scheduleDefaults";

export const useScheduleManager = (initialData = defaultSchedule) => {
  const [schedule, setSchedule] = useState(initialData);

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

  return {
    schedule,
    setSchedule,
    scheduleHandlers: {
      updateSchedule,
      addTimeSlot,
      removeTimeSlot,
    },
  };
};
