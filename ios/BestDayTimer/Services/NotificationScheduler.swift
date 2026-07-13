import Foundation
import UserNotifications

/// Schedules Best Day reminders as local notifications.
///
/// iOS caps pending local notifications at 64 per app, so we schedule the
/// next ~60 occurrences and top the queue back up every time the app
/// becomes active or settings change.
enum NotificationScheduler {
    static let categoryIdentifier = "BESTDAY_REMINDER"
    static let doneActionIdentifier = "BESTDAY_DONE"
    static let snoozeActionIdentifier = "BESTDAY_SNOOZE"
    static let promptIDKey = "promptID"
    private static let reminderPrefix = "bestday.reminder."

    static func registerCategories() {
        let done = UNNotificationAction(
            identifier: doneActionIdentifier,
            title: "Done ✓",
            options: []
        )
        let snooze = UNNotificationAction(
            identifier: snoozeActionIdentifier,
            title: "Snooze 10 min",
            options: []
        )
        let category = UNNotificationCategory(
            identifier: categoryIdentifier,
            actions: [done, snooze],
            intentIdentifiers: [],
            options: []
        )
        UNUserNotificationCenter.current().setNotificationCategories([category])
    }

    static func requestAuthorization() async -> Bool {
        let center = UNUserNotificationCenter.current()
        return (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
    }

    static func authorizationStatus() async -> UNAuthorizationStatus {
        await UNUserNotificationCenter.current().notificationSettings().authorizationStatus
    }

    /// Clears and re-schedules the upcoming reminder queue from settings.
    static func reschedule(settings: ReminderSettings) async {
        let center = UNUserNotificationCenter.current()

        // Remove only our recurring reminders; leave snoozes alone.
        let pending = await center.pendingNotificationRequests()
        let staleIDs = pending
            .map(\.identifier)
            .filter { $0.hasPrefix(reminderPrefix) }
        center.removePendingNotificationRequests(withIdentifiers: staleIDs)

        guard settings.isEnabled else { return }
        let status = await authorizationStatus()
        guard status == .authorized || status == .provisional else { return }

        let prompts = PromptCatalog.prompts(in: settings.enabledCategories)
        let occurrences = settings.upcomingOccurrences(limit: 60)
        let calendar = Calendar.current

        for (index, date) in occurrences.enumerated() {
            guard let prompt = prompts.randomElement() else { break }
            let content = makeContent(for: prompt, playSound: settings.playSound)
            let components = calendar.dateComponents(
                [.year, .month, .day, .hour, .minute],
                from: date
            )
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
            let request = UNNotificationRequest(
                identifier: reminderPrefix + String(index),
                content: content,
                trigger: trigger
            )
            try? await center.add(request)
        }
    }

    /// Re-delivers the given notification content after a 10 minute snooze.
    static func snooze(content: UNNotificationContent) async {
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 10 * 60, repeats: false)
        let request = UNNotificationRequest(
            identifier: "bestday.snooze.\(UUID().uuidString)",
            content: content.mutableCopy() as! UNMutableNotificationContent,
            trigger: trigger
        )
        try? await UNUserNotificationCenter.current().add(request)
    }

    private static func makeContent(for prompt: ExercisePrompt, playSound: Bool) -> UNMutableNotificationContent {
        let content = UNMutableNotificationContent()
        content.title = prompt.title
        content.body = prompt.message
        content.sound = playSound ? UNNotificationSound.default : nil
        content.categoryIdentifier = categoryIdentifier
        content.userInfo = [promptIDKey: prompt.id]
        content.threadIdentifier = "bestday.reminders"
        return content
    }
}
