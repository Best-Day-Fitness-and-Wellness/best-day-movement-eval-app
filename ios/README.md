# Best Day Timer (iOS)

A mindful-movement reminder app for **Best Day Fitness**. It nudges you throughout the day with rotating prompts — breathe, stand up and do chair squats, stretch, posture checks, water breaks, and more — delivered as local notifications on the schedule you choose. Includes a built-in 1-minute guided box-breathing session.

## Features

- **Reminder schedule** — pick an interval (15 min – 2 hrs), active hours (e.g. 9 AM – 6 PM), and active days of the week
- **14 rotating prompts** across three types you can toggle on/off: **Breathe**, **Move**, and **Mindful**
- **Notification actions** — mark **Done ✓** or **Snooze 10 min** right from the notification; tapping it opens step-by-step instructions for that exercise
- **Breathe Now** — a 1-minute guided box-breathing session with an animated circle and haptics
- **Exercise library** — every prompt with how-to steps
- Works fully offline; no account, no server, no data collection

## Requirements

- Xcode 16 or newer (macOS)
- An iPhone running iOS 17 or newer
- Your Apple Developer account (for running on device and App Store distribution)

## Run it on your iPhone

1. Open `ios/BestDayTimer.xcodeproj` in Xcode.
2. Select the **BestDayTimer** target → **Signing & Capabilities** tab:
   - Check **Automatically manage signing**
   - Choose your **Team** (your Apple Developer account)
   - If Xcode complains the bundle ID is taken, change `com.bestdayfitness.BestDayTimer` to something unique to your account.
3. Plug in your iPhone (or use wireless debugging), pick it as the run destination, and press **⌘R**.
4. On first launch the app asks for notification permission — allow it, and reminders start on the default schedule (every 45 min, 9 AM–6 PM, Mon–Fri).

> First device install only: on the phone go to **Settings → General → VPN & Device Management** and trust your developer certificate if prompted.

## How the reminders work

iOS limits an app to 64 pending local notifications, so the app pre-schedules the next ~60 reminders and tops the queue back up every time it becomes active (or whenever you change settings). Open the app once in a while — with the default schedule, 60 reminders is about a week of coverage. Each reminder picks a random exercise from the types you have enabled.

## Ship it to the App Store (later)

1. In Xcode: **Product → Archive** (with *Any iOS Device* selected).
2. In the Organizer window, **Distribute App → App Store Connect**.
3. Create the app record at [appstoreconnect.apple.com](https://appstoreconnect.apple.com) with the same bundle ID.
4. Use **TestFlight** to try it on your phone (and clients' phones) before submitting for review.

## Project layout

```
ios/
├── BestDayTimer.xcodeproj
└── BestDayTimer/
    ├── BestDayTimerApp.swift        # App entry, app state, notification delegate
    ├── Theme.swift                  # Best Day brand colors
    ├── Models/
    │   ├── ExercisePrompt.swift     # Prompt catalog (breathe / move / mindful)
    │   └── ReminderSettings.swift   # Persisted schedule + occurrence generator
    ├── Services/
    │   └── NotificationScheduler.swift  # Permission, scheduling, snooze
    ├── Views/
    │   ├── RootView.swift           # Tab bar + notification deep-link sheet
    │   ├── HomeView.swift           # Toggle, next reminders, Breathe Now
    │   ├── SettingsView.swift       # Interval, hours, days, types, sound
    │   ├── LibraryView.swift        # Exercise list + detail steps
    │   └── BreathingView.swift      # 1-minute guided box breathing
    └── Assets.xcassets              # App icon + accent color
```
