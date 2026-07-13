import SwiftUI

struct RootView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Today", systemImage: "sun.max.fill") }

            LibraryView()
                .tabItem { Label("Exercises", systemImage: "figure.mixed.cardio") }

            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
        }
        .sheet(item: $model.activePrompt) { prompt in
            PromptDetailView(prompt: prompt)
        }
        .task {
            await model.requestPermissionIfNeeded()
        }
    }
}

#Preview {
    RootView().environmentObject(AppModel())
}
