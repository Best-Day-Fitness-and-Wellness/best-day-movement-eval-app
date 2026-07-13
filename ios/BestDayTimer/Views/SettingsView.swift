import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var model: AppModel

    private let weekdaySymbols = Calendar.current.shortWeekdaySymbols // Sun ... Sat

    var body: some View {
        NavigationStack {
            Form {
                Section("Schedule") {
                    Picker("Remind me every", selection: $model.settings.intervalMinutes) {
                        ForEach(ReminderSettings.intervalOptions, id: \.self) { minutes in
                            Text(intervalLabel(minutes)).tag(minutes)
                        }
                    }
                    DatePicker(
                        "Start time",
                        selection: timeBinding(\.startMinuteOfDay),
                        displayedComponents: .hourAndMinute
                    )
                    DatePicker(
                        "End time",
                        selection: timeBinding(\.endMinuteOfDay),
                        displayedComponents: .hourAndMinute
                    )
                }

                Section("Active days") {
                    weekdayPicker
                }

                Section {
                    ForEach(PromptCategory.allCases) { category in
                        Toggle(isOn: categoryBinding(category)) {
                            Label(category.label, systemImage: category.symbolName)
                        }
                    }
                } header: {
                    Text("Reminder types")
                } footer: {
                    Text("Reminders are drawn at random from the types you keep on.")
                }

                Section("Sound") {
                    Toggle("Play notification sound", isOn: $model.settings.playSound)
                }

                Section {
                    LabeledContent("App", value: "Best Day Timer")
                    LabeledContent("Studio", value: "Best Day Fitness, St. Pete FL")
                } footer: {
                    Text("Little movement breaks, all day long — brought to you by Best Day Fitness & Wellness.")
                }
            }
            .navigationTitle("Settings")
        }
    }

    private var weekdayPicker: some View {
        HStack(spacing: 8) {
            // Calendar weekday numbers are 1 (Sun) through 7 (Sat).
            ForEach(1...7, id: \.self) { weekday in
                let isOn = model.settings.activeWeekdays.contains(weekday)
                Button {
                    if isOn {
                        model.settings.activeWeekdays.remove(weekday)
                    } else {
                        model.settings.activeWeekdays.insert(weekday)
                    }
                } label: {
                    Text(String(weekdaySymbols[weekday - 1].prefix(2)))
                        .font(.caption.weight(.bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            isOn ? Brand.deepBlue : Color(.systemGray5),
                            in: RoundedRectangle(cornerRadius: 8)
                        )
                        .foregroundStyle(isOn ? .white : .secondary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.vertical, 4)
    }

    private func categoryBinding(_ category: PromptCategory) -> Binding<Bool> {
        Binding(
            get: { model.settings.enabledCategories.contains(category) },
            set: { isOn in
                if isOn {
                    model.settings.enabledCategories.insert(category)
                } else if model.settings.enabledCategories.count > 1 {
                    // Keep at least one category enabled.
                    model.settings.enabledCategories.remove(category)
                }
            }
        )
    }

    private func timeBinding(_ keyPath: WritableKeyPath<ReminderSettings, Int>) -> Binding<Date> {
        Binding(
            get: {
                let calendar = Calendar.current
                let midnight = calendar.startOfDay(for: Date())
                return calendar.date(
                    byAdding: .minute,
                    value: model.settings[keyPath: keyPath],
                    to: midnight
                ) ?? midnight
            },
            set: { newValue in
                let components = Calendar.current.dateComponents([.hour, .minute], from: newValue)
                model.settings[keyPath: keyPath] = (components.hour ?? 0) * 60 + (components.minute ?? 0)
            }
        )
    }

    private func intervalLabel(_ minutes: Int) -> String {
        if minutes < 60 { return "\(minutes) minutes" }
        if minutes == 60 { return "1 hour" }
        if minutes % 60 == 0 { return "\(minutes / 60) hours" }
        return "\(minutes / 60) hr \(minutes % 60) min"
    }
}

#Preview {
    SettingsView().environmentObject(AppModel())
}
