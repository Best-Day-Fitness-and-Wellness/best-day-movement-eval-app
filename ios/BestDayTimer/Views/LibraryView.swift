import SwiftUI

struct LibraryView: View {
    @State private var selectedPrompt: ExercisePrompt?

    var body: some View {
        NavigationStack {
            List {
                ForEach(PromptCategory.allCases) { category in
                    Section {
                        ForEach(PromptCatalog.all.filter { $0.category == category }) { prompt in
                            Button {
                                selectedPrompt = prompt
                            } label: {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(prompt.title)
                                        .font(.headline)
                                        .foregroundStyle(.primary)
                                    Text(prompt.message)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                        .lineLimit(2)
                                }
                                .padding(.vertical, 2)
                            }
                        }
                    } header: {
                        Label(category.label, systemImage: category.symbolName)
                    }
                }
            }
            .navigationTitle("Exercises")
            .sheet(item: $selectedPrompt) { prompt in
                PromptDetailView(prompt: prompt)
            }
        }
    }
}

struct PromptDetailView: View {
    let prompt: ExercisePrompt
    @Environment(\.dismiss) private var dismiss
    @State private var showBreathing = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Label(prompt.category.label, systemImage: prompt.category.symbolName)
                        .font(.caption.weight(.bold))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Brand.sky.opacity(0.2), in: Capsule())
                        .foregroundStyle(Brand.deepBlue)

                    Text(prompt.message)
                        .font(.body)
                        .foregroundStyle(.secondary)

                    VStack(alignment: .leading, spacing: 12) {
                        Text("How to do it")
                            .font(.headline)
                        ForEach(Array(prompt.steps.enumerated()), id: \.offset) { index, step in
                            HStack(alignment: .top, spacing: 12) {
                                Text("\(index + 1)")
                                    .font(.caption.weight(.bold))
                                    .frame(width: 24, height: 24)
                                    .background(Brand.deepBlue, in: Circle())
                                    .foregroundStyle(.white)
                                Text(step)
                                    .font(.subheadline)
                            }
                        }
                    }

                    if prompt.category == .breathe {
                        Button {
                            showBreathing = true
                        } label: {
                            Label("Start guided breathing", systemImage: "wind")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Brand.deepBlue, in: RoundedRectangle(cornerRadius: 14))
                                .foregroundStyle(.white)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle(prompt.title)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .fullScreenCover(isPresented: $showBreathing) {
                BreathingView()
            }
        }
    }
}

#Preview {
    LibraryView()
}
