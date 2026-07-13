import Foundation

enum PromptCategory: String, Codable, CaseIterable, Identifiable {
    case breathe
    case move
    case mindful

    var id: String { rawValue }

    var label: String {
        switch self {
        case .breathe: return "Breathe"
        case .move: return "Move"
        case .mindful: return "Mindful"
        }
    }

    var symbolName: String {
        switch self {
        case .breathe: return "wind"
        case .move: return "figure.strengthtraining.functional"
        case .mindful: return "sparkles"
        }
    }
}

struct ExercisePrompt: Identifiable, Codable, Hashable {
    let id: String
    let category: PromptCategory
    let title: String
    let message: String
    let steps: [String]
}

enum PromptCatalog {
    static let all: [ExercisePrompt] = [
        // MARK: Breathe
        ExercisePrompt(
            id: "box-breathing",
            category: .breathe,
            title: "Box Breathing",
            message: "Pause for one minute of box breathing. In 4, hold 4, out 4, hold 4.",
            steps: [
                "Sit tall and relax your shoulders.",
                "Inhale through your nose for 4 counts.",
                "Hold for 4 counts.",
                "Exhale slowly for 4 counts, then hold 4.",
                "Repeat for about one minute.",
            ]
        ),
        ExercisePrompt(
            id: "deep-breaths",
            category: .breathe,
            title: "5 Deep Breaths",
            message: "Take 5 slow, deep belly breaths. Your best day starts with a breath.",
            steps: [
                "Place one hand on your belly.",
                "Breathe in slowly so your belly rises.",
                "Exhale even more slowly through pursed lips.",
                "Repeat 5 times.",
            ]
        ),
        ExercisePrompt(
            id: "sigh-reset",
            category: .breathe,
            title: "Physiological Sigh",
            message: "Feeling tense? Two quick inhales, one long exhale. Repeat 3 times.",
            steps: [
                "Inhale through your nose, then sneak in a second short inhale on top.",
                "Exhale long and slow through your mouth.",
                "Repeat 3 times and notice your shoulders drop.",
            ]
        ),

        // MARK: Move
        ExercisePrompt(
            id: "chair-squats",
            category: .move,
            title: "10 Chair Squats",
            message: "Stand up and knock out 10 chair squats. Strong legs, best day!",
            steps: [
                "Stand in front of a sturdy chair, feet hip-width apart.",
                "Lower down until you lightly touch the seat, keeping your chest up.",
                "Press through your heels to stand back up.",
                "Repeat 10 times at a controlled pace.",
            ]
        ),
        ExercisePrompt(
            id: "stand-stretch",
            category: .move,
            title: "Stand & Stretch",
            message: "Time to stand up! Reach for the sky and stretch for 30 seconds.",
            steps: [
                "Stand up and reach both arms overhead.",
                "Stretch gently side to side.",
                "Roll your shoulders back a few times.",
                "Take a breath before you sit back down.",
            ]
        ),
        ExercisePrompt(
            id: "calf-raises",
            category: .move,
            title: "15 Calf Raises",
            message: "Hold the counter and lift those heels — 15 calf raises for balance.",
            steps: [
                "Stand tall, fingertips on a counter or wall for balance.",
                "Rise up onto the balls of your feet.",
                "Lower slowly with control.",
                "Repeat 15 times.",
            ]
        ),
        ExercisePrompt(
            id: "wall-pushups",
            category: .move,
            title: "10 Wall Push-Ups",
            message: "Find a wall and press out 10 wall push-ups. You've got this!",
            steps: [
                "Place your palms on a wall at shoulder height, arms straight.",
                "Step back so your body leans slightly forward.",
                "Bend your elbows to bring your chest toward the wall.",
                "Push back to the start. Repeat 10 times.",
            ]
        ),
        ExercisePrompt(
            id: "march-in-place",
            category: .move,
            title: "1-Minute March",
            message: "March in place for one minute. Get that heart rate up a notch!",
            steps: [
                "Stand tall and march in place.",
                "Drive your knees up and swing your arms.",
                "Keep a steady pace for one minute.",
            ]
        ),
        ExercisePrompt(
            id: "balance-stand",
            category: .move,
            title: "Single-Leg Balance",
            message: "Balance practice: stand on one foot for 20 seconds each side.",
            steps: [
                "Stand near a counter or wall for safety.",
                "Lift one foot slightly off the floor.",
                "Hold for 20 seconds, then switch sides.",
                "Too easy? Try it without holding on.",
            ]
        ),

        // MARK: Mindful
        ExercisePrompt(
            id: "posture-check",
            category: .mindful,
            title: "Posture Reset",
            message: "Posture check! Sit tall, roll your shoulders back, chin level.",
            steps: [
                "Un-slouch: imagine a string pulling the crown of your head up.",
                "Roll your shoulders up, back, and down.",
                "Level your chin and soften your jaw.",
            ]
        ),
        ExercisePrompt(
            id: "water-break",
            category: .mindful,
            title: "Water Break",
            message: "Hydration time — grab a glass of water and take a sip break.",
            steps: [
                "Get up and refill your water.",
                "Drink at least half a glass now.",
                "Bonus: take the long way back.",
            ]
        ),
        ExercisePrompt(
            id: "eye-rest",
            category: .mindful,
            title: "20-20-20 Eye Rest",
            message: "Give your eyes a break: look 20 feet away for 20 seconds.",
            steps: [
                "Look away from your screen.",
                "Focus on something about 20 feet away.",
                "Hold your gaze for 20 seconds and blink slowly.",
            ]
        ),
        ExercisePrompt(
            id: "gratitude",
            category: .mindful,
            title: "Gratitude Moment",
            message: "Pause and name one thing making today your best day.",
            steps: [
                "Close your eyes for a moment.",
                "Think of one thing you're grateful for right now.",
                "Let yourself actually feel it before moving on.",
            ]
        ),
        ExercisePrompt(
            id: "neck-release",
            category: .mindful,
            title: "Neck Release",
            message: "Gently stretch your neck — ear to shoulder, 15 seconds each side.",
            steps: [
                "Sit tall and drop your right ear toward your right shoulder.",
                "Hold 15 seconds, breathing slowly.",
                "Switch sides. Keep it gentle — no forcing.",
            ]
        ),
    ]

    static func prompt(withID id: String) -> ExercisePrompt? {
        all.first { $0.id == id }
    }

    static func prompts(in categories: Set<PromptCategory>) -> [ExercisePrompt] {
        let filtered = all.filter { categories.contains($0.category) }
        return filtered.isEmpty ? all : filtered
    }
}
