import test from 'node:test';
import assert from 'node:assert/strict';
import { nextMeeting, upcomingListings, upcomingBreaks, scheduleEntries, timeLabel, safeUrl } from '../src/data/schedule.js';
import { meetup } from '../src/data/meetup.js';

const coffee = {
  start: '2026-10-16T11:00:00-04:00', end: '2026-10-16T12:00:00-04:00',
  cafe: 'Test café', address: 'Test address', mapUrl: 'https://example.com/map',
};
const now = new Date('2026-10-12T12:00:00Z');
const config = (meetings) => ({ ...meetup, meetings });

test('unconfirmed launch has no meeting', () => assert.equal(nextMeeting(meetup, now), null));
test('selects the earliest confirmed upcoming meeting and expires at its end', () => {
  const later = { ...coffee, start: '2026-10-23T11:00:00-04:00', end: '2026-10-23T12:00:00-04:00' };
  assert.equal(nextMeeting(config([later, coffee]), now).start.toISOString(), '2026-10-16T15:00:00.000Z');
  assert.equal(nextMeeting(config([coffee]), new Date(coffee.end)), null);
});
test('cancellations and Thanksgiving Friday are excluded', () => {
  assert.equal(nextMeeting(config([{ ...coffee, cancelled: true }]), now), null);
  const holiday = { ...coffee, start: '2026-11-27T11:00:00-05:00', end: '2026-11-27T12:00:00-05:00' };
  assert.equal(nextMeeting(config([holiday]), now), null);
});
test('requires Friday, pilot dates, venue, and complete times', () => {
  for (const invalid of [
    { ...coffee, start: '2026-10-15T11:00:00-04:00', end: '2026-10-15T12:00:00-04:00' },
    { ...coffee, start: '2027-01-01T11:00:00-05:00', end: '2027-01-01T12:00:00-05:00' },
    { ...coffee, cafe: '' }, { ...coffee, end: coffee.start },
    { ...coffee, start: '2026-10-16T11:00:00' },
  ]) assert.throws(() => nextMeeting(config([invalid]), now));
});
test('links reject executable and non-HTTPS URLs', () => {
  assert.equal(safeUrl('https://example.com'), 'https://example.com/');
  for (const url of ['javascript:alert(1)', 'http://example.com', '/local', 'not a url']) assert.throws(() => safeUrl(url));
});

test('lists the six selected dates with placeholder details without confirming them', () => {
  const listings = upcomingListings(meetup, now);
  assert.deepEqual(listings.map(item => item.date), meetup.plannedDates);
  assert.ok(listings.every(item => item.confirmed === false && item.cafe === meetup.plannedDetails.cafe));
  assert.equal(timeLabel(listings[0], meetup.timezone), '10am to 11am');
});

test('planned dates expire in Eastern time and respect skipped dates', () => {
  assert.equal(upcomingListings(meetup, new Date('2026-10-23T14:59:59Z'))[0].date, '2026-10-23');
  assert.equal(upcomingListings(meetup, new Date('2026-10-23T15:00:00Z'))[0].date, '2026-10-30');
  const dateOnly = { ...meetup, plannedDetails: undefined };
  assert.equal(upcomingListings(dateOnly, new Date('2026-10-24T03:59:00Z'))[0].date, '2026-10-23');
  assert.equal(upcomingListings(dateOnly, new Date('2026-10-24T04:00:00Z'))[0].date, '2026-10-30');
  assert.equal(upcomingListings({ ...meetup, plannedDates: ['2026-11-27'] }, now).length, 0);
  assert.throws(() => upcomingListings({ ...meetup, plannedDates: ['2026-10-22'] }, now));
});

test('confirmation replaces a date-only listing, cancellation and expiry remove it', () => {
  const draft = { ...config([coffee]), plannedDates: ['2026-10-16'] };
  const listings = upcomingListings(draft, now);
  assert.equal(listings.length, 1);
  assert.equal(listings[0].confirmed, true);
  assert.equal(listings[0].cafe, coffee.cafe);
  assert.equal(upcomingListings({ ...draft, meetings: [{ ...coffee, cancelled: true }] }, now).length, 0);
  assert.equal(upcomingListings(draft, new Date(coffee.end)).length, 0);
});

test('Thanksgiving has its own break listing, expires locally, and never becomes a coffee', () => {
  assert.deepEqual(upcomingBreaks(meetup, now), meetup.skippedDates);
  assert.equal(upcomingBreaks(meetup, new Date('2026-11-28T05:00:00Z')).length, 0);
  assert.ok(!upcomingListings(meetup, now).some(item => item.date === '2026-11-27'));
});

test('Eastern end times follow DST and the final coffee expires without adding dates', () => {
  const entries = scheduleEntries(meetup);
  assert.equal(entries.find(item => item.date === '2026-10-30').end.toISOString(), '2026-10-30T15:00:00.000Z');
  assert.equal(entries.find(item => item.date === '2026-11-06').end.toISOString(), '2026-11-06T16:00:00.000Z');
  assert.equal(upcomingListings(meetup, new Date('2026-11-06T15:59:59Z'))[0].date, '2026-11-06');
  assert.equal(upcomingListings(meetup, new Date('2026-11-06T16:00:00Z'))[0].date, '2026-11-13');
  assert.deepEqual(upcomingListings(meetup, new Date('2026-12-04T16:00:00Z')), []);
});

test('placeholder clocks reject invalid times, reversed ranges, and unsafe map links', () => {
  for (const changes of [{ endTime: '09:00' }, { endTime: '25:00' }, { mapUrl: 'javascript:alert(1)' }]) {
    assert.throws(() => scheduleEntries({ ...meetup, plannedDetails: { ...meetup.plannedDetails, ...changes } }));
  }
});
