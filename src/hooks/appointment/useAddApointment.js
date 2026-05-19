import { useState, useMemo, useEffect } from "react";
import moment from "moment-timezone";

const toMins = (t) => {
  if (!t || !t.includes(":")) return -1;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const minsToTimeStr = (mins) => {
  if (mins < 0) return "--:--";
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
};

const validateTime = (timeStr, minTime, maxTime) => {
  if (!timeStr || timeStr.length !== 5) return false;
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m) || h > 23 || m > 59) return false;
  const mins = h * 60 + m;
  return mins >= minTime && mins <= maxTime;
};

const useAppointmentFormLogic = (slotData, services, onSubmit) => {
  const date = slotData?.date || "";
  const timezone = slotData?.timezone || moment.tz.guess();

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [startTime, setStartTime] = useState(slotData?.startTime || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customDuration, setCustomDuration] = useState(null);

  useEffect(() => {
    setCustomDuration(null);
  }, [selectedServiceId]);

  const selectedService = useMemo(
    () => services.find((s) => s._id === selectedServiceId) || null,
    [services, selectedServiceId],
  );

  const staffExtraTime = Number(slotData?.staff?.extraTime || 0);
  const staffExtraPrice = Number(slotData?.staff?.extraPrice || 0);

  const activeDuration = useMemo(() => {
    if (customDuration > 0) return Number(customDuration);
    return Number(
      selectedService?.duration || selectedService?.serviceDuration || 0,
    );
  }, [customDuration, selectedService]);

  const finalDuration =
    customDuration > 0 ? activeDuration : activeDuration + staffExtraTime;

  const pricing = useMemo(() => {
    if (!selectedService) return null;
    const base = Number(selectedService.price || 0);
    return { base, extra: staffExtraPrice, total: base + staffExtraPrice };
  }, [selectedService, staffExtraPrice]);

  // Real-time boundary check for today's slots
  const now = moment().tz(timezone);
  const currentMins = now.hours() * 60 + now.minutes();
  const isSlotToday = now.format("YYYY-MM-DD") === date;

  const rawMinTime = toMins(slotData?.startTime);
  const actualMinTime =
    isSlotToday && currentMins > rawMinTime ? currentMins : rawMinTime;
  const maxAllowedTime = toMins(slotData?.endTime) - finalDuration;

  const isTimeValid = useMemo(
    () =>
      actualMinTime <= maxAllowedTime &&
      validateTime(startTime, actualMinTime, maxAllowedTime),
    [startTime, actualMinTime, maxAllowedTime],
  );

  const isTimeInvalid = startTime.length === 5 && !isTimeValid;

  const timeHint = useMemo(() => {
    if (actualMinTime > maxAllowedTime)
      return "Not enough time for this duration";
    return `Available: ${minsToTimeStr(actualMinTime)} - ${minsToTimeStr(maxAllowedTime)}`;
  }, [actualMinTime, maxAllowedTime]);

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
    setStartTime(val);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (
      !date ||
      !isTimeValid ||
      !selectedService ||
      !clientName ||
      !clientPhone
    )
      return;

    setIsSubmitting(true);

    const payload = {
      clientName,
      clientPhone,
      serviceId: selectedService._id,
      serviceName: selectedService.name,
      serviceDuration: finalDuration,
      staffId: slotData?.staff?._id || null,
      staffName: slotData?.staff?.name || "",
      startTime: moment
        .tz(`${date} ${startTime}`, "YYYY-MM-DD HH:mm", timezone)
        .toDate(),
      endTime: moment
        .tz(`${date} ${calculatedEndTime}`, "YYYY-MM-DD HH:mm", timezone)
        .toDate(),
      totalPrice: pricing.total,
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
