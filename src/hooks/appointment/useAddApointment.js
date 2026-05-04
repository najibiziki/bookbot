import { useState, useMemo, useEffect } from "react";
import moment from "moment-timezone";

const useAppointmentFormLogic = (slotData, services, onSubmit) => {
  const [date] = useState(slotData?.date || "");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [startTime, setStartTime] = useState(slotData?.startTime || "");
  const [isTimeInvalid, setIsTimeInvalid] = useState(false);

  // CHANGED: null means untouched, "" means actively cleared by user
  const [customDuration, setCustomDuration] = useState(null);

  // Automatically reset duration if user changes the service
  useEffect(() => {
    setCustomDuration(null);
  }, [selectedServiceId]);

  // --- Helpers ---
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

  // --- Smart Duration & Extras ---
  const extraTime = Number(slotData.staff?.extraTime || 0);

  // Only true if user actually typed a valid number
  const isCustomDuration =
    customDuration !== null &&
    customDuration !== "" &&
    Number(customDuration) > 0;

  const activeDuration = useMemo(() => {
    if (isCustomDuration) return Number(customDuration);
    if (selectedService)
      return Number(
        selectedService.duration || selectedService.serviceDuration || 0,
      );
    return 0;
  }, [customDuration, selectedService, isCustomDuration]);

  // If user typed custom, ONLY use custom. Otherwise, use active + extra.
  const finalDuration = isCustomDuration
    ? activeDuration
    : activeDuration + extraTime;

  // --- Time Validation ---
  const timeHint = useMemo(() => {
    const minTime = slotData.startTime;
    let maxTimeMins = toMins(slotData.endTime);
    maxTimeMins -= finalDuration;
    return `Available: ${minTime} - ${minsToTimeStr(maxTimeMins)}`;
  }, [slotData, finalDuration]);

  const isTimeValid = useMemo(() => {
    if (!startTime || startTime.length !== 5) return false;
    const h = parseInt(startTime.slice(0, 2), 10);
    const m = parseInt(startTime.slice(3, 5), 10);
    if (isNaN(h) || isNaN(m) || h > 23 || m > 59) return false;

    const typedMins = h * 60 + m;
    const minAllowed = toMins(slotData.startTime);

    // BUG FIX: Subtract finalDuration here, just like in handleTimeChange
    const maxAllowed = toMins(slotData.endTime) - finalDuration;

    if (typedMins < minAllowed || typedMins > maxAllowed) return false;

    return true;
  }, [startTime, slotData, finalDuration]);

  const calculatedEndTime = useMemo(() => {
    if (!date || !startTime || finalDuration === 0) return "--:--";
    return moment(`${date} ${startTime}`, "YYYY-MM-DD HH:mm")
      .add(finalDuration, "minutes")
      .format("HH:mm");
  }, [date, startTime, finalDuration]);

  const handleTimeChange = (e) => {
    let val = e.target.value.replace(/[^0-9:]/g, "");
    if (val.length === 4 && !val.includes(":")) {
      val = val.slice(0, 2) + ":" + val.slice(2);
    }

    setIsTimeInvalid(false);
    if (val.length < 5) {
      setStartTime(val);
      return;
    }

    const h = parseInt(val.slice(0, 2), 10);
    const m = parseInt(val.slice(3, 5), 10);

    if (isNaN(h) || isNaN(m) || h > 23 || m > 59) {
      setStartTime(val);
      setIsTimeInvalid(true);
      return;
    }

    const typedMins = h * 60 + m;
    const minAllowed = toMins(slotData.startTime);
    let maxAllowed = toMins(slotData.endTime);
    maxAllowed -= finalDuration;

    if (typedMins >= minAllowed && typedMins <= maxAllowed) {
      setStartTime(val);
    } else {
      setStartTime(val);
      setIsTimeInvalid(true);
    }
  };

  // --- Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !startTime || !selectedService || !clientName || !clientPhone)
      return;
    setIsSubmitting(true);

    const startUtc = moment
      .tz(`${date} ${startTime}`, "YYYY-MM-DD HH:mm", slotData.timezone)
      .toDate();
    const endUtc = moment
      .tz(`${date} ${calculatedEndTime}`, "YYYY-MM-DD HH:mm", slotData.timezone)
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
      totalPrice: pricing?.total || 0,
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
