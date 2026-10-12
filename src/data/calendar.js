const escapeText = value => value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
const timestamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

// iCalendar content lines are limited to 75 UTF-8 octets, including continuation spaces.
function foldLine(line) {
  let result = '';
  let bytes = 0;
  for (const character of line) {
    const length = Buffer.byteLength(character, 'utf8');
    if (bytes + length > 75) {
      result += '\r\n ';
      bytes = 1;
    }
    result += character;
    bytes += length;
  }
  return result;
}

export function calendarEvent(entry, generatedAt = new Date()) {
  if (entry.kind !== 'coffee' || !entry.start || !entry.cafe || !entry.address) {
    throw new Error('Calendar downloads require a coffee with a time and venue.');
  }
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Charlotte Code & Coffee//The Friday Commit//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:friday-commit-${entry.date}@fridaycommit.dev`,
    `DTSTAMP:${timestamp(generatedAt)}`,
    `DTSTART:${timestamp(entry.start)}`,
    `DTEND:${timestamp(entry.end)}`,
    'SUMMARY:The Friday Commit | Charlotte Code & Coffee',
    `LOCATION:${escapeText(`${entry.cafe}, ${entry.address}`)}`,
    `DESCRIPTION:${escapeText("No talks. No pitches. Just shop talk.\nLook for the terminal mug on my laptop or a tabletop sign.\nCheck fridaycommit.dev for the latest details.")}`,
    'URL:https://fridaycommit.dev/',
    'END:VEVENT',
    'END:VCALENDAR',
  ].map(foldLine).join('\r\n') + '\r\n';
}
