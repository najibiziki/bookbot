import { useState, useMemo, useEffect } from "react";
import moment from "moment-timezone";

// --- Pure Utility Functions (moved outside to prevent recreation on render) ---
const toMins = (t) => {
  if (!t || !t.includes(":")) return -1;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const minsToTimeStr = (mins) => {
  if (mins < 0) return "--:--";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const validateTime = (timeStr, minTime, maxTime) => {
  if (!timeStr || timeStr.length !== 5) return false;
  const h = parseInt(timeStr.slice(0, 2), 10);
  const m = parseInt(timeStr.slice(3, 5), 10);

  if (isNaN(h) || isNaN(m) || h > 23 || m > 59) return false;

  const typedMins = h * 60 + m;
  return typedMins >= minTime && typedMins <= maxTime;
};

// --- Hook ---
const useAppointmentFormLogic = (slotData, services, onSubmit) => {
  // Date never changes, so it doesn't need to be state
  const date = slotData?.date || "";

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [startTime, setStartTime] = useState(slotData?.startTime || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customDuration, setCustomDuration] = useState(null);

  // Reset custom duration when service changes
  useEffect(() => {
    setCustomDuration(null);
  }, [selectedServiceId]);

  // --- Service & Pricing ---
  const selectedService = useMemo(() => {
    return services.find((s) => s._id === selectedServiceId) || null;
  }, [selectedServiceId, services]);

  const pricing = useMemo(() => {
    if (!selectedService) return null;
    const basePrice = Number(selectedService.price || 0);
    const extraPrice = Number(slotData.staff?.extraPrice || 0);
    return {
      base: basePrice,
      extra: extraPrice,
      total: basePrice + extraPrice,
    };
  }, [selectedService, slotData.staff]);

  // --- Smart Duration ---
  const extraTime = Number(slotData.staff?.extraTime || 0);

  const isCustomDuration =
    customDuration !== null &&
    customDuration !== "" &&
    Number(customDuration) > 0;

  // FIX: Added isCustomDuration to dependency array
  const activeDuration = useMemo(() => {
    if (isCustomDuration) return Number(customDuration);
    if (selectedService) {
      return Number(
        selectedService.duration || selectedService.serviceDuration || 0,
      );
    }
    return 0;
  }, [isCustomDuration, customDuration, selectedService]);

  const finalDuration = isCustomDuration
    ? activeDuration
    : activeDuration + extraTime;

  // --- Time Limits ---
  // Note: Calling moment() on every render is intentional here so that
  // "actualMinTime" ticks forward in real-time as the user fills out the form.
  const now = moment().tz(slotData.timezone || moment.tz.guess());
  const isSlotToday = now.format("YYYY-MM-DD") === slotData.date;
  const currentMins = now.hours() * 60 + now.minutes();

  const rawMinTime = toMins(slotData.startTime);
  const actualMinTime =
    isSlotToday && currentMins > rawMinTime ? currentMins : rawMinTime;
  const maxAllowedTime = toMins(slotData.endTime) - finalDuration;

  // --- Time Validation & Hints ---
  const timeHint = useMemo(() => {
    if (actualMinTime > maxAllowedTime) {
      return "Not enough time for this duration";
    }
    return `Available: ${minsToTimeStr(actualMinTime)} - ${minsToTimeStr(maxAllowedTime)}`;
  }, [actualMinTime, maxAllowedTime]);

  const isTimeValid = useMemo(() => {
    if (actualMinTime > maxAllowedTime) return false;
    return validateTime(startTime, actualMinTime, maxAllowedTime);
  }, [startTime, actualMinTime, maxAllowedTime]);

  // FIX: Derived state instead of manually managed state
  // Shows error styling only when the user has finished typing a 5-character time string
  const isTimeInvalid = startTime.length === 5 && !isTimeValid;

  const calculatedEndTime = useMemo(() => {
    if (!date || !startTime || finalDuration === 0) return "--:--";
    return moment(`${date} ${startTime}`, "YYYY-MM-DD HH:mm")
      .add(finalDuration, "minutes")
      .format("HH:mm");
  }, [date, startTime, finalDuration]);

  const handleTimeChange = (e) => {
    let val = e.target.value.replace(/[^0-9:]/g, "");

    // Auto-insert colon
    if (val.length === 4 && !val.includes(":")) {
      val = val.slice(0, 2) + ":" + val.slice(2);
    }

    setStartTime(val);
  };

  // --- Submit ---
  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (
      !date ||
      !isTimeValid ||
      !selectedService ||
      !clientName ||
      !clientPhone
    ) {
      return;
    }

    setIsSubmitting(true);

    const timezone = slotData.timezone || moment.tz.guess();
    const startUtc = moment
      .tz(`${date} ${startTime}`, "YYYY-MM-DD HH:mm", timezone)
      .toDate();
    const endUtc = moment
      .tz(`${date} ${calculatedEndTime}`, "YYYY-MM-DD HH:mm", timezone)
      .toDate();

    const payload = {
      clientName,
      clientPhone,
      serviceId: selectedService._id,
      serviceName: selectedService.name,
      serviceDuration: finalDuration,
      staffId: slotData.staff?._id || null,
      staffName: slotData.staff?.name || "",
      startTime: startUtc,
      endTime: endUtc,
      totalPrice: pricing.total, // Safe to remove optional chaining due to early return
      status: "scheduled",
    };

    if (onSubmit) await onSubmit(payload);
    setIsSubmitting(false);
  };

  return {
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
  };
};

export default useAppointmentFormLogic;
