// Add only organizer-confirmed details. Each meeting is explicit; nothing recurs automatically.
// Use ISO timestamps with Eastern offsets (-04:00 or -05:00 as appropriate).
// Example shape: { start, end, cafe, address, mapUrl, cancelled: false }.
export const meetup = {
  timezone: 'America/New_York',
  pilotEnds: '2026-12-31',
  skippedDates: [{ date: '2026-11-27', title: 'Thanksgiving break', message: 'Enjoy your time with family.' }],
  // Dates selected for the lineup. Venue and time remain unconfirmed.
  plannedDates: ['2026-10-23', '2026-10-30', '2026-11-06', '2026-11-13', '2026-11-20', '2026-12-04'],
  // Shared placeholder details. These do not confirm or schedule any meetings.
  plannedDetails: {
    startTime: '10:00',
    endTime: '11:00',
    cafe: 'Platform Coffee + Kitchen',
    address: '919 Berryhill Rd #104, Charlotte, NC 28208',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Platform%20Coffee%20%2B%20Kitchen%2C%20919%20Berryhill%20Rd%20%23104%2C%20Charlotte%2C%20NC%2028208',
  },
  meetings: [],
  // Organizer-approved links only: { label, url }.
  communityLinks: [],
};
