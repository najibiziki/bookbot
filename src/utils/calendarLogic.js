// ===== 1. Constants =====
export const DEFAULT_START_MIN = 480; // 08:00
export const DEFAULT_END_MIN = 1080; // 18:00
export const BREAK_WIDTH_PCT = 4;

// ===== 2. Core helpers =====
export const toMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return 0;

  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;

  return hours * 60 + minutes;
};

export const toTimeStr = (mins) => {
  if (mins == null || isNaN(mins)) return "00:00";

  const clampedMins = Math.min(Math.max(mins, 0), 1439);
  const h = Math.floor(clampedMins / 60);
  const m = Math.floor(clampedMins % 60);

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// Get "mon", "tue", etc. from moment-like object
export const getDayKey = (momentObj) => {
  if (!momentObj) return "mon";

  const nativeDate = momentObj._d || momentObj.toDate();
  const dayOfWeek = nativeDate.getDay();

  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dayOfWeek];
};

// ===== 3. Sanitization =====
const sanitizePeriods = (periods) => {
  if (!Array.isArray(periods)) return [];

  return periods
    .filter(
      (p) => p && p.start && p.end && toMinutes(p.end) > toMinutes(p.start),
    )
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
};

// ===== 4. Math / layout =====
export const extractTemplateSegments = (workingPeriods) => {
  let maxBreaks = -1;
  let bestTemplate = [];

  Object.values(workingPeriods || {}).forEach((periods) => {
    const sorted = sanitizePeriods(periods);
    if (!sorted.length) return;

    let breaks = 0;

    for (let i = 0; i < sorted.length - 1; i++) {
      if (toMinutes(sorted[i + 1].start) > toMinutes(sorted[i].end)) {
        breaks++;
      }
    }

    if (breaks > maxBreaks) {
      maxBreaks = breaks;
      bestTemplate = [];

      sorted.forEach((p, i) => {
        bestTemplate.push({
          type: "work",
          startMin: toMinutes(p.start),
          endMin: toMinutes(p.end),
        });

        if (i < sorted.length - 1) {
          bestTemplate.push({
            type: "break",
            startMin: toMinutes(p.end),
            endMin: toMinutes(sorted[i + 1].start),
          });
        }
      });
    }
  });

  if (!bestTemplate.length) {
    bestTemplate = [
      { type: "work", startMin: DEFAULT_START_MIN, endMin: DEFAULT_END_MIN },
    ];
  }

  return bestTemplate;
};

const calculateMappedSegments = (templateSegments) => {
  const workSegs = templateSegments.filter((s) => s.type === "work");

  const totalWorkMins = workSegs.reduce(
    (sum, s) => sum + (s.endMin - s.startMin),
    0,
  );

  if (totalWorkMins === 0) {
    return templateSegments.map((s) => ({
      ...s,
      startPct: 0,
      endPct: 100,
    }));
  }

  const breakCount = templateSegments.filter((s) => s.type === "break").length;

  const workTotalWidth = 100 - breakCount * BREAK_WIDTH_PCT;
  let currentPct = 0;

  return templateSegments.map((seg) => {
    const widthPct =
      seg.type === "break"
        ? BREAK_WIDTH_PCT
        : ((seg.endMin - seg.startMin) / totalWorkMins) * workTotalWidth;

    const mapped = {
      ...seg,
      startPct: currentPct,
      endPct: currentPct + widthPct,
    };

    currentPct += widthPct;
    return mapped;
  });
};
const generateHourMarkersFromTemplate = (templateSegments) => {
  const map = new Map();
  const workSegments = templateSegments.filter((s) => s.type === "work");

  workSegments.forEach((seg) => {
    const startTimeStr = toTimeStr(seg.startMin);
    map.set(startTimeStr, { time: startTimeStr, isStart: true });

    let hour =
      seg.startMin % 60 === 0
        ? seg.startMin + 60
        : seg.startMin + (60 - (seg.startMin % 60));

    while (hour < seg.endMin) {
      const time = toTimeStr(hour);
      map.set(time, { time, isStart: false });
      hour += 60;
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => toMinutes(a.time) - toMinutes(b.time),
  );
};
// ===== 5. Classification =====
export const classifyWeekDays = (
  weekDays,
  workingPeriods,
  templateSegments,
) => {
  const normalDays = new Map();
  const exceptionDays = new Map();

  const workTemplate = templateSegments
    .filter((s) => s.type === "work")
    .sort((a, b) => a.startMin - b.startMin);

  weekDays.forEach((day) => {
    const dayKey = getDayKey(day);
    const rawPeriods = workingPeriods?.[dayKey] || [];
    const dayId = day.format("YYYY-MM-DD");

    if (!rawPeriods.length) {
      normalDays.set(dayId, day);
      return;
    }

    const sortedPeriods = sanitizePeriods(rawPeriods);

    if (sortedPeriods.length !== workTemplate.length) {
      exceptionDays.set(dayId, day);
      return;
    }

    const isExactMatch = sortedPeriods.every(
      (p, i) =>
        toMinutes(p.start) === workTemplate[i].startMin &&
        toMinutes(p.end) === workTemplate[i].endMin,
    );

    (isExactMatch ? normalDays : exceptionDays).set(dayId, day);
  });

  return { normalDays, exceptionDays };
};

export const getDaySignature = (day, workingPeriods) => {
  const periods = workingPeriods?.[getDayKey(day)] || [];
  if (!periods.length) return "off";

  return sanitizePeriods(periods)
    .map((p) => `${p.start}-${p.end}`)
    .join(",");
};

// ===== 6. Layout factory =====
export const createCalendarLayout = (
  workingPeriods,
  selectedDayKey,
  freeTimeColor = "#e2e8f0",
) => {
  const templateSegments = extractTemplateSegments(workingPeriods);
  const mappedSegments = calculateMappedSegments(templateSegments);

  const hasActualPeriods = Object.values(workingPeriods || {}).some(
    (p) => p && p.length > 0,
  );

  const isFullyEmpty =
    !hasActualPeriods &&
    templateSegments.length === 1 &&
    templateSegments[0].startMin === DEFAULT_START_MIN;

  const timeToPercent = (timeStr) => {
    const mins = toMinutes(timeStr);

    for (const seg of mappedSegments) {
      if (mins >= seg.startMin && mins <= seg.endMin) {
        const duration = seg.endMin - seg.startMin;
        if (duration <= 0) return seg.startPct;

        const progress = (mins - seg.startMin) / duration;

        return seg.startPct + progress * (seg.endPct - seg.startPct);
      }
    }

    return mins < mappedSegments[0].startMin ? 0 : 100;
  };

  const getShiftsForDay = (dayKey) =>
    sanitizePeriods(workingPeriods?.[dayKey] || []).map((p) => ({
      startMins: toMinutes(p.start),
      endMins: toMinutes(p.end),
      startStr: p.start,
      endStr: p.end,
    }));

  const buildBackground = (dayShifts) => {
    if (!dayShifts?.length) return "none";

    const stops = mappedSegments.map((seg) => {
      const startPct = timeToPercent(toTimeStr(seg.startMin));
      const endPct = timeToPercent(toTimeStr(seg.endMin));

      if (seg.type === "break") {
        return `transparent ${startPct}%, transparent ${endPct}%`;
      }

      const hasShift = dayShifts.some(
        (s) => s.startMins <= seg.endMin && s.endMins >= seg.startMin,
      );

      const color = hasShift ? "#111827" : freeTimeColor;

      return `${color} ${startPct}%, ${color} ${endPct}%`;
    });

    return `linear-gradient(to right, ${stops.join(", ")})`;
  };

  const getStyle = (start, end) => {
    let left = timeToPercent(start.format("HH:mm"));
    let width = timeToPercent(end.format("HH:mm")) - left;

    if (width < 3 && end.diff(start, "minutes") > 0) {
      width = 3;
    }

    return {
      left: `${left}%`,
      width: `${Math.min(width, 100 - left)}%`,
      duration: end.diff(start, "minutes"),
    };
  };

  const selectedDayShifts = getShiftsForDay(selectedDayKey);
  const hourMarkers = generateHourMarkersFromTemplate(templateSegments);

  return {
    getShiftsForDay,
    buildBackground,
    getStyle,
    hourMarkers,
    isFullyEmpty,
    timeToPercent,
    templateSegments,
  };
};
