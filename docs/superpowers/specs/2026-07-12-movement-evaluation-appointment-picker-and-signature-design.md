# Movement Evaluation Appointment Picker and Signature

## Goal

Make the app start with a list of today’s GoHighLevel appointments whose calendar or appointment title identifies them as a Movement Evaluation. Selecting an appointment should fill the client identity, appointment date, and assigned trainer so the trainer only enters age, sex, and optional notes before completing the assessment.

The app should collect an approved exercise-release acknowledgment with a touchscreen signature and save the assessment and signed release to the selected client’s GoHighLevel profile.

## Non-goals

- Replacing GoHighLevel as the scheduling system.
- Creating or rescheduling appointments from this app.
- Writing new legal language without owner or attorney approval.
- Removing the existing manual entry and email lookup fallback.
- Two-way synchronization of assessment edits back into the app.

## User flow

1. The app opens to **Today’s Movement Evaluations** using the business’s local date.
2. The trainer taps an appointment card showing time, client name, and assigned trainer.
3. The app loads the contact by its GoHighLevel contact ID and shows a review screen with name, email, date, and trainer.
4. The trainer enters age, sex, and optional notes.
5. Before the first assessment test, the client reads the approved release text, checks the acknowledgment, and signs on the touchscreen.
6. The trainer completes the existing guided assessment.
7. Saving writes the assessment locally first, then synchronizes it to the selected GoHighLevel contact.
8. If no appointments load or the trainer needs another client, the existing manual flow remains available.

## GoHighLevel integration

The server remains the only place that holds the private integration token. The frontend calls same-origin server routes.

New server routes:

- `GET /api/ghl/appointments?date=YYYY-MM-DD` returns normalized Movement Evaluation appointments for the requested date.
- `GET /api/ghl/appointments/:eventId` returns one normalized appointment and its contact details.

The server will:

- Discover active calendars in the location, request that day’s events, and keep events whose calendar name or appointment title contains “Movement Evaluation,” case-insensitively.
- Normalize each appointment to `eventId`, `contactId`, `title`, `startTime`, `endTime`, `clientName`, `email`, and `trainerName`.
- Fetch the contact by ID when the event does not include complete contact details.
- Use the appointment’s assigned user as the trainer. If the event only provides a user ID, the server fetches the user name.
- Prefer the selected `contactId` when saving. Manual entry continues to use the existing email-based upsert fallback.

Required token access will be expanded to include contact read/write, calendar read, user read, and `forms.write` access. Existing environment variables remain:

```text
GHL_PRIVATE_INTEGRATION_TOKEN
GHL_LOCATION_ID
GHL_ASSESSMENT_FIELD_KEY
```

One new environment variable stores the GoHighLevel file custom-field ID used for the signed release:

```text
GHL_RELEASE_SIGNATURE_FIELD_ID
```

## Assessment and release data

The local session stores:

- `client.ghlContactId` as the GoHighLevel contact ID when selected from an appointment; `client.id` remains the app’s local IndexedDB ID.
- The existing client fields plus `appointmentId`.
- Assessment results, points, and notes.
- `consent.signed`, `consent.signedAt`, `consent.signerName`, `consent.releaseVersion`, and the signature image data needed for offline recovery.

The existing assessment custom field receives the date, points, results, notes, appointment ID, consent timestamp, and release version. The signature is uploaded as a PNG to the GoHighLevel file custom field after the assessment sync. The app must never claim the release is synced if the file upload failed.

The save sequence is local-first:

```text
Save locally → update contact assessment field → upload signature → report synced or partially synced
```

## Signature experience

- Use a native canvas with pointer events so finger, stylus, and mouse input work.
- Provide a **Clear** control sized for a tablet.
- Require a visible signature, acknowledgment checkbox, and signer name before proceeding.
- Display the release version and signing date beside the signature.
- Keep the signature step before the first physical test.
- Preserve the existing consent validation so an unsigned assessment cannot be finalized.

## Error handling and fallback

- Missing calendar/contact configuration: show a clear setup message and offer manual entry.
- No appointments: show an empty state with date navigation and a manual-entry action.
- GoHighLevel unavailable: allow local saving and clearly mark synchronization as pending or failed.
- Contact lookup failure: keep the selected appointment visible and allow manual correction.
- Signature upload failure: keep the signed data in the local session and report that the assessment saved locally but the release still needs synchronization.
- Ambiguous or incomplete appointment: do not silently guess; require the trainer to choose manual entry or correct the client details.

## Verification

Automated tests will cover:

- Calendar event request construction and date boundaries.
- Filtering and normalization of Movement Evaluation appointments.
- Contact and trainer normalization.
- Appointment selection populating the client fields.
- Consent validation requiring a signature and acknowledgment.
- Assessment payload including notes, appointment ID, consent timestamp, and release version.
- Signature upload success, failure, and local-first recovery.
- Existing manual entry, scoring, and GoHighLevel sync behavior remaining intact.

Manual browser verification will cover desktop and tablet-sized layouts, selecting an appointment, signing with a mouse and touch-capable pointer, clearing/redoing a signature, saving offline, and returning to the appointment picker.

## Open implementation assumption

The first version will identify appointments by the existing “Movement Evaluation” wording in the calendar name or appointment title. If the GoHighLevel account uses a different label, the filter will need one explicit configuration value rather than broadening the search to every appointment.
