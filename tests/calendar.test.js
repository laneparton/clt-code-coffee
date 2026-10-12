import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarEvent } from '../src/data/calendar.js';
import { scheduleEntries } from '../src/data/schedule.js';
import { meetup } from '../src/data/meetup.js';

const entries = scheduleEntries(meetup);
const generatedAt = new Date('2026-10-12T12:00:00Z');
const unfold = value => value.replace(/\r\n /g, '');

test('calendar downloads represent one Friday with the correct UTC times across DST', () => {
  for (const [date, start, end] of [
    ['2026-10-30', '20261030T140000Z', '20261030T150000Z'],
    ['2026-11-06', '20261106T150000Z', '20261106T160000Z'],
  ]) {
    const calendar = calendarEvent(entries.find(entry => entry.date === date), generatedAt);
    assert.ok(calendar.includes(`DTSTART:${start}\r\n`));
    assert.ok(calendar.includes(`DTEND:${end}\r\n`));
    assert.ok(calendar.includes(`UID:friday-commit-${date}@fridaycommit.dev\r\n`));
    assert.ok(calendar.includes('DTSTAMP:20261012T120000Z\r\n'));
    assert.equal(calendar.match(/BEGIN:VEVENT/g).length, 1);
    assert.ok(!calendar.includes('RRULE'));
    assert.ok(calendar.endsWith('END:VCALENDAR\r\n'));
  }
});

test('calendar text escapes separators and newlines and folds without breaking UTF-8', () => {
  const entry = { ...entries[0], cafe: 'Café, coffee; code\\club\n' + '☕'.repeat(50) };
  const calendar = calendarEvent(entry, generatedAt);
  assert.ok(unfold(calendar).includes('LOCATION:Café\\, coffee\\; code\\\\club\\n' + '☕'.repeat(50)));
  assert.ok(unfold(calendar).includes('DESCRIPTION:No talks. No pitches. Just shop talk.\\nLook for'));
  for (const line of calendar.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
  assert.ok(!calendar.replace(/\r\n/g, '').includes('\n'));
});

test('breaks and coffees without a time or venue have no calendar download', () => {
  for (const entry of [entries.find(entry => entry.kind === 'break'), { ...entries[0], start: undefined }, { ...entries[0], cafe: undefined }, { ...entries[0], address: undefined }]) {
    assert.throws(() => calendarEvent(entry, generatedAt));
  }
});
