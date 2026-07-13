import SwiftUI
import UIKit
import UserNotifications

@main
struct BestDayTimerApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var model = AppModel()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(model)
                .tint(Brand.sky)
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                Task { await model.refresh() }
            }
        }
    }
}

/// Central app state: persisted settings, permission status, and the
/// upcoming reminder preview shown on the home screen.
@MainActor
final class AppModel: ObservableObject {
    @Published var settings: ReminderSettings {
        didSet {
            guard settings != oldValue else { return }
            settings.save()
            scheduleRefresh()
        }
    }
    @Published var authorizationStatus: UNAuthorizationStatus = .notDetermined
    @Published var nextReminders: [Date] = []
    /// Prompt to present when the user taps a notification.
    @Published var activePrompt: ExercisePrompt?

    private var refreshTask: Task<Void, Never>?
    private var promptObserver: NSObjectProtocol?

    init() {
        settings = ReminderSettings.load()
        NotificationScheduler.registerCategories()
        promptObserver = NotificationCenter.default.addObserver(
            forName: .bestDayOpenPrompt, object: nil, queue: .main
        ) { [weak self] note in
            guard let id = note.userInfo?[NotificationScheduler.promptIDKey] as? String,
                  let prompt = PromptCatalog.prompt(withID: id) else { return }
            Task { @MainActor in self?.activePrompt = prompt }
        }
        scheduleRefresh()
    }

    var isAuthorized: Bool {
        authorizationStatus == .authorized || authorizationStatus == .provisional
    }

    func requestPermissionIfNeeded() async {
        if authorizationStatus == .notDetermined {
            _ = await NotificationScheduler.requestAuthorization()
        }
        await refresh()
    }

    /// Re-checks permission, tops up the notification queue, and updates
    /// the home-screen preview.
    func refresh() async {
        authorizationStatus = await NotificationScheduler.authorizationStatus()
        await NotificationScheduler.reschedule(settings: settings)
        nextReminders = (settings.isEnabled && isAuthorized)
            ? settings.upcomingOccurrences(limit: 3)
            : []
    }

    private func scheduleRefresh() {
        refreshTask?.cancel()
        refreshTask = Task { [weak self] in
            // Debounce rapid settings edits (pickers fire per tick).
            try? await Task.sleep(nanoseconds: 400_000_000)
            guard !Task.isCancelled else { return }
            await self?.refresh()
        }
    }
}

extension Notification.Name {
    static let bestDayOpenPrompt = Notification.Name("bestday.openPrompt")
}

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    // Show reminders as banners even while the app is open.
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound, .list]
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let content = response.notification.request.content
        switch response.actionIdentifier {
        case NotificationScheduler.snoozeActionIdentifier:
            await NotificationScheduler.snooze(content: content)
        case UNNotificationDefaultActionIdentifier:
            // User tapped the notification: open the matching exercise.
            if let id = content.userInfo[NotificationScheduler.promptIDKey] as? String {
                NotificationCenter.default.post(
                    name: .bestDayOpenPrompt,
                    object: nil,
                    userInfo: [NotificationScheduler.promptIDKey: id]
                )
            }
        default:
            break
        }
    }
}
