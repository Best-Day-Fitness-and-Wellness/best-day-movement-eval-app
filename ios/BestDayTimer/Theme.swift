import SwiftUI

/// Best Day Fitness brand palette, matched to the web app theme.
enum Brand {
    static let deepBlue = Color(hex: 0x05058A)
    static let navyCard = Color(hex: 0x07076F)
    static let sky = Color(hex: 0x53D6FF)
    static let orange = Color(hex: 0xFF9D00)
    static let green = Color(hex: 0x22C55E)

    /// Background gradient used on the home screen.
    static var homeGradient: LinearGradient {
        LinearGradient(
            colors: [deepBlue, Color(hex: 0x0C148F)],
            startPoint: .top,
            endPoint: .bottom
        )
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255.0,
            green: Double((hex >> 8) & 0xFF) / 255.0,
            blue: Double(hex & 0xFF) / 255.0,
            opacity: 1.0
        )
    }
}
