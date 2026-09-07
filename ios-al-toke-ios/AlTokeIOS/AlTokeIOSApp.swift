import SwiftUI
import FirebaseAuth

@main
struct AlTokeIOSApp: App {
    @State private var appState = AppState.shared

    init() {
        FirebaseService.configure()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(appState)
                .task {
                    await appState.restaurarSesion()
                    LocationManager.shared.solicitarPermiso()
                }
        }
    }
}
