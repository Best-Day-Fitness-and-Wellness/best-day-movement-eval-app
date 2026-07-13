import SwiftUI
import UIKit

/// One-minute guided box-breathing session with an animated circle.
struct BreathingView: View {
    @Environment(\.dismiss) private var dismiss

    private enum Phase: String, CaseIterable {
        case inhale = "Breathe in"
        case holdIn = "Hold"
        case exhale = "Breathe out"
        case holdOut = "Hold…"

        var scale: CGFloat {
            switch self {
            case .inhale, .holdIn: return 1.0
            case .exhale, .holdOut: return 0.55
            }
        }
    }

    private static let phaseSeconds = 4
    private static let sessionSeconds = 64 // 4 full box-breathing cycles

    @State private var phase: Phase = .inhale
    @State private var circleScale: CGFloat = Phase.holdOut.scale
    @State private var secondsElapsed = 0
    @State private var phaseCountdown = phaseSeconds

    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            Brand.homeGradient.ignoresSafeArea()

            VStack(spacing: 40) {
                Text(isDone ? "Nice work! 🎉" : phase.rawValue)
                    .font(.largeTitle.weight(.bold))
                    .foregroundStyle(.white)
                    .contentTransition(.opacity)
                    .animation(.easeInOut(duration: 0.3), value: phase)

                ZStack {
                    Circle()
                        .stroke(Brand.sky.opacity(0.25), lineWidth: 2)
                        .frame(width: 280, height: 280)
                    Circle()
                        .fill(Brand.sky.opacity(0.35))
                        .frame(width: 280, height: 280)
                        .scaleEffect(circleScale)
                    Circle()
                        .fill(Brand.sky)
                        .frame(width: 280, height: 280)
                        .scaleEffect(circleScale * 0.65)
                        .opacity(0.85)
                    if !isDone {
                        Text("\(phaseCountdown)")
                            .font(.system(size: 56, weight: .bold, design: .rounded))
                            .foregroundStyle(Brand.deepBlue)
                            .monospacedDigit()
                    } else {
                        Image(systemName: "checkmark")
                            .font(.system(size: 56, weight: .bold))
                            .foregroundStyle(Brand.deepBlue)
                    }
                }

                Text(isDone
                     ? "You gave yourself a minute. That's a best-day move."
                     : "Follow the circle • \(remainingLabel)")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.75))

                Button(isDone ? "Done" : "End early") {
                    dismiss()
                }
                .font(.headline)
                .padding(.horizontal, 32)
                .padding(.vertical, 12)
                .background(.white.opacity(isDone ? 1.0 : 0.15), in: Capsule())
                .foregroundStyle(isDone ? Brand.deepBlue : .white)
            }
            .padding()
        }
        .onAppear { startPhase(.inhale) }
        .onReceive(timer) { _ in tick() }
    }

    private var isDone: Bool { secondsElapsed >= Self.sessionSeconds }

    private var remainingLabel: String {
        let remaining = max(0, Self.sessionSeconds - secondsElapsed)
        return "0:\(String(format: "%02d", remaining)) left"
    }

    private func tick() {
        guard !isDone else { return }
        secondsElapsed += 1
        phaseCountdown -= 1
        if secondsElapsed >= Self.sessionSeconds {
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            return
        }
        if phaseCountdown <= 0 {
            let phases = Phase.allCases
            let nextIndex = (phases.firstIndex(of: phase)! + 1) % phases.count
            startPhase(phases[nextIndex])
        }
    }

    private func startPhase(_ newPhase: Phase) {
        phase = newPhase
        phaseCountdown = Self.phaseSeconds
        UIImpactFeedbackGenerator(style: .soft).impactOccurred()
        withAnimation(.easeInOut(duration: Double(Self.phaseSeconds))) {
            circleScale = newPhase.scale
        }
    }
}

#Preview {
    BreathingView()
}
