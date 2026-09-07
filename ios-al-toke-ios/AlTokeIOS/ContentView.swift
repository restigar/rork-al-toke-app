import SwiftUI

/// Router raíz: splash → bienvenida (sin sesión) o pestañas según el rol.
struct ContentView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        Group {
            if appState.isLoading {
                splash
            } else if let perfil = appState.perfil {
                if perfil.esComercio {
                    ComercioDashboardView()
                } else {
                    ClienteTabView()
                }
            } else {
                WelcomeView()
            }
        }
        .animation(.easeInOut(duration: 0.2), value: appState.isLoading)
        .animation(.easeInOut(duration: 0.2), value: appState.isLoggedIn)
    }

    private var splash: some View {
        ZStack {
            Color.brand.ignoresSafeArea()
            VStack(spacing: 12) {
                Image(systemName: "bolt.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(.mint)
                Text("Al Toke")
                    .font(.system(size: 34, weight: .bold))
                    .foregroundStyle(.white)
                ProgressView()
                    .tint(.white)
                    .padding(.top, 8)
            }
        }
    }
}
