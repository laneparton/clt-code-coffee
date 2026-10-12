const localDate = (date, timezone) => new Intl.DateTimeFormat('en-CA', {
  timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date);

function validateFriday(date, pilotEnds) {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(+parsed)
    || parsed.toISOString().slice(0, 10) !== date || parsed.getUTCDay() !== 5 || date > pilotEnds) {
    throw new Error('Schedule dates must be valid Fridays within the pilot.');
  }
}

export function safeUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:') return url.href;
  } catch {}
  throw new Error('Links must be absolute HTTPS URLs.');
}

// Friday wall-clock times use the date's own offset, including the November DST change.
function zonedTime(date, clock, timezone) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(clock)) throw new Error('Local times must use HH:MM.');
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' })
    .formatToParts(new Date(`${date}T12:00:00Z`)).find(part => part.type === 'timeZoneName').value;
  const instant = new Date(`${date}T${clock}:00${offset === 'GMT' ? '+00:00' : offset.replace('GMT', '')}`);
  const actualClock = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(instant);
  if (localDate(instant, timezone) !== date || actualClock !== clock) throw new Error('Invalid local schedule time.');
  return instant;
}

function endOfDate(date, timezone) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return zonedTime(next.toISOString().slice(0, 10), '00:00', timezone);
}

function venueDetails(details) {
  if (!details.cafe?.trim() || !details.address?.trim()) throw new Error('Provide the café and address.');
  return { cafe: details.cafe, address: details.address, mapUrl: safeUrl(details.mapUrl) };
}

// Retain every explicit entry in the static page so its browser can advance without a rebuild.
export function scheduleEntries(config) {
  const entries = new Map();
  const details = config.plannedDetails;
  const venue = details && venueDetails(details);
  for (const date of config.plannedDates ?? []) {
    validateFriday(date, config.pilotEnds);
    const start = details ? zonedTime(date, details.startTime, config.timezone) : undefined;
    const end = details ? zonedTime(date, details.endTime, config.timezone) : endOfDate(date, config.timezone);
    if (start && end <= start) throw new Error('The end time must be after the start time.');
    entries.set(date, { date, kind: 'coffee', confirmed: false, ...venue, start, end });
  }
  for (const meeting of config.meetings) {
    const start = new Date(meeting.start);
    const end = new Date(meeting.end);
    if (!Number.isFinite(+start) || !Number.isFinite(+end) || end <= start
      || !/[+-]\d{2}:\d{2}$/.test(meeting.start) || !/[+-]\d{2}:\d{2}$/.test(meeting.end)) {
      throw new Error('Meetings need valid start/end timestamps with explicit timezone offsets.');
    }
    const date = localDate(start, config.timezone);
    validateFriday(date, config.pilotEnds);
    if (localDate(end, config.timezone) !== date) throw new Error('Meetings must end the same day.');
    const venue = venueDetails(meeting);
    if (meeting.cancelled) entries.delete(date);
    else entries.set(date, { date, kind: 'coffee', confirmed: true, ...venue, start, end });
  }
  for (const item of config.skippedDates) {
    validateFriday(item.date, config.pilotEnds);
    entries.set(item.date, { ...item, kind: 'break', end: endOfDate(item.date, config.timezone) });
  }
  return [...entries.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function upcomingListings(config, now = new Date()) {
  return scheduleEntries(config).filter(item => item.kind === 'coffee' && item.end > now);
}

export function nextMeeting(config, now = new Date()) {
  return upcomingListings(config, now).find(item => item.confirmed) ?? null;
}

export function upcomingBreaks(config, now = new Date()) {
  return scheduleEntries(config).filter(item => item.kind === 'break' && item.end > now)
    .map(({ date, title, message }) => ({ date, title, message }));
}

export function timeLabel(entry, timezone) {
  if (!entry.start) return 'Time to be announced';
  const format = value => new Intl.DateTimeFormat('en-US', {
    timeZone: timezone, hour: 'numeric', minute: '2-digit',
  }).format(value).replace(':00', '').replace(/\s/g, '').toLowerCase();
  return `${format(entry.start)} to ${format(entry.end)}`;
}
