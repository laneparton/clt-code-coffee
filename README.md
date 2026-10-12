# Charlotte Code & Coffee

Small static Astro landing page for The Friday Commit. Nothing has been published, registered, or scheduled.

## Run locally

```sh
npm install
npm run dev
```

## Verify and build

```sh
npm test
npm run build
npm run preview
```

The deployable static output is `dist/`. Publishing requires separate organizer approval. Use Node 24 LTS, the version used to verify this project.

## Update meeting details

Edit `src/data/meetup.js`. `plannedDates` holds the six selected Fridays. `plannedDetails` supplies shared placeholders of 10am to 11am at Platform Coffee + Kitchen. Its `startTime` and `endTime` use 24-hour HH:MM values; the schedule computes the Eastern offset for each Friday. The page displays these details without status badges. The metadata remains a placeholder until the organizer confirms it. Remove `plannedDetails` to show date-only listings. Leave `meetings` empty until the organizer confirms the café, address, and exact time. Add explicit meetings with `start` and `end` ISO timestamps, `cafe`, `address`, `mapUrl`, and optional `cancelled: true`. A confirmed meeting replaces its provisional listing. Cancelled and ended meetings do not reappear as provisional listings. Use the correct Eastern offset for each date. The timezone is `America/New_York`.

The build orders the lineup by date and leads with the earliest coffee listing. It excludes past planned dates, cancelled meetings, skipped dates, and ended meetings from coffee listings. `skippedDates` entries have `date`, `title`, and `message`; they appear as muted break rows in chronological order alongside future coffees. November 27 has a Thanksgiving break card. Validation rejects incomplete meetings, invalid schedule dates, non-Friday dates, dates after the pilot, and non-HTTPS links. The pilot ends December 31, 2026; this organizer detail stays in config rather than page copy.

Rebuild after schedule edits. The static page includes templates for all explicit dates. A browser script removes expired rows and promotes the next coffee on page load, at each end time, and when the tab regains focus or visibility. Eastern daylight saving changes are included. Breaks expire at local midnight. After the last date, the page shows 'Next date to be announced' and hides the lineup. It does not generate new dates or fetch a schedule. With JavaScript disabled, the build-time schedule remains visible with an 'as of' date until rebuilt.

Add only verified, organizer-approved entries to `communityLinks`, with `label` and `url`. The page omits community links when the list is empty. No domain or group affiliation is configured.

## Branding

`public/brand/` contains the six supplied hand-authored SVG concepts. The wordmark and compact mark are the primary treatments; the favicon reuses the supplied mug paths. Event artwork has a descriptive accessibility label. The page follows the browser's light/dark preference and respects reduced motion.

The compact SVGs have transparent outer backgrounds for use on the page. The header uses the supplied mug paths with a compact text wordmark. A sun/moon toggle follows the system theme until changed and saves a manual preference in local browser storage. Both the page and compact mark follow that choice. If storage is unavailable, the toggle still works for the current visit.

The SVGs retain text nodes and local monospace font fallbacks. Outline the text in a licensed font before production printing. No external fonts, generated images, analytics, backend, or registration system are included.
