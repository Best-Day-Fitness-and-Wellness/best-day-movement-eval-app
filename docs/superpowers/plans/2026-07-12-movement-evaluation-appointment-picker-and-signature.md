# Movement Evaluation Appointment Picker and Signature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start the assessment from today’s GoHighLevel Movement Evaluation appointments, collect a touchscreen exercise release, and save the completed assessment and signed release to the selected client profile.

**Architecture:** Keep the GoHighLevel token server-side. Add server routes that discover today’s calendar events, normalize Movement Evaluation appointments, and load the selected contact. Keep the current React assessment and local-first IndexedDB workflow, adding an appointment picker before Client Setup and a native pointer-based signature pad inside consent. Save selected contacts by `client.ghlContactId`; use email upsert only for manual fallback.

**Tech Stack:** React 18, Vite, Express 5, native `fetch`, native canvas/pointer events, IndexedDB, Node’s built-in test runner, GoHighLevel v3 APIs.

## Global Constraints

- The server remains the only place that holds `GHL_PRIVATE_INTEGRATION_TOKEN`.
- Local saving happens before any GoHighLevel request.
- The existing manual client-entry and email lookup fallback remains available.
- The signature must be visible, acknowledged, timestamped, and stored as a PNG upload when GoHighLevel sync is configured.
- Do not invent or silently revise legal release language; use the approved release text as a versioned app constant.
- Do not add a dependency; use native `fetch`, `FormData`, `Blob`, canvas, and pointer events.
- Existing scoring, norm comparison, draft restore, history, and offline behavior must remain intact.

---

### Task 1: Add appointment discovery and normalization

**Files:**
- Modify: `ghl-server.js`
- Modify: `tests/ghl.test.mjs`

**Interfaces:**
- Produces `buildGhlCalendarListUrl(locationId): string`.
- Produces `buildGhlCalendarEventsUrl({ locationId, calendarId, startTime, endTime }): string`.
- Produces `normalizeGhlAppointment(event, context): object`.
- Produces `filterMovementEvaluations(appointments): object[]`.
- Produces `getGhlAppointments(date, { token, locationId }): Promise<{ status: string, appointments: object[] }>`, where each appointment has `eventId`, `contactId`, `title`, `calendarName`, `startTime`, `endTime`, `clientName`, `email`, and `trainerName`.
- Produces `getGhlAppointment(eventId, { token, locationId }): Promise<{ status: string, appointment?: object, message?: string }>`.

- [ ] **Step 1: Write failing pure-helper tests**

Add to `tests/ghl.test.mjs`:

```js
import {
  buildGhlCalendarEventsUrl,
  buildGhlCalendarListUrl,
  filterMovementEvaluations,
  normalizeGhlAppointment,
} from '../ghl-server.js'

test('builds a date-bounded GoHighLevel calendar events request', () => {
  assert.equal(
    buildGhlCalendarEventsUrl({
      locationId: 'location-1',
      calendarId: 'calendar-1',
      startTime: '2026-07-12T00:00:00-04:00',
      endTime: '2026-07-13T00:00:00-04:00',
    }),
    'https://services.leadconnectorhq.com/calendars/events?locationId=location-1&calendarId=calendar-1&startTime=2026-07-12T00%3A00%3A00-04%3A00&endTime=2026-07-13T00%3A00%3A00-04%3A00',
  )
})

test('normalizes a calendar event into an appointment card', () => {
  assert.deepEqual(normalizeGhlAppointment({
    id: 'event-1',
    contactId: 'contact-1',
    title: 'Movement Evaluation',
    startTime: '2026-07-12T09:00:00-04:00',
    endTime: '2026-07-12T10:00:00-04:00',
    assignedUserId: 'user-1',
  }, {
    calendarName: 'Movement Evaluations',
    contact: { name: 'Alice Test', email: 'alice@example.com' },
    trainer: { name: 'Matt Trainer' },
  }), {
    eventId: 'event-1', contactId: 'contact-1', title: 'Movement Evaluation',
    calendarName: 'Movement Evaluations', startTime: '2026-07-12T09:00:00-04:00',
    endTime: '2026-07-12T10:00:00-04:00', clientName: 'Alice Test',
    email: 'alice@example.com', trainerName: 'Matt Trainer',
  })
})

test('keeps only Movement Evaluation appointments', () => {
  const appointments = [
    { title: 'Movement Evaluation', calendarName: 'Senior Assessments' },
    { title: 'Personal Training', calendarName: 'Movement Evaluations' },
    { title: 'Nutrition Check-In', calendarName: 'Consultations' },
  ]
  assert.equal(filterMovementEvaluations(appointments).length, 2)
})
```

- [ ] **Step 2: Run the focused tests and confirm they fail for the missing exports**

Run:

```text
node --test tests/ghl.test.mjs
```

Expected: failure stating that `ghl-server.js` does not export the new calendar helpers.

- [ ] **Step 3: Implement the minimum appointment helpers and API calls**

Add calendar constants and pure helpers to `ghl-server.js`:

```js
const GHL_CALENDARS_URL = 'https://services.leadconnectorhq.com/calendars/'
const GHL_CALENDAR_EVENTS_URL = 'https://services.leadconnectorhq.com/calendars/events'
const MOVEMENT_EVALUATION = /movement\s*evaluation/i

export function buildGhlCalendarListUrl(locationId) {
  return `${GHL_CALENDARS_URL}?locationId=${encodeURIComponent(locationId)}`
}

export function buildGhlCalendarEventsUrl({ locationId, calendarId, startTime, endTime }) {
  const params = new URLSearchParams({ locationId, calendarId, startTime, endTime })
  return `${GHL_CALENDAR_EVENTS_URL}?${params}`
}

export function normalizeGhlAppointment(event, { calendarName = '', contact = {}, trainer = {} } = {}) {
  return {
    eventId: event.id || event.eventId || event.appointmentId || '',
    contactId: event.contactId || event.contact?.id || contact.id || '',
    title: event.title || event.name || '',
    calendarName,
    startTime: event.startTime || event.start || '',
    endTime: event.endTime || event.end || '',
    clientName: event.contactName || event.contact?.name || contact.name || '',
    email: event.email || event.contact?.email || contact.email || '',
    trainerName: event.assignedUserName || event.userName || trainer.name || '',
  }
}

export function filterMovementEvaluations(appointments) {
  return appointments.filter(appointment => MOVEMENT_EVALUATION.test(
    [appointment.title, appointment.calendarName].filter(Boolean).join(' '),
  ))
}
```

Implement `getGhlAppointments` by returning `{ status: 'disabled', appointments: [] }` when credentials are missing; otherwise fetch active calendars, fetch each calendar’s date-bounded events with `Promise.all`, normalize the events, and apply `filterMovementEvaluations`. Do not fetch every contact for the list; use event-provided identity when available and defer a complete contact fetch to `getGhlAppointment`.

Implement `getGhlAppointment` by fetching the appointment by event ID, then fetching its contact and assigned user when the event does not already contain their names. Return `{ status: 'found', appointment }`, `{ status: 'empty', appointment: null }`, or `{ status: 'error', message }` without exposing token details.

- [ ] **Step 4: Run the focused tests and the full existing suite**

Run:

```text
node --test tests/ghl.test.mjs
node --test
```

Expected: the new helper tests and all existing tests pass.

- [ ] **Step 5: Commit the appointment discovery unit**

```text
git add ghl-server.js tests/ghl.test.mjs
git commit -m "Add GoHighLevel appointment discovery"
```

### Task 2: Add appointment routes and contact-specific sync

**Files:**
- Modify: `server.js`
- Modify: `ghl-server.js`
- Modify: `src/utils/ghl.js`
- Modify: `tests/ghl.test.mjs`

**Interfaces:**
- `GET /api/ghl/appointments?date=YYYY-MM-DD` returns `{ status, appointments, message? }`.
- `GET /api/ghl/appointments/:eventId` returns `{ status, appointment, message? }`.
- `syncToGoHighLevel(session, { token, locationId, assessmentFieldKey, releaseSignatureFieldId })` updates `client.ghlContactId` when present, falls back to the existing email upsert, and uploads the signature when configured.
- `loadGhlAppointments(date)` and `loadGhlAppointment(eventId)` in `src/utils/ghl.js` throw safe user-facing errors for non-JSON or failed responses.

- [ ] **Step 1: Write failing tests for route payloads and contact-specific sync**

Add these imports and tests to `tests/ghl.test.mjs`:

```js
import {
  buildGhlAssessmentPayload,
  buildGhlContactUpdate,
  syncToGoHighLevel,
} from '../ghl-server.js'

const sessionWithAppointment = {
  client: {
    name: 'Alice Test', email: 'alice@example.com', ghlContactId: 'contact-1',
    notes: 'Use the rail for balance work.', appointmentId: 'event-1',
  },
  date: '2026-07-12', points: 8, results: { tug: 12 },
  consent: {
    signed: true, signedAt: '2026-07-12T13:00:00.000Z',
    signerName: 'Alice Test', releaseVersion: 'movement-release-v1',
    signatureData: 'data:image/png;base64,c2lnbmF0dXJl',
  },
}

test('includes appointment notes and signed release metadata in the assessment field', () => {
  assert.deepEqual(JSON.parse(buildGhlAssessmentPayload(sessionWithAppointment, 'assessment-field').customFields[0].fieldValue), {
    date: '2026-07-12', points: 8, results: { tug: 12 },
    notes: 'Use the rail for balance work.', appointmentId: 'event-1',
    consent: { signedAt: '2026-07-12T13:00:00.000Z', releaseVersion: 'movement-release-v1' },
  })
})

test('updates the selected GoHighLevel contact by contact ID', () => {
  assert.equal(buildGhlContactUpdate('contact-1', sessionWithAppointment, 'assessment-field').url,
    'https://services.leadconnectorhq.com/contacts/contact-1')
})

test('reports partial sync when the assessment saves but the signature upload fails', async () => {
  const originalFetch = global.fetch
  const calls = []
  global.fetch = async (url) => {
    calls.push(url)
    return calls.length === 1
      ? new Response('{}', { status: 200 })
      : new Response('{}', { status: 500 })
  }
  try {
    const result = await syncToGoHighLevel(sessionWithAppointment, {
      token: 'token', locationId: 'location-1',
      assessmentFieldKey: 'assessment-field', releaseSignatureFieldId: 'signature-field',
    })
    assert.equal(result.status, 'partial')
    assert.equal(calls[0], 'https://services.leadconnectorhq.com/contacts/contact-1')
  } finally {
    global.fetch = originalFetch
  }
})
```

- [ ] **Step 2: Run the focused tests and confirm the new exports/behavior fail**

Run:

```text
node --test tests/ghl.test.mjs
```

Expected: failures for the missing payload builder, contact update, and signature upload behavior.

- [ ] **Step 3: Implement the server routes and sync path**

Add the two Express routes with strict date/event ID validation. Pass these environment values into the sync function:

```js
releaseSignatureFieldId: process.env.GHL_RELEASE_SIGNATURE_FIELD_ID,
```

Extend the assessment JSON to include:

```js
{
  date,
  points,
  results,
  notes: session.client?.notes || '',
  appointmentId: session.client?.appointmentId || '',
  consent: {
    signedAt: session.consent?.signedAt || '',
    releaseVersion: session.consent?.releaseVersion || '',
  },
}
```

When `session.client.ghlContactId` exists, send the contact update to `PUT /contacts/:contactId`; otherwise preserve the current email-based upsert. Convert a `data:image/png;base64,...` signature into a native `Blob`, append it to `FormData` using `<custom_field_id>_<uuid>`, and POST it to `/forms/upload-custom-files`. Return `partial` if the assessment update succeeds but the signature upload fails.

The file-upload request must include both `contactId` and `locationId` query parameters and the Private Integration must include `forms.write` access.

Add the frontend wrappers:

```js
export async function loadGhlAppointments(date) {
  return getJson(`/api/ghl/appointments?date=${encodeURIComponent(date)}`)
}

export async function loadGhlAppointment(eventId) {
  return getJson(`/api/ghl/appointments/${encodeURIComponent(eventId)}`)
}
```

- [ ] **Step 4: Run all tests and build**

Run:

```text
node --test
npm run build
```

Expected: all tests pass and Vite produces `dist/` successfully.

- [ ] **Step 5: Commit the API and sync unit**

```text
git add server.js ghl-server.js src/utils/ghl.js tests/ghl.test.mjs
git commit -m "Add appointment routes and contact-specific sync"
```

### Task 3: Add the appointment picker and prefilled client flow

**Files:**
- Create: `src/components/AppointmentPicker.jsx`
- Create: `src/utils/appointments.js`
- Modify: `src/App.jsx`
- Create: `tests/appointments.test.mjs`

**Interfaces:**
- `AppointmentPicker({ date, appointments, loading, error, onDateChange, onRefresh, onSelect, onManualEntry })` renders tablet-sized appointment cards and a manual-entry fallback.
- `clientFromAppointment(appointment, date): object` returns a fresh client object with `ghlContactId`, `appointmentId`, name, email, trainer, and date while leaving the local `id` unset.
- App state adds `selectedAppointment`, `showAppointmentPicker`, and `appointmentStatus`.
- Selecting an appointment sets `client.ghlContactId`, `client.appointmentId`, `name`, `email`, `trainer`, and `date` without setting the local `client.id`.

- [ ] **Step 1: Write the failing appointment-to-client test**

Create `tests/appointments.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { clientFromAppointment } from '../src/utils/appointments.js'

test('maps a selected appointment into a fresh client without reusing the local id', () => {
  assert.deepEqual(clientFromAppointment({
    contactId: 'contact-1', eventId: 'event-1', clientName: 'Alice Test',
    email: 'alice@example.com', trainerName: 'Matt Trainer',
  }, '2026-07-12'), {
    name: 'Alice Test', age: '', sex: 'M', email: 'alice@example.com',
    trainer: 'Matt Trainer', date: '2026-07-12', notes: '',
    ghlContactId: 'contact-1', appointmentId: 'event-1',
  })
})
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```text
node --test tests/appointments.test.mjs
```

Expected: failure stating that `src/utils/appointments.js` does not exist.

- [ ] **Step 3: Implement the picker and App wiring**

On first load, if a draft exists restore it and show the existing form; otherwise show the appointment picker and load `localDate()`. The picker includes a native date input, refresh button, loading state, no-results state, and `Enter client manually` action.

Implement `clientFromAppointment` as a pure mapping from the normalized appointment to the existing `emptyClient` shape plus `ghlContactId` and `appointmentId`. Selecting an appointment calls `loadGhlAppointment(eventId)`, passes the result through that helper, clears old results and consent, sets step 0, and hides the picker. Manual entry hides the picker and preserves the current email lookup section as fallback. `newAssessment()` returns to the picker rather than silently reusing the previous client. The existing generic draft serializer automatically persists the added fields; do not modify `src/utils/draft.js`.

Save the selected appointment fields in the existing draft object so a refresh does not lose the context.

- [ ] **Step 4: Run tests and build**

Run:

```text
node --test
npm run build
```

Expected: all tests pass and the build succeeds.

- [ ] **Step 5: Commit the appointment picker unit**

```text
git add src/components/AppointmentPicker.jsx src/utils/appointments.js src/App.jsx tests/appointments.test.mjs
git commit -m "Add today appointment picker"
```

### Task 4: Add the touchscreen release and consent validation

**Files:**
- Create: `src/components/SignaturePad.jsx`
- Create: `src/data/release.js`
- Modify: `src/App.jsx`
- Modify: `src/utils/validation.js`
- Modify: `tests/validation.test.mjs`

**Interfaces:**
- `RELEASE_VERSION` is a stable string such as `movement-release-v1`.
- `RELEASE_TEXT` contains the approved client-facing acknowledgment.
- `SignaturePad({ value, onChange, color, background })` calls `onChange(dataUrl)` after a visible stroke and clears with `onChange('')`.
- `validateAssessment(client, consent)` accepts the consent object and requires `acknowledged`, `signed`, `signerName`, and `signatureData`.

- [ ] **Step 1: Write failing consent tests**

Add to `tests/validation.test.mjs`:

```js
test('requires a named signature and acknowledgment before saving', () => {
  const result = validateAssessment({ name: 'Alice Test', age: '70' }, {
    acknowledged: true,
    signed: false,
    signerName: 'Alice Test',
    signatureData: '',
  })
  assert.equal(result.valid, false)
  assert.equal(result.errors.consent, 'Read and sign the exercise release before continuing.')
})

test('accepts a complete signed release', () => {
  const result = validateAssessment({ name: 'Alice Test', age: '70' }, {
    acknowledged: true,
    signed: true,
    signerName: 'Alice Test',
    signatureData: 'data:image/png;base64,signature',
  })
  assert.equal(result.errors.consent, undefined)
})
```

- [ ] **Step 2: Run validation tests and confirm the new consent behavior fails**

Run:

```text
node --test tests/validation.test.mjs
```

Expected: the new tests fail because the current validator accepts only a boolean consent value.

- [ ] **Step 3: Implement the native pointer signature pad and release data**

Use a canvas scaled by `devicePixelRatio`, `pointerdown`/`pointermove`/`pointerup`, and `setPointerCapture` so touch and stylus strokes remain continuous. Export the release copy and version from `src/data/release.js`; do not put legal copy directly inside event handlers.

Replace the current checkbox with a release card containing the text, acknowledgment checkbox, signer-name field, signature canvas, and Clear button. Keep controls at least 44px high. Make `validateAssessment` accept the new consent object while continuing to treat legacy boolean `true` as valid for existing saved sessions. Initialize new consent state as:

```js
{
  acknowledged: false,
  signed: false,
  signerName: '',
  signedAt: '',
  releaseVersion: RELEASE_VERSION,
  signatureData: '',
}
```

On the first visible signature stroke set `signed: true`; on clear set `signed: false` and erase `signatureData`. On save, set `signedAt` immediately before constructing the session payload. Store the entire consent object in the draft and session.

- [ ] **Step 4: Run all tests and build**

Run:

```text
node --test
npm run build
```

Expected: all tests pass and the build succeeds.

- [ ] **Step 5: Commit the signature unit**

```text
git add src/components/SignaturePad.jsx src/data/release.js src/App.jsx src/utils/validation.js tests/validation.test.mjs
git commit -m "Add touchscreen exercise release signature"
```

### Task 5: Document configuration and verify the complete workflow

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the required Railway setup**

Update the GoHighLevel section with these required token scopes and variables:

```text
GHL_PRIVATE_INTEGRATION_TOKEN=server-side private integration token
GHL_LOCATION_ID=GoHighLevel sub-account/location ID
GHL_ASSESSMENT_FIELD_KEY=large-text assessment custom field key
GHL_RELEASE_SIGNATURE_FIELD_ID=file custom field ID for the signed release
```

Document that the token needs contact read/write, calendar read, user read, and `forms.write` access, and that the GoHighLevel account must have a file custom field for the signature. Explain that missing signature configuration produces a partial-sync warning rather than deleting the local record.

- [ ] **Step 2: Run repository verification**

Run:

```text
git diff --check
node --test
npm run build
```

Expected: no whitespace errors, all tests pass, and the production build succeeds.

- [ ] **Step 3: Verify the local server and browser workflow**

Run `npm run dev`, open `http://127.0.0.1:5173`, and verify:

1. With no GHL environment variables, the picker shows a safe configuration message and manual entry remains available.
2. The appointment normalizer unit tests cover time, client, and trainer display data.
3. After Railway variables and permissions are configured, the picker shows real Movement Evaluation appointments and selecting one fills name, email, date, trainer, and `ghlContactId` without filling the local `id`.
4. The release card accepts a mouse/touch stroke, Clear removes it, and the Continue button remains blocked until acknowledgment, name, and signature are complete.
5. A complete assessment saves locally before the sync request and displays either synced or partially synced status.

- [ ] **Step 4: Commit the documentation and verification changes**

```text
git add README.md
git commit -m "Document appointment picker configuration"
```

- [ ] **Step 5: Report the Railway handoff**

List the four variables, the required permission scopes, the new GoHighLevel file custom field, the test/build results, and the commit IDs. Do not claim Railway is updated until the changes are pushed and the deployment is confirmed.
