// ===== 1. Constants =====
export const DEFAULT_START_MIN = 480; // 08:00
export const DEFAULT_END_MIN = 1080; // 18:00
export const BREAK_WIDTH_PCT = 4;

// ===== 2. Core Helpers =====
export const toMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return isNaN(hours) || isNaN(minutes) ? 0 : hours * 60 + minutes;
};

export const toTimeStr = (mins) => {
  if (mins == null || isNaN(mins)) return "00:00";
  const clampedMins = Math.min(Math.max(mins, 0), 1439);
  const h = Math.floor(clampedMins / 60);
  const m = Math.floor(clampedMins % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const getDayKey = (dateObj) => {
  if (!dateObj) return "mon";
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][d.getDay()];
};

const sanitizePeriods = (periods) => {
  if (!Array.isArray(periods)) return [];
  return periods
    .filter(
      (p) => p && p.start && p.end && toMinutes(p.end) > toMinutes(p.start),
    )
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
};

const toDate = (input) => {
  if (input instanceof Date) return input;
  if (input && input._d) return input._d;
  if (input && input.toDate) return input.toDate();
  return new Date(input);
};

const formatDateYMD = (input) => {
  const d = toDate(input);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// TIMEZONE FIX: Safe UTC parser to prevent local browser timezone shifting dates
const getUTCDayTimestamp = (input) => {
  if (!input) return 0;
  if (input instanceof Date) {
    return Date.UTC(
      input.getUTCFullYear(),
      input.getUTCMonth(),
      input.getUTCDate(),
    );
  }
  if (input._d) {
    const d = input._d;
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  }
  const str = String(input).substring(0, 10);
  const parts = str.split("-");
  if (parts.length === 3) {
    return Date.UTC(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10),
    );
  }
  return 0;
};

// ===== 3. Math / Layout =====
export const extractTemplateSegments = (workingPeriods) => {
  let maxBreaks = -1;
  let bestTemplate = [];

  Object.values(workingPeriods || {}).forEach((periods) => {
    const sorted = sanitizePeriods(periods);
    if (!sorted.length) return;

    let breaks = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (toMinutes(sorted[i + 1].start) > toMinutes(sorted[i].end)) breaks++;
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
    return templateSegments.map((s) => ({ ...s, startPct: 0, endPct: 100 }));
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
  templateSegments
    .filter((s) => s.type === "work")
    .forEach((seg) => {
      map.set(toTimeStr(seg.startMin), {
        time: toTimeStr(seg.startMin),
        isStart: true,
      });
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

const createSegmentMapper = (mappedSegments) => {
  const timeToPercent = (timeStr) => {
    const mins = toMinutes(timeStr);
    for (const seg of mappedSegments) {
      if (mins >= seg.startMin && mins <= seg.endMin) {
        const duration = seg.endMin - seg.startMin;
        if (duration <= 0) return seg.startPct;
        return (
          seg.startPct +
          ((mins - seg.startMin) / duration) * (seg.endPct - seg.startPct)
        );
      }
    }
    return mins < mappedSegments[0].startMin ? 0 : 100;
  };

  const getStyle = (start, end) => {
    let left = timeToPercent(start.format("HH:mm"));
    let width = timeToPercent(end.format("HH:mm")) - left;
    if (width < 3 && end.diff(start, "minutes") > 0) width = 3;
    return {
      left: `${left}%`,
      width: `${Math.min(width, 100 - left)}%`,
      duration: end.diff(start, "minutes"),
    };
  };

  return { timeToPercent, getStyle };
};

// ===== 4. Classification =====
const getTemplateShiftSet = (templateSegments) => {
  return new Set(
    templateSegments
      .filter((s) => s.type === "work")
      .sort((a, b) => a.startMin - b.startMin)
      .map((s) => `${toTimeStr(s.startMin)}-${toTimeStr(s.endMin)}`),
  );
};

export const classifyWeekDays = (
  weekDays,
  workingPeriods,
  templateSegments,
) => {
  const normalDays = new Map();
  const exceptionDays = new Map();
  const templateShiftSet = getTemplateShiftSet(templateSegments);

  weekDays.forEach((day) => {
    const dayKey = getDayKey(day);
    const rawPeriods = workingPeriods?.[dayKey] || [];
    const dayId = day.format("YYYY-MM-DD");

    if (!rawPeriods.length) {
      normalDays.set(dayId, day);
      return;
    }

    const sortedPeriods = sanitizePeriods(rawPeriods);
    const hasNonTemplateShift = sortedPeriods.some(
      (p) => !templateShiftSet.has(`${p.start}-${p.end}`),
    );

    (hasNonTemplateShift ? exceptionDays : normalDays).set(dayId, day);
  });

  return { normalDays, exceptionDays };
};

export const getDaySignature = (
  day,
  workingPeriods,
  templateSegments = null,
) => {
  const periods = workingPeriods?.[getDayKey(day)] || [];
  if (!periods.length) return "off";

  const sortedPeriods = sanitizePeriods(periods);

  if (templateSegments) {
    const templateShiftSet = getTemplateShiftSet(templateSegments);
    const allMatchTemplate = sortedPeriods.every((p) =>
      templateShiftSet.has(`${p.start}-${p.end}`),
    );
    if (allMatchTemplate) return "normal";
  }

  return sortedPeriods.map((p) => `${p.start}-${p.end}`).join(",");
};

// ===== 5. Layout Factories =====
export const createCalendarLayout = (
  workingPeriods,
  selectedDayKey,
  freeTimeColor = "#e2e8f0",
) => {
  const templateSegments = extractTemplateSegments(workingPeriods);
  const mappedSegments = calculateMappedSegments(templateSegments);
  const { timeToPercent, getStyle } = createSegmentMapper(mappedSegments);

  const hasActualPeriods = Object.values(workingPeriods || {}).some(
    (p) => p && p.length > 0,
  );
  const isFullyEmpty =
    !hasActualPeriods &&
    templateSegments.length === 1 &&
    templateSegments[0].startMin === DEFAULT_START_MIN;

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

      if (seg.type === "break")
        return `transparent ${startPct}%, transparent ${endPct}%`;

      const hasShift = dayShifts.some(
        (s) => s.startMins <= seg.startMin && s.endMins >= seg.endMin,
      );
      const color = hasShift ? "#111827" : freeTimeColor;
      return `${color} ${startPct}%, ${color} ${endPct}%`;
    });
    return `linear-gradient(to right, ${stops.join(", ")})`;
  };

  return {
    getShiftsForDay,
    buildBackground,
    getStyle,
    hourMarkers: generateHourMarkersFromTemplate(templateSegments),
    isFullyEmpty,
    timeToPercent,
    templateSegments,
  };
};

export const createExceptionDayLayout = (
  dayShifts,
  freeTimeColor = "#e2e8f0",
) => {
  if (!dayShifts?.length) return { isFullyEmpty: true };

  const sorted = [...dayShifts].sort(
    (a, b) =>
      (a.startMins || toMinutes(a.start)) - (b.startMins || toMinutes(b.start)),
  );
  const startMins = sorted[0].startMins || toMinutes(sorted[0].start);
  const endMins =
    sorted[sorted.length - 1].endMins ||
    toMinutes(sorted[sorted.length - 1].end);

  if (endMins - startMins <= 0) return { isFullyEmpty: true };

  const segments = [];
  let currentTime = startMins;

  for (const shift of sorted) {
    const shiftStart = shift.startMins || toMinutes(shift.start);
    const shiftEnd = shift.endMins || toMinutes(shift.end);

    if (shiftStart > currentTime) {
      segments.push({
        type: "break",
        startMin: currentTime,
        endMin: shiftStart,
      });
    }
    segments.push({ type: "work", startMin: shiftStart, endMin: shiftEnd });
    currentTime = shiftEnd;
  }

  const mappedSegments = calculateMappedSegments(segments);
  const { timeToPercent, getStyle } = createSegmentMapper(mappedSegments);

  const buildBackground = () => {
    const stops = mappedSegments.map((seg) => {
      const startPct = timeToPercent(toTimeStr(seg.startMin));
      const endPct = timeToPercent(toTimeStr(seg.endMin));
      if (seg.type === "break")
        return `transparent ${startPct}%, transparent ${endPct}%`;
      return `#111827 ${startPct}%, #111827 ${endPct}%`;
    });
    return `linear-gradient(to right, ${stops.join(", ")})`;
  };

  return {
    getShiftsForDay: () => sorted,
    buildBackground,
    getStyle,
    hourMarkers: generateHourMarkersFromTemplate(segments),
    isFullyEmpty: false,
    timeToPercent,
    templateSegments: segments,
  };
};

// ===== 6. Staff Free Days =====
export const isStaffFreeDay = (day, weeklyOff = [], vacations = []) => {
  const dayKey = getDayKey(day);
  if (weeklyOff.includes(dayKey)) return true;

  if (vacations?.length > 0) {
    const dayTimestamp = getUTCDayTimestamp(day);

    for (const vacation of vacations) {
      const vacStart = getUTCDayTimestamp(vacation.start);
      const vacEnd = getUTCDayTimestamp(vacation.end);

      // Add 24 hours to make the end date inclusive
      const vacEndInclusive = vacEnd + 24 * 60 * 60 * 1000;

      if (dayTimestamp >= vacStart && dayTimestamp < vacEndInclusive)
        return true;
    }
  }
  return false;
};

export const getWeekFreeDays = (weekDays, weeklyOff = [], vacations = []) => {
  const freeDays = new Set();
  weekDays.forEach((day) => {
    if (isStaffFreeDay(day, weeklyOff, vacations)) {
      freeDays.add(formatDateYMD(day));
    }
  });
  return freeDays;
};
