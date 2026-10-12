import { meetup } from '../../data/meetup.js';
import { scheduleEntries } from '../../data/schedule.js';
import { calendarEvent } from '../../data/calendar.js';

export function getStaticPaths() {
  return scheduleEntries(meetup)
    .filter(entry => entry.kind === 'coffee' && entry.start && entry.cafe && entry.address)
    .map(entry => ({ params: { date: entry.date }, props: { entry } }));
}

export function GET({ props: { entry } }) {
  return new Response(calendarEvent(entry), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="friday-commit-${entry.date}.ics"`,
    },
  });
}
