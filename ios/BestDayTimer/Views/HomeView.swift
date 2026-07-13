import SwiftUI
import UIKit

struct HomeView: View {
    @EnvironmentObject private var model: AppModel
    @State private var showBreathing = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    header
                    statusCard
                    if !model.isAuthorized && model.authorizationStatus == .denied {
                        permissionBanner
                    }
                    breatheNowButton
                    if !model.nextReminders.isEmpty {
                        upcomingCard
                    }
                }
                .padding()
            }
            .background(Brand.homeGradient.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.hidden, for: .navigationBar)
        }
        .fullScreenCover(isPresented: $showBreathing) {
            BreathingView()
        }
    }

    private var header: some View {
        VStack(spacing: 6) {
            Text("BEST DAY FITNESS")
                .font(.caption.weight(.heavy))
                .tracking(3)
                .foregroundStyle(Brand.orange)
            Text("Make today your best day.")
                .font(.title2.weight(.bold))
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 8)
    }

    private var statusCard: some View {
        VStack(spacing: 16) {
            Toggle(isOn: $model.settings.isEnabled) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Movement Reminders")
                        .font(.headline)
                        .foregroundStyle(.white)
                    Text(scheduleSummary)
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                }
            }
            .tint(Brand.green)

            if model.settings.isEnabled, let next = model.nextReminders.first {
                Divider().overlay(.white.opacity(0.2))
                HStack {
                    Image(systemName: "bell.badge.fill")
                        .foregroundStyle(Brand.sky)
                    Text("Next reminder")
                        .foregroundStyle(.white.opacity(0.8))
                    Spacer()
                    Text(next, style: .relative)
                        .monospacedDigit()
                        .foregroundStyle(Brand.sky)
                        .fontWeight(.semibold)
                }
                .font(.subheadline)
            }
        }
        .padding()
        .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
    }

    private var permissionBanner: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Notifications are off", systemImage: "bell.slash.fill")
                .font(.headline)
                .foregroundStyle(.white)
            Text("Reminders can't be delivered until notifications are allowed in Settings.")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.8))
            Button("Open iOS Settings") {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
            .font(.caption.weight(.bold))
            .foregroundStyle(Brand.orange)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.red.opacity(0.25), in: RoundedRectangle(cornerRadius: 16))
    }

    private var breatheNowButton: some View {
        Button {
            showBreathing = true
        } label: {
            HStack {
                Image(systemName: "wind")
                    .font(.title3)
                Text("Breathe Now")
                    .font(.headline)
                Spacer()
                Text("1 min")
                    .font(.caption.weight(.bold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(.white.opacity(0.2), in: Capsule())
            }
            .foregroundStyle(Brand.deepBlue)
            .padding()
            .background(Brand.sky, in: RoundedRectangle(cornerRadius: 16))
        }
    }

    private var upcomingCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Coming up")
                .font(.headline)
                .foregroundStyle(.white)
            ForEach(model.nextReminders, id: \.self) { date in
                HStack {
                    Image(systemName: "clock")
                        .foregroundStyle(.white.opacity(0.5))
                    Text(date, format: .dateTime.weekday(.wide).hour().minute())
                        .foregroundStyle(.white.opacity(0.85))
                    Spacer()
                }
                .font(.subheadline)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
    }

    private var scheduleSummary: String {
        let start = minuteLabel(model.settings.startMinuteOfDay)
        let end = minuteLabel(model.settings.endMinuteOfDay)
        return "Every \(model.settings.intervalMinutes) min, \(start) – \(end)"
    }

    private func minuteLabel(_ minuteOfDay: Int) -> String {
        let calendar = Calendar.current
        let date = calendar.date(
            byAdding: .minute,
            value: minuteOfDay,
            to: calendar.startOfDay(for: Date())
        ) ?? Date()
        return date.formatted(date: .omitted, time: .shortened)
    }
}

#Preview {
    HomeView().environmentObject(AppModel())
}
