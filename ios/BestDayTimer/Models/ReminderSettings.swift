import Foundation

struct ReminderSettings: Codable, Equatable {
    var isEnabled: Bool = true
    var intervalMinutes: Int = 45
    /// Minutes after midnight when reminders begin (default 9:00 AM).
    var startMinuteOfDay: Int = 9 * 60
    /// Minutes after midnight when reminders end (default 6:00 PM).
    var endMinuteOfDay: Int = 18 * 60
    /// Calendar weekday numbers (1 = Sunday ... 7 = Saturday). Default Mon–Fri.
    var activeWeekdays: Set<Int> = [2, 3, 4, 5, 6]
    var enabledCategories: Set<PromptCategory> = Set(PromptCategory.allCases)
    var playSound: Bool = true

    static let intervalOptions = [15, 20, 30, 45, 60, 90, 120]

    /// Generates upcoming reminder fire dates within the active window.
    func upcomingOccurrences(from now: Date = Date(), limit: Int = 60) -> [Date] {
        guard isEnabled, intervalMinutes > 0, !activeWeekdays.isEmpty,
              endMinuteOfDay >= startMinuteOfDay else { return [] }

        var result: [Date] = []
        let calendar = Calendar.current
        var day = calendar.startOfDay(for: now)

        for _ in 0..<28 {
            if activeWeekdays.contains(calendar.component(.weekday, from: day)) {
                var minute = startMinuteOfDay
                while minute <= endMinuteOfDay {
                    if let date = calendar.date(byAdding: .minute, value: minute, to: day),
                       date > now {
                        result.append(date)
                        if result.count >= limit { return result }
                    }
                    minute += intervalMinutes
                }
            }
            guard let next = calendar.date(byAdding: .day, value: 1, to: day) else { break }
            day = next
        }
        return result
    }
}

extension ReminderSettings {
    private static let storageKey = "bestday.reminderSettings"

    static func load() -> ReminderSettings {
        guard let data = UserDefaults.standard.data(forKey: storageKey),
              let settings = try? JSONDecoder().decode(ReminderSettings.self, from: data)
        else { return ReminderSettings() }
        return settings
    }

    func save() {
        if let data = try? JSONEncoder().encode(self) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }
}
